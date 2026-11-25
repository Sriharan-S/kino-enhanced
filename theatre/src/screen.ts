// ScreenDO: one per screen. The single authority for a screen's viewers, roles, item and timeline anchor.
// WebSockets use the Hibernation API: idle screens sleep without dropping connections.
import { DurableObject } from "cloudflare:workers";
import * as A from "./anchor";
import { hashPassword, screenCode, sha256Hex, verifyPassword } from "./crypto";
import type { Listing } from "./lobby";
import {
  encode,
  MIN_CLIENT_PROTOCOL,
  parseClientMessage,
  ProtocolError,
  type Anchor,
  type ClientMessage,
  type Device,
  type ErrorCode,
  type Item,
  type NewItem,
  type ReadyCheck,
  type ScreenInfo,
  type ServerMessage,
  type ViewerStatus,
  type ViewerInfo,
  type Visibility,
} from "./protocol";
import * as C from "./chat";
import * as P from "./playlist";
import * as R from "./rbac";
import * as RL from "./ratelimit";
import * as S from "./subs";

/** How long an empty screen survives before it is closed (reconnect window). */
const EMPTY_SCREEN_TTL_MS = 5 * 60_000;
/** Host and all co-hosts absent this long → the screen closes (§6.5). */
const HOST_ABSENT_TTL_MS = 15 * 60_000;
const DEFAULT_RTT_MS = 200;
/** How long a ready check stays open (§14.14). */
const READY_CHECK_MS = 30_000;
/** A dropped viewer keeps their place (and shows as reconnecting) this long (§6.4). */
const RECONNECT_GRACE_MS = 60_000;
/** Wrong-password limits (§11): per token, and per screen because tokens are chosen by the client. */
const PASSWORD_WINDOW_MS = 60_000;
const PASSWORD_ATTEMPTS_PER_TOKEN = 5;
const PASSWORD_ATTEMPTS_PER_SCREEN = 30;

export interface ScreenInit {
  screenId: string;
  code: string;
  name: string;
  visibility: Visibility;
  hidden: boolean;
  password: string | null;
  maxViewers: number;
  claim: string;
}

interface ScreenState {
  screenId: string;
  code: string;
  name: string;
  visibility: Visibility;
  hidden: boolean;
  passwordHash: string | null;
  maxViewers: number;
  showDevices: boolean;
  /** SHA-256 of the one-time owner claim handed to the creator; cleared once claimed. */
  claimHash: string | null;
  /** SHA-256 of the host's per-screen token. */
  ownerKey: string | null;
  /** Everyone who has passed the join checks (so reconnects skip the password and keep their roles). */
  members: Record<string, R.Member>;
  roles: R.Role[];
  roleSeq: number;
  /** Co-host keys in priority order (§7.1). */
  coHosts: string[];
  bans: string[];
  playlist: Item[];
  autoAdvance: boolean;
  /** The current item (also in `playlist`, unless it was removed). */
  item: Item | null;
  itemSeq: number;
  anchor: Anchor;
  createdAt: number;
  /** When the host and every co-host were last all absent, or null while one is present. */
  controllersAbsentSince: number | null;
  /** When the last viewer left, or null while anyone is connected. */
  emptySince: number | null;
  /** Viewers whose connection dropped: token hash → when. They keep their seat for RECONNECT_GRACE_MS. */
  away: Record<string, number>;
  /** Recent wrong passwords: token hash → timestamps (ms). */
  failedPasswords: Record<string, number[]>;
  /** Who was acting host at the last presence change, to announce handovers. */
  actingHost: string | null;
  /** Shared subtitle files (metadata; contents under "sub:<id>"). */
  subs: S.SubMeta[];
  subSeq: number;
  bufferingPolicy: "keep" | "wait";
  /** Names playback is paused for under "wait for everyone", or null. */
  hold: string[] | null;
  /** Buffering viewers the host chose not to wait for (until they recover). */
  holdIgnored: string[];
  ready: ReadyCheck | null;
  readySeq: number;
  /** Viewers (keys) whose player reached the end of the current YouTube item. */
  ended: string[];
}

/** Per-connection data, kept on the socket so it survives hibernation. */
interface Attachment {
  key: string;
  id: string;
  name: string;
  device: Device;
  rtt: number | null;
  buffering: boolean;
  status?: ViewerStatus;
  /** Recent chat / reaction times, for rate limiting. */
  chatTimes?: number[];
  reactTimes?: number[];
}

/** Chat lives under its own storage key, so messages don't rewrite the whole screen state. */
interface ChatState {
  seq: number;
  messages: C.ChatMessage[];
}

