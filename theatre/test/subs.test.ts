import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { ProtocolError } from "../src/protocol";
import * as S from "../src/subs";

const ab = (b: Uint8Array) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;

describe("subtitle uploads", () => {
  it("parses item, format and name from the query", () => {
    const u = S.parseUpload(new URL("https://t/screens/X/subs?item=i3&format=SRT&name=EP%2001.en.srt"));
    expect(u).toEqual({ itemId: "i3", format: "srt", name: "EP 01.en.srt" });
    expect(() => S.parseUpload(new URL("https://t/x?item=i3&format=txt&name=a"))).toThrow(ProtocolError);
    expect(() => S.parseUpload(new URL("https://t/x?item=3&format=srt&name=a"))).toThrow(ProtocolError);
  });

  it("accepts gzip within 1 MB only", () => {
    expect(() => S.checkBody(ab(gzipSync("1\n00:00:01,000 --> 00:00:02,000\nHi\n")))).not.toThrow();
    expect(() => S.checkBody(ab(new TextEncoder().encode("plain text")))).toThrow(/gzip/);
    expect(() => S.checkBody(new ArrayBuffer(S.MAX_SUB_BYTES + 1))).toThrow(/at most/);
    expect(() => S.checkBody(new ArrayBuffer(0))).toThrow(/empty/);
  });

  it("limits files per item and per screen", () => {
    const meta = (i: number, itemId: string): S.SubMeta => ({ id: `s${i}`, itemId, name: "a.srt", format: "srt", size: 1, from: "a", fromName: "A" });
    const perItem = Array.from({ length: S.MAX_SUBS_PER_ITEM }, (_, i) => meta(i, "i1"));
    expect(() => S.checkRoom(perItem, "i1")).toThrow(/per item/);
    expect(() => S.checkRoom(perItem, "i2")).not.toThrow();
  });

  it("reads bearer tokens", () => {
    const req = (h?: string) => new Request("https://t/", { headers: h ? { Authorization: h } : {} });
    expect(S.bearer(req("Bearer " + "a".repeat(64)))).toBe("a".repeat(64));
    expect(S.bearer(req("Basic abc"))).toBeNull();
    expect(S.bearer(req())).toBeNull();
  });
});
