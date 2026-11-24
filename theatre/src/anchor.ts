// Pure timeline-anchor logic (see wiki docs §14.4–14.5). No I/O, so it is easy to unit test.
import type { Anchor } from "./protocol";

/** Expected media position (s) at theatre time `now` (ms). A scheduled start that hasn't begun returns `position`. */
export function expectedPosition(a: Anchor, now: number): number {
  if (a.state === "paused" || now <= a.at) return a.position;
  return a.position + (a.rate * (now - a.at)) / 1000;
}

/** Lead time for scheduled starts, so every viewer has received the anchor before it takes effect. */
export function startLead(maxRttMs: number): number {
  return Math.min(800, Math.max(200, maxRttMs / 2 + 150));
}

export function initialAnchor(now: number): Anchor {
  return { itemId: null, state: "paused", position: 0, rate: 1, at: now, seq: 0 };
}

export function play(a: Anchor, now: number, lead: number): Anchor {
  if (a.state === "playing") return a;
  return { ...a, state: "playing", position: a.position, at: now + lead, seq: a.seq + 1 };
}

export function pause(a: Anchor, now: number): Anchor {
  if (a.state === "paused") return a;
  return { ...a, state: "paused", position: expectedPosition(a, now), at: now, seq: a.seq + 1 };
}

export function seek(a: Anchor, to: number, now: number, lead: number): Anchor {
  return { ...a, position: to, at: a.state === "playing" ? now + lead : now, seq: a.seq + 1 };
}

export function load(a: Anchor, itemId: string, now: number): Anchor {
  return { itemId, state: "paused", position: 0, rate: 1, at: now, seq: a.seq + 1 };
}

/**
 * Host re-anchor: the host's real position defines the truth. `at` comes from the host's
 * synced clock; it is clamped to ±2 s of theatre time so a broken clock can't wreck the screen.
 */
export function reanchor(a: Anchor, position: number, hostAt: number, now: number): Anchor {
  const at = Math.min(now + 2000, Math.max(now - 2000, hostAt));
  return { ...a, position, at, seq: a.seq + 1 };
}