export class ScreenDO extends DurableObject<Env> {
  private state: ScreenState | null = null;
  private chat: ChatState = { seq: 0, messages: [] };
  private readonly buckets = new WeakMap<WebSocket, RL.Bucket>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      const stored = await ctx.storage.get<ScreenState>("state");
      this.state = stored ? normalise(stored) : null;
      this.chat = (await ctx.storage.get<ChatState>("chat")) ?? { seq: 0, messages: [] };
    });
  }

  // ---- RPC from the Worker ------------------------------------------------------------

  async init(p: ScreenInit): Promise<void> {
    const now = Date.now();
    this.state = {
      screenId: p.screenId,
      code: p.code,
      name: p.name,
      visibility: p.visibility,
      hidden: p.visibility === "private" && p.hidden,
      passwordHash: p.password ? await hashPassword(p.password) : null,
      maxViewers: p.maxViewers,
      showDevices: true,
      claimHash: await sha256Hex(p.claim),
      ownerKey: null,
      members: {},
      roles: R.defaultRoles(),
      roleSeq: 0,
      coHosts: [],
      bans: [],
      playlist: [],
      autoAdvance: true,
      item: null,
      itemSeq: 0,
      anchor: A.initialAnchor(now),
      createdAt: now,
      controllersAbsentSince: null,
      emptySince: now, // if the creator never connects, clean up like any empty screen
      away: {},
      failedPasswords: {},
      actingHost: null,
      subs: [],
      subSeq: 0,
      bufferingPolicy: "keep",
      hold: null,
      holdIgnored: [],
      ready: null,
      readySeq: 0,
      ended: [],
    };
    await this.save();
    await this.scheduleAlarm();
  }

  override async fetch(request: Request): Promise<Response> {
    if (!this.state) return new Response("screen closed", { status: 404 });
    const parts = new URL(request.url).pathname.split("/").filter(Boolean);
    if (parts[2] === "subs") {
      try {
        return await this.subsRequest(request, parts[3]);
      } catch (e) {
        if (e instanceof ProtocolError) {
          const status = e.code === "forbidden" ? 403 : e.code === "not_found" ? 404 : 400;
          return Response.json({ error: { code: e.code, message: e.message } }, { status });
        }
        throw e;
      }
    }
    if (request.headers.get("Upgrade") !== "websocket") return new Response("expected websocket", { status: 426 });

    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  // ---- WebSocket handlers -------------------------------------------------------------

  override async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    if (!this.state) return this.reject(ws, "closed", "screen closed", true);

    // Flood protection: drop messages over the budget; close connections that keep going.
    const now = Date.now();
    let bucket = this.buckets.get(ws);
    if (!bucket) this.buckets.set(ws, (bucket = RL.newBucket(now)));
    const verdict = RL.take(bucket, now);
    if (verdict === "close") return this.reject(ws, "rate_limited", "too many messages", true);
    if (verdict === "limited") return this.reject(ws, "rate_limited", "too many messages; slow down");

    let msg: ClientMessage;
    try {
      msg = parseClientMessage(raw);
    } catch (e) {
      return this.reject(ws, e instanceof ProtocolError ? e.code : "bad_request", String((e as Error).message));
    }

    const me = ws.deserializeAttachment() as Attachment | null;
    if (!me) {
      if (msg.type !== "hello") return this.reject(ws, "bad_request", "send hello first", true);
      return this.onHello(ws, msg.data);
    }

    try {
      await this.onMessage(ws, me, msg);
    } catch (e) {
      if (e instanceof ProtocolError) return this.reject(ws, e.code, e.message);
      throw e;
    }
  }

  override async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    try {
      ws.close(code, reason);
    } catch {
      /* already closed */
    }
    await this.onDisconnect(ws);
  }

  override async webSocketError(ws: WebSocket): Promise<void> {
    await this.onDisconnect(ws);
  }

  override async alarm(): Promise<void> {
    const s = this.state;
    if (!s) return;
    const now = Date.now();

    // Reconnect grace over: drop them from the list.
    let expired = false;
    for (const [key, since] of Object.entries(s.away)) {
      if (now - since >= RECONNECT_GRACE_MS) {
        delete s.away[key];
        expired = true;
        await this.system(`${this.nameOf(key)} left`);
      }
    }
    if (expired) this.broadcastViewers();

    if (s.ready && !s.ready.done && now >= s.ready.deadline) await this.finishReady();

    // Current item reached its end (host's duration is the reference): next item, or stop at the end.
    const end = P.endsAt(s.anchor, s.item);
    if (end !== null && now >= end - 50) await this.itemEnded();

    if (this.online().length === 0 && s.emptySince !== null && now >= s.emptySince + EMPTY_SCREEN_TTL_MS) {
      return this.closeScreen("screen closed");
    }
    if (s.controllersAbsentSince !== null && now >= s.controllersAbsentSince + HOST_ABSENT_TTL_MS) {
      return this.closeScreen("the host has left, so the screen closed");
    }
    await this.save();
    await this.scheduleAlarm();
  }

  /** One alarm for every deadline: empty screen, host absence and reconnect grace. */
  private async scheduleAlarm(): Promise<void> {
    const s = this.state;
    if (!s) return;
    const deadlines: number[] = [];
    if (s.emptySince !== null) deadlines.push(s.emptySince + EMPTY_SCREEN_TTL_MS);
    if (s.controllersAbsentSince !== null) deadlines.push(s.controllersAbsentSince + HOST_ABSENT_TTL_MS);
    for (const since of Object.values(s.away)) deadlines.push(since + RECONNECT_GRACE_MS);
    const end = P.endsAt(s.anchor, s.item);
    if (end !== null) deadlines.push(end);
    if (s.ready && !s.ready.done) deadlines.push(s.ready.deadline);
    if (deadlines.length) await this.ctx.storage.setAlarm(Math.min(...deadlines));
    else await this.ctx.storage.deleteAlarm();
  }

  // ---- Join -----------------------------------------------------------------------------

  private async onHello(ws: WebSocket, h: Extract<ClientMessage, { type: "hello" }>["data"]): Promise<void> {
    const s = this.state!;
    if (h.protocol < MIN_CLIENT_PROTOCOL) return this.reject(ws, "update_required", "please update Kino", true);

    const key = await sha256Hex(h.token);
    if (s.bans.includes(key)) return this.reject(ws, "banned", "you are banned from this screen", true);

    if (!s.ownerKey && s.claimHash && h.claim && (await sha256Hex(h.claim)) === s.claimHash) {
      s.ownerKey = key;
      s.claimHash = null;
    }
    const isOwner = key === s.ownerKey;

    if (!isOwner && !s.members[key] && s.passwordHash) {
      const now = Date.now();
      if (this.passwordLimited(key, now)) {
        return this.reject(ws, "rate_limited", "too many wrong passwords; try again in a minute", true);
      }
      if (!h.password || !(await verifyPassword(h.password, s.passwordHash))) {
        (s.failedPasswords[key] ??= []).push(now);
        await this.save();
        return this.reject(ws, "wrong_password", "wrong password", true);
      }
    }

    // A reconnect (within the grace period) or a replaced connection isn't a new join.
    let returning = key in s.away;

    // One live session per viewer: a new connection replaces the old one (e.g. after a network change).
    const others = this.online().filter(([w, a]) => {
      if (a.key !== key) return true;
      returning = true;
      try {
        w.serializeAttachment(null);
        w.close(4000, "replaced by a newer connection");
      } catch {
        /* ignore */
      }
      return false;
    });
    const reserved = Object.keys(s.away).filter((k) => k !== key).length; // seats held for reconnecting viewers
    if (!isOwner && others.length + reserved >= s.maxViewers) return this.reject(ws, "full", "screen is full", true);

    const me: Attachment = { key, id: key.slice(0, 12), name: h.name, device: h.device, rtt: null, buffering: false };
    ws.serializeAttachment(me);
    const member = (s.members[key] ??= R.newMember(h.name, h.device));
    member.name = h.name;
    member.device = h.device;
    delete s.failedPasswords[key];
    delete s.away[key];
    if (!returning) await this.system(`${h.name} joined`);
    await this.updatePresence();

    this.send(ws, {
      type: "welcome",
      data: {
        self: this.viewerInfo(me),
        screen: this.screenInfo(),
        viewers: this.viewerList(),
        roles: s.roles,
        coHosts: this.coHostList(),
        playlist: s.playlist,
        chat: this.chat.messages,
        subs: s.subs,
        ready: s.ready,
        hold: s.hold,
        item: s.item,
        anchor: s.anchor,
        serverTime: Date.now(),
      },
    });
    this.broadcastViewers();
    await this.updateLobby();
  }

  private passwordLimited(key: string, now: number): boolean {
    const s = this.state!;
    let total = 0;
    for (const [k, times] of Object.entries(s.failedPasswords)) {
      const recent = times.filter((t) => now - t < PASSWORD_WINDOW_MS);
      if (recent.length) s.failedPasswords[k] = recent;
      else delete s.failedPasswords[k];
      total += recent.length;
    }
    return (s.failedPasswords[key]?.length ?? 0) >= PASSWORD_ATTEMPTS_PER_TOKEN || total >= PASSWORD_ATTEMPTS_PER_SCREEN;
  }

  // ---- Messages -----------------------------------------------------------------------

  private async onMessage(ws: WebSocket, me: Attachment, msg: ClientMessage): Promise<void> {
    const s = this.state!;
    const now = Date.now();

    switch (msg.type) {
      case "hello":
        throw new ProtocolError("bad_request", "already joined");

      case "ping":
        // Theatre time is stamped as the message is handled (Workers' clock advances between I/O events).
        this.send(ws, { type: "pong", data: { t0: msg.data.t0, ts: now } });
        return;

      case "rtt":
        me.rtt = Math.round(msg.data.value);
        ws.serializeAttachment(me);
        this.broadcastViewers();
        return;

      case "buffering":
      case "status": {
        const status: ViewerStatus = msg.type === "status" ? msg.data.value : msg.data.value ? "buffering" : "sync";
        const buffering = status === "buffering";
        const changed = me.status !== status || me.buffering !== buffering;
        me.status = status;
        me.buffering = buffering;
        ws.serializeAttachment(me);
        if (!buffering && s.holdIgnored.includes(me.key)) s.holdIgnored = s.holdIgnored.filter((k) => k !== me.key);
        if (changed) this.broadcastViewers();
        await this.checkHold();
        return;
      }

      case "item.ended": {
        // YouTube: advance only when everyone has finished (§14.13). The host can skip ahead anyway.
        if (s.item?.id !== msg.data.id || s.item.kind !== "youtube") return;
        if (!s.ended.includes(me.key)) s.ended = [...s.ended, me.key];
        await this.save();
        return this.checkAllEnded();
      }

      case "hold.release":
        // "Resume anyway": stop waiting for whoever is buffering now.
        this.require(me, "playback.toggle");
        return this.releaseHold(me.name);

      // ---- Ready check (§14.14)

      case "ready.start": {
        this.require(me, "screen.ready_check");
        s.ready = { id: ++s.readySeq, by: me.name, deadline: now + READY_CHECK_MS, answers: { [me.id]: true }, done: false };
        await this.save();
        this.broadcast({ type: "ready", data: s.ready });
        await this.scheduleAlarm();
        return;
      }

      case "ready.answer": {
        const r = s.ready;
        if (!r || r.done || r.id !== msg.data.id) throw new ProtocolError("bad_request", "that ready check is over");
        r.answers[me.id] = msg.data.ready;
        await this.finishReadyIfComplete();
        return;
      }

      // ---- Chat (§18)

      case "chat.send":
      case "chat.gif": {
        this.require(me, msg.type === "chat.gif" ? "chat.gif" : "chat.send");
        this.requireUnmuted(me);
        this.rateLimit(ws, me, "chatTimes", C.CHAT_RATE, now);
        await this.post({
          kind: msg.type === "chat.gif" ? "gif" : "text",
          from: me.id,
          name: me.name,
          text: msg.type === "chat.send" ? msg.data.text : null,
          gif: msg.type === "chat.gif" ? msg.data : null,
        });
        return;
      }

      case "subs.unshare": {
        const sub = s.subs.find((x) => x.id === msg.data.id);
        if (!sub) throw new ProtocolError("not_found", "no such subtitles");
        // The sharer, or anyone with subtitles.share who outranks them.
        const sharerKey = Object.keys(s.members).find((k) => k.startsWith(sub.from));
        const mine = sub.from === me.id;
        if (!mine) {
          this.require(me, "subtitles.share");
          if (sharerKey) this.requireOutranks(this.subject(me.key), sharerKey);
        }
        await this.dropSubs([sub.id]);
        return;
      }

      case "react":
        this.require(me, "chat.react");
        this.requireUnmuted(me);
        this.rateLimit(ws, me, "reactTimes", C.REACT_RATE, now);
        this.broadcast({ type: "react", data: { from: me.id, name: me.name, emoji: msg.data.emoji } });
        return;

      // ---- Playback

      case "play":
        this.require(me, "playback.toggle");
        if (s.hold) return this.releaseHold(me.name); // pressing play while held = resume anyway
        return this.setAnchor(A.play(s.anchor, now, this.lead()));

      case "pause":
        this.require(me, "playback.toggle");
        if (s.hold) await this.setHold(null); // a deliberate pause: don't auto-resume later
        return this.setAnchor(A.pause(s.anchor, now));

      case "seek":
        this.require(me, "playback.seek");
        return this.setAnchor(A.seek(s.anchor, msg.data.to, now, this.lead()));

      case "reanchor":
        // Only the timeline authority: the host, or the acting host while the host is away.
        if (me.key !== this.controllerKey()) throw new ProtocolError("forbidden", "only the host can re-anchor");
        if (s.anchor.state !== "playing") return; // re-anchoring only corrects running playback
        return this.setAnchor(A.reanchor(s.anchor, msg.data.position, msg.data.at, now));

      case "load": {
        // Open now: insert after the current item and make it current (paused at 0).
        this.requireAdd(me, [msg.data]);
        const [item] = this.newItems([msg.data]);
        s.playlist = P.insert(s.playlist, [item!], P.indexOf(s.playlist, s.item?.id ?? null) + 1);
        this.broadcast({ type: "playlist", data: s.playlist });
        return this.setCurrent(item!, false);
      }

      // ---- Playlist (§13)

      case "playlist.add": {
        this.requireAdd(me, msg.data.items);
        const items = this.newItems(msg.data.items);
        s.playlist = P.insert(s.playlist, items, msg.data.at);
        await this.save();
        this.broadcast({ type: "playlist", data: s.playlist });
        if (!s.item) return this.setCurrent(items[0]!, false); // first item becomes current
        return;
      }

      case "playlist.remove": {
        this.require(me, "playlist.remove");
        const before = s.playlist;
        if (P.indexOf(before, msg.data.id) < 0) throw new ProtocolError("not_found", "no such item");
        s.playlist = P.remove(before, msg.data.id);
        await this.save();
        this.broadcast({ type: "playlist", data: s.playlist });
        await this.dropSubs(s.subs.filter((x) => x.itemId === msg.data.id).map((x) => x.id));
        if (s.item?.id === msg.data.id) return this.setCurrent(P.successorAfterRemoval(before, msg.data.id), s.anchor.state === "playing");
        return;
      }

      case "playlist.move": {
        this.require(me, "playlist.reorder");
        if (P.indexOf(s.playlist, msg.data.id) < 0) throw new ProtocolError("not_found", "no such item");
        s.playlist = P.move(s.playlist, msg.data.id, msg.data.to);
        await this.save();
        this.broadcast({ type: "playlist", data: s.playlist });
        return;
      }

      case "playlist.play": {
        this.require(me, "playback.skip");
        const item = s.playlist.find((it) => it.id === msg.data.id);
        if (!item) throw new ProtocolError("not_found", "no such item");
        return this.setCurrent(item, true);
      }

      case "skip": {
        this.require(me, "playback.skip");
        const item = P.neighbour(s.playlist, s.item?.id ?? null, msg.data.direction === "next" ? 1 : -1);
        if (!item)
          throw new ProtocolError("bad_request", msg.data.direction === "next" ? "this is the last item" : "this is the first item");
        return this.setCurrent(item, s.anchor.state === "playing" || msg.data.direction === "next");
      }

      // ---- Roles

      case "roles.create": {
        this.require(me, "roles.manage");
        const actor = this.subject(me.key);
        const myRank = R.rank(actor, s.roles);
        if (s.roles.filter((r) => !r.builtin).length >= R.MAX_CUSTOM_ROLES) {
          throw new ProtocolError("bad_request", `at most ${R.MAX_CUSTOM_ROLES} roles`);
        }
        const position = msg.data.position ?? R.defaultPosition(myRank, s.roles);
        if (position >= myRank || position < R.RANK.customMin) throw new ProtocolError("forbidden", "a role must rank below your own");
        this.requireGrantable(actor, msg.data.permissions);
        s.roles.push({
          id: `r${++s.roleSeq}`,
          name: msg.data.name,
          colour: msg.data.colour,
          position: Math.round(position),
          permissions: R.uniquePermissions(msg.data.permissions),
          builtin: false,
        });
        return this.rolesChanged(false);
      }

      case "roles.update": {
        this.require(me, "roles.manage");
        const actor = this.subject(me.key);
        const myRank = R.rank(actor, s.roles);
        const role = this.role(msg.data.id);
        if (role.id === R.COHOST_ROLE) throw new ProtocolError("forbidden", "the Co-host role can't be edited");
        if (role.position >= myRank) throw new ProtocolError("forbidden", "you can only edit roles below your own");
        const d = msg.data;
        if (role.builtin && (d.name !== undefined || d.colour !== undefined || d.position !== undefined)) {
          throw new ProtocolError("forbidden", "only the Viewer role's permissions can be changed");
        }
        if (d.position !== undefined && d.position >= myRank) throw new ProtocolError("forbidden", "a role must rank below your own");
        if (d.permissions) {
          this.requireGrantable(
            actor,
            d.permissions.filter((p) => !role.permissions.includes(p)),
          );
          role.permissions = R.uniquePermissions(d.permissions);
        }
        if (d.name !== undefined) role.name = d.name;
        if (d.colour !== undefined) role.colour = d.colour;
        if (d.position !== undefined) role.position = Math.round(d.position);
        return this.rolesChanged(true);
      }

      case "roles.delete": {
        this.require(me, "roles.manage");
        const actor = this.subject(me.key);
        const role = this.role(msg.data.id);
        if (role.builtin) throw new ProtocolError("forbidden", "built-in roles can't be deleted");
        if (role.position >= R.rank(actor, s.roles)) throw new ProtocolError("forbidden", "you can only delete roles below your own");
        s.roles = s.roles.filter((r) => r !== role);
        for (const m of Object.values(s.members)) m.roles = m.roles.filter((id) => id !== role.id);
        return this.rolesChanged(true);
      }

      case "roles.assign": {
        this.require(me, "roles.assign");
        const actor = this.subject(me.key);
        const role = this.role(msg.data.role);
        if (role.builtin) throw new ProtocolError("bad_request", "co-hosts are set by the host; everyone has the Viewer role");
        if (role.position >= R.rank(actor, s.roles)) throw new ProtocolError("forbidden", "you can only assign roles below your own");
        const targetKey = this.memberKey(msg.data.viewer);
        this.requireOutranks(actor, targetKey);
        const m = s.members[targetKey]!;
        const had = m.roles.includes(role.id);
        m.roles = msg.data.assigned ? [...new Set([...m.roles, role.id])] : m.roles.filter((id) => id !== role.id);
        await this.save();
        this.broadcastViewers();
        if (had !== msg.data.assigned)
          await this.system(msg.data.assigned ? `${m.name} is now ${role.name}` : `${m.name} is no longer ${role.name}`);
        return;
      }

      case "viewer.overrides": {
        this.require(me, "roles.manage");
        const actor = this.subject(me.key);
        const targetKey = this.memberKey(msg.data.viewer);
        this.requireOutranks(actor, targetKey);
        this.requireGrantable(actor, msg.data.allow);
        const m = s.members[targetKey]!;
        m.allow = R.uniquePermissions(msg.data.allow);
        m.deny = R.uniquePermissions(msg.data.deny);
        await this.save();
        this.broadcastViewers();
        return;
      }

      // ---- Moderation (§9)

      case "viewer.mute": {
        this.require(me, "viewers.mute");
        const targetKey = this.memberKey(msg.data.viewer);
        this.requireOutranks(this.subject(me.key), targetKey);
        s.members[targetKey]!.muted = msg.data.muted;
        await this.save();
        this.broadcastViewers();
        return;
      }

      case "viewer.kick": {
        this.require(me, "viewers.kick");
        const targetKey = this.memberKey(msg.data.viewer);
        this.requireOutranks(this.subject(me.key), targetKey);
        this.disconnect(targetKey, "kicked", "you were removed from the screen");
        await this.system(`${this.nameOf(targetKey)} was removed by ${me.name}`);
        return;
      }

      case "viewer.ban": {
        this.require(me, "viewers.ban");
        const targetKey = this.memberKey(msg.data.viewer);
        this.requireOutranks(this.subject(me.key), targetKey);
        if (!s.bans.includes(targetKey)) s.bans.push(targetKey);
        const wasCoHost = s.coHosts.includes(targetKey);
        s.coHosts = s.coHosts.filter((k) => k !== targetKey);
        await this.save();
        this.disconnect(targetKey, "banned", "you are banned from this screen");
        if (wasCoHost) this.broadcast({ type: "cohosts", data: this.coHostList() });
        await this.system(`${this.nameOf(targetKey)} was banned by ${me.name}`);
        return;
      }

      // ---- Host-only (§7)

      case "cohosts.set": {
        this.requireOwner(me);
        const keys = msg.data.viewers.map((id) => this.memberKey(id));
        if (keys.includes(s.ownerKey!)) throw new ProtocolError("bad_request", "the host can't be a co-host");
        const before = s.coHosts;
        s.coHosts = keys;
        for (const k of keys.filter((k) => !before.includes(k))) await this.system(`${this.nameOf(k)} is now a co-host`);
        for (const k of before.filter((k) => !keys.includes(k))) await this.system(`${this.nameOf(k)} is no longer a co-host`);
        await this.updatePresence();
        this.broadcastViewers();
        this.broadcast({ type: "cohosts", data: this.coHostList() });
        await this.updateLobby();
        return;
      }

      case "host.transfer": {
        this.requireOwner(me);
        const targetKey = this.memberKey(msg.data.viewer);
        if (targetKey === s.ownerKey) return;
        if (!this.online().some(([, a]) => a.key === targetKey)) throw new ProtocolError("bad_request", "the new host must be present");
        // The old host becomes the top co-host (§7.5).
        s.coHosts = [me.key, ...s.coHosts.filter((k) => k !== targetKey && k !== me.key)];
        s.ownerKey = targetKey;
        await this.system(`${this.nameOf(targetKey)} is now the host`);
        await this.updatePresence();
        this.broadcastViewers();
        this.broadcast({ type: "cohosts", data: this.coHostList() });
        await this.updateLobby();
        return;
      }

      case "screen.close":
        this.requireOwner(me);
        return this.closeScreen("the host closed the screen");

      case "leave":
        // Explicit leave: no reconnect grace.
        await this.system(`${me.name} left`);
        ws.serializeAttachment(null);
        try {
          ws.close(1000, "left");
        } catch {
          /* ignore */
        }
        this.broadcastViewers();
        await this.updatePresence();
        await this.updateLobby();
        return;

      // ---- Screen settings & invites (§6.3, §11)

      case "settings.update": {
        this.require(me, "screen.settings");
        const d = msg.data;
        if (d.name !== undefined) s.name = d.name;
        if (d.maxViewers !== undefined) s.maxViewers = d.maxViewers;
        if (d.showDevices !== undefined) s.showDevices = d.showDevices;
        if (d.autoAdvance !== undefined) s.autoAdvance = d.autoAdvance;
        if (d.bufferingPolicy !== undefined) s.bufferingPolicy = d.bufferingPolicy;
        if (d.visibility !== undefined || d.password !== undefined || d.hidden !== undefined) {
          const visibility = d.visibility ?? s.visibility;
          if (visibility === "private") {
            if (d.password) s.passwordHash = await hashPassword(d.password);
            if (!s.passwordHash) throw new ProtocolError("bad_request", "private screens need a password");
            s.hidden = d.hidden ?? s.hidden;
          } else {
            s.passwordHash = null;
            s.hidden = false;
          }
          s.visibility = visibility;
        }
        await this.save();
        this.broadcast({ type: "screen", data: this.screenInfo() });
        if (d.showDevices !== undefined) this.broadcastViewers();
        await this.lobby().update(s.code, { name: s.name, visibility: s.visibility, hidden: s.hidden, maxViewers: s.maxViewers });
        if (d.bufferingPolicy === "keep" && s.hold) await this.releaseHold(null);
        else await this.checkHold();
        return;
      }

      case "code.regenerate": {
        this.require(me, "screen.invite");
        let next: string | null = null;
        for (let attempt = 0; attempt < 8 && !next; attempt++) {
          const candidate = screenCode();
          if (await this.lobby().recode(s.code, candidate)) next = candidate;
        }
        if (!next) throw new ProtocolError("bad_request", "couldn't allocate a new code; try again");
        s.code = next; // the old code stops working at once: it no longer resolves
        await this.save();
        this.broadcast({ type: "screen", data: this.screenInfo() });
        return;
      }
    }
  }

  // ---- Permission helpers ---------------------------------------------------------------

  private subject(key: string, online = this.online()): R.Subject {
    const s = this.state!;
    return {
      isOwner: key === s.ownerKey,
      isCoHost: s.coHosts.includes(key),
      isActingHost: key === this.actingHostKey(online),
      member: s.members[key] ?? R.newMember("", ""),
    };
  }

  private require(me: Attachment, p: R.Permission): void {
    if (!R.can(this.subject(me.key), p, this.state!.roles)) {
      throw new ProtocolError("forbidden", `you don't have permission: ${p}`);
    }
  }

  private requireOwner(me: Attachment): void {
    if (me.key !== this.state!.ownerKey) throw new ProtocolError("forbidden", "only the host can do that");
  }

  private requireOutranks(actor: R.Subject, targetKey: string): void {
    if (!R.outranks(actor, this.subject(targetKey), this.state!.roles)) {
      throw new ProtocolError("forbidden", "you can only do that to viewers ranked below you");
    }
  }

  private requireGrantable(actor: R.Subject, wanted: R.Permission[]): void {
    const missing = R.missingPermissions(actor, wanted, this.state!.roles);
    if (missing.length) throw new ProtocolError("forbidden", `you can't grant permissions you don't have: ${missing.join(", ")}`);
  }

  private role(id: string): R.Role {
    const role = this.state!.roles.find((r) => r.id === id);
    if (!role) throw new ProtocolError("not_found", "no such role");
    return role;
  }

  /** Viewer id (first 12 hex of the key) → key, for anyone who has joined this screen. */
  private memberKey(viewerId: string): string {
    const key = Object.keys(this.state!.members).find((k) => k.startsWith(viewerId));
    if (!key) throw new ProtocolError("not_found", "no such viewer");
    return key;
  }

  /** Everyone connected has reached the end of the current YouTube item: move on. */
  private async checkAllEnded(): Promise<void> {
    const s = this.state!;
    if (s.item?.kind !== "youtube" || s.ended.length === 0) return;
    const online = this.online().map(([, a]) => a.key);
    if (online.length > 0 && online.every((k) => s.ended.includes(k))) await this.itemEnded();
  }

  // ---- Buffering policy (§14.10) and ready check (§14.14)

  /** Under "wait for everyone": pause while someone buffers, resume with a scheduled start when all are ready. */
  private async checkHold(): Promise<void> {
    const s = this.state!;
    if (s.bufferingPolicy !== "wait") return;
    const waitingFor = this.online()
      .filter(([, a]) => a.buffering && !s.holdIgnored.includes(a.key))
      .map(([, a]) => a.name);

    if (!s.hold) {
      if (waitingFor.length === 0 || s.anchor.state !== "playing") return;
      await this.setAnchor(A.pause(s.anchor, Date.now()));
      await this.setHold(waitingFor);
      await this.system(`Waiting for ${waitingFor.join(", ")}…`);
      return;
    }
    if (waitingFor.length === 0) {
      await this.setHold(null);
      await this.setAnchor(A.play(s.anchor, Date.now(), this.lead()));
      return;
    }
    if (waitingFor.join("|") !== s.hold.join("|")) await this.setHold(waitingFor);
  }

  /** Resume now, and don't wait again for anyone buffering at this moment. */
  private async releaseHold(by: string | null): Promise<void> {
    const s = this.state!;
    s.holdIgnored = [
      ...new Set([
        ...s.holdIgnored,
        ...this.online()
          .filter(([, a]) => a.buffering)
          .map(([, a]) => a.key),
      ]),
    ];
    const wasHeld = s.hold !== null;
    await this.setHold(null);
    if (wasHeld && by) await this.system(`${by} resumed without waiting`);
    if (s.anchor.state !== "playing") await this.setAnchor(A.play(s.anchor, Date.now(), this.lead()));
  }

  private async setHold(names: string[] | null): Promise<void> {
    const s = this.state!;
    s.hold = names;
    await this.save();
    this.broadcast({ type: "hold", data: names });
  }

  /** Done when everyone connected has answered. */
  private async finishReadyIfComplete(): Promise<void> {
    const r = this.state!.ready;
    if (!r || r.done) return;
    const ids = this.online().map(([, a]) => a.id);
    if (ids.every((id) => id in r.answers)) await this.finishReady();
    else {
      await this.save();
      this.broadcast({ type: "ready", data: r });
    }
  }

  private async finishReady(): Promise<void> {
    const s = this.state!;
    const r = s.ready;
    if (!r || r.done) return;
    r.done = true;
    await this.save();
    this.broadcast({ type: "ready", data: r });
    const online = this.online();
    const ready = online.filter(([, a]) => r.answers[a.id] === true).length;
    await this.system(ready === online.length ? "Everyone is ready" : `Ready check: ${ready} of ${online.length} ready`);
    await this.scheduleAlarm();
  }

  // ---- Shared subtitles (§17)

  /** POST: upload (needs subtitles.share). GET <id>: download (members only). Token in "Authorization: Bearer". */
  private async subsRequest(request: Request, id: string | undefined): Promise<Response> {
    const s = this.state!;
    const token = S.bearer(request);
    if (!token) throw new ProtocolError("forbidden", "missing token");
    const key = await sha256Hex(token);
    if (!s.members[key] || s.bans.includes(key)) throw new ProtocolError("forbidden", "join the screen first");

    if (request.method === "GET" && id) {
      const meta = s.subs.find((x) => x.id === id);
      const body = meta ? await this.ctx.storage.get<ArrayBuffer>(S.storageKey(id)) : undefined;
      if (!meta || !body) throw new ProtocolError("not_found", "no such subtitles");
      return new Response(body, { headers: { "Content-Type": "application/gzip", "Cache-Control": "private, max-age=86400" } });
    }
    if (request.method !== "POST" || id) throw new ProtocolError("bad_request", "unsupported request");

    if (!R.can(this.subject(key), "subtitles.share", s.roles))
      throw new ProtocolError("forbidden", "you don't have permission: subtitles.share");
    const { itemId, name, format } = S.parseUpload(new URL(request.url));
    const item = s.playlist.find((it) => it.id === itemId);
    if (!item) throw new ProtocolError("not_found", "no such item");
    S.checkRoom(s.subs, itemId);
    const declared = Number(request.headers.get("Content-Length") ?? "0");
    if (declared > S.MAX_SUB_BYTES) S.checkBody(new ArrayBuffer(S.MAX_SUB_BYTES + 1));
    const body = await request.arrayBuffer();
    S.checkBody(body);

    const member = s.members[key]!;
    const meta: S.SubMeta = {
      id: `s${++s.subSeq}`,
      itemId,
      name,
      format,
      size: body.byteLength,
      from: key.slice(0, 12),
      fromName: member.name,
    };
    await this.ctx.storage.put(S.storageKey(meta.id), body);
    s.subs = [...s.subs, meta];
    await this.save();
    this.broadcast({ type: "subs", data: s.subs });
    await this.system(`${member.name} shared subtitles: ${name} (for ${item.name})`);
    return Response.json(meta, { status: 201 });
  }

  private async dropSubs(ids: string[]): Promise<void> {
    const s = this.state!;
    if (ids.length === 0) return;
    s.subs = s.subs.filter((x) => !ids.includes(x.id));
    await this.ctx.storage.delete(ids.map(S.storageKey));
    await this.save();
    this.broadcast({ type: "subs", data: s.subs });
  }

  // ---- Chat helpers

  private requireUnmuted(me: Attachment): void {
    if (this.state!.members[me.key]?.muted) throw new ProtocolError("forbidden", "you are muted in this screen");
  }

  private rateLimit(
    ws: WebSocket,
    me: Attachment,
    field: "chatTimes" | "reactTimes",
    rate: { count: number; windowMs: number },
    now: number,
  ): void {
    const times = C.allow(me[field], now, rate);
    if (!times) throw new ProtocolError("rate_limited", "slow down a little");
    me[field] = times;
    ws.serializeAttachment(me);
  }

  private async post(m: Omit<C.ChatMessage, "id" | "at">): Promise<void> {
    const msg: C.ChatMessage = { id: ++this.chat.seq, at: Date.now(), ...m };
    this.chat.messages = C.append(this.chat.messages, msg);
    await this.ctx.storage.put("chat", this.chat);
    this.broadcast({ type: "chat", data: msg });
  }

  /** Joins, leaves, roles, handover, item changes (§18). */
  private system(text: string): Promise<void> {
    return this.post({ kind: "system", from: null, name: null, text, gif: null });
  }

  private nameOf(key: string): string {
    return this.state?.members[key]?.name ?? "Someone";
  }

  private coHostList(): { id: string; name: string }[] {
    const s = this.state!;
    return s.coHosts.map((k) => ({ id: k.slice(0, 12), name: s.members[k]?.name ?? "?" }));
  }

  private async rolesChanged(affectsViewers: boolean): Promise<void> {
    await this.save();
    this.broadcast({ type: "roles", data: this.state!.roles });
    if (affectsViewers) this.broadcastViewers();
  }

  // ---- Presence & handover (§7, §6.5) ------------------------------------------------------

  /** The highest-priority co-host present while the host is away. */
  private actingHostKey(online = this.online()): string | null {
    const s = this.state!;
    const present = new Set(online.map(([, a]) => a.key));
    if (s.ownerKey && present.has(s.ownerKey)) return null;
    return s.coHosts.find((k) => present.has(k)) ?? null;
  }

  /** Whoever defines the timeline: the host, else the acting host. */
  private controllerKey(): string | null {
    const s = this.state!;
    const online = this.online();
    if (s.ownerKey && online.some(([, a]) => a.key === s.ownerKey)) return s.ownerKey;
    return this.actingHostKey(online);
  }

  /** Saves state and (re)arms the lifecycle alarm after anyone joins, leaves or changes role. */
  private async updatePresence(except?: WebSocket): Promise<void> {
    const s = this.state!;
    const online = this.online(except);
    const keys = new Set(online.map(([, a]) => a.key));
    const controllerPresent = (s.ownerKey !== null && keys.has(s.ownerKey)) || s.coHosts.some((k) => keys.has(k));
    const now = Date.now();

    if (online.length === 0) s.emptySince ??= now;
    else s.emptySince = null;
    if (controllerPresent) s.controllersAbsentSince = null;
    else s.controllersAbsentSince ??= now;

    const acting = this.actingHostKey(online);
    if (acting !== s.actingHost) {
      if (acting) await this.system(`${this.nameOf(acting)} is standing in for the host`);
      else if (s.ownerKey && keys.has(s.ownerKey) && s.actingHost) await this.system("The host is back");
      s.actingHost = acting;
    }
    await this.save();
    await this.scheduleAlarm();
  }

  private async closeScreen(reason: string): Promise<void> {
    const s = this.state;
    if (!s) return;
    for (const [ws] of this.online()) {
      ws.serializeAttachment(null);
      this.reject(ws, "closed", reason, true);
    }
    await this.lobby().remove(s.code);
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
    this.state = null;
  }

  /** Disconnects a viewer (kick/ban). The close handler won't run for them, so update presence here. */
  private disconnect(key: string, code: ErrorCode, message: string): void {
    delete this.state!.away[key];
    for (const [ws, a] of this.online()) {
      if (a.key !== key) continue;
      ws.serializeAttachment(null);
      this.reject(ws, code, message, true);
    }
    this.broadcastViewers();
    this.ctx.waitUntil(this.updatePresence().then(() => this.updateLobby()));
  }

  // ---- Helpers --------------------------------------------------------------------------

  private async setAnchor(next: Anchor): Promise<void> {
    const s = this.state!;
    if (next === s.anchor) return;
    s.anchor = next;
    await this.save();
    this.broadcast({ type: "anchor", data: next });
    await this.scheduleAlarm(); // the item's end moves with the anchor
  }

  /** Makes `item` current at position 0, playing (scheduled start) or paused. */
  private async setCurrent(item: Item | null, play: boolean): Promise<void> {
    const s = this.state!;
    const now = Date.now();
    if (s.hold) await this.setHold(null);
    s.ended = [];
    s.item = item;
    let a = A.load(s.anchor, item?.id ?? null, now);
    if (play && item) a = A.play(a, now, this.lead());
    s.anchor = a;
    await this.save();
    this.broadcast({ type: "item", data: item });
    if (item) await this.system(`Now playing: ${item.name}`);
    this.broadcast({ type: "anchor", data: a });
    await this.scheduleAlarm();
  }

  /** The current item ended: auto-advance, or stop exactly at the end. */
  private async itemEnded(): Promise<void> {
    const s = this.state!;
    const next = P.neighbour(s.playlist, s.item?.id ?? null, 1);
    if (next && s.autoAdvance) return this.setCurrent(next, true);
    const end = s.item?.duration ?? A.expectedPosition(s.anchor, Date.now());
    await this.setAnchor({ ...s.anchor, state: "paused", position: end, at: Date.now(), seq: s.anchor.seq + 1 });
  }

  private newItems(items: NewItem[]): Item[] {
    const s = this.state!;
    if (s.playlist.length + items.length > P.MAX_PLAYLIST)
      throw new ProtocolError("bad_request", `playlists hold at most ${P.MAX_PLAYLIST} items`);
    return items.map((it) => ({ id: `i${++s.itemSeq}`, ...it }));
  }

  /** Local files need `playlist.add`; links need `playlist.add_external`. */
  private requireAdd(me: Attachment, items: NewItem[]): void {
    if (items.some((it) => it.kind === "local")) this.require(me, "playlist.add");
    if (items.some((it) => it.kind !== "local")) this.require(me, "playlist.add_external");
  }

  private lead(): number {
    const rtts = this.online().map(([, a]) => a.rtt ?? DEFAULT_RTT_MS);
    return A.startLead(rtts.length ? Math.max(...rtts) : DEFAULT_RTT_MS);
  }

  private async onDisconnect(ws: WebSocket): Promise<void> {
    if (!this.state) return;
    const me = ws.deserializeAttachment() as Attachment | null;
    if (!me) return;
    ws.serializeAttachment(null);
    this.state.away[me.key] = Date.now(); // keeps their seat; shown as reconnecting
    this.broadcastViewers(ws);
    await this.updatePresence(ws);
    await this.updateLobby(ws);
    await this.checkHold();
    await this.finishReadyIfComplete();
    await this.checkAllEnded();
  }

  /** Joined sockets, optionally excluding one that is closing. */
  private online(except?: WebSocket): [WebSocket, Attachment][] {
    const out: [WebSocket, Attachment][] = [];
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === except) continue;
      const a = ws.deserializeAttachment() as Attachment | null;
      if (a) out.push([ws, a]);
    }
    return out;
  }

  private viewerInfo(a: Attachment, online = this.online()): ViewerInfo {
    const s = this.state!;
    const subject = this.subject(a.key, online);
    const coHost = s.coHosts.indexOf(a.key);
    return {
      id: a.id,
      name: a.name,
      device: s.showDevices ? a.device : null,
      isHost: subject.isOwner,
      rtt: a.rtt,
      buffering: a.buffering,
      roles: subject.member.roles,
      coHost: coHost < 0 ? null : coHost + 1,
      actingHost: subject.isActingHost,
      muted: subject.member.muted,
      allow: subject.member.allow,
      deny: subject.member.deny,
      permissions: R.effective(subject, s.roles),
      connected: true,
      status: a.status ?? (a.buffering ? "buffering" : "sync"),
    };
  }

  /** Everyone connected, then anyone in their reconnect grace period. */
  private viewerList(except?: WebSocket): ViewerInfo[] {
    const s = this.state!;
    const online = this.online(except);
    const here = new Set(online.map(([, a]) => a.key));
    const list = online.map(([, a]) => this.viewerInfo(a, online));
    for (const key of Object.keys(s.away)) {
      const m = s.members[key];
      if (here.has(key) || !m) continue;
      const a: Attachment = { key, id: key.slice(0, 12), name: m.name, device: m.device as Device, rtt: null, buffering: false };
      list.push({ ...this.viewerInfo(a, online), connected: false });
    }
    return list;
  }

  private screenInfo(): ScreenInfo {
    const s = this.state!;
    return {
      code: s.code,
      name: s.name,
      visibility: s.visibility,
      hidden: s.hidden,
      maxViewers: s.maxViewers,
      showDevices: s.showDevices,
      autoAdvance: s.autoAdvance,
      bufferingPolicy: s.bufferingPolicy,
    };
  }

  private broadcastViewers(except?: WebSocket): void {
    this.broadcast({ type: "viewers", data: this.viewerList(except) }, except);
  }

  private broadcast(msg: ServerMessage, except?: WebSocket): void {
    const text = encode(msg);
    for (const [ws] of this.online(except)) {
      try {
        ws.send(text);
      } catch {
        /* socket went away; close handler cleans up */
      }
    }
  }

  private send(ws: WebSocket, msg: ServerMessage): void {
    try {
      ws.send(encode(msg));
    } catch {
      /* ignore */
    }
  }

  private reject(ws: WebSocket, code: ErrorCode, message: string, close = false): void {
    this.send(ws, { type: "error", data: { code, message } });
    if (close) {
      try {
        ws.close(4001, code); // 4001 = rejected; the reason carries the error code
      } catch {
        /* ignore */
      }
    }
  }

  private async updateLobby(except?: WebSocket): Promise<void> {
    const s = this.state;
    if (!s) return;
    const online = this.online(except);
    const hostKey = s.ownerKey && online.some(([, a]) => a.key === s.ownerKey) ? s.ownerKey : this.actingHostKey(online);
    const host = online.find(([, a]) => a.key === hostKey)?.[1].name ?? null;
    const patch: Partial<Listing> = { viewers: online.length, host };
    await this.lobby().update(s.code, patch);
  }

  private lobby() {
    return this.env.LOBBY.get(this.env.LOBBY.idFromName("lobby"));
  }

  private async save(): Promise<void> {
    if (this.state) await this.ctx.storage.put("state", this.state);
  }
}

/** Fills in fields added after a screen was created (screens can outlive a deploy). */
function normalise(s: ScreenState & { known?: Record<string, { name: string; device: Device }> }): ScreenState {
  if (!s.members) {
    s.members = {};
    for (const [k, v] of Object.entries(s.known ?? {})) s.members[k] = R.newMember(v.name, v.device);
    delete s.known;
  }
  s.roles ??= R.defaultRoles();
  s.roleSeq ??= 0;
  s.coHosts ??= [];
  s.controllersAbsentSince ??= null;
  s.emptySince ??= null;
  s.away ??= {};
  s.playlist ??= s.item ? [s.item] : [];
  s.autoAdvance ??= true;
  s.actingHost ??= null;
  s.subs ??= [];
  s.subSeq ??= 0;
  s.bufferingPolicy ??= "keep";
  s.hold ??= null;
  s.holdIgnored ??= [];
  s.ready ??= null;
  s.readySeq ??= 0;
  s.ended ??= [];
  s.failedPasswords ??= {};
  return s;
}
