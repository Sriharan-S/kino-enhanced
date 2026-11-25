// End-to-end smoke test against a running theatre (default: local `npm run dev`).
// Usage: node scripts/smoke.mjs [baseUrl] [--slow]    (--slow adds a ~65 s reconnect-grace expiry check)
import { createHmac, randomBytes } from "node:crypto";
import assert from "node:assert/strict";

const BASE = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "http://127.0.0.1:8787";
const WS_BASE = BASE.replace(/^http/, "ws");

const token = (secret, screenId) => createHmac("sha256", secret).update(screenId).digest("hex");

async function http(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

/** Minimal client: collects messages and lets tests await a given type. */
function connect(code) {
  const ws = new WebSocket(`${WS_BASE}/screens/${code}/ws`);
  const inbox = [];
  const waiters = [];
  ws.addEventListener("message", (e) => {
    const msg = JSON.parse(e.data);
    const i = waiters.findIndex((w) => w.type === msg.type && w.pred(msg.data));
    if (i >= 0) waiters.splice(i, 1)[0].resolve(msg.data);
    else inbox.push(msg);
  });
  const opened = new Promise((res, rej) => {
    ws.addEventListener("open", res, { once: true });
    ws.addEventListener("error", rej, { once: true });
  });
  return {
    opened,
    send: (type, data = {}) => ws.send(JSON.stringify({ type, data })),
    next(type, pred = () => true, timeoutMs = 3000) {
      const i = inbox.findIndex((m) => m.type === type && pred(m.data));
      if (i >= 0) return Promise.resolve(inbox.splice(i, 1)[0].data);
      return new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error(`timeout waiting for ${type}`)), timeoutMs);
        waiters.push({ type, pred, resolve: (d) => (clearTimeout(t), resolve(d)) });
      });
    },
    close: () => ws.close(),
  };
}

const step = (name) => console.log(`✓ ${name}`);

// --- /info
const info = await http("GET", "/info");
assert.equal(info.status, 200);
assert.equal(info.body.protocol, 1);
step(`info: theatre "${info.body.name}" (${info.body.id})`);

// --- create public screen
const created = await http("POST", "/screens", { name: "Smoke test", visibility: "public" });
assert.equal(created.status, 201);
const { code, screenId, claim } = created.body;
assert.match(code, /^[0-9A-HJKMNP-TV-Z]{6}$/);
step(`created screen ${code}`);

// --- host joins with claim
const hostSecret = randomBytes(32);
const host = connect(code);
await host.opened;
host.send("hello", { protocol: 1, token: token(hostSecret, screenId), name: "Host", device: "windows", claim });
const hw = await host.next("welcome");
assert.equal(hw.self.isHost, true);
step("host joined and owns the screen");

// --- clock ping
const t0 = performance.now();
host.send("ping", { t0 });
const pong = await host.next("pong");
assert.equal(pong.t0, t0);
assert.ok(Math.abs(pong.ts - Date.now()) < 5000);
step(`ping/pong rtt=${(performance.now() - t0).toFixed(1)}ms`);

// --- resolve + viewer joins
const resolved = await http("GET", `/resolve/${code.toLowerCase()}`);
assert.equal(resolved.body.screenId, screenId);
const viewer = connect(code);
await viewer.opened;
const viewerSecret = randomBytes(32);
viewer.send("hello", { protocol: 1, token: token(viewerSecret, screenId), name: "Viewer", device: "web" });
const vw = await viewer.next("welcome");
assert.equal(vw.self.isHost, false);
await host.next("viewers", (list) => list.length === 2);
step("viewer joined; host sees 2 viewers");

// --- lobby lists it
const lobby = await http("GET", "/lobby");
const listed = lobby.body.screens.find((s) => s.code === code);
assert.ok(listed, "screen listed in lobby");
assert.equal(listed.viewers, 2);
assert.equal(listed.host, "Host");
step("lobby lists the screen with 2 viewers");

// --- host loads + plays; both receive the scheduled anchor
host.send("load", { kind: "local", name: "EP 01.mkv", duration: 1420.5 });
const item = await viewer.next("item");
assert.equal(item.name, "EP 01.mkv");
host.send("play");
const a1 = await viewer.next("anchor", (a) => a.state === "playing");
const a1h = await host.next("anchor", (a) => a.state === "playing");
assert.equal(a1.seq, a1h.seq);
assert.ok(a1.at > Date.now() - 1000, "scheduled start time is current");
step(`play → anchor seq=${a1.seq} at=+${a1.at - pong.ts}ms (scheduled start)`);

// --- viewer may not control
viewer.send("pause");
const err = await viewer.next("error");
assert.equal(err.code, "forbidden");
step("viewer pause rejected (forbidden)");

// --- seek + pause
host.send("seek", { to: 600 });
const a2 = await viewer.next("anchor", (a) => a.position === 600);
assert.equal(a2.state, "playing");
host.send("pause");
const a3 = await viewer.next("anchor", (a) => a.state === "paused" && a.seq > a2.seq);
assert.ok(a3.position >= 600 && a3.position < 610);
step(`seek/pause → paused at ${a3.position.toFixed(2)}s`);

