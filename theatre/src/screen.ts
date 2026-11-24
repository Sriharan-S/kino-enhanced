// ScreenDO: one per screen. The single authority for a screen's viewers, item and timeline anchor.
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

/** How long an empty screen survives before it is closed (reconnect window). */
const EMPTY_SCREEN_TTL_MS = 5 * 60_000;
const DEFAULT_RTT_MS = 200;

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
  /** Viewers that have passed the join checks (so reconnects skip the password). */
  known: Record<string, { name: string; device: Device }>;
  bans: string[];
  item: Item | null;
  itemSeq: number;
  anchor: Anchor;
  createdAt: number;
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
      this.state = (await ctx.storage.get<ScreenState>("state")) ?? null;
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
      known: {},
      bans: [],
      item: null,
      itemSeq: 0,
      anchor: A.initialAnchor(now),
      createdAt: now,
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
    if (!this.state) return;
    if (this.online().length > 0) return; // someone came back
    const lobby = this.lobby();
    await lobby.remove(this.state.code);
    await this.ctx.storage.deleteAll();
    this.state = null;
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

    if (!isOwner && !s.known[key] && s.passwordHash) {
      if (!h.password || !(await verifyPassword(h.password, s.passwordHash))) {
        return this.reject(ws, "wrong_password", "wrong password", true);
      }
    }

    // One live session per viewer: a new connection replaces the old one (e.g. after a network change).
    const others = this.online().filter(([w, a]) => {
      if (a.key !== key) return true;
      try {
        w.close(4000, "replaced by a newer connection");
      } catch {
        /* ignore */
      }
      return false;
    });
    if (!isOwner && others.length >= s.maxViewers) return this.reject(ws, "full", "screen is full", true);

    const me: Attachment = { key, id: key.slice(0, 12), name: h.name, device: h.device, rtt: null, buffering: false };
    ws.serializeAttachment(me);
    s.known[key] = { name: h.name, device: h.device };
    await this.save();
    await this.ctx.storage.deleteAlarm();

    this.send(ws, {
      type: "welcome",
      data: {
        self: this.viewerInfo(me),
        screen: { code: s.code, name: s.name, visibility: s.visibility, maxViewers: s.maxViewers, showDevices: s.showDevices },
        viewers: this.viewerList(),
        item: s.item,
        anchor: s.anchor,
        serverTime: Date.now(),
      },
    });
    this.broadcastViewers();
    await this.updateLobby();
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

      case "play":
        this.requireControl(me);
        return this.setAnchor(A.play(s.anchor, now, this.lead()));

      case "pause":
        this.requireControl(me);
        return this.setAnchor(A.pause(s.anchor, now));

      case "seek":
        this.requireControl(me);
        return this.setAnchor(A.seek(s.anchor, msg.data.to, now, this.lead()));

      case "reanchor":
        if (me.key !== s.ownerKey) throw new ProtocolError("forbidden", "only the host can re-anchor");
        if (s.anchor.state !== "playing") return; // re-anchoring only corrects running playback
        return this.setAnchor(A.reanchor(s.anchor, msg.data.position, msg.data.at, now));

      case "load": {
        this.requireControl(me);
        const item: Item = { id: `i${++s.itemSeq}`, ...msg.data };
        s.item = item;
        s.anchor = A.load(s.anchor, item.id, now);
        await this.save();
        this.broadcast({ type: "item", data: item });
        this.broadcast({ type: "anchor", data: s.anchor });
        return;
      }
    }
  }

  // ---- Helpers --------------------------------------------------------------------------

  /** Until full RBAC lands (README 5.x), only the host controls playback. */
  private requireControl(me: Attachment): void {
    if (me.key !== this.state!.ownerKey) throw new ProtocolError("forbidden", "you don't have permission to control playback");
  }

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
    await this.updateLobby(ws);
    if (this.online(ws).length === 0) await this.ctx.storage.setAlarm(Date.now() + EMPTY_SCREEN_TTL_MS);
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

  private viewerInfo(a: Attachment): ViewerInfo {
    const s = this.state!;
    return {
      id: a.id,
      name: a.name,
      device: s.showDevices ? a.device : null,
      isHost: a.key === s.ownerKey,
      rtt: a.rtt,
      buffering: a.buffering,
    };
  }

  private viewerList(except?: WebSocket): ViewerInfo[] {
    return this.online(except).map(([, a]) => this.viewerInfo(a));
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
    const s = this.state!;
    const online = this.online(except);
    const host = online.find(([, a]) => a.key === s.ownerKey)?.[1].name ?? null;
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
