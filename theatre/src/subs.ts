// Shared subtitles (wiki docs §17). Files travel over HTTP (WebSocket messages are capped at 1 MiB on Workers),
// gzip-compressed, at most 1 MB each, and are stored with their playlist item for the screen's lifetime.
import { cleanName, ProtocolError } from "./protocol";

export const MAX_SUB_BYTES = 1024 * 1024;
export const MAX_SUBS_PER_ITEM = 20;
export const MAX_SUBS_PER_SCREEN = 100;
export const SUB_FORMATS = ["srt", "vtt", "ass", "ssa"] as const;
export type SubFormat = (typeof SUB_FORMATS)[number];

export interface SubMeta {
  id: string;
  itemId: string;
  name: string;
  format: SubFormat;
  /** Compressed size in bytes. */
  size: number;
  /** Who shared it (viewer id and name at the time). */
  from: string;
  fromName: string;
}

export const storageKey = (id: string) => `sub:${id}`;

/** Validates the upload's query parameters. */
export function parseUpload(url: URL): { itemId: string; name: string; format: SubFormat } {
  const itemId = url.searchParams.get("item") ?? "";
  if (!/^i[0-9]{1,9}$/.test(itemId)) throw new ProtocolError("bad_request", "item must be an item id");
  const format = (url.searchParams.get("format") ?? "").toLowerCase() as SubFormat;
  if (!SUB_FORMATS.includes(format)) throw new ProtocolError("bad_request", `format must be one of ${SUB_FORMATS.join(", ")}`);
  const name = cleanName(url.searchParams.get("name"), "name", 120);
  return { itemId, name, format };
}

/** The body must be gzip (magic bytes 1f 8b) and within the size limit. */
export function checkBody(body: ArrayBuffer): void {
  if (body.byteLength === 0) throw new ProtocolError("bad_request", "empty file");
  if (body.byteLength > MAX_SUB_BYTES) throw new ProtocolError("bad_request", `subtitle files must be at most ${MAX_SUB_BYTES / 1024 / 1024} MB compressed`);
  const b = new Uint8Array(body, 0, 2);
  if (b[0] !== 0x1f || b[1] !== 0x8b) throw new ProtocolError("bad_request", "upload must be gzip-compressed");
}

export function checkRoom(subs: SubMeta[], itemId: string): void {
  if (subs.length >= MAX_SUBS_PER_SCREEN) throw new ProtocolError("bad_request", `at most ${MAX_SUBS_PER_SCREEN} shared subtitle files per screen`);
  if (subs.filter((s) => s.itemId === itemId).length >= MAX_SUBS_PER_ITEM) {
    throw new ProtocolError("bad_request", `at most ${MAX_SUBS_PER_ITEM} shared subtitle files per item`);
  }
}

/** "Bearer <token>" → token, or null. */
export function bearer(request: Request): string | null {
  const h = request.headers.get("Authorization") ?? "";
  const m = /^Bearer ([0-9a-f]{16,128})$/i.exec(h);
  return m ? m[1]! : null;
}