// --- private screen requires password; hidden ones are not listed
const priv = await http("POST", "/screens", { name: "Secret", visibility: "private", password: "popcorn", hidden: true });
assert.equal(priv.status, 201);
const p1 = connect(priv.body.code);
await p1.opened;
p1.send("hello", { protocol: 1, token: token(randomBytes(32), priv.body.screenId), name: "Eve", device: "web", password: "nope" });
assert.equal((await p1.next("error")).code, "wrong_password");
const p2 = connect(priv.body.code);
await p2.opened;
p2.send("hello", { protocol: 1, token: token(randomBytes(32), priv.body.screenId), name: "Pat", device: "android", password: "popcorn" });
await p2.next("welcome");
const lobby2 = await http("GET", "/lobby");
assert.ok(!lobby2.body.screens.some((s) => s.code === priv.body.code), "hidden private screen not listed");
step("private screen: wrong password rejected, right password accepted, hidden from lobby");

// --- old protocol rejected
const old = connect(code);
await old.opened;
old.send("hello", { protocol: 0, token: token(randomBytes(32), screenId), name: "Old", device: "linux" });
assert.equal((await old.next("error")).code, "update_required");
step("protocol 0 client gets update_required");

// --- wrong-password rate limit (5 per token per minute)
const limitedSecret = randomBytes(32);
let lastCode;
for (let i = 0; i < 6; i++) {
  const c = connect(priv.body.code);
  await c.opened;
  c.send("hello", { protocol: 1, token: token(limitedSecret, priv.body.screenId), name: "Guess", device: "web", password: `guess${i}` });
  lastCode = (await c.next("error")).code;
  c.close();
}
assert.equal(lastCode, "rate_limited");
step("6th wrong password in a minute is rate limited");

for (const c of [p1, p2, old]) c.close();

// ================================ Roles & permissions =====================================

/** Joins `code` as a new or returning device; resolves with [client, welcome]. */
async function join(screenCode, sid, secret, name, extra = {}) {
  const c = connect(screenCode);
  await c.opened;
  c.send("hello", { protocol: 1, token: token(secret, sid), name, device: "windows", ...extra });
  return [c, await c.next("welcome")];
}
const me = (list, id) => list.find((v) => v.id === id);

const viewerId = vw.self.id;

// --- a custom role grants exactly its permissions
host.send("roles.create", { name: "DJ", colour: "#3d8be8", permissions: ["playback.toggle"], position: 5 });
const rolesMsg = await viewer.next("roles", (rs) => rs.some((r) => r.name === "DJ"));
const dj = rolesMsg.find((r) => r.name === "DJ");
host.send("roles.assign", { viewer: viewerId, role: dj.id, assigned: true });
const withDj = await viewer.next("viewers", (l) => me(l, viewerId)?.roles.includes(dj.id));
assert.ok(me(withDj, viewerId).permissions.includes("playback.toggle"));
viewer.send("play");
await viewer.next("anchor", (a) => a.state === "playing" && a.seq > a3.seq);
viewer.send("seek", { to: 10 });
assert.equal((await viewer.next("error")).code, "forbidden");
step("role DJ lets the viewer play, but not seek");

