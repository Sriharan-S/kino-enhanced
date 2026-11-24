// Kino protocol v1: wire types and validation for theatre <-> client messages.
// The language-neutral spec lives in /protocol/README.md; examples in /protocol/examples.

export const PROTOCOL_VERSION = 1;
export const MIN_CLIENT_PROTOCOL = 1;

export const LIMITS = {
  displayName: 32,
  screenName: 64,
  itemName: 260,
  url: 2048,
  password: 128,
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
}

// ---- Client -> theatre --------------------------------------------------------------

export type ClientMessage =
  | { type: "hello"; data: { protocol: number; token: string; name: string; device: Device; password?: string; claim?: string } }
  | { type: "ping"; data: { t0: number } }
  | { type: "play"; data: Record<string, never> }
  | { type: "pause"; data: Record<string, never> }
  | { type: "seek"; data: { to: number } }
  | { type: "load"; data: { kind: "local" | "url"; name: string; duration: number | null; url?: string } }
  | { type: "reanchor"; data: { position: number; at: number } }
  | { type: "buffering"; data: { value: boolean } }
  | { type: "rtt"; data: { value: number } };

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
  | "closed";

export type ServerMessage =
  | {
      type: "welcome";
      data: {
        self: ViewerInfo;
        screen: { code: string; name: string; visibility: Visibility; maxViewers: number; showDevices: boolean };
        viewers: ViewerInfo[];
        item: Item | null;
        anchor: Anchor;
        serverTime: number;
      };
    }
  | { type: "pong"; data: { t0: number; ts: number } }
  | { type: "anchor"; data: Anchor }
  | { type: "item"; data: Item | null }
  | { type: "viewers"; data: ViewerInfo[] }
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
    case "load": {
      if (d.kind !== "local" && d.kind !== "url") throw new ProtocolError("bad_request", "kind must be local or url");
      const duration = d.duration === null || d.duration === undefined ? null : num(d.duration, "duration", 0, 1e7);
      const url = d.kind === "url" ? str(d.url, "url", LIMITS.url) : undefined;
      if (url !== undefined && !/^https?:\/\//i.test(url)) throw new ProtocolError("bad_request", "url must be http(s)");
      return { type: "load", data: { kind: d.kind, name: cleanName(d.name, "name", LIMITS.itemName), duration, url } };
    }
    case "reanchor":
      return { type: "reanchor", data: { position: num(d.position, "position", 0, 1e7), at: num(d.at, "at") } };
    case "buffering":
      if (typeof d.value !== "boolean") throw new ProtocolError("bad_request", "value must be boolean");
      return { type: "buffering", data: { value: d.value } };
    case "rtt":
      return { type: "rtt", data: { value: num(d.value, "value", 0, 60_000) } };
    default:
      throw new ProtocolError("bad_request", `unknown type ${msg.type}`);
  }
}

export function encode(msg: ServerMessage): string {
  return JSON.stringify(msg);
}
