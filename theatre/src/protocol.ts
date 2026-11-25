// Kino protocol v1: wire types and validation for theatre <-> client messages.
// The language-neutral spec lives in /protocol/README.md; examples in /protocol/examples.
import type { ChatMessage, Gif, Reaction } from "./chat";
import { cleanText, isAllowedGifUrl, isReaction } from "./chat";
import { isPermission, type Permission, type Role } from "./rbac";

export const PROTOCOL_VERSION = 1;
export const MIN_CLIENT_PROTOCOL = 1;

export const LIMITS = {
  displayName: 32,
  screenName: 64,
  itemName: 260,
  url: 2048,
  password: 128,
  roleName: 32,
  maxViewersCap: 25,
  defaultMaxViewers: 10,
  messageBytes: 16 * 1024,
} as const;

export type Device = "windows" | "linux" | "android" | "web";
const DEVICES: readonly Device[] = ["windows", "linux", "android", "web"];

export type Visibility = "public" | "private";

export interface Anchor {
  itemId: string | null;
  state: "playing" | "paused";
  /** Media position in seconds at theatre time `at`. */
  position: number;
  rate: number;
  /** Theatre time (Unix ms). May be slightly in the future for scheduled starts. */
  at: number;
  seq: number;
}

export interface Item {
  id: string;
  kind: "local" | "url";
  name: string;
  /** Seconds; null if unknown. Used for the mismatch check. */
  duration: number | null;
  url?: string;
}

export interface ViewerInfo {
  id: string;
  name: string;
  device: Device | null;
  isHost: boolean;
  rtt: number | null;
  buffering: boolean;
  /** Custom role ids (co-host and viewer are implied by `coHost` and by being here). */
  roles: string[];
  /** 1-based co-host priority, or null if not a co-host. */
  coHost: number | null;
  /** Standing in for the absent host (§7.2). */
  actingHost: boolean;
  muted: boolean;
  /** Per-viewer overrides (§8.4): deny beats allow beats roles. */
  allow: Permission[];
  deny: Permission[];
  /** Effective permissions, computed by the theatre. */
  permissions: Permission[];
  /** False while the viewer's connection has dropped and they have a reconnect grace period (§6.4). */
  connected: boolean;
}

export interface ScreenInfo {
  code: string;
  name: string;
  visibility: Visibility;
  hidden: boolean;
  maxViewers: number;
  showDevices: boolean;
  /** Move to the next playlist item when the current one ends. */
  autoAdvance: boolean;
}

/** A playlist item before the theatre assigns its id. Local files share only name and duration (§13.2). */
export interface NewItem {
  kind: "local" | "url";
  name: string;
  duration: number | null;
  url?: string;
}

/** A co-host in priority order, present or not (viewer lists only include who is online). */
export interface CoHostInfo {
  id: string;
  name: string;
}

// ---- Client -> theatre --------------------------------------------------------------

export type ClientMessage =
  | { type: "hello"; data: { protocol: number; token: string; name: string; device: Device; password?: string; claim?: string } }
  | { type: "ping"; data: { t0: number } }
  | { type: "play"; data: Record<string, never> }
  | { type: "pause"; data: Record<string, never> }
  | { type: "seek"; data: { to: number } }
  | { type: "load"; data: NewItem }
  | { type: "playlist.add"; data: { items: NewItem[]; at?: number } }
  | { type: "playlist.remove"; data: { id: string } }
  | { type: "playlist.move"; data: { id: string; to: number } }
  | { type: "playlist.play"; data: { id: string } }
  | { type: "skip"; data: { direction: "next" | "previous" } }
  | { type: "reanchor"; data: { position: number; at: number } }
  | { type: "buffering"; data: { value: boolean } }
  | { type: "rtt"; data: { value: number } }
  | { type: "roles.create"; data: { name: string; colour: string | null; permissions: Permission[]; position?: number } }
  | { type: "roles.update"; data: { id: string; name?: string; colour?: string | null; permissions?: Permission[]; position?: number } }
  | { type: "roles.delete"; data: { id: string } }
  | { type: "roles.assign"; data: { viewer: string; role: string; assigned: boolean } }
  | { type: "viewer.overrides"; data: { viewer: string; allow: Permission[]; deny: Permission[] } }
  | { type: "viewer.mute"; data: { viewer: string; muted: boolean } }
  | { type: "viewer.kick"; data: { viewer: string } }
  | { type: "viewer.ban"; data: { viewer: string } }
  | { type: "cohosts.set"; data: { viewers: string[] } }
  | { type: "host.transfer"; data: { viewer: string } }
  | { type: "screen.close"; data: Record<string, never> }
  | { type: "leave"; data: Record<string, never> }
  | {
      type: "settings.update";
      data: { name?: string; visibility?: Visibility; password?: string; hidden?: boolean; maxViewers?: number; showDevices?: boolean; autoAdvance?: boolean };
    }
  | { type: "code.regenerate"; data: Record<string, never> }
  | { type: "chat.send"; data: { text: string } }
  | { type: "chat.gif"; data: Gif }
  | { type: "react"; data: { emoji: Reaction } };