// --- no privilege escalation
viewer.send("roles.create", { name: "Nope", permissions: [] });
assert.equal((await viewer.next("error")).code, "forbidden"); // no roles.manage
host.send("viewer.overrides", { viewer: viewerId, allow: ["roles.manage"], deny: [] });
await viewer.next("viewers", (l) => me(l, viewerId)?.permissions.includes("roles.manage"));
viewer.send("roles.create", { name: "Banhammer", permissions: ["viewers.ban"] });
assert.match((await viewer.next("error")).message, /don't have/);
viewer.send("roles.update", { id: dj.id, permissions: ["playback.toggle", "playback.seek"] });
assert.equal((await viewer.next("error")).code, "forbidden"); // DJ is not below the viewer's own rank
viewer.send("roles.create", { name: "Helper", permissions: ["chat.send"] });
const helper = (await host.next("roles", (rs) => rs.some((r) => r.name === "Helper"))).find((r) => r.name === "Helper");
assert.ok(helper.position < dj.position, "created below the creator's own rank");
step("viewers can't grant what they lack or edit roles at their own rank");

// --- co-host handover (§7.2) and the host's return (§7.4)
const carolSecret = randomBytes(32);
const [carol, carolWelcome] = await join(code, screenId, carolSecret, "Carol");
const carolId = carolWelcome.self.id;
host.send("cohosts.set", { viewers: [carolId] });
await carol.next("viewers", (l) => me(l, carolId)?.coHost === 1);
host.close();
const acting = await carol.next("viewers", (l) => me(l, carolId)?.actingHost === true);
assert.ok(acting.some((v) => v.isHost && v.connected === false), "host shown as reconnecting");
carol.send("seek", { to: 42 });
await viewer.next("anchor", (a) => a.position === 42);
const [host2, hw2] = await join(code, screenId, hostSecret, "Host");
assert.equal(hw2.self.isHost, true);
await carol.next("viewers", (l) => me(l, carolId)?.actingHost === false && l.some((v) => v.isHost));
step("host leaves → co-host becomes acting host and can seek; host returns and takes over");

// --- hierarchy: a co-host can't act on the host or use host-only actions
carol.send("viewer.kick", { viewer: hw2.self.id });
assert.equal((await carol.next("error")).code, "forbidden");
carol.send("cohosts.set", { viewers: [] });
assert.equal((await carol.next("error")).code, "forbidden");
step("co-host can't kick the host or change co-hosts");

// --- kick (can rejoin, keeps roles) and ban (can't)
host2.send("viewer.kick", { viewer: viewerId });
assert.equal((await viewer.next("error")).code, "kicked");
const [viewer2, vw2] = await join(code, screenId, viewerSecret, "Viewer");
assert.ok(vw2.self.roles.includes(dj.id), "roles survive a kick");
host2.send("viewer.ban", { viewer: viewerId });
assert.equal((await viewer2.next("error")).code, "banned");
const banned = connect(code);
await banned.opened;
banned.send("hello", { protocol: 1, token: token(viewerSecret, screenId), name: "Viewer", device: "windows" });
assert.equal((await banned.next("error")).code, "banned");
step("kicked viewer can rejoin with roles intact; banned viewer can't");

// --- reconnect grace (§6.4) and explicit leave
const daveSecret = randomBytes(32);
const [dave, daveWelcome] = await join(code, screenId, daveSecret, "Dave");
const daveId = daveWelcome.self.id;
dave.close(); // connection drops (no leave)
await host2.next("viewers", (l) => me(l, daveId)?.connected === false);
const [dave2] = await join(code, screenId, daveSecret, "Dave");
await host2.next("viewers", (l) => me(l, daveId)?.connected === true);
dave2.send("leave");
await host2.next("viewers", (l) => !me(l, daveId));
step("dropped viewer shows as reconnecting and gets their seat back; leave removes them at once");

// --- screen settings (§6.3) and code regeneration (§11)
viewer2.close();
const [eve, eveWelcome] = await join(code, screenId, randomBytes(32), "Eve");
eve.send("settings.update", { name: "Hacked" });
assert.equal((await eve.next("error")).code, "forbidden");
host2.send("settings.update", { visibility: "private" });
assert.match((await host2.next("error")).message, /password/);
host2.send("settings.update", { name: "Renamed", visibility: "private", password: "letmein", maxViewers: 8, showDevices: false });
const renamed = await eve.next("screen", (sc) => sc.name === "Renamed");
assert.equal(renamed.visibility, "private");
assert.equal(renamed.maxViewers, 8);
await eve.next("viewers", (l) => l.every((v) => v.device === null));
assert.equal((await http("GET", `/resolve/${code}`)).body.requiresPassword, true);
host2.send("settings.update", { visibility: "public" });
await eve.next("screen", (sc) => sc.visibility === "public");
step("settings: viewers can't change them; host renames, goes private (password required), hides devices, goes public");

host2.send("code.regenerate");
const recoded = await eve.next("screen", (sc) => sc.code !== code);
assert.equal((await http("GET", `/resolve/${code}`)).status, 404, "old code stops working");
assert.equal((await http("GET", `/resolve/${recoded.code}`)).body.screenId, screenId);
step(`code regenerated ${code} → ${recoded.code}; old code no longer resolves`);
void eveWelcome;

// --- transfer ownership (§7.5) and close
host2.send("host.transfer", { viewer: carolId });
const transferred = await carol.next("viewers", (l) => me(l, carolId)?.isHost === true);
assert.equal(me(transferred, hw2.self.id).coHost, 1, "old host becomes top co-host");
carol.send("screen.close");
assert.equal((await host2.next("error")).code, "closed");
assert.equal((await http("GET", `/resolve/${recoded.code}`)).status, 404, "closed screen no longer resolves");
step("transfer makes Carol host (old host → co-host #1); she closes the screen");

for (const c of [host, viewer, viewer2, banned, carol, host2, dave, dave2, eve]) c.close();

// --- (optional, ~65 s) reconnect grace expires on the alarm
if (process.argv.includes("--slow")) {
  const g = await http("POST", "/screens", { name: "Grace test", visibility: "public" });
  const [gh] = await join(g.body.code, g.body.screenId, randomBytes(32), "Host", { claim: g.body.claim });
  const [gv, gvw] = await join(g.body.code, g.body.screenId, randomBytes(32), "Leaver");
  await gh.next("viewers", (l) => l.length === 2);
  gv.close();
  await gh.next("viewers", (l) => me(l, gvw.self.id)?.connected === false);
  await gh.next("viewers", (l) => !me(l, gvw.self.id), 75_000);
  gh.send("screen.close");
  gh.close();
  step("reconnect grace expires after 60 s and the viewer is removed");
}

console.log("\nAll smoke checks passed.");
