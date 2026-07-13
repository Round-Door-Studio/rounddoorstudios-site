# Systems Reference

Quick reference for every external service the site depends on. Dashboards, where keys live, and what each service does.

---

## Supabase

**What it does:** Postgres database + auth (email/password and Google OAuth).

**Dashboard:** [supabase.com](https://supabase.com) → Round Door Studio project

**Keys location:** Project Settings → API

| Env var | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — server-side only, never exposed to client |

**Tables:**

| Table | Description |
|---|---|
| `stories` | Story catalog — metadata, titles, audio, cover images |
| `story_content` | Story pack content — read-along, vocab, questions, activities (JSONB) |
| `profiles` | User profiles — name, email, synced from `auth.users` via Postgres trigger |
| `stripe_customers` | Maps `user_id` → `stripe_customer_id` |
| `subscriptions` | Active/canceled membership subscriptions with status and billing period |
| `story_pack_purchases` | Individual story pack purchases (one row per user+slug) |
| `stripe_events` | Processed webhook event IDs — used for idempotency |

---

## Stripe

**What it does:** Payments — membership subscriptions (monthly/yearly) and one-time story pack purchases.

**Dashboard:** [dashboard.stripe.com](https://dashboard.stripe.com)

**Keys location:** Developers → API keys (test mode) / Developers → API keys (live mode)

| Env var | Description |
|---|---|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key (public) |
| `STRIPE_SECRET_KEY` | Secret key — server-side only |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret — used to verify incoming events |
| `STRIPE_PRICE_MONTHLY` | Price ID for monthly membership |
| `STRIPE_PRICE_YEARLY` | Price ID for yearly membership |

**Webhook endpoint:** `/api/stripe/webhook`

Stripe sends events here after checkout and subscription changes. The webhook handler is idempotent — it upserts event IDs into `stripe_events` before processing to guard against duplicate delivery.

**Events handled:**

| Event | What it does |
|---|---|
| `checkout.session.completed` | For subscriptions: upserts to `subscriptions`. For story packs: upserts to `story_pack_purchases` |
| `customer.subscription.created/updated` | Upserts subscription record |
| `customer.subscription.deleted` | Marks subscription as `canceled` |
| `invoice.payment_failed/succeeded` | Re-syncs subscription state |

**Local testing:** Stripe events won't reach localhost by default. Run the Stripe CLI to forward them:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI prints a webhook signing secret — use that as `STRIPE_WEBHOOK_SECRET` in `.env.local` while the listener is running (it differs from the dashboard secret).

**Status:** Currently in test mode. Sandbox account ID: `acct_1TqRjw228cC4fyy1`. Going live requires completing the Stripe account profile (EIN needed).

---

## Upstash Redis

**What it does:** Rate limiting for Stripe checkout API routes. Prevents users from spamming checkout session creation.

**Dashboard:** [console.upstash.com](https://console.upstash.com)

**Keys location:** Database → your Redis instance → REST API

| Env var | Description |
|---|---|
| `UPSTASH_REDIS_REST_URL` | REST URL for the Redis instance |
| `UPSTASH_REDIS_REST_TOKEN` | REST token |

**Local behavior:** If these env vars are not set, rate limiting falls back to an in-memory `Map`. This means rate limiting works locally and in CI without needing a real Redis connection — the tradeoff is that limits don't persist across server restarts or share state across instances.

---

## Vercel

**What it does:** Hosting and deployment.

**Dashboard:** [vercel.com](https://vercel.com) → Round Door Studio project

Environment variables are set in the Vercel dashboard under Project Settings → Environment Variables. They mirror `.env.local` (minus `TEST_USER_*` — those are only needed for CI).

---

## GitHub Actions

**What it does:** CI on every push/PR to `main` and `f3/**` branches.

**Config:** `.github/workflows/ci.yml`

Two jobs:
- **Lint, Typecheck & Unit Tests** — fast, no browser
- **E2E Tests (Playwright)** — sharded across 3 parallel jobs (Chromium + Mobile Safari)

Secrets required in the repo (Settings → Secrets → Actions):

| Secret | Used for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Build + E2E |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Build + E2E |
| `SUPABASE_SERVICE_ROLE_KEY` | E2E |
| `TEST_USER_EMAIL` | Subscriber account for E2E |
| `TEST_USER_PASSWORD` | |
| `TEST_USER_FREE_EMAIL` | Free account (no sub) for purchase flow E2E |
| `TEST_USER_FREE_PASSWORD` | |
| `TEST_USER_PURCHASER_EMAIL` | Account with a story pack purchase for E2E |
| `TEST_USER_PURCHASER_PASSWORD` | |
