// Abuse protection (README 1.11). Pure helpers, unit tested.

/** Per-connection message budget: bursts of 40 (a join's clock-sync burst is 8), refilling at 8 messages per second. */
export const MESSAGE_BUCKET = { capacity: 40, perSecond: 8 } as const;
/** A connection that keeps flooding after being told is closed. */
export const MAX_STRIKES = 25;
/** Screens a single address may create per window. */
export const CREATE_LIMIT = { count: 30, windowMs: 10 * 60_000 } as const;

export interface Bucket {
  tokens: number;
  at: number;
  strikes: number;
}

export function newBucket(now: number, capacity: number = MESSAGE_BUCKET.capacity): Bucket {
  return { tokens: capacity, at: now, strikes: 0 };
}

/** Takes one token. Returns "ok", "limited" (drop this message), or "close" (persistent flooding). */
export function take(b: Bucket, now: number, rate: { capacity: number; perSecond: number } = MESSAGE_BUCKET): "ok" | "limited" | "close" {
  b.tokens = Math.min(rate.capacity, b.tokens + ((now - b.at) / 1000) * rate.perSecond);
  b.at = now;
  if (b.tokens >= 1) {
    b.tokens -= 1;
    b.strikes = Math.max(0, b.strikes - 0.1); // good behaviour slowly forgives
    return "ok";
  }
  b.strikes += 1;
  return b.strikes >= MAX_STRIKES ? "close" : "limited";
}
