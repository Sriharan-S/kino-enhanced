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
| 0.7  | Shared protocol specification | Versioned, language-neutral message schemas in `protocol/`                               | ⬜     |
| 0.8  | Protocol compatibility policy | Version handshake; "update required" on mismatch                                         | ⬜     |
| 0.9  | Lint, format, test tooling    | Per repo                                                                                 | ⬜     |
| 0.10 | CI pipeline                   | Build + test on push in every repo                                                       | ⬜     |

### 1. Theatres (Servers / Cloudflare Workers)

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 1.1   | Worker project scaffold           | One codebase, deployable to many Cloudflare accounts                                    | ⬜     |
| 1.2   | Multi-account deployment          | Deploy the same Worker to several accounts; per-account config                          | ⬜     |
| 1.3   | Unique theatre naming             | Each theatre has a unique id and name                                                   | ⬜     |
| 1.4   | Dynamic theatre list              | `servers.json` on Cloudflare Pages, with cached and bundled fallbacks                   | ⬜     |
| 1.5   | `/info` endpoint                  | Name, protocol version, status; also used as the latency probe                          | ⬜     |
| 1.6   | Real-time connection layer        | WebSockets to one Durable Object per screen, using the Hibernation API                  | ⬜     |
| 1.7   | Screen state storage              | Durable Object storage (SQLite-backed, free tier)                                       | ⬜     |
| 1.8   | Lobby Durable Object              | Per-theatre listing of discoverable screens                                             | ⬜     |
| 1.9   | Free-tier budget design           | Event-based anchors, rare re-syncs, state-change-only reports                           | ⬜     |
| 1.10  | Quota handling                    | Theatre marked unavailable when its daily quota is exhausted                            | ⬜     |
| 1.11  | Abuse protection                  | Rate limiting, payload size limits, input validation                                    | ⬜     |
| 1.12  | User-added theatres (future)      | "Deploy to Cloudflare" plus paste-URL; deferred                                          | ⏸     |

### 2. Screens (Rooms)

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 2.1   | Naming                            | Theatre / Screen / Host / Co-host / Viewer                                              | ✅     |
| 2.2   | Create screen                     | Host must enter a screen name before it is created                                      | ⬜     |
| 2.3   | Unique backend screen ID          | Internal ID, never shown anywhere in the UI                                             | ⬜     |
| 2.4   | Non-unique names                  | Screen names and viewer names do not have to be unique                                  | ⬜     |
| 2.5   | Join screen                       | Anyone can join any public screen                                                       | ⬜     |
| 2.6   | Leave screen                      | Clean leave; reconnect grace period                                                     | ⬜     |
| 2.7   | Viewer list                       | Host, co-hosts and viewers, with status icons                                           | ⬜     |
| 2.8   | Host controls the screen          | The host has full control by default                                                    | ⬜     |
| 2.9   | Viewer cap                        | Default maximum of 10, configurable by the host                                         | ⬜     |
| 2.10  | Screen settings                   | Name, visibility, password, devices toggle, buffering policy, auto-advance              | ⬜     |
| 2.11  | Screen lifecycle                  | Closes on host close, host absence timeout, or empty timeout                            | ⬜     |

### 3. Identity & Reconnect (no accounts)

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 3.1   | No accounts                       | Display name only                                                                       | ⬜     |
| 3.2   | Device secret                     | Random secret generated and stored on the device                                        | ⬜     |
| 3.3   | Per-screen token                  | HMAC(deviceSecret, screenId), so viewers can't be tracked across screens                | ⬜     |
| 3.4   | Reconnect with same identity      | Roles, permissions and host status are restored                                         | ⬜     |
| 3.5   | Host ownership by token           | The host is identified by the owner token, not the name                                 | ⬜     |

