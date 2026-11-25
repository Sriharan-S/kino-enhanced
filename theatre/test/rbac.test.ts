import { describe, expect, it } from "vitest";
import * as R from "../src/rbac";

const roles = (): R.Role[] => [
  ...R.defaultRoles(),
  { id: "r1", name: "DJ", colour: null, position: 5, permissions: ["playback.toggle", "playback.seek"], builtin: false },
  { id: "r2", name: "Mod", colour: null, position: 10, permissions: ["viewers.kick", "viewers.mute", "roles.assign"], builtin: false },
];

const who = (over: Partial<R.Subject> = {}, member: Partial<R.Member> = {}): R.Subject => ({
  isOwner: false,
  isActingHost: false,
  isCoHost: false,
  member: { ...R.newMember("x", "windows"), ...member },
  ...over,
});

describe("permission resolution (§8.4)", () => {
  it("host and acting host can do everything, overrides notwithstanding", () => {
    const deny = { deny: [...R.PERMISSIONS] };
    expect(R.effective(who({ isOwner: true }, deny), roles())).toEqual([...R.PERMISSIONS]);
    expect(R.effective(who({ isActingHost: true }, deny), roles())).toEqual([...R.PERMISSIONS]);
  });

  it("plain viewers get only the Viewer role's permissions", () => {
    expect(R.effective(who(), roles())).toEqual(["chat.send", "chat.gif", "chat.react"]);
  });

  it("co-hosts get the Co-host role (everything)", () => {
    expect(R.effective(who({ isCoHost: true }), roles())).toEqual([...R.PERMISSIONS]);
  });

  it("roles add up; deny beats allow beats roles", () => {
    const dj = who({}, { roles: ["r1"] });
    expect(R.can(dj, "playback.seek", roles())).toBe(true);
    expect(R.can(dj, "viewers.kick", roles())).toBe(false);

    const overridden = who({}, { roles: ["r1"], allow: ["playback.skip", "chat.gif"], deny: ["playback.seek", "chat.gif"] });
    expect(R.can(overridden, "playback.skip", roles())).toBe(true);
    expect(R.can(overridden, "playback.seek", roles())).toBe(false); // deny beats role
    expect(R.can(overridden, "chat.gif", roles())).toBe(false); // deny beats allow
  });

  it("a deny override also applies to co-hosts (only the host can set one on them)", () => {
    expect(R.can(who({ isCoHost: true }, { deny: ["viewers.ban"] }), "viewers.ban", roles())).toBe(false);
  });

  it("an unknown role id grants nothing", () => {
    expect(R.can(who({}, { roles: ["gone"] }), "playback.toggle", roles())).toBe(false);
  });
});

describe("hierarchy (§8.2)", () => {
  it("ranks host > co-host = acting host > custom roles > viewer", () => {
    expect(R.rank(who({ isOwner: true }), roles())).toBe(1000);
    expect(R.rank(who({ isCoHost: true }), roles())).toBe(900);
    expect(R.rank(who({ isActingHost: true }), roles())).toBe(900);
    expect(R.rank(who({}, { roles: ["r1", "r2"] }), roles())).toBe(10);
    expect(R.rank(who(), roles())).toBe(0);
  });

  it("only strictly higher ranks can act on someone", () => {
    const mod = who({}, { roles: ["r2"] });
    const dj = who({}, { roles: ["r1"] });
    const otherMod = who({}, { roles: ["r2"] });
    expect(R.outranks(mod, dj, roles())).toBe(true);
    expect(R.outranks(dj, mod, roles())).toBe(false);
    expect(R.outranks(mod, otherMod, roles())).toBe(false); // equals can't act on each other
    expect(R.outranks(who({ isCoHost: true }), who({ isOwner: true }), roles())).toBe(false);
    expect(R.outranks(who({ isActingHost: true }), who({ isCoHost: true }), roles())).toBe(false); // acting host can't touch co-hosts
  });

  it("nobody can grant permissions they don't have", () => {
    const mod = who({}, { roles: ["r2"] });
    expect(R.missingPermissions(mod, ["viewers.kick", "viewers.ban"], roles())).toEqual(["viewers.ban"]);
    expect(R.missingPermissions(who({ isOwner: true }), [...R.PERMISSIONS], roles())).toEqual([]);
  });

  it("new roles default to just above the creator's highest manageable role, below their own rank", () => {
    expect(R.defaultPosition(1000, roles())).toBe(11);
    expect(R.defaultPosition(10, roles())).toBe(6);
    expect(R.defaultPosition(1, R.defaultRoles())).toBe(0); // no room: the caller must reject it
    expect(R.defaultPosition(1000, R.defaultRoles())).toBe(1);
  });
});
