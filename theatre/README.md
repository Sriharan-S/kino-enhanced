# Kino Theatre (Cloudflare Worker)

A **theatre** is one deployment of this Worker. It hosts screens and keeps their viewers in sync.
The wire format is in [`../protocol`](../protocol/README.md), and behaviour is described in the [wiki](https://github.com/Sriharan-S/kino-enhanced/wiki/docs).

| Piece | File | Role |
|---|---|---|
| Worker | `src/index.ts` | HTTP routes (`/info`, `/lobby`, `/screens`, `/resolve/<code>`) and WebSocket hand-off |
| `ScreenDO` | `src/screen.ts` | One Durable Object per screen: viewers, item, timeline anchor. Uses WebSocket Hibernation. |
| `LobbyDO` | `src/lobby.ts` | One per theatre: code → screen mapping plus the lobby listing (SQLite) |
| Anchor logic | `src/anchor.ts` | Pure play/pause/seek/re-anchor maths (unit tested) |
| Protocol | `src/protocol.ts` | Message types and validation |

Everything runs on the Workers **free plan** (SQLite-backed Durable Objects).

## Develop

```bash
npm install
npm run dev        # local theatre on http://127.0.0.1:8787 (no Cloudflare account needed)
npm test           # unit tests
npm run typecheck
npm run smoke      # end-to-end checks against the running dev server
```

## Deploy a theatre

Each Cloudflare account hosts one theatre. Give each one a unique id and name:

```bash
npx wrangler login                       # once per Cloudflare account
npx wrangler deploy --name kino-aurora \
  --var THEATRE_ID:aurora --var THEATRE_NAME:Aurora
```

Then add it to `servers.json`, the client theatre list (README TODO 1.4 / 17.2).