// ---- Theatre -> client --------------------------------------------------------------

export type ErrorCode =
  | "bad_request"
  | "update_required"
  | "not_found"
  | "forbidden"
  | "wrong_password"
  | "full"
  | "banned"
  | "rate_limited"
  | "kicked"
  | "closed";

export type ServerMessage =
  | {
      type: "welcome";
      data: {
        self: ViewerInfo;
        screen: ScreenInfo;
        viewers: ViewerInfo[];
        roles: Role[];
        coHosts: CoHostInfo[];
        playlist: Item[];
        chat: ChatMessage[];
        item: Item | null;
        anchor: Anchor;
        serverTime: number;
      };
    }
  | { type: "pong"; data: { t0: number; ts: number } }
  | { type: "anchor"; data: Anchor }
  | { type: "item"; data: Item | null }
  | { type: "viewers"; data: ViewerInfo[] }
  | { type: "roles"; data: Role[] }
  | { type: "cohosts"; data: CoHostInfo[] }
  | { type: "screen"; data: ScreenInfo }
  | { type: "playlist"; data: Item[] }
  | { type: "chat"; data: ChatMessage }
  | { type: "react"; data: { from: string; name: string; emoji: Reaction } }
  | { type: "error"; data: { code: ErrorCode; message: string } };

// ---- Validation ----------------------------------------------------------------------

export class ProtocolError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isFiniteNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function str(v: unknown, field: string, max: number, min = 1): string {
  if (typeof v !== "string") throw new ProtocolError("bad_request", `${field} must be a string`);
  const s = v.trim();
  if (s.length < min || s.length > max) throw new ProtocolError("bad_request", `${field} must be ${min}-${max} characters`);
  return s;
}

function optStr(v: unknown, field: string, max: number): string | undefined {
  return v === undefined ? undefined : str(v, field, max);
}

function num(v: unknown, field: string, min = -Infinity, max = Infinity): number {
  if (!isFiniteNum(v) || v < min || v > max) throw new ProtocolError("bad_request", `${field} must be a number in [${min}, ${max}]`);
  return v;
}

export function cleanName(v: unknown, field: string, max: number): string {
  // Collapse whitespace and strip control characters.
  const s = str(v, field, max * 4).replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();
  if (s.length < 1 || s.length > max) throw new ProtocolError("bad_request", `${field} must be 1-${max} characters`);
  return s;
}

const VIEWER_ID = /^[0-9a-f]{12}$/;
const ROLE_ID = /^[a-z0-9]{1,16}$/;
const COLOUR = /^#[0-9a-f]{6}$/i;

function viewerId(v: unknown, field = "viewer"): string {
  if (typeof v !== "string" || !VIEWER_ID.test(v)) throw new ProtocolError("bad_request", `${field} must be a viewer id`);
  return v;
}

function roleId(v: unknown): string {
  if (typeof v !== "string" || !ROLE_ID.test(v)) throw new ProtocolError("bad_request", "role must be a role id");
  return v;
}

function colour(v: unknown): string | null {
  if (v === null) return null;
  if (typeof v !== "string" || !COLOUR.test(v)) throw new ProtocolError("bad_request", "colour must be #rrggbb or null");
  return v.toLowerCase();
}