### 4. Host Handover

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 4.1   | Co-host role                      | Host appoints co-hosts in priority order                                                | ⬜     |
| 4.2   | Host disconnect → Acting Host     | Highest-priority present co-host takes control; playback continues                      | ⬜     |
| 4.3   | No co-host present                | Playback continues; host-only actions are locked                                        | ⬜     |
| 4.4   | Host returns → regains control    | Acting Host goes back to their previous role                                            | ⬜     |
| 4.5   | Absence timeout                   | Screen closes after the host and all co-hosts have been absent for 15 min               | ⬜     |
| 4.6   | Transfer ownership                | Host permanently hands the screen to another viewer                                     | ⬜     |

### 5. Roles & Permissions (RBAC, Discord-style)

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 5.1   | Permission catalogue              | Playback, playlist, subtitles, screen, chat, viewer moderation, roles                   | ⬜     |
| 5.2   | Role model                        | Named, coloured, ranked roles with permission sets                                      | ⬜     |
| 5.3   | Default roles                     | Host, Co-host, Viewer                                                                   | ⬜     |
| 5.4   | Create / edit / delete roles      | Limited to roles below your own (hierarchy)                                             | ⬜     |
| 5.5   | Assign roles to viewers           | One or more roles per viewer                                                            | ⬜     |
| 5.6   | Per-viewer allow / deny overrides | Deny > allow > roles                                                                    | ⬜     |
| 5.7   | Enforcement in the Screen DO      | Every action is checked by the theatre, not just hidden in the UI                       | ⬜     |
| 5.8   | Permission-aware UI               | Disallowed controls are disabled or hidden                                              | ⬜     |

### 6. Moderation

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 6.1   | Kick                              | Remove a viewer (they can rejoin)                                                       | ⬜     |
| 6.2   | Ban                               | Block the token for the screen's lifetime                                               | ⬜     |
| 6.3   | Chat mute                         | Stop a viewer from sending chat, GIFs and reactions                                     | ⬜     |

### 7. Lobby

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 7.1   | Unified lobby screen              | Screens from **all** theatres in one list, with no dropdown                             | ⬜     |
| 7.2   | Parallel fetch across theatres    | Query every theatre at once and merge the results                                       | ⬜     |
| 7.3   | Theatre badge per screen          | Each listed screen shows its theatre                                                    | ⬜     |
| 7.4   | Theatre latency indicator         | Ping to each theatre                                                                    | ⬜     |
| 7.5   | Public screens                    | Always listed; anyone can join                                                          | ⬜     |
| 7.6   | Private screens                   | Password-protected                                                                      | ⬜     |
| 7.7   | "Hide from lobby" toggle          | Only for private screens                                                                | ⬜     |
| 7.8   | Refresh                           | Manual refresh plus 15 s auto-refresh                                                   | ⬜     |
| 7.9   | Partial results                   | Down or slow theatres don't block the list                                              | ⬜     |
| 7.10  | Sort & filter                     | By viewers, latency, name, privacy, theatre                                             | ⬜     |

### 8. Invites

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 8.1   | Screen code                       | 6-char code, separate from the hidden ID                                                | ⬜     |
| 8.2   | Invite link                       | `kino://join/<theatre>/<code>` plus a web link                                          | ⬜     |
| 8.3   | Join by code                      | Code is resolved across all theatres in parallel                                        | ⬜     |
| 8.4   | Private join                      | Code or link plus a password prompt                                                     | ⬜     |
| 8.5   | Password security                 | PBKDF2 hash; limit on attempts                                                          | ⬜     |
| 8.6   | Regenerate code                   | Old code and link stop working                                                          | ⬜     |

### 9. Device & Latency Visibility

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 9.1   | Device detection                  | Windows / Linux / Android / Web                                                         | ⬜     |
| 9.2   | Show device per viewer            | Host included                                                                           | ⬜     |
| 9.3   | Per-screen devices toggle         | Host setting, **on by default**                                                         | ⬜     |
| 9.4   | Own latency indicator             | Live ping to the theatre                                                                | ⬜     |
| 9.5   | Others' latency indicator         | Each viewer's RTT, refreshed on clock re-sync                                           | ⬜     |
| 9.6   | Sync status per viewer            | In sync / catching up / buffering / mismatch / waiting                                  | ⬜     |

