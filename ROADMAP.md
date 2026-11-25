# Kino Enhanced roadmap

The master, common roadmap for every part of Kino Enhanced: the theatres (backend), the directory site, the protocol,
and the Windows, Web, Android and Linux clients. Kino only syncs playback (play, pause, seek and the timeline); every
viewer plays their own copy, and no video is ever streamed or uploaded.

- **Behaviour** is specified in the [wiki spec](https://github.com/Sriharan-S/kino-enhanced/wiki/docs) (cited as §n).
  The wire format is in [`protocol/README.md`](protocol/README.md).
- **Platform checklists:** [Windows roadmap](https://github.com/Sriharan-S/kino-enhanced-windows/blob/main/ROADMAP.md)
  (`WIN-` IDs) and [Web roadmap](https://github.com/Sriharan-S/kino-enhanced-web/blob/main/ROADMAP.md) (`WEB-` IDs).
  Android and Linux are on hold and have no repos yet; their columns live here.
- This file replaces the long checklist that used to be under `## TODO` in the README. Every old item (sections 0 to
  17) is in here; section 18 (the web client) moved to the Web roadmap. Appendix A maps every old number to its new ID.

## How to use this roadmap

### IDs

- Common tasks: `C-<phase>.<n>`; sub-tasks `C-<phase>.<n>.<m>`. Acceptance criteria are numbered inside each task and
  can be cited as `C-11.12 AC 3`.
- Platform tasks live in the platform repos: `WIN-…` and `WEB-…`. Each one names the common ID it implements, or is
  marked **platform-only**.
- IDs are stable. A task is never renumbered or reused. New tasks get the next free number in their phase. A task that
  is dropped keeps its row, with its title struck through and a note saying why.

### Columns

| Column | Meaning |
|---|---|
| **Th** | Theatre: the Cloudflare Worker in `theatre/`, plus the directory site in `directory/` and the protocol in `protocol/` (all in this repo) |
| **Win** | Windows client ([`kino-enhanced-windows`](https://github.com/Sriharan-S/kino-enhanced-windows)) |
| **Web** | Web client ([`kino-enhanced-web`](https://github.com/Sriharan-S/kino-enhanced-web)) |
| **And** | Android client (on hold, no repo yet) |
| **Lin** | Linux client (on hold, no repo yet) |
| **§** | The spec section (wiki docs). "R" followed by a number is an old README checklist number. |
| **Tests / notes** | What automated tests cover the task per platform, and why a status isn't ✅ |

### Status legend

| Mark | Meaning |
|---|---|
| ✅ | Done: meets the definition of done below |
| 🟨 | Partial: started, or done but missing part of the behaviour, its automated tests or its manual check (the notes say which) |
| ⬜ | Not started |
| ⏸ | On hold (Android and Linux clients; deferred items) |
| — | Does not apply to that column |

### Definition of done

A task is ✅ for a platform only when **all three** hold for that platform:

1. **Implemented.** Every acceptance criterion of the task is met, with the spec's numbers.
2. **Automated tests.** The logic is covered by automated tests that run in that repo's CI: unit tests, live tests
   against a real theatre, the theatre smoke test, or the browser end-to-end test. A criterion that is purely about
   presentation (a control is there, a label says the right thing) may be checked by hand until the platform has a UI
   test suite (C-21.5); the Tests column then says **UI: manual**.
3. **Verified by hand on a real device** of that platform (a real Windows PC, a real browser, a real phone).

Manual verification can't be read from code. For this first version of the roadmap it is taken from the old README
checklist: Windows items that were ✅ there shipped in Windows 0.1 and were tested for that release; Web items 18.1 to
18.7 were tested in real browsers (two browsers on Aurora). Anything added or changed after that needs a fresh manual
check before it becomes ✅.

Test abbreviations: **Th unit** (`theatre/test`), **Th smoke** (`theatre/scripts/smoke.mjs`), **Win unit** and
**Win live** (`tests/Kino.Core.Tests`; live needs `KINO_LIVE_THEATRE`), **Web unit** and **Web live** (`test/`; live
needs `KINO_THEATRE`), **Web e2e** (`scripts/e2e.mjs`, two headless browsers).

### How to update it

1. Change a status only with evidence: for ✅ or 🟨, you must have looked at the code and tests that implement it.
   Put the reason for any 🟨 in the notes.
2. When a platform status changes, change it **here and in that platform's roadmap in the same piece of work** (one
   commit per repo). For common tasks this file is the authority; the platform file adds where the code lives.
3. When the behaviour changes, change the spec first (wiki), then the acceptance criteria here, then the code.
4. Keep the README's `## Roadmap` milestone table in step with the phase summary below.
5. Update "Status at a glance" (below) by recounting the tables whenever statuses change.
6. Record each full audit in Appendix C with the date and the commit of every repo.

### Order of work

Phases are listed in the order the work happens; within a phase, tasks are roughly in dependency order. Windows was
built first and is released; the Web client is catching up (its plan is in the Web roadmap); Android and Linux follow
when they come off hold. Phase 21 brings every platform into one screen. Phase 23, the design rework, is gated on
everything before it.

## Phases

| Phase | Title | Main spec sections |
|---|---|---|
| [0](#phase-0-foundation-and-governance) | Foundation and governance | §1, §3.1 |
| [1](#phase-1-theatres-backend) | Theatres (backend) | §3.2, §4, §20 |
| [2](#phase-2-protocol-and-contract-tests) | Protocol and contract tests | §19 |
| [3](#phase-3-identity-and-connection) | Identity and connection | §5, §6.4 |
| [4](#phase-4-theatre-discovery-and-lobby) | Theatre discovery and lobby | §4.2–4.4, §10 |
| [5](#phase-5-screens-create-join-leave-settings-lifecycle) | Screens: create, join, leave, settings, lifecycle | §6 |
| [6](#phase-6-invites-and-private-screens) | Invites and private screens | §11 |
| [7](#phase-7-host-co-hosts-and-handover) | Host, co-hosts and handover | §7 |
| [8](#phase-8-roles-and-permissions) | Roles and permissions | §8 |
| [9](#phase-9-moderation) | Moderation | §9 |
| [10](#phase-10-viewers-panel-devices-latency-and-sync-status) | Viewers panel: devices, latency and sync status | §12 |
| [11](#phase-11-sync-engine) | Sync engine | §14 |
| [12](#phase-12-media-player) | Media player | §15.1–15.4 |
| [13](#phase-13-local-media-playlists-and-file-matching) | Local media, playlists and file matching | §13.1–13.5, §13.7 |
| [14](#phase-14-external-media-links-and-youtube) | External media: links and YouTube | §13.6, §14.13 |
| [15](#phase-15-codecs-and-formats) | Codecs and formats | §15.5 |
| [16](#phase-16-viewer-customisation-local-only) | Viewer customisation (local only) | §16 |
| [17](#phase-17-subtitles) | Subtitles | §17 |
| [18](#phase-18-chat-reactions-and-gifs) | Chat, reactions and GIFs | §18 |
| [19](#phase-19-notices-errors-and-resilience) | Notices, errors and resilience | §6.4, §19.2 |
| [20](#phase-20-builds-distribution-and-updates) | Builds, distribution and updates | §21 |
| [21](#phase-21-quality-and-the-cross-platform-test) | Quality and the cross-platform test | §21 |
| [22](#phase-22-later--to-be-planned) | Later / to be planned | §4.5, §19.2 |
| [23](#phase-23-layout-and-design-language-rework-gated) | Layout and Design Language rework (gated) | all |

## Status at a glance

Counts every row in the phase tables (sub-tasks included); "—" rows are left out. Recount when statuses change.

| Phase | Th | Win | Web | And | Lin |
|---|---|---|---|---|---|
| 0 | ✅ 9 · ⬜ 1 | ✅ 7 | ✅ 5 · 🟨 1 · ⬜ 1 | ⏸ 7 | ⏸ 7 |
| 1 | ✅ 11 · 🟨 1 · ⬜ 2 | — | — | — | — |
| 2 | ✅ 4 · ⬜ 1 | ✅ 2 · 🟨 1 | ✅ 2 · ⬜ 1 | ⏸ 3 | ⏸ 3 |
| 3 | ✅ 6 · ⬜ 1 | ✅ 6 · 🟨 3 | ✅ 7 · 🟨 2 | ⏸ 9 | ⏸ 9 |
| 4 | ✅ 4 · ⬜ 1 | ✅ 9 · 🟨 3 · ⬜ 1 | ✅ 7 · 🟨 5 · ⬜ 1 | ⏸ 13 | ⏸ 13 |
| 5 | ✅ 22 · 🟨 3 | ✅ 19 · 🟨 3 | ✅ 13 · 🟨 2 · ⬜ 7 | ⏸ 22 | ⏸ 22 |
| 6 | ✅ 7 · ⬜ 1 | ✅ 6 · 🟨 2 · ⬜ 1 | ✅ 5 · 🟨 3 · ⬜ 1 | ⏸ 9 | ⏸ 9 |
| 7 | ✅ 8 | ✅ 6 | 🟨 1 · ⬜ 5 | ⏸ 6 | ⏸ 6 |
| 8 | ✅ 12 | ✅ 11 · 🟨 2 | ✅ 3 · 🟨 1 · ⬜ 9 | ⏸ 13 | ⏸ 13 |
| 9 | ✅ 4 | ✅ 5 | ✅ 1 · ⬜ 4 | ⏸ 5 | ⏸ 5 |
| 10 | ✅ 6 | ✅ 10 · 🟨 1 | ✅ 8 · 🟨 2 · ⬜ 1 | ⏸ 11 | ⏸ 11 |
| 11 | ✅ 14 · ⬜ 1 | ✅ 25 · 🟨 1 · ⬜ 2 | ✅ 19 · 🟨 2 · ⬜ 7 | ⏸ 28 | ⏸ 28 |
| 12 | — | ✅ 4 · 🟨 4 · ⬜ 2 | ✅ 5 · 🟨 1 · ⬜ 5 | ⏸ 11 | ⏸ 10 |
| 13 | ✅ 7 | ✅ 19 · 🟨 2 · ⬜ 1 | ✅ 15 · 🟨 4 · ⬜ 3 | ⏸ 22 | ⏸ 22 |
| 14 | ✅ 4 · ⬜ 1 | ✅ 8 · ⬜ 1 | ✅ 2 · 🟨 1 · ⬜ 6 | ⏸ 9 | ⏸ 9 |
| 15 | — | ✅ 1 · 🟨 1 | 🟨 1 · ⬜ 3 | ⏸ 2 | ⏸ 2 |
| 16 | ✅ 1 | ✅ 7 | ✅ 2 · ⬜ 5 | ⏸ 7 | ⏸ 7 |
| 17 | ✅ 6 | ✅ 8 · 🟨 3 · ⬜ 1 | 🟨 2 · ⬜ 9 | ⏸ 12 | ⏸ 12 |
| 18 | ✅ 7 | ✅ 9 | 🟨 3 · ⬜ 6 | ⏸ 9 | ⏸ 9 |
| 19 | ✅ 1 | ✅ 2 · 🟨 5 | ✅ 7 | ⏸ 7 | ⏸ 7 |
| 20 | ✅ 3 | ✅ 4 · 🟨 2 | ✅ 2 · 🟨 1 · ⬜ 2 | ⏸ 6 | ⏸ 6 |
| 21 | ✅ 1 · ⬜ 13 | ✅ 1 · 🟨 1 · ⬜ 14 | ✅ 3 · 🟨 1 · ⬜ 13 | ⏸ 14 | ⏸ 14 |
| 22 | ⏸ 4 | ⏸ 3 | ⏸ 3 | ⏸ 3 | ⏸ 3 |
| 23 | ⬜ 23 | ⬜ 26 | ⬜ 28 | ⬜ 27 | ⬜ 26 |
| **All** | **✅ 137 · 🟨 4 · ⬜ 45 · ⏸ 4** | **✅ 169 · 🟨 34 · ⬜ 49 · ⏸ 3** | **✅ 106 · 🟨 33 · ⬜ 117 · ⏸ 3** | **⬜ 27 · ⏸ 228** | **⬜ 26 · ⏸ 227** |

---

## Phase 0. Foundation and governance

**Goal.** The repos, the specification, the tooling and the rules every later phase relies on.

| ID | Task | § | Th | Win | Web | And | Lin | Tests / notes |
|---|---|---|---|---|---|---|---|---|
| C-0.1 | Repositories set up | §3.1, R0.1, R0.6 | ✅ | ✅ | ✅ | ⏸ | ⏸ | No repo yet for Android or Linux |
| C-0.2 | READMEs | R0.2 | ✅ | ✅ | ✅ | ⏸ | ⏸ | |
| C-0.3 | Wiki specification | §1–§22, R0.3 | ✅ | — | — | — | — | Some sections are out of date: C-0.10 |
| C-0.4 | One repo per client; this repo holds theatre, protocol and docs | §3.1, R0.4 | ✅ | — | — | — | — | |
| C-0.5 | Native stack chosen per platform | §15.1, R0.5 | ✅ | — | — | — | — | Windows C#/WinUI 3 + libmpv; Web TS/React; Android Kotlin/Compose + libmpv; Linux C++/Qt 6 + libmpv |
| C-0.6 | Licence: GPL-3.0-or-later in every repo | — | ✅ | ✅ | ✅ | ⏸ | ⏸ | `LICENSE` in each repo; web `package.json` says `GPL-3.0-or-later` |
| C-0.7 | Lint, format and test tooling | R0.9 | ✅ | ✅ | 🟨 | ⏸ | ⏸ | Web: typecheck, Prettier and Vitest, but no linter (old 18.1 said "lint"): WEB-0.P1 |
| C-0.8 | CI on every push and pull request | R0.10 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th: unit, smoke, protocol JSON; Win: format, build, tests (x64 only); Web: typecheck, format, unit, live, e2e |
| C-0.9 | Roadmaps: this file and one per platform repo | — | ✅ | ✅ | ✅ | ⏸ | ⏸ | |
| C-0.10 | Spec kept in step with the code | — | ⬜ | — | — | — | — | Fix every item in Appendix B |
| C-0.11 | Changelog per released client | — | — | ✅ | ⬜ | ⏸ | ⏸ | Win: `CHANGELOG.md` feeds the release notes; Web has none |

#### C-0.1 Repositories set up
Each repo exists on GitHub under `Sriharan-S`, with `main` as the default branch, a `.gitignore` that keeps build output,
local tool state (`.claude/`, `.wrangler/`, `node_modules/`, `bin/`, `obj/`, `dist/`) and secrets out of git.

Acceptance criteria:
1. `kino-enhanced`, `kino-enhanced-windows` and `kino-enhanced-web` exist and build from a fresh clone with the steps in
   their README.
2. `git status` is clean after a full build and test run in each repo.
3. Android and Linux repos are created (`kino-enhanced-android`, `kino-enhanced-linux`) when those clients come off hold.

#### C-0.2 READMEs
Each repo's README says what it is, how to build, test and run it, where releases live, and links to the spec and to
its roadmap.

Acceptance criteria:
1. The main README has the download table, the terminology, the architecture summary, the milestone table and links to
   all three roadmaps.
2. Each platform README links to its `ROADMAP.md` and to the main repo.

#### C-0.3 Wiki specification
The wiki page `docs` is the full product and technical spec (§1 to §22). Values marked *(tunable)* are starting points.

Acceptance criteria:
1. Every feature in this roadmap cites the § that defines it.
2. Every number used in acceptance criteria here comes from the spec, the protocol or §22.

#### C-0.4 Repo layout
This repo holds `theatre/`, `directory/`, `protocol/` and the docs; each client has its own repo and its own releases.

Acceptance criteria: no client code lives in this repo; no theatre code lives in a client repo.

#### C-0.5 Native stack per platform
Windows: C# / .NET 10, WinUI 3, libmpv. Web: TypeScript, React, Vite, HTML5 video (MSE, WebAssembly and WebCodecs
later). Android: Kotlin, Jetpack Compose, libmpv (as in mpv-android). Linux: C++, Qt 6 (QML), libmpv.

Acceptance criteria: the stack is recorded in §15.1 and in each client's README.

#### C-0.6 Licence
Kino Enhanced is GPL-3.0-or-later.

Acceptance criteria:
1. Every repo has the full GPL v3 text in `LICENSE`.
2. Package metadata (npm `license`, .NET `PackageLicenseExpression` if packaged, Android and Linux package metadata)
   says `GPL-3.0-or-later`.
3. Third-party components (libmpv, FFmpeg builds, Inno Setup, icon fonts) are compatible and credited in About
   (C-20.8).

#### C-0.7 Lint, format and test tooling
Acceptance criteria:
1. Theatre: `npm run check` runs `tsc`, Prettier and Vitest.
2. Windows: `.editorconfig` and `dotnet format whitespace --verify-no-changes`; xUnit tests.
3. Web: `npm run check` runs `tsc`, Prettier, Vitest **and a linter** (ESLint with the React hooks rules).
4. Each tool runs in CI (C-0.8) and fails the build on a violation.

#### C-0.8 CI
Acceptance criteria:
1. Theatre CI runs typecheck, format check, unit tests, the smoke test against `wrangler dev`, and checks that every
   file in `protocol/examples` is valid JSON.
2. Windows CI builds, checks formatting and runs the tests on every push and pull request; the release workflow builds
   all three architectures.
3. Web CI runs typecheck, format, unit tests, a production build, the live tests and the browser test against a local
   theatre.

#### C-0.9 Roadmaps
This file plus `ROADMAP.md` in each platform repo, following the rules in "How to use this roadmap".

Acceptance criteria:
1. Every old README checklist item (sections 0 to 18) appears in Appendix A with its new ID.
2. Every platform roadmap item names its common ID or is marked platform-only.

#### C-0.10 Spec kept in step with the code
The audit for this roadmap found places where the wiki spec, the protocol README and the code disagree (Appendix B).

Acceptance criteria:
1. Each item in Appendix B is resolved: either the spec is corrected, or a task here is opened to change the code.
2. Appendix B records the resolution for each item.

#### C-0.11 Changelog per released client
Acceptance criteria:
1. Each client repo that publishes releases has a `CHANGELOG.md` with a section per version.
2. The release notes are built from it (as the Windows release workflow already does).
3. Web: one entry per production deployment that changes behaviour.

---

## Phase 1. Theatres (backend)

**Goal.** The Cloudflare Worker that hosts screens, on the free plan, deployed as several independent theatres.

| ID | Task | § | Th | Win | Web | And | Lin | Tests / notes |
|---|---|---|---|---|---|---|---|---|
| C-1.1 | Worker project scaffold | §3.2, R1.1 | ✅ | — | — | — | — | Th unit, Th smoke |
| C-1.2 | Multi-account deployment | §4.1, R1.2 | ✅ | — | — | — | — | Aurora and Nova live; `scripts/deploy.mjs`, `accounts/*.env` |
| C-1.3 | Unique theatre naming | §4.1, R1.3 | ✅ | — | — | — | — | |
| C-1.4 | `GET /info` | §4.3, R1.5 | 🟨 | — | — | — | — | Th smoke. `status` is always `"ok"`; `degraded` and `quota_exhausted` are never sent (Appendix B 1) |
| C-1.5 | WebSocket layer with the Hibernation API | §3.2, R1.6 | ✅ | — | — | — | — | Th smoke |
| C-1.6 | Screen state in Durable Object storage | §3.2, R1.7 | ✅ | — | — | — | — | `normalise()` upgrades state written by older deploys |
| C-1.7 | Lobby Durable Object | §3.2, R1.8 | ✅ | — | — | — | — | Th smoke |
| C-1.8 | Free-tier budget design | §20, R1.9 | ✅ | — | — | — | — | |
| C-1.9 | Free-tier budget measured | §20 | ⬜ | — | — | — | — | The 30–100 screen-hours estimate has never been measured |
| C-1.10 | Quota behaviour | §4.4, R1.10 | ✅ | — | — | — | — | A theatre over quota fails its requests; clients' side is C-4.4 |
| C-1.11 | Abuse protection | R1.11 | ✅ | — | — | — | — | Th unit `ratelimit.test.ts`, Th smoke (flood, wrong passwords) |
| C-1.12 | Deploy tooling and `deployedAt` | — | ✅ | — | — | — | — | `npm run deploy`; `/info.deployedAt` |
| C-1.13 | Directory site (`servers.json`, join, download, YouTube page) | §4.2, R17.2 | ✅ | — | — | — | — | UI: manual. Static-assets Worker `kino-directory` |
| C-1.14 | Operations: monitoring and runbook | §20 | ⬜ | — | — | — | — | |

#### C-1.1 Worker project scaffold
A TypeScript Worker in `theatre/` with routes `/info`, `/lobby`, `POST /screens`, `/resolve/<code>`,
`/screens/<code>/ws` and `/screens/<code>/subs[/<id>]`, a Lobby DO and a Screen DO.

Acceptance criteria:
1. `npx wrangler dev` runs it locally on port 8787.
2. Unknown routes return `404 { error: { code: "not_found" } }`; every JSON response has CORS `*`; `OPTIONS` returns 204.
3. Unexpected exceptions return `500 { error: { code: "internal" } }` and are logged.

#### C-1.2 Multi-account deployment
The same code deployed to several free Cloudflare accounts, one theatre per account.

Acceptance criteria:
1. Aurora (`kino-aurora.srie.workers.dev`) and Nova (`kino-nova.sri-me.workers.dev`) are live on separate accounts.
2. Adding a theatre needs only an `accounts/<id>.env` file, a deploy, and an entry in `servers.json` (C-1.13).

#### C-1.3 Unique theatre naming
Each theatre has an `id` slug and a display `name` from its deployment's environment (`THEATRE_ID`, `THEATRE_NAME`),
named after the sky (Aurora, Nova; later Orion, Lyra, Vega, Polaris).

Acceptance criteria: `id` and `name` are unique across `servers.json`; `/info` and `/lobby` report them.

#### C-1.4 `GET /info`
Health, identity, version and latency probe.

Acceptance criteria:
1. Returns `{ id, name, protocol, minProtocol, status, time, deployedAt }`.
2. `status` is `ok`, `degraded` or `quota_exhausted` (§4.3). **Open:** the Worker can't see its own daily quota, so
   `quota_exhausted` may be impossible to report; decide whether `degraded` is reported (for example when a Durable
   Object call fails) or remove both values from the spec (Appendix B 1).
3. Answers within one request, without touching a Durable Object, so it is cheap enough to use as a ping.

#### C-1.5 WebSocket layer with Hibernation
One WebSocket per viewer per screen to that screen's Durable Object, accepted with `ctx.acceptWebSocket`, so idle
screens sleep without dropping connections.

Acceptance criteria:
1. Per-connection data (viewer key, name, device, RTT, status, chat timestamps) is kept with
   `serializeAttachment`, so it survives hibernation.
2. The first message must be `hello`; anything else first gets `bad_request` and a close with code 4001.
3. A Screen DO handles one message at a time (no races on screen state).

#### C-1.6 Screen state storage
Acceptance criteria:
1. Screen state is saved under `state` and chat under its own key `chat`, so a chat message doesn't rewrite the whole
   state.
2. A screen survives a Durable Object eviction or a deploy: fields added later are filled in by `normalise()`.
3. Closing a screen deletes all its storage and its alarm (§6.5).

#### C-1.7 Lobby Durable Object
One per theatre, SQLite-backed, mapping codes to screens and holding the listing.

Acceptance criteria:
1. `GET /lobby` lists at most 200 screens, ordered by viewers then most recently updated, and never lists a private
   hidden screen.
2. `GET /resolve/<code>` finds hidden screens too.
3. Screen DOs push viewer count, host name and settings changes to it.

#### C-1.8 Free-tier budget design
Acceptance criteria (§20): anchors only on events; clock re-sync every 2 minutes; buffering and latency reports only on
change or re-sync; GIF search never touches the theatre; WebSocket hibernation used.

#### C-1.9 Free-tier budget measured
Measure what one theatre can carry on the free plan.

Acceptance criteria:
1. A scripted session (10 viewers, 2 hours, typical chat) is run against a deployed theatre, and the Durable Object
   duration, requests and storage used are read from the Cloudflare dashboard.
2. The result (screen-hours per day per theatre) replaces the estimate in §20, with the date and the free-plan limits
   it was measured against.

#### C-1.10 Quota behaviour
Acceptance criteria:
1. When a theatre runs out of free quota its requests fail, and clients treat it as unavailable (C-4.4).
2. New screens go to the fastest usable theatre (C-4.5).

#### C-1.11 Abuse protection
Acceptance criteria:
1. Each connection may send bursts of 40 messages, refilling at 8 per second; excess messages get `rate_limited` and are
   dropped; after 25 strikes the connection is closed.
2. `POST /screens` allows 30 screens per address per 10 minutes (`429 rate_limited`); only a salted hash of the address
   is kept.
3. Messages over 16 KiB, invalid JSON, unknown types and invalid fields get `bad_request` (C-2.4).

#### C-1.12 Deploy tooling
Acceptance criteria: one command deploys a theatre to its account and sets `DEPLOYED_AT`; `/info.deployedAt` shows it.

#### C-1.13 Directory site
A static-assets Worker `kino-directory` serving `servers.json`, `join.html`, `download.html` and `yt.html`.

Acceptance criteria:
1. `servers.json` is `{ version: 1, theatres: [{ id, name, url }] }` with CORS `*` and a 5-minute cache.
2. `/join#<theatre>/<code>` offers the desktop app (tried first on desktops) and the web app (C-6.4).
3. `/download` picks the right Windows file for the visitor's architecture (C-20.6).
4. `/yt` hosts the YouTube IFrame player for the Windows client (C-14.5).

#### C-1.14 Operations: monitoring and runbook
Acceptance criteria:
1. A short runbook in `theatre/README.md`: how to see each theatre's usage, what to do when one is over quota, how to
   add or retire a theatre, how to roll back a deploy.
2. Worker errors (`console.error`) are visible in the Cloudflare dashboard for each theatre and checked after each deploy.

---

## Phase 2. Protocol and contract tests

**Goal.** One versioned contract that every client and the theatre follow, with tests that prove it.

| ID | Task | § | Th | Win | Web | And | Lin | Tests / notes |
|---|---|---|---|---|---|---|---|---|
| C-2.1 | Versioned protocol spec with canonical examples | §19, R0.7 | ✅ | — | — | — | — | `protocol/README.md`, `protocol/examples/` (small drift: Appendix B 9) |
| C-2.2 | Compatibility policy | §19.2, R0.8 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th smoke (`update_required`); Win unit (old theatre, unknown types); Web unit (unknown types ignored) |
| C-2.3 | Contract tests against `protocol/examples` | §19 | ⬜ | 🟨 | ⬜ | ⏸ | ⏸ | Th: CI only checks the files are valid JSON. Win: parses the server examples, but passes silently if the protocol folder is missing. Web: none |
| C-2.4 | Theatre validates every message | §8.5, R1.11 | ✅ | — | — | — | — | Th smoke (forbidden, bad requests) |
| C-2.5 | Error envelope and fatal closes | §19.2 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Close 4001 carries the error code as the reason; 4000 = replaced |

#### C-2.1 Versioned protocol spec
Acceptance criteria:
1. Every message type and HTTP route has a row in `protocol/README.md` with its data, who may send it and notes.
2. Every message has a canonical example in `protocol/examples/client` or `protocol/examples/server`.
3. The shared types (`Anchor`, `Item`, `ViewerInfo`, `ReadyCheck`, `ScreenInfo`, `NewItem`, `SubMeta`, `ChatMessage`,
   `Role`, `Permission`) match `theatre/src/protocol.ts` exactly.

#### C-2.2 Compatibility policy
Acceptance criteria:
1. The client sends `hello.protocol`; a theatre whose `minProtocol` is higher replies `update_required` and closes.
2. A theatre whose `/info` range doesn't include the client's version is treated as unusable (C-4.3).
3. Clients ignore unknown fields and unknown message types; additive changes don't bump the version.

#### C-2.3 Contract tests
Acceptance criteria:
1. Theatre: a unit test feeds every file in `protocol/examples/client` to `parseClientMessage` and expects success.
2. Each client: a unit test parses every file in `protocol/examples/server` with its own parser and checks the
   important fields; and serialises each client message type and compares it with `protocol/examples/client`.
3. If the examples folder can't be found, the test **fails** (or is reported as skipped), never passes silently.
4. CI in each client repo checks out the main repo to get the examples.

#### C-2.4 Theatre validates every message
Acceptance criteria:
1. Every field is type-checked and range-checked as in `protocol.ts` (names 1–32, screen names 1–64, item names up to
   260, URLs up to 2048, passwords up to 128, role names up to 32, colours `#rrggbb`, ids by pattern).
2. Every permission-gated message is checked by the Screen DO before it changes state (§8.5).

#### C-2.5 Error envelope and fatal closes
Acceptance criteria:
1. Errors are `{ type: "error", data: { code, message } }` with a code from protocol §4.4.
2. Fatal errors (`update_required`, `banned`, `kicked`, `closed`, `full`, `wrong_password`, and `rate_limited` on
   `hello`) are followed by close code 4001 with the error code as the reason.
3. A connection replaced by a newer one from the same viewer is closed with 4000.
4. Clients stop reconnecting on 4000 and 4001 and show the reason (C-19.2).

---

## Phase 3. Identity and connection

**Goal.** No accounts: a display name and a device secret, with reconnects that keep everything.

| ID | Task | § | Th | Win | Web | And | Lin | Tests / notes |
|---|---|---|---|---|---|---|---|---|
| C-3.1 | Display name, 1–32 characters, saved locally | §5, R3.1 | ✅ | 🟨 | ✅ | ⏸ | ⏸ | Win: not saved (resets each launch to the Windows user name); an empty box becomes "Viewer" |
| C-3.2 | Change the display name at any time | §5 | ⬜ | 🟨 | 🟨 | ⏸ | ⏸ | No rename message in the protocol; both clients apply a new name only on the next join |
| C-3.3 | Device secret | §5, R3.2 | — | ✅ | ✅ | ⏸ | ⏸ | Win: `device.key` per profile; Web: `localStorage` |
| C-3.4 | Per-screen token | §5, R3.3 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Win unit (matches the theatre's HMAC); Web live (joins) |
| C-3.5 | Reconnect restores everything | §5, R3.4 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th smoke; Win live; Web live (member rejoins without password) |
| C-3.6 | Host ownership by owner token (one-time claim) | §5, §19.1, R3.5 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th smoke |
| C-3.7 | Automatic reconnect after a network drop | §6.4, R2.6 | ✅ | 🟨 | 🟨 | ⏸ | ⏸ | Both: 3 clock samples after a reconnect instead of the 8-sample burst (§14.3). Win: gives up onto the video page, not the lobby (C-19.3). Web: no automated test of the reconnect loop |
| C-3.8 | One live session per viewer | §6.4 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th: older socket closed with 4000 |
| C-3.9 | Profiles: separate identities on one device | §21.1 | — | ✅ | ✅ | ⏸ | ⏸ | Win `--profile`; Web `?profile=` |

#### C-3.1 Display name
Acceptance criteria:
1. Free text, trimmed, 1–32 characters after the theatre collapses whitespace and strips control characters; not unique.
2. The client asks for a name before the first create or join if it has none, and saves it locally (per profile).
3. A name that is empty after trimming can't be used.

#### C-3.2 Change the display name at any time
§5 says the name "can be changed at any time". Today a name only travels in `hello`.

Acceptance criteria:
1. Protocol (additive): a `rename { name }` message, validated like `hello.name`, updates the member and the viewer list
   and posts a system message "{old} is now {new}".
2. Every client offers rename in a screen and in the lobby; in a screen it sends `rename` without reconnecting.
3. Until then, the spec says names can be changed between screens only (C-0.10).

#### C-3.3 Device secret
Acceptance criteria:
1. 32 random bytes from a cryptographic random source, created on first use, stored locally per profile, never sent.
2. If the stored value is missing or malformed, a new one is created (and the viewer loses host status in old screens,
   as §5 "Lost device" says).

#### C-3.4 Per-screen token
Acceptance criteria:
1. `token = lowercase hex(HMAC-SHA256(key = deviceSecret, message = UTF-8(screenId)))`.
2. The same device gives the same token for a screen and different tokens for different screens.
3. The theatre stores only `SHA-256(token)`; the public viewer id is its first 12 hex characters.

#### C-3.5 Reconnect restores everything
Acceptance criteria: reconnecting with the same token (within the grace period or later, while the screen exists)
restores host status, co-host rank, roles, per-viewer overrides and chat mute, and needs no password; a banned token is
still refused.

#### C-3.6 Host ownership
Acceptance criteria:
1. `POST /screens` returns a one-time `claim`; the first `hello` that presents it makes that token the owner token.
2. The claim can't be used twice; the host is whoever holds the owner token, whatever their name.

#### C-3.7 Automatic reconnect
Acceptance criteria:
1. On a dropped connection (not 4000 or 4001), the client keeps playing on the last anchor and retries after 300 ms,
   1 s, 2 s, 3 s, then every 5 s, for 60 s in total (the theatre's grace period).
2. On success it runs the full 8-sample clock burst (§14.3, §14.11) and applies the new welcome.
3. On a fatal error, or when the screen no longer resolves, it stops and returns to the lobby with the reason.
4. After 60 s without success it returns to the lobby with "Couldn't reconnect".
5. A "Reconnecting…" indicator is visible the whole time, in fullscreen too (C-19.3).
6. An automated test drops the connection and checks the reconnect and the restored state.

#### C-3.8 One live session per viewer
Acceptance criteria: a new connection with the same token replaces the old one (closed with 4000, "replaced by a newer
connection"), keeps the seat and isn't announced as a new join; the replaced client says "You joined this screen from
another tab or device" and doesn't reconnect.

#### C-3.9 Profiles
Acceptance criteria: a profile name gives a separate device secret and local settings, so two instances on one device
can join the same screen as different viewers (for testing).

---

## Phase 4. Theatre discovery and lobby

**Goal.** Find theatres, see their health, and show every screen from every theatre in one list.

| ID | Task | § | Th | Win | Web | And | Lin | Tests / notes |
|---|---|---|---|---|---|---|---|---|
| C-4.1 | Theatre list: live, then cached, then bundled | §4.2, R1.4 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Win unit (5 tests); Web unit (directory parsing) |
| C-4.2 | Parallel `/info` probes and theatre latency | §10.4, R7.4 | — | ✅ | 🟨 | ⏸ | ⏸ | Win unit. Web: no automated test of probing or of choosing the fastest |
| C-4.3 | Incompatible theatres are unusable, and say why | §19.2 | — | 🟨 | 🟨 | ⏸ | ⏸ | Both treat them as unusable, but show no "needs a newer Kino" hint |
| C-4.4 | Unavailable theatres greyed out and not usable for create | §4.4, R1.10 | — | 🟨 | 🟨 | ⏸ | ⏸ | Both still let you pick an unavailable theatre in Create; Win's lobby badge ignores `/info` health |
| C-4.5 | Create suggests the fastest usable theatre | §4.4 | — | ✅ | ✅ | ⏸ | ⏸ | Win unit; Web: UI manual |
| C-4.6 | Unified lobby across theatres | §10.1, R7.1, R7.2 | — | ✅ | ✅ | ⏸ | ⏸ | Win unit; Web unit (`mergeLobbies`) |
| C-4.7 | Listing fields | §10.2, R7.3, R7.4 | ✅ | ✅ | ✅ | ⏸ | ⏸ | UI: manual |
| C-4.8 | "Now playing" in the listing (host setting) | §10.2 | ⬜ | ⬜ | ⬜ | ⏸ | ⏸ | Not in the protocol yet |
| C-4.9 | Visibility matrix | §10.3, R7.5–R7.7 | ✅ | — | — | — | — | Th smoke (hidden screens not listed) |
| C-4.10 | Refresh and ping cadence | §10.4, R7.8 | — | 🟨 | 🟨 | ⏸ | ⏸ | Win: no ping when the lobby opens. Web: manual refresh doesn't re-ping |
| C-4.11 | Partial results with a 3 s per-theatre timeout | §10.4, R7.9 | — | ✅ | 🟨 | ⏸ | ⏸ | Win unit. Web uses 5 s for `/info` and `/lobby` |
| C-4.12 | Sort, filter and search | §10.4, R7.10 | — | ✅ | ✅ | ⏸ | ⏸ | Win unit (4 tests); Web unit |
| C-4.13 | Loading and empty states | §10 | — | ✅ | ✅ | ⏸ | ⏸ | UI: manual |
| C-4.14 | Full screens shown as full and not joinable | §6.4 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Win, Web unit (full screens sort last) |

#### C-4.1 Theatre list
Acceptance criteria:
1. The client fetches `https://kino-directory.srie.workers.dev/servers.json` at start-up.
2. A file is accepted only if `version` is 1; entries with a missing field, a duplicate `id` or a non-HTTPS URL
   (loopback HTTP excepted, for development) are skipped; a file with no valid entry is rejected.
3. A good live file is cached locally; if the fetch fails or is rejected, the cached copy is used; if there is none, the
   list bundled in the app (Aurora, Nova) is used. A bad live file never overwrites a good cache.
4. A development override (Windows `--theatre`, Web `?theatre=`) replaces the list with one theatre.

#### C-4.2 Parallel probes and theatre latency
Acceptance criteria:
1. `/info` is requested on every theatre at once; the first request warms the connection and the second is timed as
   the ping.
2. Each probe gives up after 3 s (§10.4), and one slow theatre never delays the others.
3. The fastest usable theatre is the one with the lowest ping among those whose `/info` succeeded with `status: ok` and
   a compatible protocol range.

#### C-4.3 Incompatible theatres
Acceptance criteria: a theatre whose `minProtocol` is above the client's version (or whose `protocol` is below it) is
unusable, and the lobby and create dialog say "needs a newer version of Kino" (with a link to update) rather than just
"unavailable".

#### C-4.4 Unavailable theatres
Acceptance criteria:
1. A theatre whose probe fails, times out or isn't `ok` is shown as unavailable in the lobby's theatre strip (badge and
   tooltip with the reason).
2. It is shown but greyed out and can't be selected in the create dialog (§4.4).
3. If no theatre is usable, Create is disabled with "No theatre is available right now; try again in a moment".

#### C-4.5 Create suggests the fastest
Acceptance criteria: the create dialog preselects "Fastest (name, ping)", resolved when Create is pressed, and the host
can choose any other usable theatre.

#### C-4.6 Unified lobby
Acceptance criteria: `GET /lobby` is fetched from every theatre in parallel and the results are merged into one list,
with no theatre dropdown needed to see them (§10.1); a theatre that fails is left out of the list and marked in the
theatre strip.

#### C-4.7 Listing fields
Acceptance criteria (§10.2): each row shows the screen name, the theatre (as a badge), a lock for private screens,
viewers/max, the host's display name, and the theatre's latency.

#### C-4.8 Now playing in the listing
Acceptance criteria:
1. Protocol (additive): a screen setting `showNowPlaying` (default off) and a listing field `playing` (item name or
   null), sent in `/lobby` only when the setting is on.
2. The Screen DO updates the lobby when the current item changes.
3. Clients show it in the lobby row and offer the setting in screen settings (C-5.11).

#### C-4.9 Visibility matrix
Acceptance criteria (§10.3): public screens are always listed; private screens are listed and need the password;
private hidden screens are never listed and are reached by code or link plus password; "Hide from lobby" only applies
to private screens.

#### C-4.10 Refresh and ping cadence
Acceptance criteria:
1. A manual refresh button re-probes `/info` (ping) and re-fetches `/lobby`.
2. Opening the lobby probes `/info` and fetches `/lobby`.
3. While the lobby is visible, it re-fetches only `/lobby` every 15 s (one request per theatre), and stops while it is
   hidden or the app is minimised or in a background tab.

#### C-4.11 Partial results
Acceptance criteria: each theatre's `/lobby` request times out after 3 s; results from the others show at once; a
failed theatre gets an "unavailable" badge with the reason.

#### C-4.12 Sort, filter and search
Acceptance criteria:
1. Sort by most viewers (full screens last), lowest ping, or name; ties by name, then by theatre and code.
2. Filter by visibility (all, public, private) and by theatre.
3. Search matches screen name or host name (case-insensitive substring) or an exact screen code.

#### C-4.13 Loading and empty states
Acceptance criteria: "Looking for screens…" while the first fetch runs; "No public screens right now. Create one!" when
there are none; "No screens match" when filters hide everything.

#### C-4.14 Full screens
Acceptance criteria: a screen with viewers ≥ max is marked "Full" and can't be joined from the lobby; the theatre still
enforces capacity (`full`) for joins by code; the owner is never refused for capacity.

---

## Phase 5. Screens: create, join, leave, settings, lifecycle

**Goal.** Rooms: creating them, getting in and out, changing their settings, and closing them.

| ID | Task | § | Th | Win | Web | And | Lin | Tests / notes |
|---|---|---|---|---|---|---|---|---|
| C-5.1 | Terminology in the UI | §2, R2.1 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Theatre, Screen, Host, Co-host, Viewer |
| C-5.2 | Create a screen | §6.1, R2.2, R2.9 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th smoke; Win live; Web e2e |
| C-5.2.1 | Name required, 1–64 | §6.1 | ✅ | ✅ | ✅ | ⏸ | ⏸ | |
| C-5.2.2 | Public or private, password required for private | §6.1 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th smoke; Win live; Web live |
| C-5.2.3 | "Hide from lobby" shown only when private | §6.1, R7.7 | ✅ | ✅ | ✅ | ⏸ | ⏸ | UI: manual |
| C-5.2.4 | Max viewers 2–25, default 10 | §6.1, R2.9 | ✅ | ✅ | ✅ | ⏸ | ⏸ | |
| C-5.3 | Internal screen ID never shown | §6.2, R2.3 | ✅ | ✅ | ✅ | ⏸ | ⏸ | |
| C-5.4 | Names don't have to be unique | §6.2, R2.4 | ✅ | — | — | — | — | |
| C-5.5 | Join from the lobby | §6.4, R2.5 | — | ✅ | ✅ | ⏸ | ⏸ | UI: manual |
| C-5.6 | Join checks and their order | §6.4 | 🟨 | — | — | — | — | The theatre checks the password before capacity; §6.4 says capacity first (Appendix B 4) |
| C-5.7 | Snapshot on join | §6.4 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th smoke; Win unit (welcome round-trip); Web live |
| C-5.8 | Leave frees the seat at once | §6.4, R2.6 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th smoke; Win live; Web e2e |
| C-5.9 | 60 s reconnect grace, shown to others | §6.4, R2.6 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th smoke (optional 65 s step); clients UI: manual |
| C-5.10 | Capacity, with seats held for reconnecting viewers | §6.4, R2.9 | 🟨 | — | — | — | — | Implemented; no automated test of `full` or of held seats |
| C-5.11 | Screen settings | §6.3, R2.10 | ✅ | 🟨 | 🟨 | ⏸ | ⏸ | Th smoke. Sub-tasks below |
| C-5.11.1 | Rename the screen | §6.3 | ✅ | 🟨 | ⬜ | ⏸ | ⏸ | Win: "needs a name" error is shown in a hidden overlay |
| C-5.11.2 | Visibility and password | §6.3 | ✅ | 🟨 | ⬜ | ⏸ | ⏸ | Win: "Set a password" error is shown in a hidden overlay |
| C-5.11.3 | Hide from lobby | §6.3 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | |
| C-5.11.4 | Max viewers | §6.3 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | |
| C-5.11.5 | Show devices | §6.3, R9.3 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | |
| C-5.11.6 | Auto-advance | §6.3 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th smoke |
| C-5.11.7 | Buffering policy | §6.3, §14.10 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | Th smoke |
| C-5.12 | Lifecycle timers | §6.5, R2.11, R4.5 | 🟨 | — | — | — | — | Implemented; the 5 and 15 minute closes have no automated test |
| C-5.13 | Close the screen | §6.5, R2.11 | ✅ | ✅ | 🟨 | ⏸ | ⏸ | Th smoke |
| C-5.13.1 | Host closes, with confirmation | §6.5 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | |
| C-5.13.2 | Everyone else returns to the lobby with the reason | §6.5 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Web live |

#### C-5.1 Terminology
Acceptance criteria: the UI says Theatre, Screen, Host, Co-host, Acting host and Viewer as defined in §2, never
"server", "room" or "owner".

#### C-5.2 Create a screen
`POST /screens { name, visibility, password?, hidden?, maxViewers? }`, then join with the returned claim.

- **C-5.2.1** The name is required, 1–64 characters after trimming; Create is disabled until it is filled in.
- **C-5.2.2** Public or Private; Private needs a password of 1–128 characters; Create is disabled until it is entered.
- **C-5.2.3** "Hide from lobby" appears only when Private is selected; public screens are always listed.
- **C-5.2.4** Max viewers is a number from 2 to 25 with 10 preselected; the theatre clamps anything outside.

Acceptance criteria:
1. A created screen is joined as host at once (`welcome.self.isHost = true`).
2. `429 rate_limited` from `POST /screens` is shown as "Too many screens created from here recently; try again in a few
   minutes".

#### C-5.3 Screen ID never shown
Acceptance criteria: the Durable Object id (`screenId`) is used only to derive the token and is never displayed, logged
to the UI or put in a link; codes and names are shown instead.

#### C-5.4 Non-unique names
Acceptance criteria: two screens, or two viewers, may have the same name; nothing is keyed by name.

#### C-5.5 Join from the lobby
Acceptance criteria: activating a row resolves its code (to get the `screenId`), asks for the password if it is
private and this device isn't already a member, and joins; if it no longer resolves, the lobby says it has closed and
refreshes.

#### C-5.6 Join checks and their order
Acceptance criteria:
1. On `hello`, in order: protocol version (`update_required`), ban list (`banned`), capacity (`full`), password for
   private screens (`wrong_password`; `rate_limited` after too many), then `welcome`.
2. The owner and existing members skip the password; the owner is never refused for capacity.
3. Whichever order is chosen (Appendix B 4), the spec and the code agree.

#### C-5.7 Snapshot on join
Acceptance criteria: `welcome` carries `self, screen, viewers, roles, coHosts, playlist, chat, subs, ready, hold, item,
anchor, serverTime`, and the client applies all of it before catching up (C-11.16).

#### C-5.8 Leave
Acceptance criteria: an explicit leave (button, closing the window or tab) sends `leave` before closing; the theatre
removes the viewer at once with no grace, posts "{name} left" and updates the lobby count.

#### C-5.9 Reconnect grace
Acceptance criteria: a viewer whose connection drops without `leave` stays listed with `connected: false` for 60 s and
keeps their seat; others see them dimmed as "reconnecting…"; after 60 s they are removed and "{name} left" is posted.

#### C-5.10 Capacity
Acceptance criteria: joins are refused with `full` when connected viewers plus seats held for reconnecting viewers
reach `maxViewers`; the owner always gets in; an automated test covers a full screen and a held seat.

#### C-5.11 Screen settings
Needs `screen.settings`; sent as `settings.update` with only the changed fields; the theatre broadcasts `screen`.

- **C-5.11.1 Rename:** 1–64 characters; the lobby listing updates.
- **C-5.11.2 Visibility and password:** going private needs a password (new, or the existing one if it already had
  one); going public clears the password and hidden; viewers already in keep their place.
- **C-5.11.3 Hide from lobby:** only when private.
- **C-5.11.4 Max viewers:** 2–25; lowering it never removes anyone already in.
- **C-5.11.5 Show devices:** on by default; when off, the theatre sends `device: null` for everyone (C-10.4).
- **C-5.11.6 Auto-advance:** on by default (§14.12).
- **C-5.11.7 Buffering policy:** "Keep playing" (default) or "Wait for everyone" (§14.10); switching to Keep playing
  while held releases the hold.

Acceptance criteria:
1. Viewers without `screen.settings` see the settings read-only with "Only the host or someone with permission can
   change these".
2. Every validation error is shown next to the field or in a visible message on the settings page.
3. Every client shows the new values when `screen` arrives, without reopening the page.

#### C-5.12 Lifecycle timers
Acceptance criteria (§6.5):
1. No viewer connected for 5 minutes: the screen closes.
2. The host and every co-host absent for 15 minutes: the screen closes with "the host has left, so the screen closed".
3. On close, everyone connected gets `closed`, the listing is removed, the code is freed and all storage and the alarm
   are deleted.
4. One Durable Object alarm serves every deadline (empty, absent, grace, item end, ready check).
5. An automated test drives each timer (with shortened timers or a fake clock).

#### C-5.13 Close the screen
- **C-5.13.1** Only the host (not the acting host) can close; the client asks "Close the screen for everyone?" first.
- **C-5.13.2** Everyone else gets `closed` and returns to the lobby with "The host closed the screen".

Acceptance criteria: after closing, the code no longer resolves and the screen is gone from the lobby.

---

## Phase 6. Invites and private screens

**Goal.** Get people into a screen by code or link, and keep private screens private.

| ID | Task | § | Th | Win | Web | And | Lin | Tests / notes |
|---|---|---|---|---|---|---|---|---|
| C-6.1 | Screen code: 6 characters, Crockford base32, unique per theatre | §6.2, R8.1 | ✅ | — | — | — | — | Th unit |
| C-6.2 | Code entry: normalised, and accepts a pasted link | §11 | ✅ | 🟨 | 🟨 | ⏸ | ⏸ | Win: typed codes aren't normalised by the client; neither client parses a link pasted into the code box |
| C-6.3 | Invite link formats | §11, §21.1, R8.2 | — | ✅ | ✅ | ⏸ | ⏸ | Win unit; Web unit |
| C-6.4 | Directory join page | §11, §21.1 | ✅ | — | — | — | — | UI: manual |
| C-6.5 | Join by code across every theatre | §10.4, R8.3 | — | ✅ | ✅ | ⏸ | ⏸ | Win unit; Web live (resolve), UI: manual |
| C-6.6 | Private join: password prompt in place | §11, R8.4 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th smoke; Win live; Web live |
| C-6.7 | Password security and attempt limits | §11, R8.5 | ✅ | — | — | — | — | Th smoke (6th wrong password limited) |
| C-6.8 | Members rejoin without the password | §6.4 | ✅ | 🟨 | ✅ | ⏸ | ⏸ | Web live. Win: reconnects skip it; not checked whether a later join from the lobby still asks |
| C-6.9 | Invite panel: code and links with copy | §11 | — | ✅ | 🟨 | ⏸ | ⏸ | Web: no "copy code" button |
| C-6.10 | Regenerate the code | §11, R8.6 | ✅ | ✅ | 🟨 | ⏸ | ⏸ | Th smoke. Web: no confirmation before old links stop working |
| C-6.11 | `screen.invite` controls who sees the code | §8.1 | ⬜ | ⬜ | ⬜ | ⏸ | ⏸ | Spec and code disagree (Appendix B 8); decide first |
| C-6.12 | Opening invite links on each platform | §11 | — | ✅ | ✅ | ⏸ | ⏸ | Win: `kino://` handler + single instance; Web: `#theatre/code` in the address |

#### C-6.1 Screen code
Acceptance criteria: 6 characters from `0-9 A-Z` without `I L O U`, drawn without modulo bias; unique within its
theatre (retried on collision, up to 8 times); separate from the hidden screen ID.

#### C-6.2 Code entry
Acceptance criteria:
1. Input is case-insensitive; `I` and `L` become `1`, `O` becomes `0`; spaces and dashes are ignored (the theatre does
   the same, so a typed `7k3-qxm` works).
2. Pasting any invite link (C-6.3) into the code box joins that screen on that theatre.
3. A code that isn't 6 valid characters after normalising gets "Screen codes are 6 letters and digits" without a
   network request.

#### C-6.3 Invite link formats
Acceptance criteria: every client parses all of these, case-insensitively for the code:
1. `kino://join/<theatreId>/<code>` (app link).
2. `https://kino-directory.srie.workers.dev/join#<theatreId>/<code>` (web link; the page offers app and browser).
3. `https://kino-web.srie.workers.dev/#<theatreId>/<code>` (straight into the web app).
4. `<theatreId>/<code>`.
Anything else is rejected. An unknown theatre id falls back to looking the code up on every theatre.

#### C-6.4 Directory join page
Acceptance criteria: `/join#<theatre>/<code>` shows the screen code, a "Open in the Kino app" button (`kino://…`), a
"Watch in your browser" button (web app link with the same hash), and a download link; on desktops it tries the app link
once automatically; on phones it doesn't; a malformed hash shows "This invite link isn't complete".

#### C-6.5 Join by code
Acceptance criteria: the code is resolved with `GET /resolve/<code>` on every theatre in parallel within one 3 s budget;
the first match wins; theatres that don't answer are skipped and counted; "No screen with code X" says how many
theatres didn't answer, if any.

#### C-6.6 Private join
Acceptance criteria: a private screen opens a password prompt in place (§10.4) naming the screen; a wrong password
keeps the prompt open with "Wrong password." and the field cleared and focused; Cancel returns to the lobby.

#### C-6.7 Password security
Acceptance criteria: the password is stored as PBKDF2-SHA256 with a random 16-byte salt and 100,000 iterations (the
Workers maximum), compared in constant time; at most 5 wrong passwords per token and 30 per screen per minute, then
`rate_limited` with "try again in a minute"; the plain password is never stored or logged.

#### C-6.8 Members rejoin without the password
Acceptance criteria: a device that has joined a private screen before (its token is a member) gets in without the
password, both on reconnect and when joining again from the lobby or a link; the client doesn't prompt for it.

#### C-6.9 Invite panel
Acceptance criteria: shows the code in large monospace; "Copy code"; the web link with "Copy"; a sentence for sharing
("Join my screen on Kino: <link> (code X)"), adding "ask me for the password" for private screens.

#### C-6.10 Regenerate the code
Acceptance criteria: needs `screen.invite`; asks "Make a new code? The old code and links stop working"; the theatre
gives a new unique code, the old one stops resolving at once, connected viewers aren't affected, and every client shows
the new code from the `screen` message.

#### C-6.11 Who sees the code
§8.1 says `screen.invite` lets a viewer "view and regenerate" the code and link, but the theatre sends the code to
everyone (`welcome.screen.code`, `screen`), and both clients show it to everyone.

Acceptance criteria:
1. Decide: either the code is visible to everyone (change §8.1 to "regenerate" only), or it is limited to
   `screen.invite` holders.
2. If limited: the theatre sends `code: null` in `screen` and `welcome` to viewers without `screen.invite`, and clients
   hide the code and the Invite panel for them.
3. The spec, the protocol and both clients agree.

#### C-6.12 Opening invite links on each platform
Acceptance criteria:
- **Windows:** `kino://` is registered per user (installer and first launch); a link opened while Kino runs is passed
  to the running instance, which comes to the front and joins.
- **Web:** a `#<theatre>/<code>` address joins once the theatre list and identity are ready; changing the hash joins
  the new screen when not already in one.
- **Android:** an intent filter for `kino://join/…` and an App Link for the directory join page.
- **Linux:** a `.desktop` file with `x-scheme-handler/kino` and single-instance forwarding.

---

## Phase 7. Host, co-hosts and handover

**Goal.** The screen keeps going when the host is away, and control returns when they come back.

| ID | Task | § | Th | Win | Web | And | Lin | Tests / notes |
|---|---|---|---|---|---|---|---|---|
| C-7.1 | Appoint and remove co-hosts | §7.1, R4.1 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | Th smoke; Win live. Web: `session.setCoHost` exists, no UI |
| C-7.2 | Co-host priority order | §7.1, R4.1 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | Web: `moveCoHost` exists, no UI |
| C-7.3 | Away co-hosts listed | §7.1, R2.7 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | Web ignores the `cohosts` list in the UI |
| C-7.4 | Acting host takes over the timeline | §7.2, R4.2 | ✅ | ✅ | 🟨 | ⏸ | ⏸ | Th smoke; Win live. Web: badge and engine switch work; no automated test |
| C-7.5 | Acting host limits | §7.2 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | Web has none of the host-only controls yet |
| C-7.6 | No co-host present | §7.3, R4.3 | ✅ | — | — | — | — | |
| C-7.7 | Host returns and takes over | §7.4, R4.4 | ✅ | — | — | — | — | Th smoke. Client side is C-7.4 |
| C-7.8 | Transfer ownership | §7.5, R4.6 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | Th smoke |

#### C-7.1 Appoint and remove co-hosts
Acceptance criteria: only the host (not the acting host) sees "Make co-host" and "Remove co-host" in a viewer's menu;
the client sends `cohosts.set` with the full ordered list, keeping co-hosts who are away; the theatre posts "{name} is
now a co-host" / "is no longer a co-host"; the host can't be a co-host.

#### C-7.2 Co-host priority
Acceptance criteria: "Move up (takes over sooner)" and "Move down" reorder the list; co-host #1 takes over first; the
viewer list shows "co-host #n".

#### C-7.3 Away co-hosts
Acceptance criteria: co-hosts who aren't connected are listed under the viewers ("Away: name (co-host #n)") from the
`cohosts` message, so the host can still reorder or remove them.

#### C-7.4 Acting host
Acceptance criteria:
1. When the host is disconnected, the highest-priority present co-host becomes acting host (`actingHost: true`) without
   interrupting playback; the theatre posts "{name} is standing in for the host".
2. The acting host's client becomes the timeline authority (re-anchors, C-11.15); everyone sees an "acting host" badge.
3. If the acting host leaves too, the next present co-host takes over.
4. An automated test covers takeover and the client's switch to timeline authority.

#### C-7.5 Acting host limits
Acceptance criteria (§7.2): the acting host has every permission but can't transfer ownership, close the screen,
change co-hosts or their order, or act on the host or other co-hosts (rank 900 isn't above 900); clients don't offer
those actions to an acting host.

#### C-7.6 No co-host present
Acceptance criteria: playback continues from the current anchor; items still end on the theatre's alarm; viewers keep
whatever permissions they have; host-only actions wait for the host or a co-host.

#### C-7.7 Host returns
Acceptance criteria: the host reconnecting with the owner token takes control at once, the acting host returns to
co-host, and "The host is back" is posted.

#### C-7.8 Transfer ownership
Acceptance criteria: host only; the new host must be connected; the client confirms "Make X the host? You become
co-host #1"; the owner token switches, the old host becomes co-host #1, "{name} is now the host" is posted and the lobby
host name updates.

---

## Phase 8. Roles and permissions

**Goal.** Discord-style roles and per-viewer overrides, enforced by the theatre and reflected in every client's UI.

| ID | Task | § | Th | Win | Web | And | Lin | Tests / notes |
|---|---|---|---|---|---|---|---|---|
| C-8.1 | Permission catalogue (19 permissions) | §8.1, R5.1 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th unit; Win unit (`Rank_matches_the_theatre`) |
| C-8.2 | Role model and limits | §8.2, R5.2 | ✅ | 🟨 | ⬜ | ⏸ | ⏸ | Th unit. Win: the 20-role cap isn't checked before sending |
| C-8.3 | Default roles | §8.3, R5.3 | ✅ | — | — | — | — | Th unit |
| C-8.4 | Resolution order; effective permissions from the theatre | §8.4 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th unit; Win unit (parse); clients never compute permissions |
| C-8.5 | Roles page | §8.2, R5.4 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | Th smoke; Win UI: manual |
| C-8.5.1 | List roles by rank, with colour | §8.2 | — | ✅ | ⬜ | ⏸ | ⏸ | |
| C-8.5.2 | Create a role | §8.2 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | |
| C-8.5.3 | Edit a role | §8.2 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | |
| C-8.5.4 | Delete a role | §8.2 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | |
| C-8.5.5 | Built-in roles: Viewer permissions only; Co-host read-only | §8.3 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | |
| C-8.6 | Assign roles to viewers | §8.2, R5.5 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | |
| C-8.7 | Per-viewer overrides: Inherit, Allow, Deny | §8.4, R5.6 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | |
| C-8.8 | Enforcement in the Screen DO | §8.5, R5.7 | ✅ | — | — | — | — | Th unit, Th smoke (no escalation) |
| C-8.9 | Permission-aware UI | §8.5, R5.8 | — | 🟨 | 🟨 | ⏸ | ⏸ | Win: everything except `screen.invite` (C-6.11). Web: playback, playlist, auto-advance and regenerate follow permissions; the rest has no UI |
| C-8.10 | Roles shown in the viewer list | §8.2, R2.7 | — | ✅ | ✅ | ⏸ | ⏸ | Win: role names as text with a colour dot; Web: coloured chips |

#### C-8.1 Permission catalogue
Acceptance criteria: exactly the 19 keys of §8.1, spelt identically in the theatre (`rbac.ts`), every client and the
protocol; an unknown key is rejected by the theatre.

#### C-8.2 Role model and limits
Acceptance criteria: a role has `id`, `name` (1–32), `colour` (`#rrggbb` or none), `position` (1–899 for custom
roles) and `permissions`; at most 20 custom roles (clients disable "New role" at 20 with the reason); a viewer can hold
several roles.

#### C-8.3 Default roles
Acceptance criteria: Host (owner token, rank 1000, everything, not a role); Co-host (built-in, 900, every permission,
fixed); Viewer (built-in, 0, everyone, by default `chat.send`, `chat.gif`, `chat.react`).

#### C-8.4 Resolution order
Acceptance criteria (§8.4): host or acting host → allow; per-viewer deny → deny; per-viewer allow → allow; any role
grants → allow; otherwise deny. The theatre sends each viewer's effective `permissions`, and clients use only that list.

#### C-8.5 Roles page
Needs `roles.manage` to edit; anyone can open it to see the roles.

- **C-8.5.1** Roles ordered by rank, with colour, name and rank; the ones you can't edit are marked.
- **C-8.5.2** Create: name, colour (presets plus none), rank (1 to your rank − 1, capped at 899; default just above the
  highest role you can manage), permissions (only ones you hold; the others disabled with "You don't have this
  permission").
- **C-8.5.3** Edit: same fields, only for roles ranked below you.
- **C-8.5.4** Delete: only custom roles below you, with confirmation; it is removed from everyone.
- **C-8.5.5** Viewer: only its permissions can change. Co-host: read-only.

Acceptance criteria: every rejection from the theatre (`forbidden`, `bad_request`) is shown on the page.

#### C-8.6 Assign roles
Acceptance criteria: a viewer's menu has a "Roles" submenu of toggles for custom roles ranked below you, offered only
with `roles.assign` and only for viewers ranked below you; the theatre posts "{name} is now {role}" / "is no longer
{role}".

#### C-8.7 Per-viewer overrides
Acceptance criteria: "Permissions…" (needs `roles.manage`, target ranked below you) shows all 19 permissions, each
Inherit (showing whether it is currently allowed), Allow or Deny; Allow is disabled for permissions you don't hold;
saving sends `viewer.overrides` with the full allow and deny lists.

#### C-8.8 Enforcement
Acceptance criteria: the Screen DO checks the permission for every gated message, the rank rule for every action on a
role or viewer, and the "only permissions you have" rule for every grant; violations get `forbidden` and change nothing.

#### C-8.9 Permission-aware UI
Acceptance criteria: each client disables or hides controls the viewer can't use, from the effective permissions, and
updates them live when `viewers` changes: playback (`playback.toggle`, `playback.seek`, `playback.skip`), playlist
(`playlist.add`, `playlist.add_external`, `playlist.remove`, `playlist.reorder`), subtitles share, ready check, settings,
invite (C-6.11), chat (`chat.send`, `chat.gif`, `chat.react`), moderation and roles. This is for convenience only; the
theatre is the authority.

#### C-8.10 Roles in the viewer list
Acceptance criteria: each viewer row shows their custom roles by name, with the role colour shown in a way that stays
readable (a dot or bar, not coloured text on its own; see C-23.3.1).

---

## Phase 9. Moderation

**Goal.** Chat mute, kick and ban, within the rank rules.

| ID | Task | § | Th | Win | Web | And | Lin | Tests / notes |
|---|---|---|---|---|---|---|---|---|
| C-9.1 | Chat mute and unmute | §9, R6.3 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | Th smoke (muted can't chat) |
| C-9.2 | Kick | §9, R6.1 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | Th smoke; Win live |
| C-9.3 | Ban | §9, R6.2 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | Th smoke |
| C-9.4 | Viewer actions menu, filtered by rank and permission | §8.2, §8.5 | — | ✅ | ⬜ | ⏸ | ⏸ | Win UI: manual |
| C-9.5 | Being kicked or banned | §9 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th smoke; clients UI: manual |

#### C-9.1 Chat mute
Acceptance criteria: needs `viewers.mute` and a target ranked below you; the muted viewer can't send chat, GIFs or
reactions until unmuted (`forbidden`, "you are muted in this screen"); the mute survives reconnects; a mute icon shows
next to them for everyone.

#### C-9.2 Kick
Acceptance criteria: needs `viewers.kick` and a target ranked below you; they are disconnected with `kicked` and no
reconnect grace; "{name} was removed by {by}" is posted; they can rejoin and keep their roles.

#### C-9.3 Ban
Acceptance criteria: needs `viewers.ban` and a target ranked below you; the client confirms first ("Ban X from this
screen? They can't come back"); they are disconnected with `banned`, their token hash is banned for the screen's
lifetime, they are removed from the co-host list, and "{name} was banned by {by}" is posted; any later join with that
token gets `banned`.

#### C-9.4 Viewer actions menu
Acceptance criteria: each viewer row opens a menu listing only the actions you may take on that viewer: mute or unmute,
kick, ban, roles, permissions, make or remove co-host, move up or down, make host; with "No actions available" when
there are none; never for yourself.

#### C-9.5 Being kicked or banned
Acceptance criteria: the client stops reconnecting and returns to the lobby with "You were removed from the screen" or
"You can't join this screen" (banned).

---

## Phase 10. Viewers panel: devices, latency and sync status

**Goal.** Everyone can see who is here, on what, how far away, and whether they are in sync.

| ID | Task | § | Th | Win | Web | And | Lin | Tests / notes |
|---|---|---|---|---|---|---|---|---|
| C-10.1 | Viewer rows: name, you, host, acting host, co-host #n | §12, R2.7 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Win unit (parse); UI: manual |
| C-10.2 | Device reported in `hello` | §12, R9.1 | ✅ | ✅ | ✅ | ⏸ | ⏸ | `windows`, `web` (`linux`, `android` later) |
| C-10.3 | Device icon per viewer | §12, R9.2 | — | 🟨 | 🟨 | ⏸ | ⏸ | Both show the device as text, not an icon |
| C-10.4 | Show devices off: no devices sent or shown | §12, R9.3 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th smoke |
| C-10.5 | Own latency, updated live | §12, R9.4 | — | ✅ | ⬜ | ⏸ | ⏸ | Win: in the sync overlay. Web: the sync readout has no RTT |
| C-10.6 | Others' latency with colour bands | §12, R9.5 | ✅ | ✅ | 🟨 | ⏸ | ⏸ | Web: the number only, no bands |
| C-10.7 | RTT reported after every clock sync | §12, §14.3 | ✅ | ✅ | ✅ | ⏸ | ⏸ | |
| C-10.8 | Sync status per viewer (six states) | §12, R9.6 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th smoke; Win emoji, Web coloured words |
| C-10.9 | Status reporter: on change only, buffering after 2 s | §12, §14.10 | — | ✅ | ✅ | ⏸ | ⏸ | Win unit; Web unit |
| C-10.10 | Reconnecting viewers dimmed | §6.4 | — | ✅ | ✅ | ⏸ | ⏸ | UI: manual |
| C-10.11 | Chat-mute icon | R2.7 | — | ✅ | ✅ | ⏸ | ⏸ | UI: manual |

#### C-10.1 Viewer rows
Acceptance criteria: one row per viewer, sorted host first, then co-hosts by priority, then by name; badges for "you",
"host", "acting host", "co-host #n"; the count in the tab counts connected viewers only.

#### C-10.2 Device in `hello`
Acceptance criteria: each client sends its platform: `windows`, `linux`, `android` or `web`.

#### C-10.3 Device icon
Acceptance criteria: a Windows, Linux, Android or web icon next to each viewer, the host included, with the platform
name as its accessible name and tooltip.

#### C-10.4 Show devices off
Acceptance criteria: when the setting is off, every `ViewerInfo.device` is `null`, and clients show no device at all.

#### C-10.5 Own latency
Acceptance criteria: your RTT to the theatre (the median RTT of the last committed clock sync) is visible while in a
screen and updates after every re-sync, with the same colour bands as C-10.6.

#### C-10.6 Others' latency
Acceptance criteria: each viewer's RTT next to their name in ms, coloured 🟢 < 100 ms, 🟡 100–250 ms, 🔴 > 250 ms
(§12), and "–" when unknown or reconnecting.

#### C-10.7 RTT reported
Acceptance criteria: after each committed clock sync (join, reconnect, every 2 minutes) the client sends `rtt { value }`
rounded to 0.1 ms; nothing else sends RTT.

#### C-10.8 Sync status per viewer
Acceptance criteria: each row shows one of: 🟢 in sync (`sync`), 🟡 catching up (`catching`), 🔵 buffering
(`buffering`), ⚠ file differs (`mismatch`), ⏳ waiting (`waiting`), ⛔ no file (`nofile`), with a text label too.

#### C-10.9 Status reporter
Acceptance criteria: the client sends `status { value }` only when the value changes; buffering is reported only after
it has lasted 2 s; other changes must hold for 1 s before they are sent (debounce); settling, starting and idle keep the
last status; reconnecting sends nothing.

#### C-10.10 Reconnecting viewers
Acceptance criteria: rows with `connected: false` are dimmed to about 50% and say "reconnecting…" instead of the status
and ping.

#### C-10.11 Chat-mute icon
Acceptance criteria: a muted viewer's row shows a chat-off icon with the accessible name and tooltip "Chat-muted".

---

## Phase 11. Sync engine

**Goal.** Every viewer stays within a fraction of a second of the host, with corrections nobody notices (§14.1).
Constants are in §22; both engines (Windows `Kino.Core/Sync`, Web `src/core/sync.ts`) use the same constants and the
same tests.

| ID | Task | § | Th | Win | Web | And | Lin | Tests / notes |
|---|---|---|---|---|---|---|---|---|
| C-11.1 | Sync only, never stream | §1, R11.1 | ✅ | ✅ | ✅ | ⏸ | ⏸ | |
| C-11.2 | Clock sync burst on join | §14.3, R11.2 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Win unit; Web unit (`ClockSync`) |
| C-11.3 | Periodic re-sync and smoothing | §14.3, R11.2 | — | ✅ | ✅ | ⏸ | ⏸ | Win unit; Web unit |
| C-11.4 | Immediate re-sync when RTT jumps by more than 50% | §14.3 | — | ⬜ | ⬜ | ⏸ | ⏸ | Not built anywhere; the trigger needs defining (Appendix B 12) |
| C-11.5 | Anchors and `seq` ordering | §14.4, R11.3 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th unit; Win unit; Web unit (stale anchors) |
| C-11.6 | Expected position (latency compensation) | §14.4, R11.4 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th unit; Web unit |
| C-11.7 | Scheduled start | §14.5, R11.5 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th unit (`startLead`); Win unit; Web unit |
| C-11.8 | Anchors applied on arrival | §14.5 | — | ✅ | ✅ | ⏸ | ⏸ | Win unit; Web unit |
| C-11.9 | Drift measurement | §14.6, R11.6 | — | ✅ | ✅ | ⏸ | ⏸ | Win unit; Web unit |
| C-11.10 | Green zone with hysteresis | §14.7, R11.7 | — | ✅ | ✅ | ⏸ | ⏸ | Win unit; Web unit |
| C-11.11 | Exact seek while paused | §14.7 | — | ✅ | ✅ | ⏸ | ⏸ | Win unit; Web unit. Both ignore the personal offset while paused (Appendix B 16) |
| C-11.12 | Smooth rate controller with pitch correction | §14.8, R10.3, R11.8 | — | ✅ | ✅ | ⏸ | ⏸ | Win unit; Web unit + e2e |
| C-11.13 | Hard seek with learned seek latency | §14.9, R11.9 | — | ✅ | ✅ | ⏸ | ⏸ | Win unit; Web unit |
| C-11.14 | Late anchors | §14.5 | — | ✅ | ✅ | ⏸ | ⏸ | Win unit; Web unit |
| C-11.15 | Host re-anchor | §14.5, R11.10 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th: `at` clamped to ±2 s; Win unit; Web unit |
| C-11.16 | Late join and reconnect catch-up | §14.11, R11.11 | — | ✅ | ✅ | ⏸ | ⏸ | Win live; Web live + e2e. Reconnect burst size: C-3.7 |
| C-11.17 | Buffering policy "Wait for everyone" | §14.10, R11.12 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th smoke; Win live; Web UI: manual. The setting itself is C-5.11.7 |
| C-11.18 | Playlist transitions | §14.12, R11.13 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th smoke; Win unit; Web unit |
| C-11.19 | Ready check | §14.14, R11.14 | ✅ | ✅ | 🟨 | ⏸ | ⏸ | Th smoke; Win live |
| C-11.19.1 | Start a ready check | §14.14 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | Web: `startReadyCheck` exists, no button |
| C-11.19.2 | Prompt with Ready and Not yet | §14.14 | ✅ | ✅ | ✅ | ⏸ | ⏸ | |
| C-11.19.3 | Live tally | §14.14 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | |
| C-11.19.4 | 30 s countdown | §14.14 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | |
| C-11.19.5 | Result shown | §14.14 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | The result is a chat system message, and the web has no chat |
| C-11.20 | Personal sync offset | §14.15, R11.15 | — | ✅ | 🟨 | ⏸ | ⏸ | Win unit. Web: the engine supports it (unit test), no control |
| C-11.21 | Sync readout for the viewer | §14 | — | ✅ | ✅ | ⏸ | ⏸ | Zone, drift, rate. UI: manual |
| C-11.22 | Shared sync test vectors across engines | §14 | ⬜ | ⬜ | ⬜ | ⏸ | ⏸ | Today the tests are ported by hand |
| C-11.23 | Sleep, lock and background behaviour | §14.11 | — | 🟨 | ⬜ | ⏸ | ⏸ | Win: recovers through reconnect; not tested. Web: background-tab timer throttling not handled |

#### C-11.1 Sync only
Acceptance criteria: only playback state, times and small metadata (names, durations, links, chat, subtitle files the
viewer chose to share) travel over the network; no client uploads or relays media.

#### C-11.2 Clock sync burst
Acceptance criteria: on join, 8 `ping { t0 }` 100 ms apart using the local monotonic clock; for each `pong { t0, ts }`
received at `t1`, `rtt = t1 − t0` and `offset = ts − (t0 + t1) / 2`; samples with RTT below 0 or above 10 s are dropped;
500 ms after the last ping, the 3 samples with the lowest RTT are kept and the median offset is used; the engine stays
disabled until this first commit.

#### C-11.3 Periodic re-sync and smoothing
Acceptance criteria: every 2 minutes, 3 samples; a new offset is blended as `0.8 × old + 0.2 × new` unless it differs by
more than 100 ms, when it replaces the old one; the first commit always replaces; `theatreNow = localMonotonicNow +
offset`; no re-sync while reconnecting.

#### C-11.4 Immediate re-sync on an RTT jump
Acceptance criteria:
1. Define the trigger in §14.3 (for example: a single ping during a re-sync, or a periodic lightweight ping, whose RTT is
   more than 1.5 × the last committed RTT).
2. When it fires, a 3-sample re-sync runs at once (at most once per 10 s).
3. Unit tests in both engines.

#### C-11.5 Anchors
Acceptance criteria: `anchor = { itemId, state, position, rate, at, seq }`; it changes only on play, pause, seek, item
change, buffering hold and resume, and host re-anchor; `seq` increases with every change; clients ignore an anchor with
a lower `seq` than the last applied, and an equal `seq` replaces it silently.

#### C-11.6 Expected position
Acceptance criteria: `E(now) = position` if paused or `now ≤ at`, else `position + rate × (now − at) / 1000`; computed
locally with theatre time.

#### C-11.7 Scheduled start
Acceptance criteria: play and resume anchors use `at = now + lead`, `lead = clamp(maxViewerRTT / 2 + 150 ms, 200 ms,
800 ms)` (unknown RTT counts as 200 ms); a client waiting for a scheduled start holds paused at the start position
(plus personal offset) and starts within one frame of `at`.

#### C-11.8 Anchors applied on arrival
Acceptance criteria: a new anchor is acted on when it arrives, not on the next 250 ms tick; a scheduled start due
within 1.5 ticks is started by its own timer.

#### C-11.9 Drift measurement
Acceptance criteria: `d = actualPosition − E(now) − personalOffset` sampled every 250 ms; the median of the last 5
samples is used, and nothing is decided with fewer than 3; drift is ignored for 1 s after any seek, play, item change or
buffering.

#### C-11.10 Green zone with hysteresis
Acceptance criteria: correction starts when `|d| ≥ 0.25 s` and continues until `|d| < 0.08 s`; inside the green zone
the rate is exactly 1.00×.

#### C-11.11 Exact seek while paused
Acceptance criteria: while paused, rate correction is off and any `|d| > 0.05 s` is fixed with an exact seek, at most
once per 500 ms.

#### C-11.12 Smooth rate controller
Acceptance criteria: `want = −sign(d) × min(K × |d|, D_max, √(2 × S × |d|))` with `K = 0.10/s`, `D_max = 0.05`,
`S = 0.005/s`; the deviation moves towards `want` by at most `S × dt` per tick; rate changes smaller than 0.0005 aren't
applied (except returning to 1.0); pitch correction is always on (libmpv `audio-pitch-correction`, HTML
`preservesPitch`); simulated catch-up from 0.3 s, 1.0 s and 3.0 s reaches the green zone without overshoot in about
16 s, 33 s and 73 s (§14.8; tests may allow a margin).

#### C-11.13 Hard seek
Acceptance criteria: when `|d| > 3 s`, seek to `E(now) + L`, where `L` is the average of the last 5 measured seek
latencies (each clamped to 0–2 s), starting at 300 ms; at most one hard seek per 5 s, reset by every new anchor; while
the limit holds back a needed seek, the rate stays 1.00×.

#### C-11.14 Late anchors
Acceptance criteria: on the first playing step after an anchor that arrived after its `at`: a viewer hard-seeks at once
if `|d| > 3 s`; the host seeks at once if the anchor moved the timeline by more than 0.25 s and the host is more than
0.25 s from it; the host's own re-anchors never trigger this.

#### C-11.15 Host re-anchor
Acceptance criteria: the timeline authority (host, or acting host) never bends its own speed; if its drift exceeds
0.25 s it sends `reanchor { position, at }` with its real position, at most once per 2 s; the theatre accepts it only
from the timeline authority, only while playing, and clamps `at` to ±2 s of its own time.

#### C-11.16 Late join and reconnect catch-up
Acceptance criteria (§14.11): clock burst, then the snapshot's anchor, then load the mapped file, then hard-seek to
`E(now) + L`; from then on the rate controller takes over; a late joiner is within 0.1 s of the host within 10 s of the
file loading (Web e2e measures this).

#### C-11.17 Wait for everyone
Acceptance criteria: with `bufferingPolicy: "wait"`, a viewer reporting `buffering` (after 2 s) makes the theatre pause
the anchor at `E(now)`, broadcast `hold` with the names and post "Waiting for {names}…"; when nobody is buffering any
more it resumes with a scheduled start; "Resume anyway" (`hold.release`, or `play`) resumes at once and stops waiting for
those buffering now until they recover; a deliberate pause while held cancels the auto-resume; every client shows the
hold banner with the names and offers "Resume anyway" to those allowed (Appendix B 10).

#### C-11.18 Playlist transitions
Acceptance criteria (§14.12): the theatre schedules the current item's end from the host's duration and fires it on its
alarm, even with the host away; with auto-advance on, the next item starts at 0 with a scheduled start; otherwise, or
after the last item, playback pauses exactly at the end; a viewer whose copy is shorter waits paused at its end showing
"Waiting for the others…" without seek loops; a longer copy moves on with the anchor.

#### C-11.19 Ready check
- **C-11.19.1** "Ready check" (needs `screen.ready_check`) sends `ready.start`; the starter counts as ready.
- **C-11.19.2** Everyone sees "{name} asks: ready?" with Ready and Not yet over the video; answering sends
  `ready.answer`; the current answer is highlighted and can be changed until it ends.
- **C-11.19.3** Everyone sees "n of m ready" update live (m = connected viewers).
- **C-11.19.4** The time left counts down from the theatre's deadline (30 s).
- **C-11.19.5** When everyone has answered or the deadline passes, "Everyone is ready" or "Ready check: n of m ready"
  shows over the video for 5 s and is posted to chat.

Acceptance criteria: the host can press play at any time regardless (§14.14); a viewer who leaves no longer blocks
completion.

#### C-11.20 Personal sync offset
Acceptance criteria: a local-only control from −2000 to +2000 ms (Picture and sound), applied in the drift formula and
never sent; positive plays later (for Bluetooth delay); remembered locally (C-16.6).

#### C-11.21 Sync readout
Acceptance criteria: the viewer can see their zone (in sync, catching up, jumping, buffering, leading, paused,
starting, waiting, no file), the drift in ms and the current rate when it isn't 100%.

#### C-11.22 Shared sync test vectors
Acceptance criteria: `protocol/sync-vectors/` holds language-neutral JSON scenarios (anchors, player behaviour, expected
zones, seeks and rates per tick); every engine (Windows, Web, Android, Linux) runs all of them in CI and must match.

#### C-11.23 Sleep, lock and background behaviour
Acceptance criteria:
1. After the device sleeps or the app is suspended, the client detects the gap (tick interval much longer than 250 ms),
   runs a full clock burst and catches up as on reconnect.
2. Web: a hidden tab keeps playing in sync for at least 30 minutes, muted or not (timer throttling in background tabs
   must not stop the engine; see WEB-11.P1).
3. An automated test simulates a long gap and checks the recovery.

---

## Phase 12. Media player

**Goal.** A Kino player on each platform with the engine capabilities of §15.2.

| ID | Task | § | Th | Win | Web | And | Lin | Tests / notes |
|---|---|---|---|---|---|---|---|---|
| C-12.1 | Playback engine integration | §15.1–15.3, R10.1, R10.7 | — | 🟨 | ✅ | ⏸ | ⏸ | Win: libmpv in a child window, works, but no automated test drives libmpv. Web: `<video>`, exercised by Web e2e |
| C-12.2 | Core playback controls | §15.4, R10.2 | — | ✅ | ✅ | ⏸ | ⏸ | UI: manual; Web e2e (play, seek, pause) |
| C-12.3 | Fine playback rate with pitch correction | §15.2, R10.3 | — | ✅ | ✅ | ⏸ | ⏸ | |
| C-12.4 | Seek bar with hover preview time | §15.4 | — | ⬜ | ⬜ | ⏸ | ⏸ | Win sets `IsThumbToolTipEnabled="False"`; Web uses a plain range input |
| C-12.5 | Audio track selection | §15.2, R10.4 | — | ✅ | ⬜ | ⏸ | ⏸ | Web: browsers expose audio tracks only in Safari (WEB-12.P4) |
| C-12.6 | Fullscreen | §15.4, R10.5 | — | ✅ | ✅ | ⏸ | ⏸ | UI: manual |
| C-12.7 | Keyboard shortcuts | §15.4, R10.6 | — | 🟨 | 🟨 | ⏸ | ⏸ | Win: a focused slider takes the arrow keys, nothing works while the YouTube view has focus, and seeking reads libmpv's position during YouTube items. Web: no ↑/↓, N, P or Home |
| C-12.8 | Touch gestures | §15.4 | — | — | ⬜ | ⏸ | — | Web: phones and tablets |
| C-12.9 | Buffering and end-of-file detection | §15.2, §15.3 | — | 🟨 | ✅ | ⏸ | ⏸ | Win: only `paused-for-cache` (spec also lists `core-idle` and `seeking`) |
| C-12.10 | System media controls go through the screen | — | — | ⬜ | ⬜ | ⏸ | ⏸ | Web: media keys act on `<video>` directly and fight the engine |
| C-12.11 | Keep the display awake while playing | — | — | 🟨 | ⬜ | ⏸ | ⏸ | Win: relies on libmpv's default `stop-screensaver`; not verified |

#### C-12.1 Playback engine integration
Acceptance criteria (§15.2): position readable every 250 ms or faster; playback rate settable in 0.001 steps with pitch
correction; fast, accurate seeking; buffering and end-of-file events; audio and subtitle track selection; external
subtitles with delay and style; zoom, aspect and fit; volume above 100%. Per platform: Windows libmpv (`hwdec=auto-safe`,
`hr-seek=yes`, `keep-open=yes`, `osc=no`, `input-default-bindings=no`, `volume-max=200`); Web HTML5 `<video>`
(later MSE, C-15.4); Android and Linux libmpv. An automated test plays a generated clip through the real engine and
checks position, rate and seek accuracy.

#### C-12.2 Core playback controls
Acceptance criteria: play/pause follows the anchor state (sends `play` or `pause`); seeking sends `seek { to }` when the
drag or key is released; previous and next send `skip` and are hidden or disabled without `playback.skip`; at the end of
the last item playback stops (C-11.18); without permission the controls are disabled.

#### C-12.3 Playback rate with pitch correction
Acceptance criteria: C-11.12; no audible pitch change at 0.95× or 1.05×.

#### C-12.4 Seek bar with hover preview time
Acceptance criteria: hovering or focusing the seek bar shows the time under the pointer (or of the focused value);
dragging shows the target time; the current time and duration are shown beside it; with keyboard focus, ←/→ move 5 s.

#### C-12.5 Audio track selection
Acceptance criteria: Picture and sound lists every audio track as "title · language · codec · channels"; choosing one
switches without losing sync; disabled when there is one track or none.

#### C-12.6 Fullscreen
Acceptance criteria: F, F11 (desktop) and a button enter fullscreen; Esc or the button leaves; the top bar and side
panel hide; the controls, notices and reactions still work.

#### C-12.7 Keyboard shortcuts
Acceptance criteria: Space or K play/pause; ←/→ seek 5 s; J/L seek 10 s; ↑/↓ volume ±5; M mute; F fullscreen (F11 on
desktop); Esc leave fullscreen; N/P next/previous; Home restart the item; they never fire while typing in a text field,
whatever control has focus (including sliders and the YouTube view); each one obeys the same permission as its button;
during YouTube items, seeks use the YouTube player's position.

#### C-12.8 Touch gestures
Acceptance criteria: on touch devices, a tap shows or hides the controls; a double tap on the left or right third seeks
10 s back or forward (with `playback.seek`); see C-23.6.3 for the full gesture set.

#### C-12.9 Buffering and end-of-file detection
Acceptance criteria: the engine sees "buffering" while the player is waiting for data or seeking (libmpv
`paused-for-cache`, `core-idle` while not paused, `seeking`; HTML `seeking` or `readyState < HAVE_FUTURE_DATA` while
playing); the end of a copy is detected from the media's own duration.

#### C-12.10 System media controls
Acceptance criteria: hardware media keys and the OS media overlay (Windows System Media Transport Controls, the web
Media Session API, Android MediaSession, Linux MPRIS) show the current item and route play, pause, next and previous
through the screen (with the same permissions), never straight to the local player.

#### C-12.11 Keep the display awake
Acceptance criteria: the display doesn't sleep while a screen is playing (Windows `SetThreadExecutionState` or libmpv
`stop-screensaver`; web Screen Wake Lock API, re-acquired when the tab becomes visible again); it may sleep while paused.

---

## Phase 13. Local media, playlists and file matching

**Goal.** Build a playlist from local files, links and YouTube, and let every viewer map items to their own copies.

| ID | Task | § | Th | Win | Web | And | Lin | Tests / notes |
|---|---|---|---|---|---|---|---|---|
| C-13.1 | Pick a single local file | §13.3, R12.1 | — | ✅ | ✅ | ⏸ | ⏸ | Web e2e |
| C-13.2 | Add a folder | §13.3, R12.2 | — | ✅ | ⬜ | ⏸ | ⏸ | Win: top level only |
| C-13.3 | Multi-select files | §13.3, R12.3 | — | ✅ | ✅ | ⏸ | ⏸ | |
| C-13.4 | Natural A–Z order, ignoring case | §13.3, R12.4 | — | ✅ | ✅ | ⏸ | ⏸ | Win unit; Web unit |
| C-13.5 | The same media file types on every platform | §13.3 | — | ✅ | ✅ | ⏸ | ⏸ | Identical 26-extension lists |
| C-13.6 | Drag files in from the system | §21.1 | — | ⬜ | ✅ | ⏸ | ⏸ | Win: no drag and drop from Explorer |
| C-13.7 | Host-defined order: drag and drop, Move up and Move down | §13.3, R12.5 | ✅ | ✅ | 🟨 | ⏸ | ⏸ | Th smoke. Web: "Move up" only |
| C-13.8 | Remove an item | §13 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th smoke |
| C-13.9 | Play an item now | §13 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th smoke |
| C-13.10 | "Open now" for a file or a link | §13 | ✅ | 🟨 | 🟨 | ⏸ | ⏸ | Win: links are only appended. Web: only when nothing is current |
| C-13.11 | Playlist limits and chunked adds | §13 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th unit |
| C-13.12 | Automatic matching: duration first, then name | §13.4, R12.6 | — | ✅ | ✅ | ⏸ | ⏸ | Win unit; Web unit |
| C-13.13 | "Choose my file…" per item | §13.4, R12.6 | — | ✅ | ✅ | ⏸ | ⏸ | Web e2e |
| C-13.14 | "Match my files…" (folder or several files) | §13.4, R12.6 | — | ✅ | 🟨 | ⏸ | ⏸ | Web: only by dropping files; no button, no folder |
| C-13.15 | "Pick your file" when an unmapped item comes up | §13.4 | — | ✅ | ✅ | ⏸ | ⏸ | Win unit; Web unit + e2e |
| C-13.16 | Duration tolerance max(2 s, 0.5%) | §13.5, R12.7 | — | ✅ | ✅ | ⏸ | ⏸ | Win unit; Web unit |
| C-13.17 | Name comparison | §13.5, R12.8 | — | ✅ | ✅ | ⏸ | ⏸ | Win unit; Web unit |
| C-13.18 | Mismatch indicator and "different name" note | §13.5, R12.9 | — | ✅ | ✅ | ⏸ | ⏸ | Win unit; Web unit; UI: manual |
| C-13.19 | Only name and duration leave the device | §13.2, R12.10 | ✅ | ✅ | ✅ | ⏸ | ⏸ | |
| C-13.20 | Mixed playlists | §13.1, R12.14 | ✅ | ✅ | 🟨 | ⏸ | ⏸ | Th smoke. Web: YouTube items can't play |
| C-13.21 | Resume position | §13.7, R12.16 | — | 🟨 | ⬜ | ⏸ | ⏸ | Win unit: saved every 5 s, used only outside a screen |
| C-13.22 | Watch alone, outside a screen | §13.7 | — | ✅ | ⬜ | ⏸ | ⏸ | Web needs a screen for everything |

#### C-13.1 Pick a single file
Acceptance criteria: a file picker accepts the media types of C-13.5; with `playlist.add` the file is added (or opened,
C-13.10); without it, it is offered for matching only; the duration is read on the device before anything is sent.

#### C-13.2 Add a folder
Acceptance criteria: choosing a folder adds its media files (top level; subfolders are a later option) in natural
order; files already mapped to an item aren't added again.

#### C-13.3 Multi-select
Acceptance criteria: several files can be chosen at once and are added in natural order.

#### C-13.4 Natural order
Acceptance criteria: `EP 2` comes before `EP 10`; comparison ignores case.

#### C-13.5 Media file types
Acceptance criteria: every platform treats these as media: `.mkv .mp4 .m4v .avi .mov .webm .wmv .flv .ts .m2ts .mts
.mpg .mpeg .ogv .3gp .vob .divx .rmvb .mp3 .flac .m4a .aac .ogg .opus .wav` (case-insensitive); other files are
ignored with "Those aren't video or audio files".

#### C-13.6 Drag files in
Acceptance criteria: dropping files on the player adds them (with `playlist.add`) or offers them for matching; dropping
one file while the current item needs a file uses it as your copy; a drop highlight says which will happen.

#### C-13.7 Reorder
Acceptance criteria: with `playlist.reorder`, rows can be dragged to a new position and also moved with "Move up" and
"Move down" (the buttons are the accessible alternative, WCAG 2.5.7); each sends `playlist.move { id, to }`.

#### C-13.8 Remove
Acceptance criteria: with `playlist.remove`; removing the current item moves on to the next (else the previous),
keeping play or pause; its shared subtitles are deleted with it.

#### C-13.9 Play now
Acceptance criteria: with `playback.skip`, "Play now" sends `playlist.play` and the item starts from 0 with a scheduled
start.

#### C-13.10 Open now
Acceptance criteria: "Open" with one file or one link sends `load`, which inserts it after the current item and makes
it current, paused at 0; with several files they are added instead; a link needs `playlist.add_external`.

#### C-13.11 Playlist limits
Acceptance criteria: at most 200 items per playlist and per `playlist.add`; clients send large adds in chunks of 100;
the theatre rejects anything beyond 200 with "playlists hold at most 200 items", and the client shows it.

#### C-13.12 Automatic matching
Acceptance criteria: each local item is matched to the viewer's candidate files by score (3 = duration and name,
2 = duration only, 1 = name only), best scores first, then the smallest duration gap; each file is used once; manual
choices are kept.

#### C-13.13 Choose my file
Acceptance criteria: each local item has "Choose my file…", which maps that item to the chosen file, overriding the
automatic match; "Use the automatic match" undoes it.

#### C-13.14 Match my files
Acceptance criteria: anyone (no permission needed) can pick a folder or several files to match against the playlist
without adding them; the client reports "Matched n of m items".

#### C-13.15 Pick your file
Acceptance criteria: when the current item is local and unmapped, the player shows "Choose your copy" with the item
name and duration and a file button; the engine holds paused for that viewer and reports `nofile`.

#### C-13.16 Duration tolerance
Acceptance criteria: durations match when `|d_host − d_viewer| ≤ max(2 s, 0.5% × d_host)`.

#### C-13.17 Name comparison
Acceptance criteria: names match after lower-casing, removing an extension of 1–5 characters, and collapsing runs of
whitespace, `.`, `_` and `-` into one space.

#### C-13.18 Mismatch indicator
Acceptance criteria (§13.5): duration and name match → ✅; duration matches, name doesn't → ✅ with "same length,
different name: {file}"; duration doesn't match → ⚠ in the playlist row and over the video ("Your file's length differs
from the host's"), and the viewer reports `mismatch`; a mismatch never blocks playback.

#### C-13.19 Privacy of local files
Acceptance criteria: only the file name (without any path) and the duration are sent; the file's contents and path
never leave the device (on the web, files play from an object URL in memory).

#### C-13.20 Mixed playlists
Acceptance criteria: local, URL and YouTube items can be in one playlist and play in turn on every platform.

#### C-13.21 Resume position
Acceptance criteria (§13.7): the position of each local file and URL is saved locally every 5 s while playing; ignored
under 10 s and forgotten within 15 s of the end; at most 500 entries; used when watching alone ("Resumed at m:ss · Home
restarts"); inside a screen it is never applied automatically (the anchor rules), but the host can choose "Resume from
m:ss" when starting an item they have watched before (Appendix B 22).

#### C-13.22 Watch alone
Acceptance criteria: a file or link can be played without joining a screen, with every local option (C-16) and resume;
a file opened before creating a screen becomes its first item.

---

## Phase 14. External media: links and YouTube

**Goal.** Items every viewer gets automatically: direct links and YouTube videos.

| ID | Task | § | Th | Win | Web | And | Lin | Tests / notes |
|---|---|---|---|---|---|---|---|---|
| C-14.1 | Add a link: direct URL or YouTube, detected | §13.6, R12.13 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Th smoke; Win unit; Web unit |
| C-14.2 | Direct URL items play on every viewer | §13.6, R12.13 | — | ✅ | ✅ | ⏸ | ⏸ | Web: subject to the browser's codecs (C-15.3) |
| C-14.3 | URL items get a duration, so they end and auto-advance | §14.12 | ⬜ | ⬜ | ⬜ | ⏸ | ⏸ | Both clients send `duration: null`, so the theatre never ends a URL item (Appendix B 18) |
| C-14.4 | External items reach everyone automatically | §13.6, R12.15 | ✅ | — | — | — | — | Th smoke |
| C-14.5 | YouTube player | §13.6, R12.11 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | Th: `/yt` page. Win: WebView2. Web: shows "Use Kino for Windows" |
| C-14.6 | YouTube sync rules | §14.13, R12.12 | — | ✅ | 🟨 | ⏸ | ⏸ | Win unit. Web: the settings exist in `sync.ts` but aren't used |
| C-14.7 | Ads and YouTube buffering count as buffering | §14.13 | — | ✅ | ⬜ | ⏸ | ⏸ | |
| C-14.8 | End of a YouTube item: wait for everyone, host can skip | §14.13 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | Th smoke. **Web viewers never send `item.ended`, so a screen with a web viewer never leaves a YouTube item by itself** |
| C-14.9 | YouTube titles | §13.6 | — | ✅ | ⬜ | ⏸ | ⏸ | Win: oEmbed. Web: names items "YouTube {id}" |
| C-14.10 | YouTube errors explained | §15.5 | — | ✅ | ⬜ | ⏸ | ⏸ | Embedding disabled, private, removed |

#### C-14.1 Add a link
Acceptance criteria: one field accepts an http(s) link or a YouTube link or id (watch, shorts, embed, live, youtu.be,
m. and music. hosts, or a bare 11-character id); YouTube is stored as `https://www.youtube.com/watch?v=<id>`; a direct
link is named after the last part of its path (else its host); needs `playlist.add_external`, and the field says so
without it.

#### C-14.2 Direct URL items
Acceptance criteria: every viewer streams the URL itself with its own engine; the theatre only passes the link along
and never proxies media; a link that can't be played gets a clear message (C-15.2).

#### C-14.3 URL items get a duration
Without a duration the theatre can't schedule the end (§14.12), so the playlist stops after a URL item even with
auto-advance on.

Acceptance criteria:
1. The adding client probes the link's duration before sending it (Windows: libmpv or a probe; web: a hidden `<video>`
   with `preload=metadata`), with a 10 s timeout; if it can't, the item is sent with `null`.
2. Protocol (additive): a `item.duration { id, duration }` message, allowed only for the host or acting host and only
   while the item's duration is `null`, so the host's player can supply it once it has loaded the link.
3. A playlist of two URL items auto-advances (Th smoke).

#### C-14.4 Auto-distribute
Acceptance criteria: URL and YouTube items are on every viewer's playlist as soon as they are added, with no mapping.

#### C-14.5 YouTube player
Acceptance criteria: YouTube items play through the official IFrame Player API with YouTube's own controls hidden and
Kino's controls on top; Windows hosts it in WebView2 on `https://kino-directory.srie.workers.dev/yt` (an https origin,
which the API needs); the web client uses the API directly (WEB-14.P1); the engine drives it with play, pause, seek and
volume; position is read from the player at least every 250 ms (extrapolated between reports).

#### C-14.6 YouTube sync rules
Acceptance criteria (§14.13): no rate correction; dead zone 0.5 s; anything beyond 1.5 s gets a hard seek; while paused,
seeks only beyond 0.25 s; initial seek latency 0.5 s; host re-anchor beyond 0.75 s (the last three are in the code, not
yet in §22: Appendix B 15).

#### C-14.7 Ads and buffering
Acceptance criteria: YouTube's buffering state, and "unstarted" while Kino asked it to play (an ad or a click-to-play
wall), are reported as buffering.

#### C-14.8 End of a YouTube item
Acceptance criteria: each client sends `item.ended { id }` when its player reaches the end of the current YouTube item;
the theatre moves on when every connected viewer has sent it (a viewer who leaves stops counting); the host (or anyone
with `playback.skip`) can press Next at any time; a client that can't play YouTube must still not block the screen
(it sends `item.ended` at once, with a note to the viewer).

#### C-14.9 YouTube titles
Acceptance criteria: the adding client looks up the title (YouTube oEmbed, no API key) and uses it as the item name,
falling back to "YouTube video {id}".

#### C-14.10 YouTube errors
Acceptance criteria: player errors are explained: 101 or 150 "The owner doesn't allow this video to be played outside
YouTube"; 100 "This video is private or was removed"; others "YouTube couldn't play this video (error n)"; the viewer
reports `nofile` and the screen isn't blocked (C-14.8).

---

## Phase 15. Codecs and formats

**Goal.** Play everything the platform can, and explain clearly what it can't.

| ID | Task | § | Th | Win | Web | And | Lin | Tests / notes |
|---|---|---|---|---|---|---|---|---|
| C-15.1 | Full codec support through libmpv / FFmpeg | §15.5, R13.1, R13.3, R13.4 | — | ✅ | — | ⏸ | ⏸ | Win: `hwdec=auto-safe`; Android adds a software fallback |
| C-15.2 | Unsupported formats: a message that names the codec | §15.5, R13.2 | — | 🟨 | 🟨 | ⏸ | ⏸ | Win: the message exists but is overwritten within 250 ms (C-19.4). Web: generic "format or codec not supported" |
| C-15.3 | Web: know what this browser can play | §15.5, §21.1 | — | — | ⬜ | — | — | |
| C-15.4 | Web: remux unsupported containers (MKV → fragmented MP4) | §15.5, R13.5, R18.13 | — | — | ⬜ | — | — | |
| C-15.5 | Web: decode unsupported audio (AC-3, E-AC-3, DTS) | §15.5, R18.13 | — | — | ⬜ | — | — | |

#### C-15.1 Full codec support
Acceptance criteria: every common container and codec plays (MKV, MP4, AVI, MOV, WebM, TS; H.264, HEVC, VP9, AV1,
MPEG-2; AAC, AC-3, E-AC-3, DTS, FLAC, Opus), with hardware decoding where available and software otherwise.

#### C-15.2 Unsupported-format messages
Acceptance criteria: a file or link that can't be played shows a message that stays until dismissed and names the
codec or container when known ("This file uses the DTS-HD audio codec, which this browser can't decode"); the viewer
reports `nofile`; the message suggests what to do (another copy; on the web, Chrome or Edge, or Kino for Windows).

#### C-15.3 Web: what this browser can play
Acceptance criteria: when a file is added or chosen, the client reads its container and codec ids (a small JavaScript
demuxer such as mp4box.js for MP4 and a Matroska parser for MKV) and checks them with `MediaSource.isTypeSupported` and
`MediaCapabilities.decodingInfo`; it warns at once instead of failing at play time.

#### C-15.4 Web: remux
Acceptance criteria: an MKV (or other container) whose codecs the browser supports is remuxed to fragmented MP4 in a
Web Worker and played through Media Source Extensions, with seeking; memory stays bounded (stream from the `File`, don't
load it whole); the sync engine works unchanged on it.

#### C-15.5 Web: unsupported audio
Acceptance criteria: AC-3 and E-AC-3 (and DTS where licensing allows) are decoded with WebCodecs where the browser has
the decoder, else with a WebAssembly decoder, and played in step with the video; if neither is possible, C-15.2 applies.

---

## Phase 16. Viewer customisation (local only)

**Goal.** Personal viewing settings that never leave the device (§16).

| ID | Task | § | Th | Win | Web | And | Lin | Tests / notes |
|---|---|---|---|---|---|---|---|---|
| C-16.1 | Zoom 50–400% with pan | §16, R14.1 | — | ✅ | ⬜ | ⏸ | ⏸ | Win unit |
| C-16.2 | Aspect ratio override | §16, R14.2 | — | ✅ | ⬜ | ⏸ | ⏸ | |
| C-16.3 | Fit modes | §16, R14.3 | — | ✅ | ⬜ | ⏸ | ⏸ | Win unit (all five) |
| C-16.4 | Volume 0–100% and mute | §16, R14.4 | — | ✅ | ✅ | ⏸ | ⏸ | Web: not remembered (C-16.6) |
| C-16.5 | Volume boost to 200% with a one-time disclaimer | §16, R14.5 | — | ✅ | ⬜ | ⏸ | ⏸ | |
| C-16.6 | Remember preferences: defaults and per file | §16, R14.6 | — | ✅ | ⬜ | ⏸ | ⏸ | Win unit (`prefs.json`) |
| C-16.7 | Local-only guarantee | §16, R14.7 | ✅ | ✅ | ✅ | ⏸ | ⏸ | No protocol message carries them |

#### C-16.1 Zoom and pan
Acceptance criteria: zoom from 50% to 400% in 5% steps; pan of ±100% appears when zoomed above 100%.

#### C-16.2 Aspect ratio override
Acceptance criteria: Original, 16:9, 4:3, 21:9, 2.35:1, 1:1.

#### C-16.3 Fit modes
Acceptance criteria: Fit (letterbox), Fit width, Fit height, Stretch, Fill (crop); Fit width and Fit height become
letterbox or crop depending on the window's shape.

#### C-16.4 Volume and mute
Acceptance criteria: 0–100% with a slider, ↑/↓ and M; muting is local and never affects others.

#### C-16.5 Volume boost
Acceptance criteria: the first time the volume goes above 100%, a one-time notice about distortion and hearing safety
asks for confirmation; after that the slider goes to 200%; YouTube stays capped at 100%; on the web, boost works only
where the browser allows audio processing of the source (local files; links with CORS), and says so otherwise
(WEB-16.P1).

#### C-16.6 Remember preferences
Acceptance criteria: zoom, pan, aspect, fit, volume, boost acceptance, personal sync offset and subtitle settings are
saved locally as defaults; "Remember for this file only" saves an override for the current file; "Reset to defaults"
clears it; nothing is stored on the theatre.

#### C-16.7 Local-only guarantee
Acceptance criteria: no protocol message carries any C-16 setting, the personal offset or subtitle style; a review of
the protocol types confirms it.

---

## Phase 17. Subtitles

**Goal.** Load, share and style subtitles per video (§17).

| ID | Task | § | Th | Win | Web | And | Lin | Tests / notes |
|---|---|---|---|---|---|---|---|---|
| C-17.1 | Load an external subtitle file | §17.1, R15.1 | — | ✅ | ⬜ | ⏸ | ⏸ | |
| C-17.2 | A same-named file next to the video | §17.1, R15.1 | — | 🟨 | ⬜ | ⏸ | ⏸ | Win: left to libmpv's default and not offered as a choice. Web: needs folder access |
| C-17.3 | Formats: SRT, WebVTT, ASS/SSA | §17.1, R15.2 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | Win unit |
| C-17.4 | Embedded tracks ("In the file") | §17.1, R15.2 | — | ✅ | ⬜ | ⏸ | ⏸ | |
| C-17.5 | Subtitles belong to one playlist item | §17.1, R15.3 | ✅ | — | — | — | — | Th smoke (deleted with the item) |
| C-17.6 | "Also share with viewers" (upload) | §17.2, R15.4, R15.6 | ✅ | ✅ | 🟨 | ⏸ | ⏸ | Th smoke; Win live. Web: `uploadSubtitle` exists, no UI |
| C-17.7 | Stop sharing (unshare) | §17.2 | ✅ | ⬜ | ⬜ | ⏸ | ⏸ | Th smoke. Win: `UnshareSubtitleAsync` exists, no UI |
| C-17.8 | Download shared subtitles | §17.2, R15.6 | ✅ | ✅ | 🟨 | ⏸ | ⏸ | Win live. Web: `downloadSubtitle` exists, no UI |
| C-17.9 | Viewer's choice per item | §17.3, R15.5 | — | ✅ | ⬜ | ⏸ | ⏸ | |
| C-17.10 | Timing offset per file, ±10 s | §17.4, R15.7 | — | ✅ | ⬜ | ⏸ | ⏸ | Win unit |
| C-17.11 | Style | §17.4, R15.8 | — | 🟨 | ⬜ | ⏸ | ⏸ | Win: no outline colour |
| C-17.12 | "{name} shared subtitles" announcement | §17.2 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | Web: no chat to show it in |
| C-17.13 | No subtitles for YouTube items | §17.1 | — | 🟨 | — | ⏸ | ⏸ | Win: the Subtitles flyout still opens on YouTube items |

#### C-17.1 Load a file
Acceptance criteria: "Load a file…" in the Subtitles menu accepts `.srt`, `.vtt`, `.ass`, `.ssa`; the file is used for
the current item at once and offered as "Your file: {name}".

#### C-17.2 Same-named file
Acceptance criteria: when a local video is opened, a subtitle file with the same name next to it (`movie.srt` for
`movie.mkv`, also `movie.en.srt`) is listed as a choice ("Next to the video: {name}") but not turned on unless the
viewer's default says so.

#### C-17.3 Formats
Acceptance criteria: SRT, WebVTT and ASS/SSA render correctly, ASS with its own styling where the engine supports it;
the format comes from the extension; the theatre accepts `srt`, `vtt`, `ass`, `ssa` only.

#### C-17.4 Embedded tracks
Acceptance criteria: every subtitle track inside the file is listed as "In the file: {title · language}".

#### C-17.5 Per-item scope
Acceptance criteria: a shared file belongs to one playlist item; it is deleted when the item is removed or the screen
closes.

#### C-17.6 Share with viewers
Acceptance criteria: with `subtitles.share`, "Also share with viewers" uploads the file gzip-compressed to `POST
/screens/<code>/subs?item=&format=&name=` with `Authorization: Bearer <perScreenToken>`; the client refuses files over
1 MB compressed before uploading; the theatre allows at most 20 files per item and 100 per screen and the client shows
those errors; everyone receives `subs`.

#### C-17.7 Unshare
Acceptance criteria: the sharer, or anyone with `subtitles.share` ranked above them, can remove a shared file
(`subs.unshare { id }`); it disappears from everyone's choices, and anyone using it falls back to Off.

#### C-17.8 Download
Acceptance criteria: choosing a shared file downloads it (members only, gzip) once, caches it locally for the screen,
and shows it within 2 s on a normal connection.

#### C-17.9 Viewer's choice
Acceptance criteria: per item, each viewer picks Off, an embedded track, any shared file, or their own file; the choice
is local and kept when the item comes round again.

#### C-17.10 Timing offset
Acceptance criteria: ±10 s in 100 ms steps, per subtitle file, local only (§17.4 says "±ms"; Appendix B 14).

#### C-17.11 Style
Acceptance criteria (§17.4): font, size, colour, outline colour, outline width, background box on or off, box opacity,
vertical position; all local; a preview while editing.

#### C-17.12 Announcement
Acceptance criteria: "{name} shared subtitles: {file} (for {item})" appears in chat for everyone.

#### C-17.13 No subtitles for YouTube
Acceptance criteria: on YouTube items the Subtitles control is disabled with "Subtitles aren't available for YouTube
videos" (§17.1).

---

## Phase 18. Chat, reactions and GIFs

**Goal.** Talk while watching, without slowing the theatre down (§18).

| ID | Task | § | Th | Win | Web | And | Lin | Tests / notes |
|---|---|---|---|---|---|---|---|---|
| C-18.1 | Text chat with an unread count | §18, R16.1 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | Th smoke; Win unit (parse) |
| C-18.2 | Chat history for late joiners | §18, R16.2 | ✅ | ✅ | 🟨 | ⏸ | ⏸ | Th smoke. Web: kept in the session, never shown |
| C-18.3 | Emoji reactions | §18, R16.3 | ✅ | ✅ | 🟨 | ⏸ | ⏸ | Th smoke |
| C-18.3.1 | Send a reaction | §18 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | |
| C-18.3.2 | Reactions float over the video for 3 s | §18 | — | ✅ | 🟨 | ⏸ | ⏸ | Web: shown as toasts |
| C-18.4 | GIF search (GIPHY, key kept on the device) | §18, R16.4, R16.5 | — | ✅ | ⬜ | ⏸ | ⏸ | Win unit |
| C-18.5 | Pasted GIF links | §18, R16.4 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | Th unit (allow list); Win unit |
| C-18.6 | System messages | §18, R16.6 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | Th smoke |
| C-18.7 | Chat permissions and muted state | §18, R16.7 | ✅ | ✅ | ⬜ | ⏸ | ⏸ | Th smoke |

#### C-18.1 Text chat
Acceptance criteria: a Chat tab; messages up to 500 characters (newlines kept, control characters dropped; the client
stops input at 500); 5 messages per 5 s per viewer, shared with GIFs; the tab shows the number of unread messages from
others while it is hidden; links in messages aren't fetched or embedded (only GIFs from allowed hosts are shown as
images).

#### C-18.2 History
Acceptance criteria: the theatre keeps the last 100 messages (text, GIF, system) and sends them in `welcome.chat`; the
client shows them on join and de-duplicates by id.

#### C-18.3 Reactions
- **C-18.3.1** A reaction bar with exactly 👍 ❤️ 😂 😮 😢 🔥 👏 🎉; needs `chat.react` and not being muted; 10 per 5 s.
- **C-18.3.2** Each reaction floats over the video for 3 s with the sender's name; several can show at once (at most
  6); reactions are never stored or shown to late joiners.

#### C-18.4 GIF search
Acceptance criteria: the GIF picker searches GIPHY directly from the client (trending when empty; 24 results; rating
pg-13); each user enters their own free GIPHY API key once; it is stored only on their device; only the chosen GIF's
URL, size and title are sent (`chat.gif`); needs `chat.gif`.

#### C-18.5 Pasted GIF links
Acceptance criteria: an https link to an allowed GIF host (`media[0-9].giphy.com`, `i.giphy.com`, `media.tenor.com`,
`c.tenor.com`, `static.klipy.com`; no user info, default port) pasted into chat is sent as a GIF without needing a key;
the theatre rejects other hosts.

#### C-18.6 System messages
Acceptance criteria: joins, leaves, kicks, bans, co-host and role changes, host transfer, acting host, host back, now
playing, subtitle shares, hold and ready-check results appear in chat, styled apart from people's messages.

#### C-18.7 Permissions and muted state
Acceptance criteria: without `chat.send`, or when muted, the input is disabled with "You can't chat in this screen" or
"You are muted in this screen"; the GIF button and reaction bar follow `chat.gif` and `chat.react`; `rate_limited`
("slow down a little") is shown where it can be read (C-19.4).

---

## Phase 19. Notices, errors and resilience

**Goal.** People always know what happened and what to do next.

| ID | Task | § | Th | Win | Web | And | Lin | Tests / notes |
|---|---|---|---|---|---|---|---|---|
| C-19.1 | Plain-language text for every error code | §19.2 | — | 🟨 | ✅ | ⏸ | ⏸ | Win: `rate_limited` and `forbidden` show the theatre's raw text |
| C-19.2 | Kicked, banned, closed or replaced: back to the lobby with the reason | §6.5, §9 | ✅ | 🟨 | ✅ | ⏸ | ⏸ | Win: "replaced" and network give-ups stay on the video page |
| C-19.3 | Reconnecting indicator, visible everywhere | §6.4 | — | 🟨 | ✅ | ⏸ | ⏸ | Win: hidden in fullscreen; the overlay copy is overwritten |
| C-19.4 | Errors and notices stay long enough to read | — | — | 🟨 | ✅ | ⏸ | ⏸ | Win: action, codec and YouTube errors go to the sync overlay, which is rewritten every 250 ms. Web: 5 s toasts |
| C-19.5 | `update_required` tells people to update | §19.2 | — | ✅ | ✅ | ⏸ | ⏸ | |
| C-19.6 | Form errors shown where the form is | — | — | 🟨 | ✅ | ⏸ | ⏸ | Win: settings-page errors go to a hidden overlay |
| C-19.7 | Progress for slow actions | — | — | ✅ | ✅ | ⏸ | ⏸ | Connecting, joining, creating, reading files |

#### C-19.1 Error wording
Acceptance criteria: each code in protocol §4.4 has client wording: `wrong_password` "Wrong password."; `full` "This
screen is full."; `banned` "You can't join this screen."; `not_found` "That screen doesn't exist (any more)."; `closed`
"The screen has closed."; `kicked` "You were removed from the screen."; `update_required` "This theatre needs a newer
version of Kino" (with update link or reload); `rate_limited` "Too many attempts; try again in a minute" or "Slow down a
little" (chat); `forbidden` "You don't have permission to do that"; `bad_request` the theatre's message.

#### C-19.2 Fatal ends
Acceptance criteria: on `kicked`, `banned`, `closed`, close 4000 (replaced), a give-up after 60 s of reconnecting, or a
screen that no longer resolves, the client leaves the screen view, returns to the lobby and shows the reason there.

#### C-19.3 Reconnecting indicator
Acceptance criteria: while reconnecting, a visible "Reconnecting… (playback continues)" indicator is shown in the
screen view, in fullscreen too, until reconnected or given up.

#### C-19.4 Notices stay readable
Acceptance criteria: transient notices (a rejected action, rate limits, "Invite copied") show for at least 5 s in a
notice area that nothing else overwrites; errors that need an action (codec, YouTube, file) stay until dismissed or
resolved; at most 3 at once.

#### C-19.5 `update_required`
Acceptance criteria: the message offers the fix: Windows a link to the download page; web "Reload the page".

#### C-19.6 Form errors
Acceptance criteria: create, join, settings and role forms show their errors next to the form (or the field), and keep
what was typed.

#### C-19.7 Progress
Acceptance criteria: creating, joining ("Looking for 7K3QXM…", "Joining {name}…"), connecting and reading files
("Reading 3 of 12: {name}") show progress, and the action can't be started twice.

---

## Phase 20. Builds, distribution and updates

**Goal.** Each client is built, released and updated from its own repo (§21).

| ID | Task | § | Th | Win | Web | And | Lin | Tests / notes |
|---|---|---|---|---|---|---|---|---|
| C-20.1 | Release packages | §21, R17.1, R17.3, R17.4, R17.5 | — | ✅ | ✅ | ⏸ | ⏸ | Win: installer and portable, x64/x86/ARM64. Web: static build. Android APK, Linux AppImage/deb on hold |
| C-20.2 | Release pipeline in each repo's CI | §21 | ✅ | ✅ | 🟨 | ⏸ | ⏸ | Th: deploy script. Web: `npm run deploy` by hand; the README's "deployed from main" can't be confirmed from the repo |
| C-20.3 | Signed releases | — | — | 🟨 | — | ⏸ | ⏸ | Win: SignPath pipeline ready, waiting for approval |
| C-20.4 | Update notice | — | — | ✅ | ⬜ | ⏸ | ⏸ | Win unit (`UpdatesTests`). Web: no new-version prompt |
| C-20.5 | Download page picks the right file | §21 | ✅ | — | — | — | — | UI: manual |
| C-20.6 | Bundled theatre list matches `servers.json` | §4.2 | ✅ | ✅ | ✅ | ⏸ | ⏸ | Aurora and Nova in all three |
| C-20.7 | About: version, licence, credits, privacy | — | — | 🟨 | ⬜ | ⏸ | ⏸ | Win: a version line in the lobby only |

#### C-20.1 Release packages
Acceptance criteria:
- **Windows:** a per-user installer (no admin; uninstaller that offers to delete local data) and a portable zip, for
  x64, x86 and ARM64, each with libmpv for that architecture; Windows 10 (19041) or later.
- **Web:** `vite build` output served by the `kino-web` static-assets Worker with single-page-app fallback.
- **Android:** a signed APK (and later an AAB).
- **Linux:** an AppImage and a .deb.

#### C-20.2 Release pipeline
Acceptance criteria:
1. Windows: pushing tag `v<version>` (equal to the version in `Directory.Build.props`) builds every architecture and
   publishes a GitHub Release with version-less file names (`Kino-Setup-x64.exe`, `Kino-Portable-x64.zip`, …),
   `SHA256SUMS.txt` and notes from `CHANGELOG.md`; versions with `-` are pre-releases.
2. Web: every push to `main` that passes CI deploys to production automatically (Cloudflare Workers Builds or a CI
   deploy step), and the deployed commit is visible (C-20.4, C-20.7).
3. Theatre: a deploy is one command per theatre (C-1.12).
4. The main README and download page link to `releases/latest/download/<file>`.

#### C-20.3 Signed releases
Acceptance criteria: Windows release binaries (`Kino.exe`, `Kino.dll`, `Kino.Core.dll`, `Kino.Player.dll`) and the
installer are signed through SignPath Foundation and the signature is verified in the workflow; the release notes stop
saying "isn't code-signed yet"; Android APKs are signed with the release key.

#### C-20.4 Update notice
Acceptance criteria:
- **Windows:** at launch (after 5 s) the app checks the latest stable GitHub release; if newer, an info bar offers
  "Download"; drafts and pre-releases are ignored; network failures are silent; a setting turns the check off.
- **Web:** when a newer build is deployed while the app is open, a notice offers "Reload" (never reloads by itself while
  in a screen).

#### C-20.5 Download page
Acceptance criteria: `https://kino-directory.srie.workers.dev/download` detects x64, ARM64 or x86 and offers the
matching installer, with links to every file.

#### C-20.6 Bundled theatre list
Acceptance criteria: every client's bundled list has the same entries as `servers.json`; adding a theatre updates all of
them in the same release cycle.

#### C-20.7 About
Acceptance criteria: an About page or dialog shows the version (and, on the web, the deployed commit), the licence
(GPL-3.0-or-later), a source link, credits for third-party components, and what is stored locally and what is shared.

---

## Phase 21. Quality and the cross-platform test

**Goal.** Automated confidence on every platform, then every platform in one screen.

| ID | Task | § | Th | Win | Web | And | Lin | Tests / notes |
|---|---|---|---|---|---|---|---|---|
| C-21.1 | Theatre tests in CI | — | ✅ | — | — | — | — | Th unit, Th smoke |
| C-21.2 | Client core unit tests in CI | — | — | ✅ | ✅ | ⏸ | ⏸ | Win: about 140 test cases; Web: Vitest |
| C-21.3 | Live tests against a real theatre in CI | — | — | 🟨 | ✅ | ⏸ | ⏸ | Win: CI never sets `KINO_LIVE_THEATRE`, and unset live tests count as passed. Web: CI starts `wrangler dev` |
| C-21.4 | Browser end-to-end test in CI | — | — | — | ✅ | — | — | Chrome only |
| C-21.5 | UI test suite per client | — | — | ⬜ | 🟨 | ⏸ | ⏸ | Web e2e covers create, open, join, play, seek, pause and leave only |
| C-21.6 | Release test checklist per platform | — | ⬜ | ⬜ | ⬜ | ⏸ | ⏸ | The manual part of the definition of done, written down |
| C-21.7 | Cross-platform sync test | §21, R17.6 | ⬜ | ⬜ | ⬜ | ⏸ | ⏸ | Sub-tasks below |
| C-21.7.1 | Test plan and matrix | §21 | ⬜ | ⬜ | ⬜ | ⏸ | ⏸ | |
| C-21.7.2 | Windows and Web in one screen: sync | §14 | ⬜ | ⬜ | ⬜ | — | — | |
| C-21.7.3 | Roles, permissions and moderation across platforms | §8, §9 | ⬜ | ⬜ | ⬜ | ⏸ | ⏸ | Needs Web Phase 8 and 9 |
| C-21.7.4 | Chat, GIFs and reactions across platforms | §18 | ⬜ | ⬜ | ⬜ | ⏸ | ⏸ | Needs Web Phase 18 |
| C-21.7.5 | Shared subtitles across platforms | §17 | ⬜ | ⬜ | ⬜ | ⏸ | ⏸ | Needs Web Phase 17 |
| C-21.7.6 | YouTube across platforms | §14.13 | ⬜ | ⬜ | ⬜ | ⏸ | ⏸ | Needs C-14.5 on the web |
| C-21.7.7 | Handover across platforms | §7 | ⬜ | ⬜ | ⬜ | ⏸ | ⏸ | |
| C-21.7.8 | Network faults across platforms | §6.4 | ⬜ | ⬜ | ⬜ | ⏸ | ⏸ | |
| C-21.7.9 | Every platform in the same screen | §21 | ⬜ | ⬜ | ⬜ | ⏸ | ⏸ | The gate for Phase 23 |
| C-21.7.10 | Automated Windows + Web live test | §21 | ⬜ | ⬜ | ⬜ | — | — | |
| C-21.8 | Soak and scale | §20, §22 | ⬜ | ⬜ | ⬜ | ⏸ | ⏸ | 25 viewers, 3 hours |

#### C-21.1 Theatre tests
Acceptance criteria: unit tests (anchor, crypto, rbac, playlist, chat, subs, rate limits) and the smoke test (every
protocol feature against `wrangler dev`) run on every push; a failure blocks merging.

#### C-21.2 Client unit tests
Acceptance criteria: sync engine, rate controller, clock sync, status reporter, matching, invites, lobby, directory,
protocol parsing, prefs and updates are unit tested in each client and run in CI.

#### C-21.3 Live tests in CI
Acceptance criteria: each client's CI starts a local theatre (`wrangler dev` from the main repo) and runs its live
tests against it; a live test without a theatre is reported as **skipped**, never as passed.

#### C-21.4 Browser end-to-end test
Acceptance criteria: two headless browsers create, join and play a generated clip, and stay within 100 ms after play and
seek, 80 ms after 8 s of playback and 60 ms when paused; runs in CI (Chrome; Firefox and WebKit in WEB-21.P1).

#### C-21.5 UI test suites
Acceptance criteria: each client has automated UI tests for the core tasks of C-23.1.5 (Windows: FlaUI or WinAppDriver;
web: Playwright; Android: Compose UI tests; Linux: Qt Quick Test); afterwards, "UI: manual" is no longer accepted for
new ✅ statuses on that platform.

#### C-21.6 Release test checklist
Acceptance criteria: each platform repo has a short manual checklist (install or open, create, join from a link,
private join, play, seek, pause, a 5-minute sync check, chat, subtitles, YouTube, leave, uninstall) that is run and
recorded for every release.

#### C-21.7 Cross-platform sync test
All platforms speak the same protocol, so any mix must work in one screen (§21).

- **C-21.7.1 Plan and matrix:** host on each platform × viewer on each platform; browsers Chrome, Edge, Firefox and
  Safari; networks: same LAN, different networks, one on mobile data; theatres Aurora and Nova.
- **C-21.7.2 Windows and Web sync:** a Windows host and two web viewers (and the reverse) on the same file: after play,
  seek and pause, every viewer is within 100 ms within 10 s; after 30 minutes of playback, within 80 ms; a 1.5 s
  knock on one viewer recovers by rate alone within 45 s; drift readouts and statuses agree across platforms.
- **C-21.7.3 Roles and moderation:** roles, overrides, mute, kick and ban set on one platform take effect on the others.
- **C-21.7.4 Chat:** text, GIFs and reactions sent on each platform appear correctly on every other one.
- **C-21.7.5 Subtitles:** a file shared from each platform is downloaded and shown on every other one, with each
  viewer's own offset and style.
- **C-21.7.6 YouTube:** a YouTube item plays in step on every platform and the screen advances only when everyone has
  finished.
- **C-21.7.7 Handover:** a host on one platform drops; a co-host on another becomes acting host and keeps the timeline;
  the host returns and takes over.
- **C-21.7.8 Network faults:** each platform loses its network for 10 s and for 70 s; the first rejoins silently, the
  second returns to the lobby; nobody else is disturbed.
- **C-21.7.9 Every platform in one screen:** Windows, Web, Android and Linux viewers in one screen through a whole
  mixed playlist (local, URL, YouTube) with chat and subtitles; every acceptance criterion of C-21.7.2 to C-21.7.8 holds.
- **C-21.7.10 Automated:** a CI job (Windows runner) runs the Windows live client and the web live client in one screen
  against `wrangler dev` and checks C-21.7.2's numbers.

Acceptance criteria: every sub-task's results are recorded (date, versions, numbers) in the test plan; C-21.7.9 is the
gate for Phase 23.

#### C-21.8 Soak and scale
Acceptance criteria: a screen at the 25-viewer cap (simulated viewers allowed) runs for 3 hours with chat; the theatre
never rate-limits normal traffic; every real viewer stays within 100 ms; the Durable Object usage is recorded for C-1.9.

---

## Phase 22. Later / to be planned

**Goal.** Ideas that are deferred. None of them is part of the Phase 23 gate. Each needs planning before work starts.

| ID | Task | § | Th | Win | Web | And | Lin | Tests / notes |
|---|---|---|---|---|---|---|---|---|
| C-22.1 | User-added theatres | §4.5, R1.12 | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ | |
| C-22.2 | More theatres: Orion, Lyra, Vega, Polaris | §4.1 | ⏸ | — | — | — | — | When usage needs them |
| C-22.3 | Compact binary encoding | §19.2 | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ | Only if budgets require it |
| C-22.4 | Own YouTube player | §14.13 | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ | **Not yet planned** |

#### C-22.1 User-added theatres
Anyone deploys the theatre Worker to their own free Cloudflare account (a "Deploy to Cloudflare" button) and pastes its
URL into the app, which checks it with `/info`. User-added theatres are shown only to the viewer who added them, unless
later added to `servers.json` (§4.5).

#### C-22.2 More theatres
Each new theatre is a separate free account, named from the sky list, added to `servers.json` and every bundled list
(C-20.6).

#### C-22.3 Compact binary encoding
JSON stays until measurements (C-1.9, C-21.8) show the message volume matters; any change is a protocol version bump.

#### C-22.4 Own YouTube player
**Status: on hold, not yet planned.**

- **Current plan (unchanged):** YouTube items play in the official YouTube IFrame player with Kino's own controls on
  top. That is C-14.5 (the web YouTube task, WEB-14.5) and its Windows equivalent (WIN-14.5, the WebView2 player).
- **What was discussed:** a Kino-owned player that extracts the video streams (yt-dlp) and plays them in libmpv on
  Windows, which would give YouTube items the same smooth rate correction and the same controls as local files.
- **Deferred** to be planned later. Open questions to settle then:
  1. The YouTube Terms of Service risk of extracting streams instead of using the official player.
  2. Keeping yt-dlp, and the JavaScript runtime it now needs, up to date on every client, since YouTube changes often.
  3. It isn't feasible on the web: stream URLs are blocked by CORS and bound to the IP address that requested them, so a
     browser would need the video proxied, and Kino never streams or proxies video (§1).

---

## Phase 23. Layout and Design Language rework (gated)

**Goal.** Completely optimise the UI of every distribution (Windows, Web, Android, Linux, and the directory site's pages)
under one design language: the same Kino everywhere, native-feeling on each platform, accessible to WCAG 2.2 AA.

### The gate (read this first)

> **Nothing in Phase 23 starts until the gate below passes.** Not design work, not prototypes, not implementation.
> The only thing allowed earlier is writing down UI problems as they are noticed, in the audit baseline
> (C-23.1, "Known issues at the time of writing"), so they are not lost.

The gate passes when **all** of these are true, and the check is recorded in C-23.0:

1. Every task in Phases 0 to 21 is ✅ in the Windows, Web, Android and Linux columns, or is marked "—" (does not
   apply) for that platform. Phase 22 ("Later / to be planned") is excluded from the gate.
2. ✅ here means the full definition of done: implemented, automated tests, and verified by hand on a real device.
3. C-21.7.9 (every platform in the same screen) is ✅.
4. No release-blocking bug is open on any platform.
5. The behaviour this phase must keep is frozen: the protocol, the sync engine constants (§22) and every
   acceptance criterion in Phases 0 to 21. The rework changes how Kino looks and is used, never what it does.
   The one planned protocol change is the additive structured system messages for localisation (C-23.9.6).

| ID | Task | § | Th | Win | Web | And | Lin | Tests / notes |
|---|---|---|---|---|---|---|---|---|
| C-23.0 | Gate check | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Record the date and the commit of every repo when the gate passes |
| C-23.1 | UI/UX audit of every current screen | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Th = directory pages (join, download) |
| C-23.1.1 | Screen inventory with screenshots | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C-23.1.2 | Heuristic review with severities | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C-23.1.3 | Accessibility audit (automated and manual) | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C-23.1.4 | Cross-platform consistency audit | — | — | ⬜ | ⬜ | ⬜ | ⬜ | |
| C-23.1.5 | Task-time baseline for the core tasks | — | — | ⬜ | ⬜ | ⬜ | ⬜ | |
| C-23.2 | Design principles | — | — | — | — | — | — | Written once, for all platforms: ⬜ |
| C-23.3 | Design language and tokens | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Columns = tokens wired into that platform |
| C-23.3.1 | Colour, "Sky & stars", light and dark | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C-23.3.2 | Typography | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C-23.3.3 | Spacing and sizing | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C-23.3.4 | Corner radius | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C-23.3.5 | Elevation | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C-23.3.6 | Motion | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C-23.3.7 | Token pipeline (one source, generated per platform) | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C-23.4 | Iconography and app icon | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C-23.5 | Component library specification | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Sub-tasks C-23.5.1 to C-23.5.18 below |
| C-23.6 | Layouts per form factor | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C-23.6.1 | Desktop window | — | — | ⬜ | — | — | ⬜ | |
| C-23.6.2 | Responsive browser | — | ⬜ | — | ⬜ | — | — | |
| C-23.6.3 | Phone | — | — | — | ⬜ | ⬜ | — | Web = phone browsers |
| C-23.6.4 | Tablet | — | — | — | ⬜ | ⬜ | — | Web = tablet browsers |
| C-23.7 | Screen-by-screen redesign | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Sub-tasks C-23.7.1 to C-23.7.22 below |
| C-23.8 | Accessibility, WCAG 2.2 AA | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C-23.9 | Localisation readiness | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Th: C-23.9.6 needs a protocol addition |
| C-23.10 | Per-platform implementation | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Detail in each platform roadmap (WIN-23, WEB-23) |
| C-23.11 | Visual regression testing | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |
| C-23.12 | Usability testing | — | — | ⬜ | ⬜ | ⬜ | ⬜ | |
| C-23.13 | Rollout | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |

Every sub-task of C-23.5 and C-23.7 has the same five status columns, all ⬜; they are listed in the detail below
rather than repeated in the table. Deliverables live in a new `design/` folder in this repo unless a task says otherwise.

#### C-23.0 Gate check

Confirm the gate conditions above, one by one, against this file and the two platform roadmaps.

Acceptance criteria:
1. A dated note in this section lists each gate condition with "met" and the evidence (the status columns, the
   C-21.7.9 test record, the bug list).
2. The commit hash of every repo (main, Windows, Web, Android, Linux) at the moment of the check is recorded.
3. If any condition is not met, the phase does not start, and the blocking task IDs are listed.

#### C-23.1 UI/UX audit of every current screen

Look at what exists before changing anything. The audit covers every screen, panel, flyout, dialog, over-video
overlay, notice and installer or directory page on every platform.

- **C-23.1.1 Screen inventory.** One row per surface and platform: name, how to reach it, the permission it needs, and
  screenshots at each relevant size: desktop 1280×800 and 1920×1080 (100% and 150% scale); browser 360×740, 768×1024,
  1440×900; phone 360×800 portrait and landscape; tablet 800×1280 both ways; each in light and dark.
- **C-23.1.2 Heuristic review.** Nielsen's ten heuristics plus three Kino-specific ones: *sync confidence* (can I tell
  at a glance that I am in step?), *who is in control* (who can play, pause and seek right now?), and *my copy* (do I
  know which file I am playing and whether it matches?). Each finding gets a severity from 0 (not a problem) to 4
  (blocks the task), the screen, the platform and a screenshot.
- **C-23.1.3 Accessibility audit.** Automated: axe-core on every web screen; Accessibility Insights for Windows (FastPass)
  on every Windows surface; Android Accessibility Scanner; Accerciser on Linux. Manual: keyboard only; NVDA and Narrator
  on Windows; VoiceOver on macOS and iOS Safari; TalkBack on Android; Orca on Linux; 200% text; high contrast and forced
  colours; reduced motion.
- **C-23.1.4 Consistency audit.** The same task compared across platforms: wording, order of actions, icons, colours,
  shortcuts and where each control lives. Every difference is listed as "intended (platform convention)" or "fix".
- **C-23.1.5 Task-time baseline.** Time on task and success for the core tasks, with at least three people per platform:
  (a) create a screen and start a local video; (b) join from an invite link, including a password; (c) match your own
  file when it has a different name; (d) make someone co-host and move them to the top; (e) share subtitles and pick
  them as a viewer; (f) send a GIF and a reaction; (g) fix a constant delay with the personal sync offset;
  (h) recover after the connection drops; (i) create a role and give it to a viewer.

Acceptance criteria:
1. `design/audit.md` contains the inventory, every finding with its severity, and the baseline numbers.
2. Every surface listed in "Known issues at the time of writing" below is reviewed and each issue is confirmed, fixed
   by a C-23.7 task, or closed with a reason.
3. Every severity 3 or 4 finding maps to at least one C-23.7 sub-task.

**Known issues at the time of writing** (seeded from the code while this roadmap was written; not a substitute for the
audit):

| Surface | Platform | Issue |
|---|---|---|
| Every control | Web | Emoji and text symbols are used as icons (▶ ⏸ ⏮ ⏭ 🔇 🔊 ⛶ 🔒 📁 ✕ ↑ ↻ ＋ 👤). They render differently per OS and have no consistent size or weight. |
| Side panel tabs | Web | `role="tablist"` is set, but the buttons have no `role="tab"` or `aria-selected`, and arrow keys don't move between tabs. |
| Over-video banners | Web | Hold, ready check, mismatch and file-reading notices are stacked with fixed pixel offsets (`top: 60`, `bottom: 12`), so two notices can overlap. |
| Viewer list | Web | Device is plain text ("web", "windows"), latency is a bare number with no colour band, and status relies on colour plus a word. |
| Reactions | Web | Reactions arrive as text toasts ("Alice 🎉") instead of floating over the video. |
| Lobby | Web | Unreachable theatres can still be picked in the create dialog; the theatre health strip is small grey text. |
| Dialogs | Web | Focus moves into a dialog, but it isn't trapped there and doesn't return to the opener on close. |
| Layout | Web | One breakpoint (820 px); below it the video is fixed at 62vh and the panel stacks under it; there is no phone landscape layout. |
| Colours | Web | Light and dark come only from `prefers-color-scheme`; there is no in-app choice. |
| Video overlays | Windows | libmpv renders into a child window, so XAML can't draw over the video (the "airspace" problem); everything near the video is a popup or side panel. Any overlay design must account for this (see WIN-23 in the Windows roadmap). |
| Strings | All | UI strings are written inline in code (`.tsx`, XAML and C#); none are in resource files. |
| System messages | Theatre | Chat system messages are English sentences built by the theatre ("Alice joined"), so clients can't translate them (C-23.9.6). |

#### C-23.2 Design principles

Write and agree the principles every later decision is checked against:

1. **The video comes first.** Chrome recedes while playing; controls hide after 3 s without input; nothing covers the
   picture unless it needs an answer (hold, ready check, pick your file).
2. **Always show who is in control and whether you are in sync.** Sync state, host and your own permissions are
   readable at a glance, without opening anything.
3. **Personal stays personal.** Local-only settings (zoom, volume, offset, subtitle style) are visibly separate from
   screen settings and are labelled "Only you".
4. **Calm corrections.** Sync changes are communicated quietly: no flashing, shaking or alarming colours for normal
   catching up.
5. **Same Kino everywhere, native on each.** Shared tokens, icons and wording; each platform's own conventions for
   menus, dialogs, shortcuts, back navigation and window chrome.
6. **Accessible by default.** WCAG 2.2 AA is the floor, keyboard-complete on desktop and web, motion optional.
7. **Say it plainly.** British English, short sentences; every error says what happened and what to do next.

Acceptance criteria:
1. `design/principles.md` has the principles, each with one "do" and one "don't" example from Kino's own screens.
2. Every C-23.7 sub-task names the principles it serves, and its review checks them.

#### C-23.3 Design language and tokens

All values are **tokens**: named, platform-neutral values that each platform consumes. No screen uses a raw colour,
size or duration.

**C-23.3.1 Colour: "Sky & stars".** Kino's theatres are named after the sky (Aurora, Nova, Orion, Lyra, Vega,
Polaris); the palette follows: a night sky for dark, a clear day sky for light, aurora teal and starlight gold as
accents.

- Semantic tokens (both themes): `canvas`, `surface-1`, `surface-2`, `surface-3`, `scrim` (over video),
  `border`, `border-strong`, `text-primary`, `text-secondary`, `text-disabled`, `text-on-accent`, `accent`,
  `accent-hover`, `accent-pressed`, `focus-ring`, `aurora`, `star` (host), `danger`, `warning`, `success`, `info`;
  status: `status-sync`, `status-catching`, `status-buffering`, `status-mismatch`, `status-waiting`, `status-nofile`;
  latency: `latency-good` (< 100 ms), `latency-fair` (100–250 ms), `latency-poor` (> 250 ms) (§12).
- Proposed starting values (to be checked against the contrast rules below before adoption):

  | Token | Dark (night sky) | Light (day sky) |
  |---|---|---|
  | `canvas` | `#0B0E1A` | `#F5F7FD` |
  | `surface-1` | `#121731` | `#FFFFFF` |
  | `surface-2` | `#1A2142` | `#EEF1FA` |
  | `surface-3` | `#232B55` | `#E2E7F5` |
  | `border` | `#2E3768` | `#D6DBEE` |
  | `text-primary` | `#EEF0FB` | `#141833` |
  | `text-secondary` | `#A7ADD6` | `#4F5580` |
  | `accent` (sky) | `#8AB4FF` | `#2F55D4` |
  | `aurora` | `#4FD1B5` | `#0F7F6B` |
  | `star` | `#FFD36E` | `#8A5E00` |
  | `danger` | `#FF7A85` | `#C62839` |
  | `warning` | `#FFCC66` | `#8A5A00` |
  | `success` | `#5FD39A` | `#137A4B` |
  | `info` | `#6FB7FF` | `#1B66C9` |
  | `scrim` | `rgb(0 0 0 / 0.6)` | `rgb(0 0 0 / 0.6)` (over video the scrim is dark in both themes) |

- Theme choice: "Follow system" (default), "Light", "Dark", stored locally. High contrast (Windows) and
  `forced-colors` (web) map tokens to system colours instead of the palette.
- Role colours are picked by people (C-8.5), so they can't be trusted for contrast: a role is shown as a coloured dot
  or bar next to text in `text-primary`, never as coloured text on its own.
- An optional decorative starfield (dark) or dawn gradient (light) on the lobby only; never behind text without a
  surface; off under reduced motion and reduced transparency.

Acceptance criteria:
1. Every text token on every surface it is used on meets 4.5:1 (normal text) or 3:1 (text ≥ 18.66 px bold or 24 px);
   every non-text UI token (borders of inputs, icons, focus ring) meets 3:1 against its neighbours (WCAG 1.4.3, 1.4.11).
   The check is automated from the token file and runs in CI.
2. Text over video always sits on `scrim`, giving ≥ 4.5:1 over a pure white frame.
3. No status is shown by colour alone: each status token is paired with an icon (C-23.4) and a text label.
4. Windows high contrast themes and web `forced-colors: active` show every control and status legibly (manual check).

**C-23.3.2 Typography.** Platform fonts, one scale.

- Families: Windows "Segoe UI Variable" (fallback "Segoe UI"); web `system-ui, "Segoe UI", -apple-system,
  "SF Pro Text", Roboto, "Noto Sans", sans-serif` (no web font download); Android "Roboto Flex" (system); Linux
  "Noto Sans" (system default respected). Monospace: "Cascadia Mono", `ui-monospace`, "Roboto Mono", "Noto Sans Mono".
- Scale (size/line height in px or sp): Display 32/40 semibold; Title 24/32 semibold; Subtitle 18/24 semibold;
  Body 14/20 regular; Body strong 14/20 semibold; Caption 12/16 regular; Code 14/20 mono; Screen code display
  28/36 mono with 0.14 em letter spacing.
- Times, pings and counts use tabular figures so they don't jitter as they change.

Acceptance criteria:
1. Nothing is smaller than 12 px (Caption).
2. Text scales with the OS setting (Windows text size up to 225%, browser zoom and text-only zoom to 200%, Android
   font scale 2.0) without clipping or overlap (WCAG 1.4.4, 1.4.12).
3. The playback time, drift readout and viewer pings don't change width as digits change.

**C-23.3.3 Spacing and sizing.** 4 px grid. Tokens `space-1` to `space-10` = 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 px.
Control heights: small 24, medium 32, large 40 (desktop); touch targets at least 44×44 px on the web and 48×48 dp on
Android.

Acceptance criteria:
1. Every layout uses spacing tokens only (lint or review check).
2. Every interactive target is at least 24×24 CSS px with spacing (WCAG 2.5.8) everywhere, and at least 44×44 px on
   touch layouts.

**C-23.3.4 Corner radius.** `radius-0` 0, `radius-sm` 4, `radius-md` 8, `radius-lg` 12, `radius-xl` 16,
`radius-pill` 999. On Windows, controls use 4 and overlays 8, as Fluent does (`ControlCornerRadius`,
`OverlayCornerRadius`).

Acceptance criteria: one radius per component type, documented in its component spec (C-23.5).

**C-23.3.5 Elevation.** Levels 0 (flat), 1 (hovered row, cards), 2 (menus and flyouts), 3 (dialogs), 4 (toasts and
banners over video). Dark theme shows elevation mainly by lighter surfaces (`surface-1` to `surface-3`); light theme
adds shadows `shadow-1` to `shadow-4`.

Acceptance criteria: each level has a token per theme; no component invents its own shadow.

**C-23.3.6 Motion.** Durations `motion-fast` 100 ms, `motion-normal` 200 ms, `motion-slow` 300 ms,
`motion-emphasis` 400 ms. Easing `ease-standard` cubic-bezier(0.2, 0, 0, 1), `ease-decelerate` (0, 0, 0, 1),
`ease-accelerate` (0.3, 0, 1, 1). Fixed behaviour from the spec: reactions float for 3 s (§18); controls hide after
3 s without input while playing.

Acceptance criteria:
1. With reduced motion on (Windows "Animation effects" off, `prefers-reduced-motion: reduce`, Android "Remove
   animations"), movement becomes fades of at most 100 ms, reactions appear in place without floating, and the
   starfield is static.
2. Nothing flashes more than three times per second (WCAG 2.3.1); animated GIFs follow C-23.8.1 AC 5.
3. No animation runs on the video area while playing except the controls fade and reactions.

**C-23.3.7 Token pipeline.** One source file, `design/tokens.json` (W3C Design Tokens Community Group format),
generates: WinUI `ThemeDictionaries` (Light, Dark, HighContrast) for Windows; CSS custom properties for the web and
the directory pages; a Compose `KinoTheme` for Android; a QML singleton for Linux.

Acceptance criteria:
1. A script regenerates every platform file from `tokens.json`; CI in each repo fails if a generated file is out of date.
2. The contrast check of C-23.3.1 AC 1 runs on the same file.

#### C-23.4 Iconography and app icon

One icon family across platforms: **Fluent System Icons** (MIT licence; available as SVG and font, so it works on
Windows, the web, Android and Linux). Sizes 16, 20 and 24; regular style, filled for selected states. Emoji are kept
only for reactions (§18).

The icon set must cover: play, pause, previous, next, back 10 s, forward 10 s, volume (off, low, high), volume boost,
fullscreen and exit fullscreen, picture-in-picture, subtitles, audio track, picture and sound (sliders), playlist,
viewers, chat, GIF, reaction, invite (person add), link, copy, regenerate, settings, lock (private), eye off (hidden),
host (star), co-host (half star or shield with rank number), acting host, role (tag), chat mute, kick (person remove),
ban (prohibited), devices (Windows, Linux, Android, web: generic device glyphs, not brand logos), latency (signal bars
with 1, 2 or 3 bars), sync states (in sync: check circle; catching up: arrow sync; buffering: spinner; file differs:
warning; waiting: clock; no file: document dismiss), file, folder, drag handle, more (…), close, back, search, filter,
sort, refresh, theatre, update, information, error, success. YouTube items use a generic "video link" icon unless use of
the YouTube logo is allowed by YouTube's branding rules.

App icon: an SVG master of the Kino mark, exported to Windows `.ico` (16, 20, 24, 32, 40, 48, 64, 256), web favicon and
PWA icons (192, 512, maskable), Android adaptive icon (foreground and background layers), Linux hicolor sizes (16 to
512).

Acceptance criteria:
1. No emoji or text character is used as a UI icon anywhere (reactions excepted).
2. Every icon-only control has an accessible name and a tooltip that includes its shortcut, if any.
3. Icons meet 3:1 contrast (C-23.3.1) and are legible at 16 px at 100% scale.
4. The app icon is crisp at every listed size on every platform.

#### C-23.5 Component library specification

Each component gets a spec in `design/components/<name>.md` with: anatomy; variants; sizes; states (rest, hover,
pressed, focus-visible, disabled, selected, error, loading); the tokens it uses; keyboard behaviour; screen reader name,
role and value; and the platform mapping (WinUI control, React component, Compose composable, QML type).

| ID | Component | Notes |
|---|---|---|
| C-23.5.1 | Button | Primary, secondary, subtle, danger; small, medium, large; label, icon and label, icon only |
| C-23.5.2 | Text fields | Text, password (show and hide, paste allowed: WCAG 3.3.8), search, and the **screen code field**: 6 characters, upper-cased as typed, Crockford normalisation (I and L → 1, O → 0), accepts a whole pasted invite link |
| C-23.5.3 | Choice controls | Select, segmented control (Public/Private, Keep playing/Wait for everyone), toggle switch, checkbox, radio |
| C-23.5.4 | Sliders | Volume 0–200% with the boost zone above 100% marked (§16); seek bar with buffered range, hover or focus preview time (§15.4), drag to scrub, keyboard steps of 5 s and 10 s |
| C-23.5.5 | Tabs | Side panel tabs with unread badge (chat) and count badges |
| C-23.5.6 | List rows | Lobby screen row or card; viewer row; playlist row (drag handle, kind icon, match state, actions); role row; chat message (text, GIF, system) |
| C-23.5.7 | Badges and chips | Theatre, ping band, role (colour dot), status, "you", host, co-host #n, acting host, muted, private, hidden, "different name" |
| C-23.5.8 | Menus and flyouts | Viewer actions, playlist item actions, picture and sound, subtitles, overflow |
| C-23.5.9 | Dialogs | Title, body, actions; the destructive confirmation pattern (kick, ban, close screen, transfer ownership, regenerate code) |
| C-23.5.10 | Toasts and info bars | Info, success, warning, error; optional action; at most 3 visible; 5 s for info, persistent for errors that need an action |
| C-23.5.11 | Over-video overlay slot | One managed slot with a priority order (pick your file > autoplay blocked > hold > ready check > mismatch > file reading) so notices never overlap |
| C-23.5.12 | Floating reactions layer | 3 s float (§18), reduced-motion variant, never blocks clicks on the video |
| C-23.5.13 | Empty states, skeletons and progress | Including determinate progress for "Reading 3 of 12" |
| C-23.5.14 | Tooltip | Delay 500 ms, dismissible with Esc, stays while hovered (WCAG 1.4.13) |
| C-23.5.15 | Permission tri-state | Inherit, Allow, Deny per permission (§8.4), with the effective result shown beside it |
| C-23.5.16 | Role colour picker | Preset swatches plus custom `#rrggbb`; preview of the chip |
| C-23.5.17 | Countdown ring | Ready check 30 s (§14.14), with the remaining seconds as text for screen readers |
| C-23.5.18 | Status composite | Device icon, latency bars and sync status, used in the viewer row and the sync overlay |

Acceptance criteria (for every C-23.5.n):
1. The spec covers every item listed in the paragraph above.
2. Every state is reachable and visibly distinct, including focus-visible (at least a 2 px ring at 3:1).
3. Each component is built on every platform (C-23.10) and appears in that platform's component gallery (C-23.11.4).

#### C-23.6 Layouts per form factor

- **C-23.6.1 Desktop window (Windows, Linux).** Width classes: compact (< 1000 px): side panel becomes an overlay drawer
  over the video; regular (1000–1599 px): side panel docked right, 340 px; wide (≥ 1600 px): 400 px. The side panel
  can be resized between 280 and 480 px and collapsed; its width is remembered locally. The video keeps its aspect ratio
  with letterboxing; the controls bar hides after 3 s without input while playing and returns on mouse move or any key;
  fullscreen hides the title bar and side panel (README 10.5). Minimum window size: 720×480.
- **C-23.6.2 Responsive browser.** Breakpoints: 0–599 px (phone), 600–839 px (small tablet), 840–1199 px (panel docked,
  320 px), ≥ 1200 px (panel 360–400 px). Components use container queries, not page width. No horizontal scrolling at
  320 CSS px (WCAG 1.4.10); safe-area insets respected; `dvh` units so mobile browser bars don't hide controls.
- **C-23.6.3 Phone (Android, phone browsers).** Portrait: video 16:9 at the top, tabs below, menus as bottom sheets.
  Landscape: immersive fullscreen video, controls on tap, side panel as a drawer. Gestures (§15.4): double-tap left or
  right to seek 10 s back or forward, vertical swipe on the right for volume; any gesture that changes the shared
  timeline needs the same permission as its button (`playback.seek`, `playback.toggle`) and does nothing visible
  without it, apart from a short "You can't seek in this screen" hint. Android: predictive back closes the top sheet,
  then the drawer, then asks before leaving the screen.
- **C-23.6.4 Tablet (Android, tablet browsers).** Landscape uses the desktop regular layout; portrait stacks like a phone
  but with the panel as a 50% height sheet; split-screen and multi-window keep the player usable down to 400 px wide;
  hardware keyboard shortcuts work as on desktop.
- TV and car form factors are out of scope.

Acceptance criteria:
1. Every screen in C-23.7 has a layout spec for each form factor it ships on.
2. Every layout is checked at the screenshot sizes in C-23.1.1, plus 320 px wide and 200% zoom on the web.
3. Rotating a phone or tablet, or resizing a window across a breakpoint, never interrupts playback or loses chat input.

#### C-23.7 Screen-by-screen redesign

Each sub-task produces a design (all states, all form factors, light and dark), is reviewed against the principles
(C-23.2) and accessibility (C-23.8), and is then built on every platform in C-23.10. Acceptance criteria shared by
every sub-task: (a) every state in the list is designed, including empty, loading, error and no-permission;
(b) every control has a keyboard path and an accessible name; (c) the wording is reviewed for plain British English;
(d) nothing in Phases 0 to 21 behaves differently afterwards (the relevant acceptance criteria and tests still pass).

| ID | Screen | Specific acceptance criteria |
|---|---|---|
| C-23.7.1 | Lobby | Code field and "Create a screen" visible without scrolling at 360×640; theatre health strip shows each theatre's ping band or "unavailable"; screen rows show name, private/hidden, theatre, ping band, viewers/max with a "Full" state, host and now playing (C-4.8); filters collapse into one "Filter and sort" control below 600 px; skeleton rows while loading; empty state offers "Create a screen"; `/` focuses search |
| C-23.7.2 | Create screen | Name is the first field and gets focus; Hide from lobby appears only when Private is on (§6.1); unavailable theatres can't be chosen; the suggested theatre shows its ping; max viewers 2–25 with the default 10 visible; the Create button stays disabled with the reason shown until the form is valid |
| C-23.7.3 | Join by code or link, and password | The code field accepts a pasted link; "looking on N theatres" progress; not found, unreachable theatres and full get distinct messages; the password prompt opens in place (§10.4) with the screen name; wrong password keeps the field and says so; the rate limit message gives the wait time |
| C-23.7.4 | Screen view | Video first; top bar with screen name, private icon, code (if allowed, C-6.11), theatre and connection state; side panel per C-23.6; sync status always visible in the controls; who is host or acting host visible without opening the panel |
| C-23.7.5 | Player controls | Play/pause, previous, next, seek bar with preview (§15.4), time and duration, volume with boost zone, subtitles, audio track, picture and sound, fullscreen; controls you lack permission for are shown disabled with a tooltip saying why, not hidden, except moderation; auto-hide after 3 s |
| C-23.7.6 | Side panel and tabs | Viewers, Playlist, Chat tabs with counts and the chat unread badge (README 16.1); remembers the last tab; arrow keys move between tabs |
| C-23.7.7 | Viewers and viewer actions | Row: name, "you", host or acting host or co-host #n, role chips, device icon, latency bars with ms, sync status icon and label, muted, reconnecting; away co-hosts listed separately (README 2.7); the actions menu shows only actions you may take on that viewer (rank and permission) |
| C-23.7.8 | Playlist | Add files, add folder, add link, match my files; drag handle plus Move up and Move down (WCAG 2.5.7); kind icon (local, link, YouTube); your match state (match, different name, length differs, no file); current item marked; auto-advance toggle |
| C-23.7.9 | Chat, GIFs and reactions | Message list with your messages distinguishable; system messages styled apart; 500-character counter shown from 450; GIF picker with search, trending and "paste a link"; GIPHY key entry explained once; reaction bar with the 8 emoji; muted and no-permission states explain themselves; new-message pill when scrolled up |
| C-23.7.10 | Roles and permissions | Roles list ordered by rank with drag to reorder (and Move up/down); role editor with name (≤ 32), colour picker, permission groups (Playback, Playlist, Screen, Chat, Viewers, Roles) and the rule "only below your rank, only permissions you have" explained beside disabled items; per-viewer overrides with the tri-state control and the effective result |
| C-23.7.11 | Screen settings | Grouped: General (name), Access (visibility, password, hide from lobby, max viewers), Playback (auto-advance, buffering policy), Privacy (show devices); changes apply with clear confirmation; host-only actions (close screen, transfer ownership) in a separate "Danger zone" |
| C-23.7.12 | Invite | Big screen code with copy; web link and app link with copy; QR code of the web link; "New code" with a confirmation that old links stop working (README 8.6); private screens remind that a password is needed |
| C-23.7.13 | Subtitles and subtitle style | Per item: Off, In the file (each track), Shared (by whom), Your file; "Also share with viewers" toggle (needs `subtitles.share`); offset ±10 s with 100 ms steps; style editor with live preview over a frame; hidden for YouTube items (§17.1) |
| C-23.7.14 | Picture and sound | Zoom 50–400% with pan, aspect, fit mode, volume and boost with the one-time disclaimer, audio track, personal sync offset ±2000 ms with a "Bluetooth headphones" hint; labelled "Only you"; "Remember for this file only" |
| C-23.7.15 | Notices, toasts and errors | One notice system per C-23.5.10; every theatre error code (protocol §4.4) has designed wording; confirmations for kick, ban, close, transfer and regenerate |
| C-23.7.16 | Reconnecting and connection states | Reconnecting (with elapsed time out of 60 s), reconnected (brief), gave up (back to lobby with reason), theatre unavailable, offline at start |
| C-23.7.17 | Onboarding and first run | Name prompt explaining "Shown to others; no account"; one-screen explanation that everyone plays their own copy and nothing is uploaded; skippable; shown once |
| C-23.7.18 | Updates and About | Version, licence (GPL-3.0-or-later), source link, privacy summary, update notice styling (Windows: new release; Web: new version, reload) |
| C-23.7.19 | Installer and directory pages | Windows installer wizard images and text in the new language at 100–250% scale; directory `join.html` and `download.html` restyled with the web tokens; `yt.html` stays chrome-less |
| C-23.7.20 | Over-video overlays | Hold ("Waiting for Alice…" with Resume anyway), ready check (prompt, countdown ring, live tally), pick your file, file differs, autoplay blocked (web), "Waiting for the others" at the end of a shorter copy; all through the overlay slot (C-23.5.11) |
| C-23.7.21 | Fullscreen and picture-in-picture | Controls, reactions and overlays work in fullscreen; the side panel opens as a drawer in fullscreen; picture-in-picture keeps sync where the platform allows it |
| C-23.7.22 | Leave, close and transfer flows | Leaving as host warns that a co-host takes over or that the screen closes after 15 minutes without a host or co-host (§6.5); close and transfer explain their effect before confirming |

#### C-23.8 Accessibility: WCAG 2.2 AA

- **C-23.8.1 Conformance target and method.** Every WCAG 2.2 level A and AA success criterion is met on every platform.
  Criteria that need particular care in Kino: 1.4.3 and 1.4.11 (contrast), 1.4.10 (reflow), 1.4.12 (text spacing),
  1.4.13 (content on hover or focus), 2.1.1 and 2.1.2 (keyboard, no trap), 2.2.1 (timing: the 30 s ready check is
  announced and can be answered from the keyboard), 2.2.2 and 2.3.1 (animated GIFs and floating reactions can be paused
  and never flash), 2.4.3 (focus order), 2.4.7 and 2.4.11 (focus visible and not hidden by overlays), 2.5.7 (drag
  reorder has buttons too), 2.5.8 (target size), 3.3.7 and 3.3.8 (redundant entry, password paste), 4.1.2 (name, role,
  value) and 4.1.3 (status messages).
- **C-23.8.2 Keyboard.** Everything works without a pointer; shortcuts (README 10.6) are listed in a "Keyboard
  shortcuts" sheet opened with `?`; shortcuts never fire while typing; dialogs trap focus and return it to the opener;
  lists use one tab stop with arrow keys inside; a "Skip to player" link on the web.
- **C-23.8.3 Screen readers.** NVDA and Narrator (Windows), VoiceOver (macOS, iOS), TalkBack (Android), Orca (Linux).
  A viewer row reads like "Alice, host, in sync, 45 milliseconds, Windows". Chat is a polite live region; hold and
  ready check prompts are announced once; sync status changes are announced only when the reported status changes
  (the same debounce as the status reporter, C-10.9), never per tick.
- **C-23.8.4 Colour and contrast.** C-23.3.1 AC 1–4.
- **C-23.8.5 Motion and transparency.** C-23.3.6 AC 1; reduced transparency turns Mica, acrylic and blur into solid
  surfaces.
- **C-23.8.6 Text size.** C-23.3.2 AC 2.
- **C-23.8.7 Subtitles as captions.** The subtitle style options (README 15.8) can reach at least 200% size, a solid
  background box and high-contrast colours.
- **C-23.8.8 Accessibility statement.** A short page (wiki) listing the conformance level, known gaps and how to report
  a problem.

Acceptance criteria:
1. Automated checks (axe-core, Accessibility Insights, Accessibility Scanner) report zero serious or critical issues on
   every screen.
2. A manual pass with each screen reader completes the C-23.1.5 core tasks.
3. A keyboard-only pass completes the core tasks on Windows, Linux and the web.
4. The statement (C-23.8.8) is published.

#### C-23.9 Localisation readiness

No translations are shipped in this phase; the goal is that adding one later needs no code change.

- **C-23.9.1 Externalise strings.** Windows `.resw` (with `x:Uid` in XAML and `ResourceLoader` in code); web JSON
  message catalogues with ICU MessageFormat; Android `strings.xml`; Linux Qt `.ts`. Base language en-GB.
- **C-23.9.2 Plurals and variables.** ICU plural rules ("1 viewer", "3 viewers"); no sentences built by concatenation.
- **C-23.9.3 Formatting.** Numbers, durations and chat times use the locale's formatting (`Intl`, `CultureInfo`).
- **C-23.9.4 Expansion.** Layouts tolerate +40% text length; a pseudo-locale (accented, expanded, bracketed strings)
  is available in development builds.
- **C-23.9.5 Right-to-left.** Layouts mirror for RTL locales; the media timeline and transport icons do not mirror, as
  Fluent and Material advise.
- **C-23.9.6 Structured system messages (protocol, additive).** The theatre adds a key and arguments to system chat
  messages (for example `{ key: "joined", args: { name } }`) next to the existing English `text`, and uses stable keys
  for error messages; clients render from the key and fall back to `text`. Older clients keep working (protocol §1:
  unknown fields are ignored).
- **C-23.9.7 Fonts.** Fallback fonts cover Latin, Cyrillic, Greek, Arabic, Hebrew, Devanagari, Tamil, CJK and emoji.

Acceptance criteria:
1. A search for user-visible string literals in UI code finds none outside the catalogues (a lint rule where the
   platform has one).
2. The pseudo-locale build shows every screen without clipped or overlapping text.
3. An RTL pseudo-locale mirrors layouts correctly, with the timeline unmirrored.
4. C-23.9.6 ships with protocol examples and tests on the theatre and every client.

#### C-23.10 Per-platform implementation

The design is built on each platform; detail and platform constraints are in each platform roadmap.

- **C-23.10.1 Windows** (WinUI 3): see WIN-23 in the Windows roadmap.
- **C-23.10.2 Web** (React): see WEB-23 in the Web roadmap.
- **C-23.10.3 Android** (Compose, Material 3 mapped to Kino tokens): built on the new language from the start if the
  client is still on hold when this phase begins.
- **C-23.10.4 Linux** (Qt 6 Quick, a custom Qt Quick Controls style from the tokens).
- **C-23.10.5 Directory pages** (`directory/public`: join, download): the web tokens and icons.

Acceptance criteria:
1. Every C-23.5 component and every C-23.7 screen is built on every platform where it applies.
2. Every acceptance criterion and automated test from Phases 0 to 21 still passes on every platform.
3. C-23.8 acceptance criteria are met on each platform.

#### C-23.11 Visual regression testing

- **C-23.11.1 Web:** Playwright screenshot tests of every screen and overlay at 360, 768, 1280 and 1920 px wide, light
  and dark, with reduced motion, from fixed fixtures (a fake session, no theatre); pixel tolerance 0.1%; runs in CI.
- **C-23.11.2 Windows:** UI automation (FlaUI or WinAppDriver) captures the component gallery and key screens at 100%,
  150% and 200% scale in light, dark and high contrast; compared with stored baselines on a Windows CI runner.
- **C-23.11.3 Android and Linux:** Roborazzi or Paparazzi screenshot tests; Qt Quick Test image grabs.
- **C-23.11.4 Component galleries:** a hidden gallery in each client (web route in development builds only, Windows
  debug window, Android debug activity, Linux debug window) showing every component in every state, used by the
  screenshot tests.
- **C-23.11.5 Automated accessibility checks in CI:** axe-core in the web tests; Accessibility Insights automated
  checks on Windows.

Acceptance criteria:
1. A change to a token or component that alters any baseline fails CI until the baseline is updated in the same commit.
2. Baselines are reviewed by a person when updated.
3. CI is green on every platform before rollout (C-23.13).

#### C-23.12 Usability testing

- **C-23.12.1 Plan:** 5 to 8 people per round across platforms, including at least one screen-reader user, one
  keyboard-only user and one person whose first language isn't English; the C-23.1.5 tasks.
- **C-23.12.2 Round 1:** on prototypes, before C-23.10 starts.
- **C-23.12.3 Round 2:** on the implemented preview (C-23.13.1).
- **C-23.12.4 Findings:** each finding gets a severity and a fix task; every severity 3 or 4 finding is fixed before
  rollout.

Acceptance criteria:
1. Task success ≥ 90% for every core task in round 2.
2. Time on task at least 20% better than the C-23.1.5 baseline on tasks (a), (b) and (c), and not worse on any task.
3. System Usability Scale score ≥ 80 in round 2.
4. No open severity 4 finding.

#### C-23.13 Rollout

- **C-23.13.1 Preview:** Windows: a pre-release GitHub release with the new UI; Web: a separate preview deployment
  (for example a `kino-web-next` static-assets Worker). The current UI stays the default.
- **C-23.13.2 Mixed screens:** at least two weeks of screens mixing old-UI and new-UI clients on every platform; the
  cross-platform test (C-21.7) is run again with the new UI.
- **C-23.13.3 Switch:** the new UI becomes the default in one release per platform; release notes, screenshots on the
  download page, READMEs and the wiki updated.
- **C-23.13.4 Clean-up:** old UI code removed one stable release later.
- **C-23.13.5 Rollback:** the previous Windows release stays downloadable; the previous web build can be redeployed in
  one command.
- **C-23.13.6 Review:** Kino collects no telemetry, so the post-release review uses GitHub issues and a final short
  usability session; outcomes are recorded in `design/audit.md`.

Acceptance criteria:
1. No sync, protocol or permission regression is reported during the preview (C-23.13.2).
2. Every platform switches within one month of the first, so the platforms don't drift apart for long.
3. The rollback path is tested once before the switch.

---

## Appendix A. Migration map from the old README checklist

Every item of the old `## TODO` checklist, with its new ID. Section 18 (the web client) moved to the Web roadmap, where
`WEB-x.y` implements `C-x.y`.

| Old | New | Old | New | Old | New |
|---|---|---|---|---|---|
| 0.1 | C-0.1 | 5.6 | C-8.7 | 11.13 | C-11.18 |
| 0.2 | C-0.2 | 5.7 | C-8.8 | 11.14 | C-11.19 |
| 0.3 | C-0.3 | 5.8 | C-8.9 | 11.15 | C-11.20 |
| 0.4 | C-0.4 | 6.1 | C-9.2 | 12.1 | C-13.1 |
| 0.5 | C-0.5 | 6.2 | C-9.3 | 12.2 | C-13.2 |
| 0.6 | C-0.1 | 6.3 | C-9.1 | 12.3 | C-13.3 |
| 0.7 | C-2.1 | 7.1 | C-4.6 | 12.4 | C-13.4 |
| 0.8 | C-2.2 | 7.2 | C-4.6 | 12.5 | C-13.7 |
| 0.9 | C-0.7 | 7.3 | C-4.7 | 12.6 | C-13.12, C-13.13, C-13.14 |
| 0.10 | C-0.8 | 7.4 | C-4.2, C-4.7 | 12.7 | C-13.16 |
| 1.1 | C-1.1 | 7.5 | C-4.9 | 12.8 | C-13.17 |
| 1.2 | C-1.2 | 7.6 | C-4.9, C-6.6 | 12.9 | C-13.18 |
| 1.3 | C-1.3 | 7.7 | C-4.9, C-5.2.3 | 12.10 | C-13.19 |
| 1.4 | C-4.1 | 7.8 | C-4.10 | 12.11 | C-14.5 |
| 1.5 | C-1.4 | 7.9 | C-4.11 | 12.12 | C-14.6, C-14.7, C-14.8 |
| 1.6 | C-1.5 | 7.10 | C-4.12 | 12.13 | C-14.1, C-14.2 |
| 1.7 | C-1.6 | 8.1 | C-6.1 | 12.14 | C-13.20 |
| 1.8 | C-1.7 | 8.2 | C-6.3, C-6.12 | 12.15 | C-14.4 |
| 1.9 | C-1.8 | 8.3 | C-6.5 | 12.16 | C-13.21 |
| 1.10 | C-1.10, C-4.4 | 8.4 | C-6.6 | 13.1 | C-15.1 |
| 1.11 | C-1.11 | 8.5 | C-6.7 | 13.2 | C-15.2 |
| 1.12 | C-22.1 | 8.6 | C-6.10 | 13.3 | C-15.1 (Linux) |
| 2.1 | C-5.1 | 9.1 | C-10.2 | 13.4 | C-15.1 (Android) |
| 2.2 | C-5.2, C-5.2.1 | 9.2 | C-10.3 | 13.5 | C-15.3, C-15.4, C-15.5 |
| 2.3 | C-5.3 | 9.3 | C-10.4, C-5.11.5 | 14.1 | C-16.1 |
| 2.4 | C-5.4 | 9.4 | C-10.5 | 14.2 | C-16.2 |
| 2.5 | C-5.5, C-6.5, C-6.6 | 9.5 | C-10.6 | 14.3 | C-16.3 |
| 2.6 | C-5.8, C-5.9, C-3.7 | 9.6 | C-10.8 | 14.4 | C-16.4 |
| 2.7 | C-10.1, C-10.11, C-7.3, C-8.10 | 10.1 | C-12.1 | 14.5 | C-16.5 |
| 2.8 | C-8.3 | 10.2 | C-12.2 | 14.6 | C-16.6 |
| 2.9 | C-5.2.4, C-5.10 | 10.3 | C-12.3, C-11.12 | 14.7 | C-16.7 |
| 2.10 | C-5.11 (all sub-tasks) | 10.4 | C-12.5 | 15.1 | C-17.1, C-17.2 |
| 2.11 | C-5.12, C-5.13 | 10.5 | C-12.6 | 15.2 | C-17.3, C-17.4 |
| 3.1 | C-3.1 | 10.6 | C-12.7 | 15.3 | C-17.5 |
| 3.2 | C-3.3 | 10.7 | C-12.1 | 15.4 | C-17.6 |
| 3.3 | C-3.4 | 11.1 | C-11.1 | 15.5 | C-17.9 |
| 3.4 | C-3.5 | 11.2 | C-11.2, C-11.3 | 15.6 | C-17.6, C-17.8 |
| 3.5 | C-3.6 | 11.3 | C-11.5 | 15.7 | C-17.10 |
| 4.1 | C-7.1, C-7.2 | 11.4 | C-11.6 | 15.8 | C-17.11 |
| 4.2 | C-7.4 | 11.5 | C-11.7 | 16.1 | C-18.1 |
| 4.3 | C-7.6 | 11.6 | C-11.9 | 16.2 | C-18.2 |
| 4.4 | C-7.7 | 11.7 | C-11.10 | 16.3 | C-18.3 |
| 4.5 | C-5.12 | 11.8 | C-11.12 | 16.4 | C-18.4, C-18.5 |
| 4.6 | C-7.8 | 11.9 | C-11.13 | 16.5 | C-18.4 |
| 5.1 | C-8.1 | 11.10 | C-11.15 | 16.6 | C-18.6 |
| 5.2 | C-8.2 | 11.11 | C-11.16 | 16.7 | C-18.7 |
| 5.3 | C-8.3 | 11.12 | C-11.17 | 17.1 | C-20.1 to C-20.4, C-6.12 (and WIN-20.P1 to WIN-20.P4) |
| 5.4 | C-8.5 | | | 17.2 | C-1.13 |
| 5.5 | C-8.6 | | | 17.3 | C-20.1 (Linux) |
| | | | | 17.4 | C-20.1 (Android) |
| | | | | 17.5 | C-20.1, C-20.2 (Web) |
| | | | | 17.6 | C-21.7 |

Section 18 (web client), now in the Web roadmap: 18.1 → WEB-0.7, WEB-0.8; 18.2 → WEB-20.1, WEB-20.P1; 18.3 → WEB-4.1,
WEB-4.2, WEB-3.7; 18.4 → WEB-11.2 to WEB-11.18; 18.5 → WEB-12.1, WEB-13.1, WEB-13.6, WEB-14.2; 18.6 → WEB-4.6,
WEB-5.2, WEB-6.3, WEB-6.5, WEB-6.6, WEB-6.12; 18.7 → WEB-13.12 to WEB-13.18; 18.8 → WEB-14.5 to WEB-14.10;
18.9 → WEB-18.1 to WEB-18.7; 18.10 → WEB-5.11, WEB-7.x, WEB-8.x, WEB-9.x; 18.11 → WEB-17.x; 18.12 → WEB-11.20,
WEB-12.6, WEB-12.7, WEB-16.x; 18.13 → WEB-15.3 to WEB-15.5.

## Appendix B. Where the spec, the protocol and the code disagree

Found while auditing for this roadmap. C-0.10 resolves each one; record the decision here.

| # | Where | What | Task |
|---|---|---|---|
| 1 | §4.3 vs `theatre/src/index.ts` | The spec names the `/info` fields `protocolVersion` and `minClientProtocol`; the code (and the protocol README) uses `protocol`, `minProtocol` and adds `time` and `deployedAt`. The spec's `degraded` and `quota_exhausted` statuses are never sent: `status` is always `"ok"`. | C-1.4 |
| 2 | §3.1, §15.1 | Still list the web client as "On hold"; §21 says it is live. | C-0.10 |
| 3 | §11 vs §21.1 and the code | §11 gives the web link as `https://<pages>/join/<theatreId>/<code>`; the real form (and §21.1) is `/join#<theatreId>/<code>`. | C-0.10 |
| 4 | §6.4 vs `screen.ts onHello` | The spec checks capacity before the password; the theatre checks the password first. The theatre also lets the owner in when full, which the spec doesn't mention. | C-5.6 |
| 5 | §19.3 | Lists many messages as "Planned (additive)" that are implemented, lists `subs.share` as a WebSocket message (it is HTTP `POST /screens/<code>/subs`), and omits `status`, `hold.release`, `code.regenerate`, `chat.gif`, `screen` and `hold`. The protocol README is the accurate list. | C-0.10 |
| 6 | §3.2 vs §19.1 | §3.2 names the route `/resolve-code`; §19.1 and the code use `/resolve/<code>`. | C-0.10 |
| 7 | §12 | The sync status list lacks "no file" (`nofile`), which the protocol and both clients have. | C-0.10 |
| 8 | §8.1 vs the theatre and both clients | `screen.invite` is described as "view and regenerate the code/link", but the code is sent to, and shown to, everyone. | C-6.11 |
| 9 | `protocol/README.md` | `Item.kind` is given as only `"local"` or `"url"` (the code also has `"youtube"`); the README says server and client test suites both parse the examples, but the theatre's don't and Windows parses only the server examples. | C-2.1, C-2.3 |
| 10 | §14.10 vs protocol and code | The spec says the host or acting host can "resume anyway"; the protocol and theatre allow anyone with `playback.toggle`, and both clients offer it to them. | C-11.17 |
| 11 | §5 | "Can be changed at any time": there is no rename message; a new name applies only on the next join. | C-3.2 |
| 12 | §14.3 | "Right away if a message's RTT jumps by more than 50%": not implemented on any client, and only pings measure RTT, so the trigger is undefined. | C-11.4 |
| 13 | §14.3, §14.11 vs both clients | After a reconnect, both clients run 3 clock samples, not the 8-sample burst. | C-3.7 |
| 14 | §17.4 vs README 15.7 and Windows | The spec says "timing offset (±ms)" with no limit; Windows (and the old README) use ±10 s. | C-17.10 |
| 15 | §22 vs both engines | Constants in the code but not in §22: host re-anchor at most every 2 s; minimum rate step 0.0005; status debounce 1 s; paused seeks at most every 500 ms; YouTube paused tolerance 0.25 s, initial seek latency 0.5 s and host re-anchor 0.75 s; reconnect delays 300 ms, 1 s, 2 s, 3 s, then 5 s. | C-0.10 |
| 16 | §14.6 vs both engines | The drift formula includes the personal offset, but while paused both engines hold at the anchor position without it (the scheduled-start wait does include it). | C-11.11 |
| 17 | §15.3 vs Windows | Buffering should come from `paused-for-cache`, `core-idle` and `seeking`; Windows uses only `paused-for-cache`. | C-12.9 |
| 18 | §14.12 vs both clients | The theatre ends items from their duration, but both clients add URL items with `duration: null`, so a playlist never auto-advances past a URL item. | C-14.3 |
| 19 | §1 | "The web client and config are on Cloudflare Pages": both are static-assets Workers now (as §4.2 and §21.1 say). | C-0.10 |
| 20 | docs.md header, §3.1 | Point to the README checklist ("master TODO") for progress; progress now lives in this file (the README's `#todo` anchor still works and links here; the wiki's Home and Roadmap pages were updated with this roadmap). | C-0.10 |
| 21 | §6.1, §22 vs code | Max viewers is clamped to 2–25 by the theatre (and the old README said so); the spec gives only the default 10. | C-0.10 |
| 22 | §13.7 vs Windows | Resume positions are "used when the host restarts an item", but no rule says how inside a screen; Windows uses them only when watching alone. | C-13.21 |

## Appendix C. Audit record

| Date | Main (`kino-enhanced`) | Wiki | Windows | Web | Notes |
|---|---|---|---|---|---|
| 2026-11-25 | `b978c4e` | `bfcff8c` | `0e86b29` (v0.1.0) | `298c94b` | First audit: every status read from the code and tests at these commits |
