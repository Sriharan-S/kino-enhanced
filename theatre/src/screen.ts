// ScreenDO: one per screen. The single authority for a screen's viewers, roles, item and timeline anchor.
// WebSockets use the Hibernation API: idle screens sleep without dropping connections.
import { DurableObject } from "cloudflare:workers";
import * as A from "./anchor";
import { hashPassword, sha256Hex, verifyPassword } from "./crypto";
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
  type ServerMessage,
  type ViewerInfo,
  type Visibility,
} from "./protocol";
import * as R from "./rbac";

/** How long an empty screen survives before it is closed (reconnect window). */
const EMPTY_SCREEN_TTL_MS = 5 * 60_000;
/** Host and all co-hosts absent this long → the screen closes (§6.5). */
const HOST_ABSENT_TTL_MS = 15 * 60_000;
const DEFAULT_RTT_MS = 200;
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
  item: Item | null;
  itemSeq: number;
  anchor: Anchor;
  createdAt: number;
  /** When the host and every co-host were last all absent, or null while one is present. */
  controllersAbsentSince: number | null;
  /** Recent wrong passwords: token hash → timestamps (ms). */
  failedPasswords: Record<string, number[]>;
}

/** Per-connection data, kept on the socket so it survives hibernation. */
interface Attachment {
  key: string;
  id: string;
  name: string;
  device: Device;
  rtt: number | null;
  buffering: boolean;
}

export class ScreenDO extends DurableObject<Env> {
  private state: ScreenState | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      const stored = await ctx.storage.get<ScreenState>("state");
      this.state = stored ? normalise(stored) : null;
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
      item: null,
      itemSeq: 0,
      anchor: A.initialAnchor(now),
      createdAt: now,
      controllersAbsentSince: null,
      failedPasswords: {},
    };
    await this.save();
    // If the creator never connects, clean up like any empty screen.
    await this.ctx.storage.setAlarm(now + EMPTY_SCREEN_TTL_MS);
  }

  override async fetch(request: Request): Promise<Response> {
    if (!this.state) return new Response("screen closed", { status: 404 });
    if (request.headers.get("Upgrade") !== "websocket") return new Response("expected websocket", { status: 426 });

    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  // ---- WebSocket handlers -------------------------------------------------------------

  override async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    if (!this.state) return this.reject(ws, "closed", "screen closed", true);

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
    const online = this.online();
    if (online.length === 0) return this.closeScreen("screen closed");
    if (s.controllersAbsentSince !== null) {
      const due = s.controllersAbsentSince + HOST_ABSENT_TTL_MS;
      if (Date.now() >= due) return this.closeScreen("the host has left, so the screen closed");
      await this.ctx.storage.setAlarm(due);
    }
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

    // One live session per viewer: a new connection replaces the old one (e.g. after a network change).
    const others = this.online().filter(([w, a]) => {
      if (a.key !== key) return true;
      try {
        w.serializeAttachment(null);
        w.close(4000, "replaced by a newer connection");
      } catch {
        /* ignore */
      }
      return false;
    });
    if (!isOwner && others.length >= s.maxViewers) return this.reject(ws, "full", "screen is full", true);

    const me: Attachment = { key, id: key.slice(0, 12), name: h.name, device: h.device, rtt: null, buffering: false };
    ws.serializeAttachment(me);
    const member = (s.members[key] ??= R.newMember(h.name, h.device));
    member.name = h.name;
    member.device = h.device;
    delete s.failedPasswords[key];
    await this.updatePresence();

    this.send(ws, {
      type: "welcome",
      data: {
        self: this.viewerInfo(me),
        screen: { code: s.code, name: s.name, visibility: s.visibility, maxViewers: s.maxViewers, showDevices: s.showDevices },
        viewers: this.viewerList(),
        roles: s.roles,
        coHosts: this.coHostList(),
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
        me.buffering = msg.data.value;
        ws.serializeAttachment(me);
        this.broadcastViewers();
        return;

      // ---- Playback

      case "play":
        this.require(me, "playback.toggle");
        return this.setAnchor(A.play(s.anchor, now, this.lead()));

      case "pause":
        this.require(me, "playback.toggle");
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
        this.require(me, msg.data.kind === "url" ? "playlist.add_external" : "playlist.add");
        const item: Item = { id: `i${++s.itemSeq}`, ...msg.data };
        s.item = item;
        s.anchor = A.load(s.anchor, item.id, now);
        await this.save();
        this.broadcast({ type: "item", data: item });
        this.broadcast({ type: "anchor", data: s.anchor });
        return;
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
          this.requireGrantable(actor, d.permissions.filter((p) => !role.permissions.includes(p)));
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
        m.roles = msg.data.assigned ? [...new Set([...m.roles, role.id])] : m.roles.filter((id) => id !== role.id);
        await this.save();
        this.broadcastViewers();
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
        return;
      }

      // ---- Host-only (§7)

      case "cohosts.set": {
        this.requireOwner(me);
        const keys = msg.data.viewers.map((id) => this.memberKey(id));
        if (keys.includes(s.ownerKey!)) throw new ProtocolError("bad_request", "the host can't be a co-host");
        s.coHosts = keys;
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
        await this.updatePresence();
        this.broadcastViewers();
        this.broadcast({ type: "cohosts", data: this.coHostList() });
        await this.updateLobby();
        return;
      }

      case "screen.close":
        this.requireOwner(me);
        return this.closeScreen("the host closed the screen");
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

    if (online.length === 0) {
      s.controllersAbsentSince ??= now;
      await this.save();
      await this.ctx.storage.setAlarm(now + EMPTY_SCREEN_TTL_MS);
      return;
    }
    if (controllerPresent) {
      s.controllersAbsentSince = null;
      await this.save();
      await this.ctx.storage.deleteAlarm();
      return;
    }
    s.controllersAbsentSince ??= now;
    await this.save();
    await this.ctx.storage.setAlarm(s.controllersAbsentSince + HOST_ABSENT_TTL_MS);
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
    this.broadcastViewers(ws);
    await this.updatePresence(ws);
    await this.updateLobby(ws);
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
    };
  }

  private viewerList(except?: WebSocket): ViewerInfo[] {
    const online = this.online(except);
    return online.map(([, a]) => this.viewerInfo(a, online));
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
  s.failedPasswords ??= {};
  return s;
}