### 10. Media Player

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 10.1  | Windows: libmpv integration       | Embedding in WinUI 3, with overlays on top (prototype first)                            | ⬜     |
| 10.2  | Core playback                     | Play, pause, seek, stop, next, previous                                                 | ⬜     |
| 10.3  | Smooth playback-rate control      | Fine-grained `speed` with pitch correction                                              | ⬜     |
| 10.4  | Audio track selection             | Choose among a file's audio tracks                                                      | ⬜     |
| 10.5  | Fullscreen                        | Windows                                                                                 | ⬜     |
| 10.6  | Keyboard shortcuts                | Space, arrows, F, M, etc.                                                               | ⬜     |
| 10.7  | Linux / Android / Web players     | Same features on the other platforms                                                    | ⏸     |

### 11. Sync Engine

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 11.1  | Sync only, no streaming           | Only state and time are sent                                                            | ⬜     |
| 11.2  | Clock synchronisation             | NTP-style; 8-sample burst, best 3, median; re-sync every 2 min                          | ⬜     |
| 11.3  | Timeline anchors                  | (item, state, position, rate, theatre time, seq)                                        | ⬜     |
| 11.4  | Latency compensation              | Expected position computed locally from the anchor and clock offset                     | ⬜     |
| 11.5  | Scheduled start                   | Play/resume take effect at a shared future moment                                       | ⬜     |
| 11.6  | Drift measurement                 | 250 ms sampling, median filter, settling windows                                        | ⬜     |
| 11.7  | Green zone with hysteresis        | Enter 0.25 s / exit 0.08 s                                                              | ⬜     |
| 11.8  | Smooth rate controller            | ±5% max, 0.5%/s slew, no-overshoot cap, pitch preserved                                 | ⬜     |
| 11.9  | Hard seek fallback                | Above 3 s, with seek-latency compensation                                               | ⬜     |
| 11.10 | Host re-anchor                    | Host sends a fresh anchor if its own drift exceeds 0.25 s                               | ⬜     |
| 11.11 | Late join / reconnect catch-up    | Clock burst, snapshot, seek                                                             | ⬜     |
| 11.12 | Buffering policy                  | Keep playing (default) / Wait for everyone, with host override                          | ⬜     |
| 11.13 | Playlist transitions              | Auto-advance; waiting state for viewers whose copy ends early                           | ⬜     |
| 11.14 | Ready check                       | Prompt, live tally, 30 s timeout                                                        | ⬜     |
| 11.15 | Personal sync offset              | Local ±ms nudge                                                                         | ⬜     |

### 12. Media Selection & Playlists

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 12.1  | Pick a single local file          | Each viewer picks their own copy                                                        | ⬜     |
| 12.2  | Pick a local folder               | The folder's media becomes the play order                                               | ⬜     |
| 12.3  | Multi-select local files          | Alternative to picking a folder                                                         | ⬜     |
| 12.4  | Default order A–Z                 | Natural sort                                                                            | ⬜     |
| 12.5  | Host-defined order                | Drag-and-drop reorder                                                                   | ⬜     |
| 12.6  | Local item mapping                | Auto-match by duration then name; manual remap                                          | ⬜     |
| 12.7  | Mismatch check: duration first    | Tolerance max(2 s, 0.5%)                                                                | ⬜     |
| 12.8  | Mismatch check: filename second   | Normalised comparison                                                                   | ⬜     |
| 12.9  | Mismatch indicator                | Warning only; never blocks playback                                                     | ⬜     |
| 12.10 | Privacy of local files            | Only name and duration are shared, never paths or contents                              | ⬜     |
| 12.11 | External media: YouTube           | Official IFrame API in a WebView                                                        | ⬜     |
| 12.12 | YouTube sync rules                | No rate correction; seek-based sync; wait for everyone at the end                       | ⬜     |
| 12.13 | External media: direct URL        | `.mp4`, `.mkv`, `.avi`, … streamed directly from the URL by each viewer                 | ⬜     |
| 12.14 | Mixed playlists                   | Local and external items together                                                       | ⬜     |
| 12.15 | Auto-distribute external items    | External items reach every viewer automatically                                         | ⬜     |
| 12.16 | Resume position                   | Per-file last position (local only)                                                     | ⬜     |

