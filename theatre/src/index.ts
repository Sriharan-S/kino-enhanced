// Kino theatre Worker: HTTP routing and WebSocket hand-off to the screen's Durable Object.
import { normaliseCode, randomToken, screenCode } from "./crypto";
import { cleanName, LIMITS, MIN_CLIENT_PROTOCOL, PROTOCOL_VERSION, ProtocolError, type Visibility } from "./protocol";

export { LobbyDO } from "./lobby";
export { ScreenDO } from "./screen";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...CORS } });

const error = (status: number, code: string, message: string) => json({ error: { code, message } }, status);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

    try {
      // GET /info
      if (request.method === "GET" && url.pathname === "/info") {
        return json({
          id: env.THEATRE_ID,
          name: env.THEATRE_NAME,
          protocol: PROTOCOL_VERSION,
          minProtocol: MIN_CLIENT_PROTOCOL,
          status: "ok",
          time: Date.now(),
        });
      }

      // GET /lobby
      if (request.method === "GET" && url.pathname === "/lobby") {
        const screens = await lobby(env).list();
        return json({
          theatre: { id: env.THEATRE_ID, name: env.THEATRE_NAME },
          screens: screens.map(({ hidden: _hidden, ...l }) => l),
        });
      }

      // POST /screens
      if (request.method === "POST" && url.pathname === "/screens") return await createScreen(request, env);

      // GET /resolve/<code>
      if (request.method === "GET" && parts[0] === "resolve" && parts[1]) {
        const found = await lobby(env).resolve(normaliseCode(parts[1]));
        if (!found) return error(404, "not_found", "no screen with that code on this theatre");
        const l = found.listing;
        // screenId is internal (never shown in UI); the client needs it to derive its per-screen token.
        return json({
          code: l.code,
          screenId: found.screenId,
          name: l.name,
          visibility: l.visibility,
          requiresPassword: l.visibility === "private",
        });
      }

      // GET /screens/<code>/ws  (WebSocket upgrade)
      if (request.method === "GET" && parts[0] === "screens" && parts[1] && parts[2] === "ws") {
        if (request.headers.get("Upgrade") !== "websocket") return error(426, "bad_request", "expected a WebSocket upgrade");
        const found = await lobby(env).resolve(normaliseCode(parts[1]));
        if (!found) return error(404, "not_found", "no screen with that code on this theatre");
        const stub = env.SCREEN.get(env.SCREEN.idFromString(found.screenId));
        return stub.fetch(request);
      }

      return error(404, "not_found", "unknown route");
    } catch (e) {
      if (e instanceof ProtocolError) return error(400, e.code, e.message);
      console.error(e);
      return error(500, "internal", "internal error");
    }
  },
} satisfies ExportedHandler<Env>;

async function createScreen(request: Request, env: Env): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return error(400, "bad_request", "invalid JSON");
  }

  const name = cleanName(body.name, "name", LIMITS.screenName);
  const visibility: Visibility = body.visibility === "private" ? "private" : "public";
  const hidden = visibility === "private" && body.hidden === true;
  const password = typeof body.password === "string" ? body.password : null;
  if (visibility === "private" && (!password || password.length < 1 || password.length > LIMITS.password)) {
    return error(400, "bad_request", `private screens need a password (1-${LIMITS.password} characters)`);
  }
  const maxViewers =
    typeof body.maxViewers === "number" && Number.isInteger(body.maxViewers)
      ? Math.min(LIMITS.maxViewersCap, Math.max(2, body.maxViewers))
      : LIMITS.defaultMaxViewers;

  const id = env.SCREEN.newUniqueId();
  const screenId = id.toString();
  const claim = randomToken();

  // Reserve a unique code (retry on the rare collision).
  let code = "";
  for (let attempt = 0; attempt < 8 && !code; attempt++) {
    const candidate = screenCode();
    const ok = await lobby(env).register(screenId, {
      code: candidate,
      name,
      visibility,
      hidden,
      viewers: 0,
      maxViewers,
      host: null,
    });
    if (ok) code = candidate;
  }
  if (!code) return error(503, "internal", "could not allocate a screen code");

  await env.SCREEN.get(id).init({ screenId, code, name, visibility, hidden, password, maxViewers, claim });

  // screenId is internal (never shown in UI); clients use it only to derive their per-screen token.
  return json({ theatre: env.THEATRE_ID, code, screenId, claim }, 201);
}

function lobby(env: Env) {
  return env.LOBBY.get(env.LOBBY.idFromName("lobby"));
}
