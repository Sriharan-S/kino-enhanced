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
| `POST /screens/<code>/subs?item=&format=&name=` | Share a subtitle file for an item. Body: the file, **gzip-compressed**, at most 1 MB. `Authorization: Bearer <perScreenToken>`; needs `subtitles.share`. | `201 SubMeta` |
| `GET /screens/<code>/subs/<id>` | Download a shared subtitle file (gzip). Members only (`Authorization: Bearer <perScreenToken>`). | `200` gzip body |

Subtitles go over HTTP because WebSocket messages on Workers are capped at 1 MiB. `format` is `srt`, `vtt`, `ass` or `ssa`.
There are at most 20 files per item and 100 per screen. Files are deleted with their item.

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
| `buffering` | `{ value }` | joined | Older form of `status` (`true` = `buffering`, `false` = `sync`). |
| `status` | `{ value: "sync"\|"catching"\|"buffering"\|"mismatch"\|"waiting"\|"nofile" }` | joined | Your sync status (§12), sent only when it changes. Report `buffering` once it has lasted 2 s. |
| `hold.release` | `{}` | `playback.toggle` | "Resume anyway" while the screen waits for someone. Those buffering now aren't waited for again until they recover. `play` while held does the same. |
| `ready.start` | `{}` | `screen.ready_check` | Starts a 30 s ready check. The starter counts as ready. |
| `ready.answer` | `{ id, ready }` | joined | Answer the current ready check. |
| `play` | `{}` | `playback.toggle` | Scheduled start: `at = now + lead`. |
| `pause` | `{}` | `playback.toggle` | Position frozen at the theatre's expected position. |
| `seek` | `{ to }` | `playback.seek` | Keeps play/pause state. |
| `load` | `NewItem` | `playlist.add` / `playlist.add_external` (url) | "Open now": inserts after the current item, makes it current, paused at 0. |
| `playlist.add` | `{ items: NewItem[], at? }` | `playlist.add` (local) / `playlist.add_external` (url) | Inserts at index `at` (default: end). If nothing is current, the first new item becomes current. At most 200 items. |
| `playlist.remove` | `{ id }` | `playlist.remove` | Removing the current item moves on to the next one (else the previous), keeping play/pause. |
| `playlist.move` | `{ id, to }` | `playlist.reorder` | Moves the item to index `to`. |
| `playlist.play` | `{ id }` | `playback.skip` | Jumps to that item and plays it from 0 (scheduled start). |
| `skip` | `{ direction: "next"\|"previous" }` | `playback.skip` | Errors at either end; there is no wrap-around. |
| `item.ended` | `{ id }` | joined | Your player reached the end of the current **YouTube** item. The screen moves on once everyone present has sent it (or the host skips). Ignored for other kinds. |
| `reanchor` | `{ position, at }` | timeline authority | The host, or the acting host while the host is away. Real position at theatre time `at` (clamped to ±2 s). |
| `roles.create` | `{ name, colour, permissions, position? }` | `roles.manage` | New role ranked below your own (default: just above the highest role you can manage). |
| `roles.update` | `{ id, name?, colour?, permissions?, position? }` | `roles.manage` | Roles below your own. Co-host is fixed; for Viewer only `permissions` can change. |
| `roles.delete` | `{ id }` | `roles.manage` | Custom roles below your own. Removed from everyone. |
| `roles.assign` | `{ viewer, role, assigned }` | `roles.assign` | Custom role below your own, to a viewer ranked below you. |
| `viewer.overrides` | `{ viewer, allow, deny }` | `roles.manage` | Replaces that viewer's per-viewer overrides. Target ranked below you. |
| `viewer.mute` | `{ viewer, muted }` | `viewers.mute` | Chat mute. Target ranked below you. |
| `viewer.kick` | `{ viewer }` | `viewers.kick` | Disconnects them (`kicked`); they can rejoin. |
| `viewer.ban` | `{ viewer }` | `viewers.ban` | Disconnects them (`banned`) and bans their token for the screen's lifetime. |
| `cohosts.set` | `{ viewers }` | host only | Co-hosts in priority order (first = takes over first). |
| `host.transfer` | `{ viewer }` | host only | New host must be present. The old host becomes co-host #1. |
| `screen.close` | `{}` | host only | Everyone gets `closed`; the screen is deleted. |
| `settings.update` | `{ name?, visibility?, password?, hidden?, maxViewers?, showDevices?, autoAdvance?, bufferingPolicy? }` | `screen.settings` | Going private needs a password (new, or the existing one). Going public clears password and hidden. Viewers already in keep their place. |
| `code.regenerate` | `{}` | `screen.invite` | New code; the old code and links stop working at once. Connected viewers aren't affected. |
| `leave` | `{}` | joined | Explicit leave: no reconnect grace. |
| `chat.send` | `{ text }` | `chat.send`, not muted | 1–500 characters (newlines kept, control characters dropped). 5 messages per 5 s, shared with GIFs. |
| `chat.gif` | `{ url, width?, height?, title? }` | `chat.gif`, not muted | `https` URL from an allow-listed GIF service (GIPHY, Tenor, KLIPY media hosts). The client searches the provider itself. |
| `subs.unshare` | `{ id }` | the sharer, or `subtitles.share` and ranked above them | Removes a shared subtitle file. |
| `react` | `{ emoji }` | `chat.react`, not muted | One of 👍 ❤️ 😂 😮 😢 🔥 👏 🎉. Broadcast, never stored. 10 per 5 s. |

