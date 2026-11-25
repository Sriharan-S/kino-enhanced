import { describe, expect, it } from "vitest";
import * as C from "../src/chat";
import { ProtocolError } from "../src/protocol";

describe("chat text", () => {
  it("trims, keeps newlines, strips control characters, collapses blank lines", () => {
    expect(C.cleanText("  hi\u0007 there \r\n\r\n\r\n\r\nbye  ")).toBe("hi there \n\nbye");
  });

  it("rejects empty and over-long messages", () => {
    expect(() => C.cleanText("   ")).toThrow(ProtocolError);
    expect(() => C.cleanText("x".repeat(501))).toThrow(ProtocolError);
    expect(C.cleanText("x".repeat(500))).toHaveLength(500);
  });
});

describe("GIF URLs", () => {
  it("accepts https URLs from GIF services only", () => {
    expect(C.isAllowedGifUrl("https://media.giphy.com/media/abc/giphy.gif")).toBe(true);
    expect(C.isAllowedGifUrl("https://media3.giphy.com/media/abc/200.gif")).toBe(true);
    expect(C.isAllowedGifUrl("https://media.tenor.com/xyz/tenor.gif")).toBe(true);
    expect(C.isAllowedGifUrl("http://media.giphy.com/media/abc/giphy.gif")).toBe(false); // not https
    expect(C.isAllowedGifUrl("https://media.giphy.com.evil.example/x.gif")).toBe(false);
    expect(C.isAllowedGifUrl("https://user:pw@media.giphy.com/x.gif")).toBe(false);
    expect(C.isAllowedGifUrl("https://media.giphy.com:8443/x.gif")).toBe(false);
    expect(C.isAllowedGifUrl("not a url")).toBe(false);
  });
});

describe("rate limit and history", () => {
  it("allows 5 per 5 s, sliding", () => {
    let times: number[] | undefined;
    for (let i = 0; i < 5; i++) {
      times = C.allow(times, 1000 + i * 100, C.CHAT_RATE) ?? undefined;
      expect(times).toBeDefined();
    }
    expect(C.allow(times, 1500, C.CHAT_RATE)).toBeNull();
    expect(C.allow(times, 6001, C.CHAT_RATE)).not.toBeNull(); // the first one has aged out
  });

  it("keeps the last 100 messages", () => {
    let h: C.ChatMessage[] = [];
    for (let i = 1; i <= 105; i++) h = C.append(h, { id: i, at: i, kind: "text", from: "a", name: "A", text: `${i}`, gif: null });
    expect(h).toHaveLength(100);
    expect(h[0]!.id).toBe(6);
    expect(h.at(-1)!.id).toBe(105);
  });

  it("only knows the fixed reaction set", () => {
    expect(C.isReaction("👍")).toBe(true);
    expect(C.isReaction("💩")).toBe(false);
  });
});
