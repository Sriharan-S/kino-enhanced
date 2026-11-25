import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as A from "../src/anchor";
import { hashPassword, normaliseCode, screenCode, verifyPassword } from "../src/crypto";
import { parseClientMessage, ProtocolError } from "../src/protocol";

describe("anchor", () => {
  const base = A.initialAnchor(1_000);

  it("expected position is frozen while paused", () => {
    expect(A.expectedPosition({ ...base, position: 10 }, 99_000)).toBe(10);
  });

  it("expected position advances with rate after `at`", () => {
    const a = { ...base, state: "playing" as const, position: 10, at: 2_000 };
    expect(A.expectedPosition(a, 4_000)).toBeCloseTo(12);
    expect(A.expectedPosition({ ...a, rate: 1.5 }, 4_000)).toBeCloseTo(13);
  });

  it("scheduled start holds position until `at`", () => {
    const a = A.play(base, 1_000, 300);
    expect(a.at).toBe(1_300);
    expect(A.expectedPosition(a, 1_200)).toBe(0);
    expect(A.expectedPosition(a, 2_300)).toBeCloseTo(1);
  });

  it("pause freezes at the theatre's expected position", () => {
    const playing = { ...base, state: "playing" as const, position: 5, at: 1_000 };
    const paused = A.pause(playing, 3_500);
    expect(paused.state).toBe("paused");
    expect(paused.position).toBeCloseTo(7.5);
    expect(paused.seq).toBe(base.seq + 1);
  });

  it("play/pause are idempotent", () => {
    expect(A.pause(base, 5_000)).toBe(base);
    const p = A.play(base, 0, 200);
    expect(A.play(p, 10, 200)).toBe(p);
  });

  it("seek keeps state and schedules when playing", () => {
    const playing = { ...base, state: "playing" as const };
    expect(A.seek(playing, 60, 10_000, 250).at).toBe(10_250);
    expect(A.seek(base, 60, 10_000, 250).at).toBe(10_000);
  });

  it("reanchor clamps the host's timestamp to ±2 s", () => {
    expect(A.reanchor(base, 1, 0, 10_000).at).toBe(8_000);
    expect(A.reanchor(base, 1, 99_999, 10_000).at).toBe(12_000);
    expect(A.reanchor(base, 1, 10_100, 10_000).at).toBe(10_100);
  });

  it("start lead is clamped to 200–800 ms", () => {
    expect(A.startLead(0)).toBe(200);
    expect(A.startLead(300)).toBe(300);
    expect(A.startLead(5_000)).toBe(800);
  });
});

describe("crypto", () => {
  it("screen codes use the Crockford alphabet", () => {
    for (let i = 0; i < 200; i++) expect(screenCode()).toMatch(/^[0-9A-HJKMNP-TV-Z]{6}$/);
  });

  it("codes are normalised", () => {
    expect(normaliseCode(" 7k3-qxm ")).toBe("7K3QXM");
    expect(normaliseCode("oil")).toBe("011");
  });

  it("passwords round-trip and reject wrong input", async () => {
    const h = await hashPassword("popcorn");
    expect(await verifyPassword("popcorn", h)).toBe(true);
    expect(await verifyPassword("Popcorn", h)).toBe(false);
  });
});

describe("protocol", () => {
  const dir = join(__dirname, "..", "..", "protocol", "examples", "client");

  for (const file of readdirSync(dir)) {
    it(`parses example ${file}`, () => {
      const raw = readFileSync(join(dir, file), "utf8");
      const msg = parseClientMessage(raw);
      expect(msg.type).toBe(JSON.parse(raw).type);
    });
  }

  it("rejects unknown types and bad fields", () => {
    expect(() => parseClientMessage('{"type":"nope","data":{}}')).toThrow(ProtocolError);
    expect(() => parseClientMessage('{"type":"seek","data":{"to":-1}}')).toThrow(ProtocolError);
    expect(() => parseClientMessage('{"type":"load","data":{"kind":"url","name":"x","url":"file:///c"}}')).toThrow(ProtocolError);
    expect(() => parseClientMessage("not json")).toThrow(ProtocolError);
  });

  it("cleans display names", () => {
    const m = parseClientMessage(
      JSON.stringify({ type: "hello", data: { protocol: 1, token: "x".repeat(32), name: "  Al\u0007ice   B ", device: "web" } }),
    );
    expect(m.type === "hello" && m.data.name).toBe("Alice B");
  });
});

import { youtubeUrl } from "../src/protocol";

describe("YouTube links", () => {
  it("normalises watch, short, embed and youtu.be links and bare ids", () => {
    const canon = "https://www.youtube.com/watch?v=aqz-KE-bpKQ";
    for (const link of [
      "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
      "https://youtube.com/watch?feature=share&v=aqz-KE-bpKQ&t=30",
      "https://m.youtube.com/watch?v=aqz-KE-bpKQ",
      "https://youtu.be/aqz-KE-bpKQ?t=12",
      "https://www.youtube.com/shorts/aqz-KE-bpKQ",
      "https://www.youtube.com/embed/aqz-KE-bpKQ",
      "aqz-KE-bpKQ",
    ])
      expect(youtubeUrl(link)).toBe(canon);
  });

  it("rejects other sites and malformed ids", () => {
    expect(youtubeUrl("https://evil.example/watch?v=aqz-KE-bpKQ")).toBeNull();
    expect(youtubeUrl("http://www.youtube.com/watch?v=aqz-KE-bpKQ")).toBeNull();
    expect(youtubeUrl("https://www.youtube.com/watch?v=short")).toBeNull();
  });
});

import { echoCloseCode } from "../src/protocol";

describe("closing handshake", () => {
  it("echoes sendable close codes and replaces reserved ones with 1000", () => {
    expect(echoCloseCode(1000)).toBe(1000);
    expect(echoCloseCode(4001)).toBe(4001);
    expect(echoCloseCode(1005)).toBe(1000); // client closed without a code
    expect(echoCloseCode(1006)).toBe(1000);
    expect(echoCloseCode(1015)).toBe(1000);
  });
});