**Permissions** are checked by the theatre on every message (wiki docs §8). You can't grant permissions you don't have yourself,
and you can only act on roles and viewers ranked strictly **below** you: host 1000, co-host and acting host 900, custom roles
1–899, Viewer 0. The acting host has every permission, but host-only actions stay with the host.

### 4.2 Theatre → client

| Type | Data | When |
|---|---|---|
| `welcome` | `{ self, screen, viewers, roles, coHosts, playlist, chat, subs, ready, hold, item, anchor, serverTime }` | Reply to a successful `hello` |
| `pong` | `{ t0, ts }` | Reply to `ping`. `ts` is theatre time when it was handled. |
| `anchor` | `Anchor` | Any timeline change |
| `item` | `Item \| null` | Current item changed |
| `playlist` | `Item[]` | Items added, removed or reordered |
| `chat` | `ChatMessage` | A text, GIF or system message. The last 100 are kept and sent to late joiners in `welcome.chat`. |
| `react` | `{ from, name, emoji }` | Someone reacted |
| `subs` | `SubMeta[]` | Subtitles were shared or removed |
| `hold` | `string[] \| null` | Names the screen is waiting for under `bufferingPolicy: "wait"`, or `null` when it isn't waiting |
| `ready` | `ReadyCheck \| null` | A ready check started, got an answer, or finished (`done`) |
| `viewers` | `ViewerInfo[]` | Anyone joins or leaves, or their RTT, buffering, roles, co-host status or permissions change |
| `roles` | `Role[]` | Roles were created, edited or deleted |
| `screen` | `ScreenInfo` | Settings or code changed |
| `cohosts` | `{ id, name }[]` | The co-host list changed. Priority order, **including co-hosts who aren't present** (viewer lists only show who is online). |
| `error` | `{ code, message }` | Rejected message. Fatal errors are followed by a close with code `4001`. |

### 4.3 Shared types

