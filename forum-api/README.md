# Compliant forum API (Cloudflare Workers + D1 + KV + R2)

Setup:
```
npm install
wrangler d1 create forum-db        # copy id into wrangler.toml
wrangler kv namespace create KV    # copy id into wrangler.toml
wrangler r2 bucket create forum-media
npm run db:init                    # add --remote for production
wrangler secret put MODERATION_API_KEY   # optional; without MODERATION_API_URL a mock scorer is used
npm run dev
```
Promote an admin: `wrangler d1 execute forum-db --command "UPDATE users SET role='admin' WHERE email='you@x.com'"`.

Compliance notes: 18+ gate at registration (upgrade to real age/ID verification), minor-score hits are never stored,
auto-suspend the uploader and are audit-logged for escalation/reporting under local law; all admin actions are audit-logged;
the R2 bucket must stay private. The mock scorer and keyword list are placeholders — use a real CSAM-capable service
(Cloudflare CSAM Scanning Tool, PhotoDNA, etc.) before launch, and get legal review for your jurisdiction.