function permissions(v: unknown, field = "permissions"): Permission[] {
  if (!Array.isArray(v) || v.length > 64) throw new ProtocolError("bad_request", `${field} must be an array`);
  for (const p of v) if (!isPermission(p)) throw new ProtocolError("bad_request", `unknown permission ${String(p)}`);
  return [...new Set(v as Permission[])];
}

function itemId(v: unknown): string {
  if (typeof v !== "string" || !/^i[0-9]{1,9}$/.test(v)) throw new ProtocolError("bad_request", "id must be an item id");
  return v;
}

function newItem(d: Record<string, unknown>): NewItem {
  if (d.kind !== "local" && d.kind !== "url") throw new ProtocolError("bad_request", "kind must be local or url");
  const duration = d.duration === null || d.duration === undefined ? null : num(d.duration, "duration", 0, 1e7);
  const url = d.kind === "url" ? str(d.url, "url", LIMITS.url) : undefined;
  if (url !== undefined && !/^https?:\/\//i.test(url)) throw new ProtocolError("bad_request", "url must be http(s)");
  return { kind: d.kind, name: cleanName(d.name, "name", LIMITS.itemName), duration, ...(url === undefined ? {} : { url }) };
}

function bool(v: unknown, field: string): boolean {
  if (typeof v !== "boolean") throw new ProtocolError("bad_request", `${field} must be boolean`);
  return v;
}

export function parseClientMessage(raw: string | ArrayBuffer): ClientMessage {
  if (typeof raw !== "string") throw new ProtocolError("bad_request", "binary messages are not supported");
  if (raw.length > LIMITS.messageBytes) throw new ProtocolError("bad_request", "message too large");

  let msg: unknown;
  try {
    msg = JSON.parse(raw);
  } catch {
    throw new ProtocolError("bad_request", "invalid JSON");
  }
  if (!isObj(msg) || typeof msg.type !== "string") throw new ProtocolError("bad_request", "missing type");
  const d = isObj(msg.data) ? msg.data : {};

  switch (msg.type) {
    case "hello": {
      const device = d.device as Device;
      if (!DEVICES.includes(device)) throw new ProtocolError("bad_request", "unknown device");
      return {
        type: "hello",
        data: {
          protocol: num(d.protocol, "protocol", 0),
          token: str(d.token, "token", 128, 16),
          name: cleanName(d.name, "name", LIMITS.displayName),
          device,
          password: optStr(d.password, "password", LIMITS.password),
          claim: optStr(d.claim, "claim", 128),
        },
      };
    }
    case "ping":
      return { type: "ping", data: { t0: num(d.t0, "t0") } };
    case "play":
    case "pause":
      return { type: msg.type, data: {} };
    case "seek":
      return { type: "seek", data: { to: num(d.to, "to", 0, 1e7) } };
    case "load":
      return { type: "load", data: newItem(d) };
    case "playlist.add": {
      if (!Array.isArray(d.items) || d.items.length < 1 || d.items.length > 200) throw new ProtocolError("bad_request", "items must be 1-200 items");
      return {
        type: "playlist.add",
        data: { items: d.items.map((it) => newItem(isObj(it) ? it : {})), at: d.at === undefined ? undefined : num(d.at, "at", 0, 1000) },
      };
    }
    case "playlist.remove":
    case "playlist.play":
      return { type: msg.type, data: { id: itemId(d.id) } };
    case "playlist.move":
      return { type: "playlist.move", data: { id: itemId(d.id), to: num(d.to, "to", 0, 1000) } };
    case "chat.send":
      return { type: "chat.send", data: { text: cleanText(d.text) } };
    case "chat.gif": {
      const url = str(d.url, "url", LIMITS.url);
      if (!isAllowedGifUrl(url)) throw new ProtocolError("bad_request", "GIFs must come from a supported GIF service");
      const dim = (v: unknown, f: string) => (v === undefined || v === null ? null : Math.round(num(v, f, 1, 4096)));
      return {
        type: "chat.gif",
        data: {
          url,
          width: dim(d.width, "width"),
          height: dim(d.height, "height"),
          title: d.title === undefined || d.title === null || d.title === "" ? null : cleanName(d.title, "title", 100),
        },
      };
    }
    case "react":
      if (!isReaction(d.emoji)) throw new ProtocolError("bad_request", "unsupported reaction");
      return { type: "react", data: { emoji: d.emoji } };
    case "skip":
      if (d.direction !== "next" && d.direction !== "previous") throw new ProtocolError("bad_request", "direction must be next or previous");
      return { type: "skip", data: { direction: d.direction } };
    case "reanchor":
      return { type: "reanchor", data: { position: num(d.position, "position", 0, 1e7), at: num(d.at, "at") } };
    case "buffering":
      if (typeof d.value !== "boolean") throw new ProtocolError("bad_request", "value must be boolean");
      return { type: "buffering", data: { value: d.value } };
    case "rtt":
      return { type: "rtt", data: { value: num(d.value, "value", 0, 60_000) } };
    case "roles.create":
      return {
        type: "roles.create",
        data: {
          name: cleanName(d.name, "name", LIMITS.roleName),
          colour: d.colour === undefined ? null : colour(d.colour),
          permissions: permissions(d.permissions ?? []),
          position: d.position === undefined ? undefined : num(d.position, "position", 1, 899),
        },
      };
    case "roles.update":
      return {
        type: "roles.update",
        data: {
          id: roleId(d.id),
          name: d.name === undefined ? undefined : cleanName(d.name, "name", LIMITS.roleName),
          colour: d.colour === undefined ? undefined : colour(d.colour),
          permissions: d.permissions === undefined ? undefined : permissions(d.permissions),
          position: d.position === undefined ? undefined : num(d.position, "position", 1, 899),
        },
      };
    case "roles.delete":
      return { type: "roles.delete", data: { id: roleId(d.id) } };
    case "roles.assign":
      return { type: "roles.assign", data: { viewer: viewerId(d.viewer), role: roleId(d.role), assigned: bool(d.assigned, "assigned") } };
    case "viewer.overrides":
      return {
        type: "viewer.overrides",
        data: { viewer: viewerId(d.viewer), allow: permissions(d.allow ?? [], "allow"), deny: permissions(d.deny ?? [], "deny") },
      };
    case "viewer.mute":
      return { type: "viewer.mute", data: { viewer: viewerId(d.viewer), muted: bool(d.muted, "muted") } };
    case "viewer.kick":
    case "viewer.ban":
    case "host.transfer":
      return { type: msg.type, data: { viewer: viewerId(d.viewer) } };
    case "cohosts.set": {
      if (!Array.isArray(d.viewers) || d.viewers.length > 25) throw new ProtocolError("bad_request", "viewers must be an array");
      return { type: "cohosts.set", data: { viewers: [...new Set(d.viewers.map((v) => viewerId(v)))] } };
    }
    case "screen.close":
    case "leave":
    case "code.regenerate":
      return { type: msg.type, data: {} };
    case "settings.update": {
      const out: Extract<ClientMessage, { type: "settings.update" }>["data"] = {};
      if (d.name !== undefined) out.name = cleanName(d.name, "name", LIMITS.screenName);
      if (d.visibility !== undefined) {
        if (d.visibility !== "public" && d.visibility !== "private") throw new ProtocolError("bad_request", "visibility must be public or private");
        out.visibility = d.visibility;
      }
      if (d.password !== undefined) out.password = str(d.password, "password", LIMITS.password);
      if (d.hidden !== undefined) out.hidden = bool(d.hidden, "hidden");
      if (d.maxViewers !== undefined) out.maxViewers = Math.round(num(d.maxViewers, "maxViewers", 2, LIMITS.maxViewersCap));
      if (d.showDevices !== undefined) out.showDevices = bool(d.showDevices, "showDevices");
      if (d.autoAdvance !== undefined) out.autoAdvance = bool(d.autoAdvance, "autoAdvance");
      return { type: "settings.update", data: out };
    }
    default:
      throw new ProtocolError("bad_request", `unknown type ${msg.type}`);
  }
}

export function encode(msg: ServerMessage): string {
  return JSON.stringify(msg);
}
