// LobbyDO: one per theatre. Maps screen codes to screens and holds the lobby listing.
import { DurableObject } from "cloudflare:workers";
import type { Visibility } from "./protocol";

export interface Listing {
  code: string;
  name: string;
  visibility: Visibility;
  hidden: boolean;
  viewers: number;
  maxViewers: number;
  host: string | null;
}

export interface ResolvedScreen {
  screenId: string;
  listing: Listing;
}

export class LobbyDO extends DurableObject<Env> {
  private readonly sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS screens (
      code TEXT PRIMARY KEY,
      screen_id TEXT NOT NULL,
      name TEXT NOT NULL,
      visibility TEXT NOT NULL,
      hidden INTEGER NOT NULL,
      viewers INTEGER NOT NULL,
      max_viewers INTEGER NOT NULL,
      host TEXT,
      updated INTEGER NOT NULL
    )`);
  }

  /** Registers a new screen. Returns false if the code is already taken (caller retries with a new code). */
  register(screenId: string, listing: Listing): boolean {
    const taken = this.sql.exec("SELECT 1 FROM screens WHERE code = ?", listing.code).toArray().length > 0;
    if (taken) return false;
    this.sql.exec(
      "INSERT INTO screens VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      listing.code,
      screenId,
      listing.name,
      listing.visibility,
      listing.hidden ? 1 : 0,
      listing.viewers,
      listing.maxViewers,
      listing.host,
      Date.now(),
    );
    return true;
  }

  resolve(code: string): ResolvedScreen | null {
    const row = this.sql.exec("SELECT * FROM screens WHERE code = ?", code).toArray()[0];
    return row ? { screenId: String(row.screen_id), listing: toListing(row) } : null;
  }

  update(code: string, patch: Partial<Omit<Listing, "code">>): void {
    const cur = this.resolve(code);
    if (!cur) return;
    const l = { ...cur.listing, ...patch };
    this.sql.exec(
      "UPDATE screens SET name = ?, visibility = ?, hidden = ?, viewers = ?, max_viewers = ?, host = ?, updated = ? WHERE code = ?",
      l.name,
      l.visibility,
      l.hidden ? 1 : 0,
      l.viewers,
      l.maxViewers,
      l.host,
      Date.now(),
      code,
    );
  }

  /** Moves a screen to a new code (regenerate). Returns false if the new code is taken. */
  recode(oldCode: string, newCode: string): boolean {
    const taken = this.sql.exec("SELECT 1 FROM screens WHERE code = ?", newCode).toArray().length > 0;
    if (taken) return false;
    this.sql.exec("UPDATE screens SET code = ?, updated = ? WHERE code = ?", newCode, Date.now(), oldCode);
    return true;
  }

  remove(code: string): void {
    this.sql.exec("DELETE FROM screens WHERE code = ?", code);
  }

  /** Lobby listing: everything except hidden private screens. */
  list(): Listing[] {
    return this.sql
      .exec("SELECT * FROM screens WHERE NOT (visibility = 'private' AND hidden = 1) ORDER BY viewers DESC, updated DESC LIMIT 200")
      .toArray()
      .map(toListing);
  }
}

function toListing(row: Record<string, SqlStorageValue>): Listing {
  return {
    code: String(row.code),
    name: String(row.name),
    visibility: row.visibility === "private" ? "private" : "public",
    hidden: row.hidden === 1,
    viewers: Number(row.viewers),
    maxViewers: Number(row.max_viewers),
    host: row.host === null ? null : String(row.host),
  };
}
