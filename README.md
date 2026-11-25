# Kino Enhanced

A cross-platform **synced media player** for two or more people, for Windows, Linux, Android and Web.

Kino Enhanced only syncs playback. It never streams the video itself. Each viewer plays their own copy of the media, and Kino keeps everyone's play/pause/seek state and timeline in step.

It is a full rework and restructure of the original [Kino](https://github.com/Sriharan-S/kino), which is now outdated.

📖 **Full specification:** [Wiki → docs](https://github.com/Sriharan-S/kino-enhanced/wiki/docs)

## Terminology

| Term | Meaning |
|---|---|
| **Theatre** | A server: one Cloudflare Worker deployment with a unique name |
| **Screen** | A room inside a theatre |
| **Host** | Owner of a screen |
| **Co-host** | Stands in for the host while the host is away |
| **Viewer** | Anyone in a screen |

## Architecture at a glance

- **Backend:** Cloudflare Workers and Durable Objects only, on the **free** plan. Nothing is hosted anywhere else.
- **Theatres:** The same Worker deployed under several Cloudflare accounts to spread the free-tier limits.
- **Clients:** A native app per platform, each in its own repo.

| Repo | Purpose | Status |
|---|---|---|
| `kino-enhanced` (this) | Theatre Worker code, protocol spec, docs, master TODO | Active |
| [`kino-enhanced-windows`](https://github.com/Sriharan-S/kino-enhanced-windows) | Windows client (C# / WinUI 3 + libmpv) | Active |
| `kino-enhanced-linux` | Linux client (C++ / Qt 6 + libmpv) | On hold |
| `kino-enhanced-android` | Android client (Kotlin / Compose + libmpv) | On hold |
| `kino-enhanced-web` | Web client (TypeScript) | On hold |

---

## TODO

Status legend: ⬜ Not started · 🟨 In progress · ✅ Done · ⏸ On hold

Tasks are worked through in order and checked off as they are completed. Windows is the first client; Linux, Android and Web are on hold.

### 0. Foundation

| #    | Task                          | Details                                                                                  | Status |
| ---- | ----------------------------- | ---------------------------------------------------------------------------------------- | ------ |
| 0.1  | Repository setup              | Git repo, `.gitignore` (incl. `.claude/`), remote `kino-enhanced`                        | ✅     |
| 0.2  | README with TODO checklist    | This document                                                                            | ✅     |
| 0.3  | Wiki specification            | Full scope in [Wiki → docs](https://github.com/Sriharan-S/kino-enhanced/wiki/docs)       | ✅     |
| 0.4  | Repo layout                   | This repo = theatre + protocol + docs; one repo per native client                        | ✅     |
| 0.5  | Native stack per platform     | Windows: C# / WinUI 3 + libmpv (others decided, on hold)                                 | ✅     |
| 0.6  | Windows repo setup            | `kino-enhanced-windows` initialised                                                      | ✅     |
| 0.7  | Shared protocol specification | Versioned message spec + canonical examples in `protocol/` (contract-tested on both sides) | ✅     |
| 0.8  | Protocol compatibility policy | `hello.protocol` checked against `minProtocol`; `update_required` on mismatch            | ✅     |
| 0.9  | Lint, format, test tooling    | Theatre: Prettier + tsc + vitest (`npm run check`); Windows: .editorconfig + `dotnet format` | ✅     |
| 0.10 | CI pipeline                   | GitHub Actions: theatre unit + end-to-end smoke; Windows build, tests, portable zip artifact | ✅     |

### 1. Theatres (Servers / Cloudflare Workers)

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 1.1   | Worker project scaffold           | TypeScript Worker in `theatre/`; runs locally with `wrangler dev`                       | ✅     |
| 1.2   | Multi-account deployment          | `npm run deploy -- <id> <Name>` per account; Aurora live; more accounts pending         | 🟨    |
| 1.3   | Unique theatre naming             | Sky & stars names; id/name set per deployment; Aurora is the first                      | ✅     |
| 1.4   | Dynamic theatre list              | Live `servers.json`, then cached copy, then bundled list (Windows)                      | ✅     |
| 1.5   | `/info` endpoint                  | Name, protocol version, status; also used as the latency probe                          | ✅     |
| 1.6   | Real-time connection layer        | WebSockets to one Durable Object per screen, using the Hibernation API                  | ✅     |
| 1.7   | Screen state storage              | Durable Object storage (SQLite-backed, free tier)                                       | ✅     |
| 1.8   | Lobby Durable Object              | Per-theatre listing of discoverable screens                                             | ✅     |
| 1.9   | Free-tier budget design           | Event-based anchors, clock re-sync every 2 min, status sent only on change, GIF search off-theatre, hibernation | ✅     |
| 1.10  | Quota handling                    | A theatre over quota fails `/info` and is shown unavailable; new screens go to the fastest usable one | ✅     |
| 1.11  | Abuse protection                  | Per-connection budget (40 burst, 8/s), 30 screens per address per 10 min, size limits, full validation | ✅     |
| 1.12  | User-added theatres (future)      | "Deploy to Cloudflare" plus paste-URL; deferred                                          | ⏸     |

### 2. Screens (Rooms)

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 2.1   | Naming                            | Theatre / Screen / Host / Co-host / Viewer                                              | ✅     |
| 2.2   | Create screen                     | Host must enter a screen name before it is created                                      | ✅     |
| 2.3   | Unique backend screen ID          | Internal ID, never shown anywhere in the UI                                             | ✅     |
| 2.4   | Non-unique names                  | Screen names and viewer names do not have to be unique                                  | ✅     |
| 2.5   | Join screen                       | From the lobby or by code; private screens prompt for the password                      | ✅     |
| 2.6   | Leave screen                      | Leave frees the seat at once; a dropped connection keeps it for 60 s and auto-reconnects | ✅     |
| 2.7   | Viewer list                       | Side panel: Host / Acting host / Co-host #n / roles, device, ping, mute icon; away co-hosts listed | ✅     |
| 2.8   | Host controls the screen          | The host has full control by default                                                    | ✅     |
| 2.9   | Viewer cap                        | 2–25 (default 10), chosen when creating; enforced by the theatre                        | ✅     |
| 2.10  | Screen settings                   | Name, visibility, password, hide, max viewers, devices, auto-advance, buffering policy              | ✅     |
| 2.11  | Screen lifecycle                  | Empty screen closes after 5 min; host + co-hosts absent 15 min closes it; host can close it | ✅     |

### 3. Identity & Reconnect (no accounts)

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 3.1   | No accounts                       | Display name only                                                                       | ✅     |
| 3.2   | Device secret                     | Random secret generated and stored on the device                                        | ✅     |
| 3.3   | Per-screen token                  | HMAC(deviceSecret, screenId), so viewers can't be tracked across screens                | ✅     |
| 3.4   | Reconnect with same identity      | Same token restores host status, co-host rank, roles, overrides and mute                | ✅     |
| 3.5   | Host ownership by token           | The host is identified by the owner token, not the name                                 | ✅     |

### 4. Host Handover

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 4.1   | Co-host role                      | Host makes co-hosts from the viewers panel; move up/down for priority                   | ✅     |
| 4.2   | Host disconnect → Acting Host     | Highest-priority present co-host becomes acting host and timeline authority (re-anchors) | ✅     |
| 4.3   | No co-host present                | Anchor keeps running; viewers keep their own permissions                                | ✅     |
| 4.4   | Host returns → regains control    | Host reconnects with the owner token and takes over at once                             | ✅     |
| 4.5   | Absence timeout                   | Screen closes after the host and all co-hosts have been absent for 15 min               | ✅     |
| 4.6   | Transfer ownership                | Old host becomes co-host #1; new host must be present                                   | ✅     |

### 5. Roles & Permissions (RBAC, Discord-style)

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 5.1   | Permission catalogue              | 19 permissions; theatre `rbac.ts`, client `Permissions.cs`                              | ✅     |
| 5.2   | Role model                        | Name, colour, rank 1–899, permissions; up to 20 custom roles                            | ✅     |
| 5.3   | Default roles                     | Host (owner token, rank 1000), Co-host (900, all), Viewer (0, chat by default)          | ✅     |
| 5.4   | Create / edit / delete roles      | Roles page; only below your own rank, and only permissions you have                     | ✅     |
| 5.5   | Assign roles to viewers           | Viewer menu → Roles; viewers ranked below you only                                      | ✅     |
| 5.6   | Per-viewer allow / deny overrides | Viewer menu → Permissions…: Inherit / Allow / Deny per permission                       | ✅     |
| 5.7   | Enforcement in the Screen DO      | Every message checked by the Screen DO; covered by unit + smoke tests                   | ✅     |
| 5.8   | Permission-aware UI               | Playback controls, viewer menu and roles page follow effective permissions              | ✅     |

### 6. Moderation

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 6.1   | Kick                              | Remove a viewer (they can rejoin)                                                       | ✅     |
| 6.2   | Ban                               | Block the token for the screen's lifetime                                               | ✅     |
| 6.3   | Chat mute                         | Muted viewers can't send chat, GIFs or reactions (enforced by the theatre)              | ✅     |

### 7. Lobby

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 7.1   | Unified lobby screen              | Screens from every theatre in one list (Windows)                                        | ✅     |
| 7.2   | Parallel fetch across theatres    | `GET /lobby` on all theatres in parallel, merged client-side                            | ✅     |
| 7.3   | Theatre badge per screen          | Each listed screen shows its theatre                                                    | ✅     |
| 7.4   | Theatre latency indicator         | Ping badge per theatre and per screen; theatre picker shows ping                        | ✅     |
| 7.5   | Public screens                    | Always listed; anyone can join                                                          | ✅     |
| 7.6   | Private screens                   | Lock icon; password prompt on join                                                      | ✅     |
| 7.7   | "Hide from lobby" toggle          | Toggle appears only when Private is on                                                  | ✅     |
| 7.8   | Refresh                           | Manual refresh plus 15 s auto-refresh                                                   | ✅     |
| 7.9   | Partial results                   | 3 s per-theatre timeout; failed theatres get an unavailable badge                       | ✅     |
| 7.10  | Sort & filter                     | Sort by viewers, ping, name; filter by visibility, theatre; search                      | ✅     |

### 8. Invites

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 8.1   | Screen code                       | 6-char code, separate from the hidden ID                                                | ✅     |
| 8.2   | Invite link                       | `kino://join/<theatre>/<code>` (per-user handler) and a web page at `/join#<theatre>/<code>` | ✅     |
| 8.3   | Join by code                      | Code looked up on all theatres in parallel; down theatres skipped                       | ✅     |
| 8.4   | Private join                      | Code plus password; wrong password rejected                                             | ✅     |
| 8.5   | Password security                 | PBKDF2-SHA256; 5 wrong passwords per token and 30 per screen per minute                 | ✅     |
| 8.6   | Regenerate code                   | New code from Invite & settings; old code stops resolving at once                       | ✅     |

### 9. Device & Latency Visibility

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 9.1   | Device detection                  | Sent in `hello`; Windows client reports `windows`                                       | ✅     |
| 9.2   | Show device per viewer            | Viewers panel, host included                                                            | ✅     |
| 9.3   | Per-screen devices toggle         | Screen setting, on by default; when off the theatre sends no devices                    | ✅     |
| 9.4   | Own latency indicator             | Sync overlay shows your RTT to the theatre                                              | ✅     |
| 9.5   | Others' latency indicator         | Viewers panel shows each RTT, updated after every clock re-sync                         | ✅     |
| 9.6   | Sync status per viewer            | 🟢 in sync · 🟡 catching up · 🔵 buffering · ⚠ file differs · ⏳ waiting · ⛔ no file; sent on change only | ✅     |

### 10. Media Player

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 10.1  | Windows: libmpv integration       | libmpv in a child HWND; popups and side panels for everything drawn near the video      | ✅      |
| 10.2  | Core playback                     | Play/pause/seek, previous/next; stops at the end of the last item                       | ✅      |
| 10.3  | Smooth playback-rate control      | libmpv `speed` + scaletempo2 pitch correction, driven by the sync engine                | ✅      |
| 10.4  | Audio track selection             | Picture & sound → Audio track (title, language, codec, channels)                        | ✅     |
| 10.5  | Fullscreen                        | F / F11 / button; Esc exits; top bar and side panel hide                                | ✅     |
| 10.6  | Keyboard shortcuts                | Space/K, ←/→ 5 s, J/L 10 s, ↑/↓ volume, M, F, Esc, N/P, Home; never while typing        | ✅     |
| 10.7  | Linux / Android / Web players     | Same features on the other platforms                                                    | ⏸     |

### 11. Sync Engine

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 11.1  | Sync only, no streaming           | Only state and time are sent                                                            | ✅     |
| 11.2  | Clock synchronisation             | NTP-style; 8-sample burst, best 3, median; re-sync every 2 min                          | ✅     |
| 11.3  | Timeline anchors                  | (item, state, position, rate, theatre time, seq)                                        | ✅     |
| 11.4  | Latency compensation              | Expected position computed locally from the anchor and clock offset                     | ✅     |
| 11.5  | Scheduled start                   | Play/resume take effect at a shared future moment                                       | ✅     |
| 11.6  | Drift measurement                 | 250 ms sampling, median filter, settling windows                                        | ✅     |
| 11.7  | Green zone with hysteresis        | Enter 0.25 s / exit 0.08 s                                                              | ✅     |
| 11.8  | Smooth rate controller            | ±5% max, 0.5%/s slew, no-overshoot cap; verified live (1.5 s knock recovered in ~45 s)  | ✅     |
| 11.9  | Hard seek fallback                | Above 3 s, with learned seek-latency compensation                                       | ✅     |
| 11.10 | Host re-anchor                    | Host sends a fresh anchor if its own drift exceeds 0.25 s                               | ✅     |
| 11.11 | Late join / reconnect catch-up    | Clock burst, snapshot, seek                                                             | ✅     |
| 11.12 | Buffering policy                  | Wait for everyone: theatre pauses for viewers buffering > 2 s and resumes with a scheduled start; Resume anyway | ✅     |
| 11.13 | Playlist transitions              | Theatre ends items on its alarm (host's duration); shorter copies wait, longer ones move on | ✅     |
| 11.14 | Ready check                       | Prompt over the video, live tally, 30 s timeout on the theatre's alarm, result in chat  | ✅     |
| 11.15 | Personal sync offset              | Picture & sound → Personal sync offset, ±2000 ms, applied in the drift formula          | ✅     |

### 12. Media Selection & Playlists

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 12.1  | Pick a single local file          | Each viewer picks their own copy                                                        | ✅     |
| 12.2  | Pick a local folder               | Add folder: its media files, natural-sorted                                             | ✅     |
| 12.3  | Multi-select local files          | Add files (multi-select)                                                                | ✅     |
| 12.4  | Default order A–Z                 | Natural sort, case-insensitive (`EP 2` before `EP 10`)                                  | ✅     |
| 12.5  | Host-defined order                | Drag and drop in the Playlist tab (or Move up/down); needs `playlist.reorder`           | ✅     |
| 12.6  | Local item mapping                | Auto-match (duration first, then name); "Choose my file…" and "Match my files…"         | ✅     |
| 12.7  | Mismatch check: duration first    | Tolerance max(2 s, 0.5%)                                                                | ✅     |
| 12.8  | Mismatch check: filename second   | Ignores case, extension and . _ - separators                                            | ✅     |
| 12.9  | Mismatch indicator                | ⚠ in the playlist and overlay; playback continues                                       | ✅     |
| 12.10 | Privacy of local files            | Only file name and duration are sent                                                    | ✅     |
| 12.11 | External media: YouTube           | IFrame player in WebView2; page on the directory site (https origin); Add link… accepts YouTube links | ✅     |
| 12.12 | YouTube sync rules                | No rate correction; seek beyond 1.5 s; ads/buffering = buffering; advance once everyone has finished | ✅     |
| 12.13 | External media: direct URL        | Add link…; every viewer streams it with libmpv                                          | ✅     |
| 12.14 | Mixed playlists                   | Local files, links and YouTube in one playlist                                          | ✅     |
| 12.15 | Auto-distribute external items    | External items reach every viewer automatically                                         | ✅     |
| 12.16 | Resume position                   | Saved every 5 s per file (local); used when playing outside a screen                    | ✅     |

### 13. Codec & Format Support

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 13.1  | Windows: full codec support       | libmpv/FFmpeg with `hwdec=auto-safe`                                                    | ✅     |
| 13.2  | Unsupported-format messaging      | Decoder failures name the codec; files that can't open say why                          | ✅     |
| 13.3  | Linux: full codec support         | libmpv                                                                                  | ⏸     |
| 13.4  | Android: full codec support       | libmpv; hardware plus software fallback                                                 | ⏸     |
| 13.5  | Web: push support to its limits   | MSE, WebAssembly remux, WebCodecs                                                       | ⏸     |

### 14. Viewer Customisation (local only, never sent to the theatre)

| #     | Task                             | Details                                                                                 | Status |
| ----- | -------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 14.1  | Zoom & pan                       | 50–400%, with pan when zoomed in                                                        | ✅     |
| 14.2  | Aspect ratio override            | Original, 16:9, 4:3, 21:9, 2.35:1, 1:1                                                  | ✅     |
| 14.3  | Fit modes                        | Fit width/height become letterbox or crop depending on the window shape                 | ✅     |
| 14.4  | Volume                           | 0–100%                                                                                  | ✅     |
| 14.5  | Volume boost                     | Up to 200% after a one-time disclaimer                                                  | ✅     |
| 14.6  | Persist preferences locally      | Defaults plus "Remember for this file only" in local prefs (`%LOCALAPPDATA%/Kino/<profile>/prefs.json`) | ✅     |
| 14.7  | Guarantee local-only             | Kept in local prefs only; no theatre message carries them                               | ✅     |

### 15. Subtitles

| #     | Task                             | Details                                                                                 | Status |
| ----- | -------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 15.1  | Load subtitles                   | Subtitles flyout → Load a file…; libmpv also picks up a same-named file next to the video | ✅     |
| 15.2  | Subtitle formats                 | SRT, VTT, ASS/SSA files; embedded tracks listed as "In the file"                        | ✅     |
| 15.3  | Per-video scope                  | Shared files belong to one playlist item and are deleted with it                        | ✅     |
| 15.4  | "Also share with viewers" toggle | "Also share with viewers" (needs `subtitles.share`); chat announces it                  | ✅     |
| 15.5  | Viewer choice                    | Per item: off, in the file, shared by anyone, or your own file                          | ✅     |
| 15.6  | Subtitle transfer                | gzip over HTTP with the per-screen token; 1 MB max; 20 per item, 100 per screen         | ✅     |
| 15.7  | Subtitle timing offset           | Per file, ±10 s                                                                         | ✅     |
| 15.8  | Subtitle styling                 | Font, size, colour, outline, background box and opacity, position                       | ✅     |

### 16. Chat

| #     | Task                             | Details                                                                                 | Status |
| ----- | -------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 16.1  | Text chat                        | Chat tab; 500 characters; unread count on the tab                                       | ✅     |
| 16.2  | Chat history                     | Last 100 kept under their own storage key; sent in `welcome`                            | ✅     |
| 16.3  | Emoji reactions                  | 8 fixed emoji; float over the video for 3 s; never stored                               | ✅     |
| 16.4  | GIFs                             | Picker searches GIPHY directly; theatre accepts GIPHY/Tenor/KLIPY media URLs only; pasted GIF links work | ✅     |
| 16.5  | GIF provider choice              | GIPHY (free API key, entered once in the picker; stored locally)                        | ✅     |
| 16.6  | System messages                  | Joins, leaves, kicks, bans, co-host and role changes, host transfer, acting host, now playing | ✅     |
| 16.7  | Chat permissions & rate limit    | `chat.send` / `chat.gif` / `chat.react`; 5 messages and 10 reactions per 5 s            | ✅     |

### 17. Platform Builds & Release

| #     | Task                             | Details                                                                                 | Status |
| ----- | -------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 17.1  | Windows build                    | Portable self-contained zip via `tools/Publish-Portable.ps1` (no installer or admin needed) | ✅     |
| 17.2  | `servers.json` on Cloudflare Pages | Static-assets Worker `kino-directory` (Pages now deploys as Workers)                  | ✅     |
| 17.3  | Linux build                      | AppImage / deb                                                                          | ⏸     |
| 17.4  | Android build                    | APK                                                                                     | ⏸     |
| 17.5  | Web build & hosting              | Cloudflare Pages                                                                        | ⏸     |
| 17.6  | Cross-platform sync test         | Every platform in the same screen together                                              | ⏸     |
