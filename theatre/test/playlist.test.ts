import { describe, expect, it } from "vitest";
import * as P from "../src/playlist";
import type { Anchor, Item } from "../src/protocol";

const item = (id: string, duration: number | null = 100): Item => ({ id, kind: "local", name: `${id}.mkv`, duration });
const ids = (l: Item[]) => l.map((i) => i.id);
const list = [item("i1"), item("i2"), item("i3")];

describe("playlist operations", () => {
  it("inserts at a position or at the end, clamped", () => {
    expect(ids(P.insert(list, [item("i9")]))).toEqual(["i1", "i2", "i3", "i9"]);
    expect(ids(P.insert(list, [item("i8"), item("i9")], 1))).toEqual(["i1", "i8", "i9", "i2", "i3"]);
    expect(ids(P.insert(list, [item("i9")], 99))).toEqual(["i1", "i2", "i3", "i9"]);
  });

  it("moves an item to an index", () => {
    expect(ids(P.move(list, "i3", 0))).toEqual(["i3", "i1", "i2"]);
    expect(ids(P.move(list, "i1", 2))).toEqual(["i2", "i3", "i1"]);
    expect(ids(P.move(list, "nope", 0))).toEqual(["i1", "i2", "i3"]);
  });

  it("finds neighbours, with no wrap-around", () => {
    expect(P.neighbour(list, "i1", 1)?.id).toBe("i2");
    expect(P.neighbour(list, "i3", 1)).toBeNull();
    expect(P.neighbour(list, "i1", -1)).toBeNull();
    expect(P.neighbour(list, null, 1)?.id).toBe("i1"); // nothing current yet: start at the top
  });

  it("picks the next item (else the previous) when the current one is removed", () => {
    expect(P.successorAfterRemoval(list, "i2")?.id).toBe("i3");
    expect(P.successorAfterRemoval(list, "i3")?.id).toBe("i2");
    expect(P.successorAfterRemoval([item("i1")], "i1")).toBeNull();
  });
});

describe("item end time (auto-advance)", () => {
  const playing = (position: number, at: number, rate = 1): Anchor => ({ itemId: "i1", state: "playing", position, rate, at, seq: 3 });

  it("is when the host's duration runs out", () => {
    expect(P.endsAt(playing(40, 10_000), item("i1", 100))).toBe(10_000 + 60_000);
    expect(P.endsAt(playing(40, 10_000, 2), item("i1", 100))).toBe(10_000 + 30_000);
  });

  it("is unknown when paused, for another item, or without a duration", () => {
    expect(P.endsAt({ ...playing(40, 0), state: "paused" }, item("i1"))).toBeNull();
    expect(P.endsAt(playing(40, 0), item("i2"))).toBeNull();
    expect(P.endsAt(playing(40, 0), item("i1", null))).toBeNull();
  });

  it("is now when the position is already past the end", () => {
    expect(P.endsAt(playing(150, 5_000), item("i1", 100))).toBe(5_000);
  });
});
