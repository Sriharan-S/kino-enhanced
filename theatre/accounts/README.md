# Theatre accounts

Each theatre runs on its own free Cloudflare account. For each one, create `<id>.env` here (git-ignored):

```
CLOUDFLARE_API_TOKEN=<token from that account, "Edit Cloudflare Workers" template>
CLOUDFLARE_ACCOUNT_ID=<that account's Account ID>
```

Then `npm run deploy -- <id> <Name>` deploys to that account. Without the file, Wrangler's logged-in account is used
(that's Aurora's account, which also hosts the theatre directory).