### 13. Codec & Format Support

| #     | Task                              | Details                                                                                 | Status |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 13.1  | Windows: full codec support       | libmpv/FFmpeg plus hardware decoding                                                    | ⬜     |
| 13.2  | Unsupported-format messaging      | Clear message that names the codec                                                      | ⬜     |
| 13.3  | Linux: full codec support         | libmpv                                                                                  | ⏸     |
| 13.4  | Android: full codec support       | libmpv; hardware plus software fallback                                                 | ⏸     |
| 13.5  | Web: push support to its limits   | MSE, WebAssembly remux, WebCodecs                                                       | ⏸     |

### 14. Viewer Customisation (local only, never sent to the theatre)

| #     | Task                             | Details                                                                                 | Status |
| ----- | -------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 14.1  | Zoom & pan                       | 50%–400%                                                                                | ⬜     |
| 14.2  | Aspect ratio override            | Original, 16:9, 4:3, 21:9, 2.35:1, 1:1                                                  | ⬜     |
| 14.3  | Fit modes                        | Fit, fit width, fit height, stretch, fill                                               | ⬜     |
| 14.4  | Volume                           | 0–100%                                                                                  | ⬜     |
| 14.5  | Volume boost                     | Up to 200%, after a one-time disclaimer                                                 | ⬜     |
| 14.6  | Persist preferences locally      | Global defaults plus per-file overrides                                                 | ⬜     |
| 14.7  | Guarantee local-only             | No customisation in any theatre message                                                 | ⬜     |

### 15. Subtitles

| #     | Task                             | Details                                                                                 | Status |
| ----- | -------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 15.1  | Load subtitles                   | For local and URL items (not YouTube)                                                   | ⬜     |
| 15.2  | Subtitle formats                 | SRT, VTT, ASS/SSA, embedded tracks                                                      | ⬜     |
| 15.3  | Per-video scope                  | Belong to an item, not the playlist                                                     | ⬜     |
| 15.4  | "Also share with viewers" toggle | Needs `subtitles.share`                                                                 | ⬜     |
| 15.5  | Viewer choice                    | Shared / own / embedded / off                                                           | ⬜     |
| 15.6  | Subtitle transfer                | Compressed, 1 MB max, stored for the screen's lifetime                                  | ⬜     |
| 15.7  | Subtitle timing offset           | Per-viewer ±ms (local)                                                                  | ⬜     |
| 15.8  | Subtitle styling                 | Font, size, colours, outline, background, position (local)                              | ⬜     |

### 16. Chat

| #     | Task                             | Details                                                                                 | Status |
| ----- | -------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 16.1  | Text chat                        | Over the screen's WebSocket; 500 chars per message                                      | ⬜     |
| 16.2  | Chat history                     | Last 100 messages, included in the join snapshot                                        | ⬜     |
| 16.3  | Emoji reactions                  | Optionally floating over the video                                                      | ⬜     |
| 16.4  | GIFs                             | Searched on the client; only allow-listed GIF URLs are sent                             | ⬜     |
| 16.5  | GIF provider choice              | e.g. GIPHY / KLIPY                                                                      | ⬜     |
| 16.6  | System messages                  | Joins, leaves, roles, handover, item changes                                            | ⬜     |
| 16.7  | Chat permissions & rate limit    | RBAC; 5 messages per 5 s                                                                | ⬜     |

### 17. Platform Builds & Release

| #     | Task                             | Details                                                                                 | Status |
| ----- | -------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 17.1  | Windows build                    | Installer and/or portable build                                                         | ⬜     |
| 17.2  | `servers.json` on Cloudflare Pages | Theatre list hosting                                                                  | ⬜     |
| 17.3  | Linux build                      | AppImage / deb                                                                          | ⏸     |
| 17.4  | Android build                    | APK                                                                                     | ⏸     |
| 17.5  | Web build & hosting              | Cloudflare Pages                                                                        | ⏸     |
| 17.6  | Cross-platform sync test         | Every platform in the same screen together                                              | ⏸     |
