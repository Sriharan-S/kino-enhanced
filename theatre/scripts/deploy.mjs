// Deploys one theatre to the Cloudflare account Wrangler is logged in to.
// Usage: npm run deploy -- <id> <Name>        e.g. npm run deploy -- aurora Aurora
//
// Each Cloudflare account hosts one theatre (to spread free-tier limits). The Worker is named
// kino-<id>, so its URL is https://kino-<id>.<account-subdomain>.workers.dev.
// After deploying, it waits until /info reports this deployment, so tests run right after never hit the old version.
import { spawnSync } from "node:child_process";

const [id, name] = process.argv.slice(2);
if (!id || !name || !/^[a-z][a-z0-9-]{1,30}$/.test(id)) {
  console.error("usage: node scripts/deploy.mjs <id: lowercase slug> <Name>");
  process.exit(2);
}

// Corporate TLS-inspecting proxies (e.g. Zscaler) need Node to trust the OS certificate store.
const env = { ...process.env, NODE_USE_SYSTEM_CA: "1" };
const stamp = new Date().toISOString();

const args = [
  "wrangler",
  "deploy",
  "--name",
  `kino-${id}`,
  "--var",
  `THEATRE_ID:${id}`,
  "--var",
  `THEATRE_NAME:${name}`,
  "--var",
  `DEPLOYED_AT:${stamp}`,
];
console.log(`> npx ${args.join(" ")}`);
const r = spawnSync("npx", args, { env, shell: process.platform === "win32", encoding: "utf8" });
process.stdout.write(r.stdout ?? "");
process.stderr.write(r.stderr ?? "");
if (r.status !== 0) process.exit(r.status ?? 1);

const url = /https:\/\/[^\s]+\.workers\.dev/.exec(r.stdout ?? "")?.[0];
if (!url) process.exit(0);
for (let i = 0; i < 60; i++) {
  try {
    const info = await (await fetch(`${url}/info`, { cache: "no-store" })).json();
    if (info.deployedAt === stamp) {
      console.log(`Live: ${url} (${info.name}, deployed ${stamp})`);
      process.exit(0);
    }
  } catch {
    /* not yet */
  }
  await new Promise((res) => setTimeout(res, 1000));
}
console.warn(`Deployed, but ${url}/info hasn't shown the new version after 60 s.`);
