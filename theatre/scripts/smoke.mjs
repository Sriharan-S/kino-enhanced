// End-to-end smoke test against a running theatre (default: local `npm run dev`).
// Usage: node scripts/smoke.mjs [baseUrl]
import { createHmac, randomBytes } from "node:crypto";
import assert from "node:assert/strict";

const BASE = process.argv[2] ?? "http://127.0.0.1:8787";
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
viewer.send("hello", { protocol: 1, token: token(randomBytes(32), screenId), name: "Viewer", device: "web" });
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

for (const c of [host, viewer, p1, p2, old]) c.close();
console.log("\nAll smoke checks passed.");
