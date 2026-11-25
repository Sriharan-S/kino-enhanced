// Deploys one theatre to the Cloudflare account Wrangler is logged in to.
// Usage: node scripts/deploy.mjs <id> <Name>        e.g. node scripts/deploy.mjs aurora Aurora
//
// Each Cloudflare account hosts one theatre (to spread free-tier limits). The Worker is named
// kino-<id>, so its URL is https://kino-<id>.<account-subdomain>.workers.dev.
import { spawnSync } from "node:child_process";

const [id, name] = process.argv.slice(2);
if (!id || !name || !/^[a-z][a-z0-9-]{1,30}$/.test(id)) {
  console.error("usage: node scripts/deploy.mjs <id: lowercase slug> <Name>");
  process.exit(2);
}

// Corporate TLS-inspecting proxies (e.g. Zscaler) need Node to trust the OS certificate store.
const env = { ...process.env, NODE_USE_SYSTEM_CA: "1" };

const args = ["wrangler", "deploy", "--name", `kino-${id}`, "--var", `THEATRE_ID:${id}`, "--var", `THEATRE_NAME:${name}`];
console.log(`> npx ${args.join(" ")}`);
const r = spawnSync("npx", args, { stdio: "inherit", env, shell: process.platform === "win32" });
process.exit(r.status ?? 1);
