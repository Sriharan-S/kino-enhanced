# Kino Enhanced

A cross-platform **synced media player** for two or more people, for Windows, Linux, Android and Web.

Kino Enhanced only syncs playback. It never streams the video itself. Each viewer plays their own copy of the media, and Kino keeps everyone's play/pause/seek state and timeline in step.

It is a full rework and restructure of the original [Kino](https://github.com/Sriharan-S/kino), which is now outdated.

📖 **Full specification:** [Wiki → docs](https://github.com/Sriharan-S/kino-enhanced/wiki/docs)

## Download

| Platform | Get it | |
|---|---|---|
| **Windows** 10/11 | **[Download page](https://kino-directory.srie.workers.dev/download)** (picks the right file for your PC) · [all files](https://github.com/Sriharan-S/kino-enhanced-windows/releases/latest) | Installer or portable, for x64, ARM64 and x86 |
| Linux | Not yet | On hold |
| Android | Not yet | On hold |
| **Web** (any modern browser) | **[Open Kino for the web](https://kino-web.srie.workers.dev)** | Early: local files and links; nothing to install |

Direct links to the newest Windows version (they never change):

| | Installer | Portable |
|---|---|---|
| x64 (most PCs) | [Kino-Setup-x64.exe](https://github.com/Sriharan-S/kino-enhanced-windows/releases/latest/download/Kino-Setup-x64.exe) | [Kino-Portable-x64.zip](https://github.com/Sriharan-S/kino-enhanced-windows/releases/latest/download/Kino-Portable-x64.zip) |
| ARM64 (Snapdragon) | [Kino-Setup-arm64.exe](https://github.com/Sriharan-S/kino-enhanced-windows/releases/latest/download/Kino-Setup-arm64.exe) | [Kino-Portable-arm64.zip](https://github.com/Sriharan-S/kino-enhanced-windows/releases/latest/download/Kino-Portable-arm64.zip) |
| x86 (32-bit) | [Kino-Setup-x86.exe](https://github.com/Sriharan-S/kino-enhanced-windows/releases/latest/download/Kino-Setup-x86.exe) | [Kino-Portable-x86.zip](https://github.com/Sriharan-S/kino-enhanced-windows/releases/latest/download/Kino-Portable-x86.zip) |

**Where releases live:** each app is released from **its own repo**, built and attached by that repo's CI, so each
platform has its own version history. This repo links to them. The links above use GitHub's `releases/latest/download/`
form with version-less file names, so they always fetch the newest stable release.

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

| Repo | Purpose | Releases | Status |
|---|---|---|---|
| `kino-enhanced` (this) | Theatre Worker (`theatre/`), theatre list and download page (`directory/`), protocol spec (`protocol/`), docs, [master roadmap](ROADMAP.md) | Theatres deploy from here | Active |
| [`kino-enhanced-windows`](https://github.com/Sriharan-S/kino-enhanced-windows) | Windows client (C# / WinUI 3 + libmpv) | [Latest](https://github.com/Sriharan-S/kino-enhanced-windows/releases/latest) | Active |
| `kino-enhanced-linux` | Linux client (C++ / Qt 6 + libmpv) | n/a | On hold |
| `kino-enhanced-android` | Android client (Kotlin / Compose + libmpv) | n/a | On hold |
| [`kino-enhanced-web`](https://github.com/Sriharan-S/kino-enhanced-web) | Web client (TypeScript / React) | [Live site](https://kino-web.srie.workers.dev), deployed from `main` | Active |

**Live theatres:** Aurora (`kino-aurora.srie.workers.dev`) and Nova (`kino-nova.sri-me.workers.dev`), each on its own free
Cloudflare account. The [theatre list](https://kino-directory.srie.workers.dev/servers.json) tells the apps where they are.

---

## Roadmap

| Milestone | What | Status |
|---|---|---|
| **Theatres** | Cloudflare Worker backend; Aurora and Nova live on separate free accounts; theatre list | ✅ Done |
| **Windows 0.1** | The full feature set: sync, lobby, roles, playlists, YouTube, chat, subtitles, player; installer and portable for x64 / x86 / ARM64 | ✅ [Released](https://github.com/Sriharan-S/kino-enhanced-windows/releases/latest) |
| **Windows code signing** | Signed releases through SignPath Foundation (free for open source); the pipeline is ready | 🟨 Waiting for SignPath approval |
| **Web** | Browser client in [`kino-enhanced-web`](https://github.com/Sriharan-S/kino-enhanced-web), [live](https://kino-web.srie.workers.dev) on Cloudflare: lobby, create/join, sync engine, player and playlist done; the rest is planned in its [roadmap](https://github.com/Sriharan-S/kino-enhanced-web/blob/main/ROADMAP.md) | 🟨 In progress |
| **Cross-platform** | Every platform in the same screen ([C-21.7](ROADMAP.md#phase-21-quality-and-the-cross-platform-test)) | ⬜ After Web |
| **Android** | Native client (Kotlin / Compose + libmpv) | ⏸ On hold |
| **Linux** | Native client (C++ / Qt 6 + libmpv) | ⏸ On hold |
| **Later / to be planned** | User-added theatres, more theatres (Orion, Lyra, Vega, Polaris), own YouTube player (not yet planned) ([Phase 22](ROADMAP.md#phase-22-later--to-be-planned)) | ⏸ |
| **Layout and Design Language rework** | One design language for every distribution: tokens, components, layouts, accessibility (WCAG 2.2 AA). **Gated:** starts only after every feature is complete and tested on Windows, Web, Android and Linux ([Phase 23](ROADMAP.md#phase-23-layout-and-design-language-rework-gated)) | ⬜ Gated |

Detail for every item is in [`ROADMAP.md`](ROADMAP.md) and in the [spec](https://github.com/Sriharan-S/kino-enhanced/wiki/docs).

## TODO

The task-level checklist now lives in the roadmaps. [`ROADMAP.md`](ROADMAP.md) is the master: every feature in phases,
broken into tasks with acceptance criteria, spec references and a status per platform (Theatre, Windows, Web, Android,
Linux), plus the gated design rework. Each client repo has its own checklist that points back to it: the
[Windows roadmap](https://github.com/Sriharan-S/kino-enhanced-windows/blob/main/ROADMAP.md) and the
[Web roadmap](https://github.com/Sriharan-S/kino-enhanced-web/blob/main/ROADMAP.md). Every item of the old checklist
(sections 0 to 18) is mapped to its new ID in [Appendix A](ROADMAP.md#appendix-a-migration-map-from-the-old-readme-checklist).

## Licence

Kino Enhanced is free software under the [GNU General Public License v3.0 or later](LICENSE). This covers this repo
(theatre, protocol, docs) and the platform apps.
