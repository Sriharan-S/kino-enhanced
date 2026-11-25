import { describe, expect, it } from "vitest";
import * as RL from "../src/ratelimit";

describe("message budget", () => {
  it("allows a burst, then refills at 8 per second", () => {
    const b = RL.newBucket(0);
    for (let i = 0; i < 40; i++) expect(RL.take(b, 0)).toBe("ok");
    expect(RL.take(b, 0)).toBe("limited");
    expect(RL.take(b, 125)).toBe("ok"); // 1/8 s later: one token back
  });

  it("closes connections that keep flooding", () => {
    const b = RL.newBucket(0);
    for (let i = 0; i < 40; i++) RL.take(b, 0);
    const verdicts = Array.from({ length: RL.MAX_STRIKES }, () => RL.take(b, 0));
    expect(verdicts.at(-1)).toBe("close");
    expect(verdicts.slice(0, -1).every((v) => v === "limited")).toBe(true);
  });

  it("normal use (a ping burst plus chat) never hits the limit", () => {
    const b = RL.newBucket(0);
    let t = 0;
    for (let i = 0; i < 8; i++) expect(RL.take(b, (t += 100))).toBe("ok"); // clock-sync burst
    for (let i = 0; i < 200; i++) expect(RL.take(b, (t += 250))).toBe("ok"); // 4 messages per second for 50 s
  });
});
