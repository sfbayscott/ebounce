# eBounce SaaS — Setup Guide (for Brooks)

Live URL: https://aceppe-email-prefilter.custmax.workers.dev
Planned public domain: https://ebounce.custmax.com (http:// also works — see §3)

## 1. Competitor comparison (researched 2026-10-11)

| | ZeroBounce | MillionVerifier | NeverBounce | Bouncer | **eBounce** |
|---|---|---|---|---|---|
| Free plan | 100 / month | 100 one-time | 10 one-time | 100 one-time | **10,000 / month** |
| Entry paid | $39 / 2,000 | $39 / 10,000 | $8 / 1,000 | $8 / 1,000 | **$9 / 5,000 / mo** |
| 100k validations | ~$700 PAYG | $149 PAYG | ~$400 PAYG | $400 PAYG | **$79 / mo** |
| Cost per 1k (paid) | $19.50 | $3.90 | $8.00 | $8.00 | **$0.79 – $1.80** |

Positioning: free tier is 10x the typical competitor (1,000/mo vs 100/mo);
paid tiers undercut every competitor on price-per-validation.

## 2. eBounce pricing (implemented)

| Plan | Price | Validations / month | Cost per 1k |
|---|---|---|---|
| Free | $0 | 1,000 | $0 |
| Starter | $4/mo | 5,000 | $0.80 |
| Growth | $15/mo | 25,000 | $0.60 |
| Scale | $40/mo | 100,000 | $0.40 |

## 3. Custom domain ebounce.custmax.com — NEEDS YOUR ACTION

`custmax.com` IS in your Cloudflare account, but the API token I use cannot
add custom domains or DNS records (scope-limited). Two-minute dashboard job:

1. Go to Cloudflare Dashboard → **Workers & Pages** → `aceppe-email-prefilter`
   → **Settings** → **Domains & Routes** → **Add Custom Domain**
2. Enter `ebounce.custmax.com` → Activate. (Cloudflare creates the DNS automatically.)
3. Done. Both `http://ebounce.custmax.com/` and `https://ebounce.custmax.com/` will work.

**About http://:** the zone's "Always Use HTTPS" is currently OFF, so plain
`http://ebounce.custmax.com/` serves directly with no redirect — as you asked.
Trade-off: login passwords and API keys travel unencrypted over http and can be
sniffed on public Wi-Fi. Recommendation: keep http working for the API, but turn
**Always Use HTTPS** on later for the dashboard/login pages. The app already
sends the `Secure` cookie flag on https and drops it on http so login works on both.

## 4. Stripe — NEEDS YOUR ACTION (billing is built, keys not yet installed)

The worker reads these **Worker secrets** (Dashboard → Workers & Pages →
`aceppe-email-prefilter` → Settings → Variables and Secrets → add as *Secret*):

| Secret name | Where to get it |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys → Secret key (`sk_live_...`) |
| `STRIPE_PUBLISHABLE_KEY` | Same page → Publishable key (`pk_live_...`) — reserved for future use |
| `STRIPE_WEBHOOK_SECRET` | Developers → Webhooks → Add endpoint → `https://ebounce.custmax.com/webhooks/stripe` → select events `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` → Signing secret (`whsec_...`) |
| `STRIPE_PRICE_STARTER` | Products → create product "eBounce Starter" $4/mo recurring → Price ID (`price_...`) |
| `STRIPE_PRICE_GROWTH` | Products → create product "eBounce Growth" $15/mo recurring → Price ID |
| `STRIPE_PRICE_SCALE` | Products → create product "eBounce Scale" $40/mo recurring → Price ID |

Steps in Stripe Dashboard (stripe.com → Sign up → activate account):
1. **Activate** your Stripe account (business details + bank account for payouts).
2. **Developers → API keys**: copy Secret key → `STRIPE_SECRET_KEY`.
3. **Product catalog → Products**: create 3 recurring products:
   - eBounce Starter — $9 USD / month → copy Price ID → `STRIPE_PRICE_STARTER`
   - eBounce Growth — $29 USD / month → copy Price ID → `STRIPE_PRICE_GROWTH`
   - eBounce Scale — $79 USD / month → copy Price ID → `STRIPE_PRICE_SCALE`
4. **Developers → Webhooks → Add endpoint**:
   - URL: `https://ebounce.custmax.com/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy Signing secret → `STRIPE_WEBHOOK_SECRET`
5. Paste the 6 secrets into the Worker (step above) → **Redeploy** the worker
   (or wait ~1 min; secrets apply on next deploy — I can redeploy on your word).

Until secrets are set, the dashboard shows "Paid billing coming soon" and
checkout returns `billing_not_configured` — the free tier and API work fully.

Also enable the **Stripe Customer Portal** (Settings → Billing → Customer portal)
so users can self-manage/cancel — the dashboard links to it automatically.

## 5. How it works (technical summary)

- **Stack:** Cloudflare Workers + KV (users, API keys, sessions, monthly usage).
- **Auth:** email + password (PBKDF2-SHA256, 100k iterations), HttpOnly session cookie.
- **API keys:** `ebk_…` prefix, SHA-256 hashed at rest, shown once, revocable.
- **Endpoints:** `GET /api/check?email=` (X-API-Key header or `?api_key=`),
  `POST /api/check-batch` (up to 500 emails). Missing key → 401, over quota → 402 JSON.
- **Checks:** syntax, MX (DNS-over-HTTPS), disposable list, role-based detection.
  Verdicts: `pass`/`fail` with reasons (`ok`, `bad-syntax`, `no-mx`, `disposable`, `role-based`, `dns-error`).
- **Quota:** monthly (UTC), hard stop at plan limit.
- **Webhooks** upgrade/downgrade plans automatically; portal for self-service.

## 6. Internal API key (for our own verification scripts)

The old public endpoint now requires a key. Create one at
https://ebounce.custmax.com/dashboard (Sign up → API keys → Create key),
or ask me to provision one. Update scripts that call `/api/check` to send
`X-API-Key: ebk_…`.

## Files

- `src/` — worker source (`index.js`, `pages.js`, `auth.js`, `verify.js`, `stripe.js`, `store.js`)
- `wrangler.toml` — worker config (KV binding)
- `cf.sh` — deploy helper (uses Cloudflare surrogate auth, never prints secrets)
- `SETUP.md` — this file
