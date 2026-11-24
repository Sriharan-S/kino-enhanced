# Kino Protocol — v1

The contract between Kino clients (Windows, Linux, Android, Web) and theatres (Cloudflare Workers).
Product behaviour is described in the [wiki](https://github.com/Sriharan-S/kino-enhanced/wiki/docs). This document covers the wire format only.

- **Version:** `1` (theatre reports `protocol` and `minProtocol` in `/info`).
- **Compatibility:**
  - A client whose version is below `minProtocol` is rejected with `update_required`.
  - Additive changes (new optional fields or message types) don't bump the version, and clients **must ignore unknown fields and message types**.
  - Breaking changes bump the version.
- **Examples:** every message below has a canonical example in [`examples/`](examples). Server and client test suites both parse these files, so they act as contract tests.

## 1. Conventions

| Item | Convention |
|---|---|
| Encoding | UTF-8 JSON |
| Times | Theatre time, Unix **milliseconds** (`at`, `ts`, `serverTime`) |
| Media positions | **Seconds**, as floating point (`position`, `to`, `duration`) |
| IDs | Opaque strings. `screenId` is internal: clients may use it, but **never display it** |
| Codes | 6 characters, Crockford base32 (`0-9 A-Z` without `I L O U`). Input is normalised: case-insensitive, `I/L→1`, `O→0` |

## 2. HTTP API

All responses are JSON with CORS `*`. Errors look like `{ "error": { "code": "...", "message": "..." } }`.

| Method & path | Purpose | Response |
|---|---|---|
| `GET /info` | Health, identity, version, latency probe | `{ id, name, protocol, minProtocol, status, time }` |
| `GET /lobby` | Discoverable screens (excludes hidden private ones) | `{ theatre: {id, name}, screens: [{ code, name, visibility, viewers, maxViewers, host }] }` |
| `POST /screens` | Create a screen | `201 { theatre, code, screenId, claim }` |
| `GET /resolve/<code>` | Look up a code (join by code or link) | `{ code, screenId, name, visibility, requiresPassword }`, or `404` |
| `GET /screens/<code>/ws` | WebSocket upgrade into the screen | `101` |

`POST /screens` body: `{ name, visibility: "public"|"private", password?, hidden?, maxViewers? }`.
- `password` is required for private screens.
- `hidden` only applies to private screens.
- `maxViewers` is clamped to 2–25 and defaults to 10.

The returned `claim` is a **one-time owner secret**. The creator presents it in `hello`, and their per-screen token becomes the owner token.

## 3. Identity

```
deviceSecret   = 32 random bytes, generated once per device, stored locally, never sent
perScreenToken = hex( HMAC-SHA256(key = deviceSecret, message = UTF-8(screenId)) )
```

The theatre stores only `SHA-256(perScreenToken)`. The public viewer `id` is the first 12 hex characters of that hash.

## 4. WebSocket messages

Envelope: `{ "type": "<type>", "data": { ... } }`. Messages are limited to 16 KiB.

### 4.1 Client → theatre

| Type | Data | Who | Notes |
|---|---|---|---|
| `hello` | `{ protocol, token, name, device, password?, claim? }` | anyone | **Must be the first message.** `device`: `windows`/`linux`/`android`/`web`. |
| `ping` | `{ t0 }` | joined | `t0` is in the **client's** monotonic ms clock; it is echoed back. |
| `rtt` | `{ value }` | joined | Your measured round-trip time in ms, so others can see it. |
| `buffering` | `{ value }` | joined | Sent only when the state changes. |
| `play` | `{}` | control | Scheduled start: `at = now + lead`. |
| `pause` | `{}` | control | Position frozen at the theatre's expected position. |
| `seek` | `{ to }` | control | Keeps play/pause state. |
| `load` | `{ kind: "local"|"url", name, duration, url? }` | control | Sets the current item and resets the anchor to paused at 0. |
| `reanchor` | `{ position, at }` | host | Host's real position at theatre time `at` (clamped to ±2 s). |

"Control" currently means the host. Later this becomes the RBAC permissions `playback.toggle`, `playback.seek` and `playlist.add`.

### 4.2 Theatre → client

| Type | Data | When |
|---|---|---|
| `welcome` | `{ self, screen, viewers, item, anchor, serverTime }` | Reply to a successful `hello` |
| `pong` | `{ t0, ts }` | Reply to `ping`. `ts` is theatre time when it was handled. |
| `anchor` | `Anchor` | Any timeline change |
| `item` | `Item \| null` | Current item changed |
| `viewers` | `ViewerInfo[]` | Anyone joins, leaves or changes RTT/buffering |
| `error` | `{ code, message }` | Rejected message. Fatal errors are followed by a close with code `4001`. |

### 4.3 Shared types

```ts
Anchor     = { itemId: string|null, state: "playing"|"paused", position: number, rate: number, at: number, seq: number }
Item       = { id: string, kind: "local"|"url", name: string, duration: number|null, url?: string }
ViewerInfo = { id: string, name: string, device: Device|null, isHost: boolean, rtt: number|null, buffering: boolean }
```

`device` is `null` when the screen's **Show devices** setting is off.

**Expected position** (all clients compute this locally):
```
E(now) = position                                   if state = paused, or now <= at
E(now) = position + rate × (now − at) / 1000        otherwise
```
Clients ignore an anchor whose `seq` is lower than the last one they applied.

### 4.4 Error codes

`bad_request` · `update_required` · `not_found` · `forbidden` · `wrong_password` · `full` · `banned` · `rate_limited` · `closed`

## 5. Typical flows

**Create and host:** `POST /screens`, then open the WebSocket and send `hello{claim}`. The theatre replies `welcome` with `self.isHost = true`. The host then sends `load` and `play`.

**Join:** `GET /resolve/<code>` gives the `screenId`. The client derives its token, opens the WebSocket, sends `hello{password?}` and receives `welcome`. It then runs a clock-sync burst (8 × `ping`) and catches up from `anchor`.
