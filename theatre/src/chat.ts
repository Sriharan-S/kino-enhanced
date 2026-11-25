// Chat, reactions and GIFs (wiki docs §18). Pure helpers, unit tested.
import { ProtocolError } from "./protocol";

export const CHAT_HISTORY = 100;
export const CHAT_MAX_CHARS = 500;
/** 5 chat messages (text or GIF) per 5 s per viewer. */
export const CHAT_RATE = { count: 5, windowMs: 5_000 } as const;
/** Reactions are cheap and never stored, but still limited. */
export const REACT_RATE = { count: 10, windowMs: 5_000 } as const;

export const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🎉"] as const;
export type Reaction = (typeof REACTIONS)[number];

/** GIF URLs are only accepted from these hosts (the client searches the provider; only the URL is sent). */
export const GIF_HOSTS = [/^media[0-9]?\.giphy\.com$/, /^i\.giphy\.com$/, /^media\.tenor\.com$/, /^c\.tenor\.com$/, /^static\.klipy\.com$/];

export interface Gif {
  url: string;
  width: number | null;
  height: number | null;
  title: string | null;
}

export interface ChatMessage {
  id: number;
  at: number;
  kind: "text" | "gif" | "system";
  /** Viewer id and display name at the time; null for system messages. */
  from: string | null;
  name: string | null;
  text: string | null;
  gif: Gif | null;
}

/** Trims, strips control characters (keeps newlines), collapses runs of blank lines; 1–500 characters. */
export function cleanText(v: unknown): string {
  if (typeof v !== "string") throw new ProtocolError("bad_request", "text must be a string");
  const s = v
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (s.length < 1 || s.length > CHAT_MAX_CHARS) throw new ProtocolError("bad_request", `messages must be 1-${CHAT_MAX_CHARS} characters`);
  return s;
}

export function isAllowedGifUrl(url: string): boolean {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  return u.protocol === "https:" && !u.username && !u.password && !u.port && GIF_HOSTS.some((h) => h.test(u.hostname));
}

export function isReaction(v: unknown): v is Reaction {
  return REACTIONS.includes(v as Reaction);
}

/** Sliding-window rate limit. Returns the updated timestamps, or null if this one is over the limit. */
export function allow(times: number[] | undefined, now: number, rate: { count: number; windowMs: number }): number[] | null {
  const recent = (times ?? []).filter((t) => now - t < rate.windowMs);
  if (recent.length >= rate.count) return null;
  recent.push(now);
  return recent;
}

/** Appends and keeps the last CHAT_HISTORY messages. */
export function append(history: ChatMessage[], msg: ChatMessage): ChatMessage[] {
  const next = [...history, msg];
  return next.length > CHAT_HISTORY ? next.slice(next.length - CHAT_HISTORY) : next;
}
