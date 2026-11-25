# Theatre directory

Serves [`public/servers.json`](public/servers.json), the list of theatres that clients load at startup
(spec: [wiki → docs §4.2](https://github.com/Sriharan-S/kino-enhanced/wiki/docs#42-discovery-serversjson)).

**Live:** https://kino-directory.srie.workers.dev/servers.json

It is a static-assets-only Worker (Cloudflare Pages now deploys as Workers static assets). Static asset requests
are free and unlimited, so this costs nothing however many clients start up. `public/_headers` adds CORS (for the
future web client) and a 5-minute cache.

## Format

```json
{
  "version": 1,
  "theatres": [
    { "id": "aurora", "name": "Aurora", "url": "https://kino-aurora.srie.workers.dev" }
  ]
}
```

- `id`: unique lowercase slug. It must match the theatre's `THEATRE_ID`.
- `name`: unique display name.
- `url`: HTTPS base URL of the theatre Worker.
- Clients ignore a file with an unknown `version`, and skip entries that are invalid or duplicated. They then fall back
  to their cached copy, and after that to the list bundled in the app.

## Add a theatre

1. Deploy it (see [`../theatre`](../theatre/README.md#deploy-a-theatre)).
2. Add its entry to `public/servers.json`.
3. Publish:
   ```bash
   cd directory
   NODE_USE_SYSTEM_CA=1 ../theatre/node_modules/.bin/wrangler deploy   # reuses the theatre's Wrangler install
   ```
4. Update the bundled fallback list in each client (Windows: `TheatreDirectory.Bundled`).
