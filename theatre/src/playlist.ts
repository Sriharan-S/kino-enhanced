// Playlist operations (wiki docs §13, §14.12). Pure functions over arrays, unit tested.
import type { Anchor, Item } from "./protocol";

export const MAX_PLAYLIST = 200;

/** Inserts `items` at `at` (default: the end). */
export function insert(list: Item[], items: Item[], at = list.length): Item[] {
  const i = Math.max(0, Math.min(list.length, Math.round(at)));
  return [...list.slice(0, i), ...items, ...list.slice(i)];
}

export function remove(list: Item[], id: string): Item[] {
  return list.filter((it) => it.id !== id);
}

/** Moves item `id` to index `to` (clamped). */
export function move(list: Item[], id: string, to: number): Item[] {
  const from = list.findIndex((it) => it.id === id);
  if (from < 0) return list;
  const rest = list.filter((it) => it.id !== id);
  const i = Math.max(0, Math.min(rest.length, Math.round(to)));
  return [...rest.slice(0, i), list[from]!, ...rest.slice(i)];
}

export function indexOf(list: Item[], id: string | null): number {
  return id === null ? -1 : list.findIndex((it) => it.id === id);
}

/** The item after (`+1`) or before (`-1`) the current one, or null at either end. */
export function neighbour(list: Item[], currentId: string | null, step: 1 | -1): Item | null {
  const i = indexOf(list, currentId);
  if (i < 0) return step === 1 ? (list[0] ?? null) : null;
  return list[i + step] ?? null;
}

/** After removing the current item, the item that takes its place: the next one, else the previous one. */
export function successorAfterRemoval(before: Item[], removedId: string): Item | null {
  const i = indexOf(before, removedId);
  if (i < 0) return null;
  return before[i + 1] ?? before[i - 1] ?? null;
}

/**
 * YouTube items are excluded: ads and buffering make their end unpredictable, so the screen waits until every viewer
 * reports the end (§14.13).
 *
 * Theatre time (ms) at which the current item ends, if the anchor is playing and its duration is known.
 * The host's duration is the reference (§13.5).
 */
export function endsAt(anchor: Anchor, item: Item | null): number | null {
  if (!item || item.kind === "youtube" || item.duration === null || anchor.state !== "playing" || anchor.itemId !== item.id || anchor.rate <= 0) return null;
  const remaining = Math.max(0, item.duration - anchor.position);
  return anchor.at + (remaining * 1000) / anchor.rate;
}