```ts
Anchor     = { itemId: string|null, state: "playing"|"paused", position: number, rate: number, at: number, seq: number }
Item       = { id: string, kind: "local"|"url", name: string, duration: number|null, url?: string }
ViewerInfo = { id: string, name: string, device: Device|null, isHost: boolean, rtt: number|null, buffering: boolean,
               roles: string[],          // custom role ids
               coHost: number|null,      // 1-based co-host priority
               actingHost: boolean,      // standing in for the absent host
               muted: boolean,           // chat-muted
               allow: Permission[],      // per-viewer overrides: deny beats allow beats roles
               deny: Permission[],
               permissions: Permission[], // effective, computed by the theatre
               connected: boolean,        // false while in the 60 s reconnect grace period
               status: "sync"|"catching"|"buffering"|"mismatch"|"waiting"|"nofile"
             }
ReadyCheck = { id: number, by: string, deadline: number, answers: { [viewerId]: boolean }, done: boolean }
ScreenInfo = { code: string, name: string, visibility: "public"|"private", hidden: boolean, maxViewers: number, showDevices: boolean,
               autoAdvance: boolean, bufferingPolicy: "keep"|"wait" }
NewItem    = { kind: "local"|"url"|"youtube", name: string, duration: number|null, url?: string }   // local: file name only, never a path
// youtube: any YouTube video link or id; stored as https://www.youtube.com/watch?v=<id>. Needs playlist.add_external.
SubMeta    = { id: string, itemId: string, name: string, format: "srt"|"vtt"|"ass"|"ssa", size: number, from: string, fromName: string }
ChatMessage = { id: number, at: number, kind: "text"|"gif"|"system", from: string|null, name: string|null,
                text: string|null, gif: { url, width, height, title }|null }
// System messages: joins, leaves, kicks, bans, co-host and role changes, host transfer, acting host, now playing.
Role       = { id: string, name: string, colour: string|null, position: number, permissions: Permission[], builtin: boolean }
Permission = "playback.toggle" | "playback.seek" | "playback.skip" | "playlist.add" | "playlist.add_external"
           | "playlist.remove" | "playlist.reorder" | "subtitles.share" | "screen.ready_check" | "screen.settings"
           | "screen.invite" | "chat.send" | "chat.gif" | "chat.react" | "viewers.mute" | "viewers.kick"
           | "viewers.ban" | "roles.assign" | "roles.manage"
```

Built-in roles: `cohost` (position 900, every permission, fixed) and `viewer` (position 0, everyone has it; by default
`chat.send`, `chat.gif`, `chat.react`). The host isn't a role: it is whoever holds the owner token.

`device` is `null` when the screen's **Show devices** setting is off.

**Expected position** (all clients compute this locally):
```
E(now) = position                                   if state = paused, or now <= at
E(now) = position + rate × (now − at) / 1000        otherwise
```
Clients ignore an anchor whose `seq` is lower than the last one they applied.

### 4.4 Error codes

`bad_request` · `update_required` · `not_found` · `forbidden` · `wrong_password` · `full` · `banned` · `kicked` · `rate_limited` · `closed`

`rate_limited` on `hello` means too many wrong passwords: 5 per token per minute, 30 per screen per minute.

## 5. Typical flows

**Create and host:** `POST /screens`, then open the WebSocket and send `hello{claim}`. The theatre replies `welcome` with `self.isHost = true`. The host then sends `load` and `play`.

**Reconnect (§6.4):** a viewer whose connection drops (without `leave`) stays in the list with `connected: false` for
60 s and keeps their seat. Reconnecting with the same token restores everything, and no password is needed. Kicked or
banned viewers get no grace.

**End of an item (§14.12):** the theatre knows the current item's duration (the host's file is the reference), so it
schedules the end itself on its alarm. Playback continues even if the host is away. With `autoAdvance`, the next item starts
at 0 with a scheduled start. Otherwise, or at the last item, playback pauses exactly at the end.

**Wait for everyone (§14.10):** with `bufferingPolicy: "wait"`, a viewer reporting `buffering` pauses the anchor at
`E(now)` and the theatre broadcasts `hold`. When nobody is buffering any more, it resumes with a scheduled start.

**Host away (§7.2):** when the host disconnects, the highest-priority co-host who is present becomes acting host
(`actingHost: true`) and the timeline authority (it re-anchors). When the host reconnects with the same token, it takes back
control at once. If the host and all co-hosts are away for 15 minutes, the screen closes.

**Join:** `GET /resolve/<code>` gives the `screenId`. The client derives its token, opens the WebSocket, sends `hello{password?}` and receives `welcome`. It then runs a clock-sync burst (8 × `ping`) and catches up from `anchor`.
