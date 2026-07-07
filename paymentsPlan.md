# Round Door Studio — Payments + Entitlements Implementation Plan

## Overview

The app is already migrated to Next.js with Supabase auth and story content set up. The next phase adds payments and entitlement logic.

The product model supports:

1. Monthly membership
2. Yearly membership
3. One-time purchase of a specific Story Pack

Access rules:

- Story 1 (`frog-at-the-bottom-of-the-well`) is always free — accessible without login
- Active monthly or yearly membership unlocks all Story Packs
- One-time Story Pack purchase unlocks only that specific Story Pack
- Free users can browse stories and use listen links, but cannot access Story Pack content
- Admin/test users may be manually granted access via entitlement grants

All payments go through Stripe Checkout. No custom card forms. No card data is ever stored in Supabase.

**Currently live story packs (`released: true`):**

| # | Slug | Title |
|---|------|-------|
| 1 | `frog-at-the-bottom-of-the-well` | The Frog at the Bottom of the Well *(always free)* |
| 2 | `qu-yuan-and-dragon-boat-festival` | Qu Yuan and Dragonboat Festival |
| 3 | `mend-the-sheep-pen` | Never Too Late to Mend the Sheep Pen |
| 4 | `fox-borrows-the-tigers-might` | The Fox Borrows the Tiger's Might |

Story Pack content is JSON-based, loaded from Supabase DB via `loadAllContentFromDB`. There are no downloadable files. Access is gated server-side before content is fetched — the page renders whatever it is given.

---

## Core Principles

- **Adapt, don't replace.** If an existing schema, auth flow, or content-loading system already solves the problem, extend it rather than introducing a parallel system.
- **Inspect before migrating.** Never recreate a table that already exists. Always audit the current schema and produce a diff before writing any migration.
- **Server decides everything.** The server always determines the Stripe price ID, the content returned, and the access level. The client renders what it receives.
- **Service role stays server-side.** `SUPABASE_SERVICE_ROLE_KEY` never appears in client components or `NEXT_PUBLIC_` vars.
- **Webhook events are verified and idempotent.** No Supabase writes before signature verification passes. Duplicate event IDs are ignored.

---

## Stage 0 — Schema Audit

Before writing any migration, inspect the existing database and produce a complete audit.

### Inspect these tables

```
auth.users
public.profiles
public.subscriptions
```

For each table, document:

- All columns (name, type, nullable, default)
- Foreign key constraints
- Indexes
- RLS enabled/disabled
- Existing policies (name, command, expression)
- Triggers

### Produce three artifacts

**1. Current Schema** — exact state of each table as it exists today

**2. Desired Schema** — target state after payments work is complete

**3. Migration Plan** — the diff between them:
- Which tables to CREATE
- Which tables to ALTER (columns to add, constraints to add)
- Which RLS policies to add or verify
- Which triggers already exist vs. need to be created

Only after this audit is complete does PR 1 begin.

---

## Stage 1 — Environment Variables

### Local (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

STRIPE_PRICE_MONTHLY=
STRIPE_PRICE_YEARLY=

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Production (Vercel)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

STRIPE_PRICE_MONTHLY=
STRIPE_PRICE_YEARLY=

NEXT_PUBLIC_SITE_URL=https://rounddoorstudio.com
```

Use test-mode Stripe keys locally and in CI. Use live keys only in production. Never mix them.

---

## Stage 2 — Stripe Test Mode Setup

Create products and prices in Stripe test mode.

### Product 1: Circle Membership

One product with two prices:

```
Circle Membership
  ├── Monthly Membership (recurring monthly)  → STRIPE_PRICE_MONTHLY
  └── Yearly Membership  (recurring yearly)   → STRIPE_PRICE_YEARLY
```

### Product 2: Individual Story Packs

Create one Stripe product per live Story Pack with a one-time price. Attach metadata so the webhook knows which pack to unlock.

```
Story Pack: The Frog at the Bottom of the Well
  └── One-time price
      metadata: { story_slug: "frog-at-the-bottom-of-the-well", product_type: "story_pack" }

Story Pack: Qu Yuan and Dragonboat Festival
  └── One-time price
      metadata: { story_slug: "qu-yuan-and-dragon-boat-festival", product_type: "story_pack" }

Story Pack: Never Too Late to Mend the Sheep Pen
  └── One-time price
      metadata: { story_slug: "mend-the-sheep-pen", product_type: "story_pack" }

Story Pack: The Fox Borrows the Tiger's Might
  └── One-time price
      metadata: { story_slug: "fox-borrows-the-tigers-might", product_type: "story_pack" }
```

When new stories are released, add a new Stripe product and insert a row in the `products` table. No code changes required.

---

## Stage 3 — Supabase Database Schema

All migrations are derived from the Stage 0 audit. The approach for every table: **inspect first, migrate second.**

---

### `profiles` *(already exists — no changes needed)*

Known schema: `id`, `email`, `full_name`, `created_at`

Use `full_name` everywhere. Verify against audit output before assuming no changes needed.

---

### `subscriptions` *(already exists — ALTER to add missing columns)*

Known existing columns: `id`, `user_id`, `status`, `stripe_customer_id`, `stripe_subscription_id`, `current_period_end`, `created_at`

Columns to add (confirmed missing from audit):

```sql
alter table public.subscriptions
  add column if not exists plan_interval text,
  add column if not exists price_id text,
  add column if not exists current_period_start timestamptz,
  add column if not exists cancel_at_period_end boolean default false,
  add column if not exists updated_at timestamptz default now();
```

Full target schema after migration:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | existing |
| `user_id` | uuid | existing |
| `status` | text | existing |
| `stripe_customer_id` | text | existing |
| `stripe_subscription_id` | text | existing |
| `current_period_end` | timestamptz | existing |
| `created_at` | timestamptz | existing |
| `plan_interval` | text | **add** — `monthly` or `yearly`, denormalized for easy reads |
| `price_id` | text | **add** — source of truth for which plan |
| `current_period_start` | timestamptz | **add** |
| `cancel_at_period_end` | boolean | **add** — drives "Canceling" state on account page |
| `updated_at` | timestamptz | **add** |

Active access statuses: `active`, `trialing`

All other statuses (`past_due`, `canceled`, `unpaid`, `incomplete`, `incomplete_expired`, `paused`) do not grant access.

---

### `stripe_customers` *(new)*

```sql
create table public.stripe_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz default now(),

  unique(user_id)
);
```

---

### `story_pack_purchases` *(new)*

Written only by the webhook handler.

```sql
create table public.story_pack_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  story_slug text not null,
  stripe_customer_id text,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,

  amount_total integer,
  currency text,

  purchased_at timestamptz default now(),

  unique(user_id, story_slug)
);
```

---

### `entitlement_grants` *(new)*

Manual admin/promo/test access. `story_slug = null` means global access.

```sql
create table public.entitlement_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  story_slug text,
  grant_type text not null,
  expires_at timestamptz,
  notes text,

  created_at timestamptz default now()
);
```

Grant types: `admin`, `promo`, `test`

---

### `products` *(new)*

Maps app products to Stripe price IDs. Checkout routes look up price IDs here — the client never sends one. Add a row when a new story pack releases; no code changes required.

```sql
create table public.products (
  id uuid primary key default gen_random_uuid(),

  product_type text not null,
  name text not null,
  story_slug text,

  stripe_product_id text,
  stripe_price_id text not null unique,

  active boolean default true,
  created_at timestamptz default now()
);
```

Product types: `membership_monthly`, `membership_yearly`, `story_pack`

---

### `stripe_events` *(new)*

Idempotency guard. Service-role only — no user access.

```sql
create table public.stripe_events (
  id text primary key,
  type text not null,
  processed_at timestamptz default now()
);
```

Before processing any webhook event: check if `event.id` exists. If yes, return 200 and stop. If no, insert then process.

---

## Stage 4 — Row Level Security

Check existing RLS state on `subscriptions` during the Stage 0 audit before applying anything.

Enable RLS on all new tables:

```sql
alter table public.stripe_customers enable row level security;
alter table public.story_pack_purchases enable row level security;
alter table public.entitlement_grants enable row level security;
alter table public.products enable row level security;
alter table public.stripe_events enable row level security;
```

Verify RLS is enabled on `subscriptions`. If not:

```sql
alter table public.subscriptions enable row level security;
```

### Policies

```sql
-- stripe_customers
create policy "Users can read own stripe customer"
on public.stripe_customers for select using (auth.uid() = user_id);

-- subscriptions
create policy "Users can read own subscriptions"
on public.subscriptions for select using (auth.uid() = user_id);

-- story_pack_purchases
create policy "Users can read own purchases"
on public.story_pack_purchases for select using (auth.uid() = user_id);

-- entitlement_grants
create policy "Users can read own grants"
on public.entitlement_grants for select using (auth.uid() = user_id);

-- products
create policy "Anyone can read active products"
on public.products for select using (active = true);

-- stripe_events: no policies — service role only
```

No user insert/update/delete policies on any payment or access table. All writes go through server routes using the service role client.

---

## Stage 5 — Access Helper

One canonical server-side function. The page calls it and renders whatever it receives — no access logic in components.

### `getStoryPackForUser`

```ts
async function getStoryPackForUser(
  userId: string | null,
  storySlug: string
): Promise<{
  hasAccess: boolean;
  storyPack: StoryPack | StoryPackPreview;
  source: "free" | "subscription" | "purchase" | "grant" | "none";
  subscriptionStatus?: string;
  planInterval?: string;
}>
```

Access is granted (and full `StoryPack` returned) if **any** of the following is true:

1. `storySlug === FREE_STORY_SLUG` — Story 1 is always free, no auth needed
2. User has a subscription with `status = 'active'` or `status = 'trialing'`
3. User has a row in `story_pack_purchases` for this `story_slug`
4. User has a row in `entitlement_grants` where:
   - `story_slug` matches OR `story_slug` is null (global)
   - AND `expires_at IS NULL OR expires_at > now()`

If none of the above: `hasAccess = false`, return `StoryPackPreview` (counts only, via existing `getContentCountsFromDB`).

### Story page integration

Replace:

```ts
const isFreeStory = story.num === 1;
const showLockedView = !user && !isFreeStory;
// ... conditional loadAllContentFromDB
```

With:

```ts
const { hasAccess, storyPack, source } = await getStoryPackForUser(user?.id ?? null, slug);
```

Pass `storyPack` directly to `<StoryPack />`. The component renders what it receives — full content or preview — with no access logic of its own. The `source` field drives which unlock CTA to show when `hasAccess` is false.

---

## Stage 6 — Checkout Routes

All routes require an authenticated user. The server always determines the Stripe price ID — the client never sends one.

Rate limiting is deferred to PR 6. Routes should be structured so Upstash Ratelimit can be dropped in at the top of each handler without restructuring the logic.

---

### `POST /api/stripe/create-membership-checkout`

Input:

```ts
{ interval: "monthly" | "yearly" }
```

Steps:

1. Require authenticated user (401 if not)
2. Validate `interval` (400 if invalid)
3. Look up price ID from env var (`STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_YEARLY`)
4. Get or create Stripe customer, store mapping in `stripe_customers`
5. Create Stripe Checkout Session in `subscription` mode
6. Return session URL

```ts
success_url: `${siteUrl}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`
cancel_url:  `${siteUrl}/membership?checkout=canceled`
```

---

### `POST /api/stripe/create-story-pack-checkout`

Input:

```ts
{ storySlug: string }
```

Steps:

1. Require authenticated user (401 if not)
2. Look up product by `story_slug` in `products` table (400 if not found or inactive)
3. Get or create Stripe customer, store mapping in `stripe_customers`
4. Create Stripe Checkout Session in `payment` mode with metadata:

```ts
metadata: {
  user_id: user.id,
  story_slug: storySlug,
  product_type: "story_pack"
}
```

5. Return session URL

```ts
success_url: `${siteUrl}/story/${storySlug}?checkout=success`
cancel_url:  `${siteUrl}/story/${storySlug}?checkout=canceled`
```

---

### `POST /api/stripe/create-portal-session`

Steps:

1. Require authenticated user (401 if not)
2. Look up `stripe_customer_id` from `stripe_customers`
3. Create Stripe billing portal session
4. Return portal URL

---

## Stage 7 — Stripe Webhook

### Route: `POST /api/stripe/webhook`

**Must use raw request body.** Do not parse before verification.

```ts
stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)
```

Return 400 immediately if verification fails. No Supabase writes before a verified event.

**Idempotency:** Check `stripe_events` for `event.id`. If exists → return 200. If not → insert, then process.

---

### Events to handle

#### `checkout.session.completed`

If `mode === 'subscription'`:
- Retrieve subscription from Stripe
- Upsert subscription row in `subscriptions`
- Ensure `stripe_customers` mapping exists

If `mode === 'payment'` and `metadata.product_type === 'story_pack'`:
- Insert into `story_pack_purchases` using `user_id`, `story_slug`, session ID, payment intent ID, amount, currency

---

#### `customer.subscription.created` / `customer.subscription.updated`

Upsert subscription row. Resolve `user_id` via `stripe_customer_id → stripe_customers`.

Fields: `user_id`, `stripe_customer_id`, `stripe_subscription_id`, `status`, `plan_interval`, `price_id`, `current_period_start`, `current_period_end`, `cancel_at_period_end`, `updated_at`

---

#### `customer.subscription.deleted`

Set `status` to `'canceled'`. Do not delete the row.

---

#### `invoice.payment_failed`

Update `status` to Stripe's current subscription status (usually `past_due`).

---

#### `invoice.payment_succeeded`

Update `current_period_start`, `current_period_end`, `status`, `updated_at`.

---

## Stage 8 — Story Pack Access Layer

Story Pack materials are JSON content in Supabase DB. There are no downloadable files. Protection is enforced server-side by `getStoryPackForUser` before any content is fetched.

### Access flow

```
Story Page
     ↓
getStoryPackForUser(userId, slug)
     ↓
{ hasAccess: true,          { hasAccess: false,
  storyPack: StoryPack }      storyPack: StoryPackPreview }
     ↓                              ↓
<StoryPack />              <StoryPack /> with locked UI
renders full content       renders counts + CTAs
```

`getContentCountsFromDB` already exists and powers the preview. No new preview function needed — extend what's there.

The `<StoryPack />` component receives either a full pack or a preview and renders accordingly. No access logic lives in the component itself.

### Why this is sufficient

Content is in Supabase DB rows. `getStoryPackForUser` only runs server-side in a Server Component. There is no client-accessible API route that exposes raw story content.

---

## Stage 9 — UI Updates

### Story Page

The CTA shown when `hasAccess = false` depends on `source`:

**`source === "none"`, user logged in:**
```
Choose how to continue:

[Join the Circle]           [Unlock This Story Pack]
Unlock every Story Pack     One-time access to this story
```

**`source === "none"`, user logged out:**
```
Join the Circle or unlock this Story Pack
[Join the Circle]  [Unlock This Story Pack]
```

**`hasAccess = true`, `source === "subscription"`:**
```
Story Pack unlocked with your Circle Membership
[Read-Along]  [Vocabulary]  [Activities]
```

**`hasAccess = true`, `source === "purchase"`:**
```
Story Pack unlocked
[Read-Along]  [Vocabulary]  [Activities]
```

---

### Membership Page *(already exists — wire up checkout)*

Buttons call `POST /api/stripe/create-membership-checkout` and redirect to the returned session URL.

---

### Account Page *(new)*

Route: `/account`

**Account**
```
Email: user@example.com
```

**Membership — active:**
```
Circle Membership: Active
Plan: Monthly / Yearly
Renews: DATE
[Manage Membership]
```

**Membership — canceling (`cancel_at_period_end = true`):**
```
Circle Membership: Canceling
Access until: DATE
[Manage Membership]
```

**Membership — free:**
```
Circle Membership: Free
[Join the Circle]
```

**Story Packs — if purchased:**
```
Your Story Packs
- Frog at the Bottom of the Well
- Qu Yuan and Dragonboat Festival
```

**Story Packs — if none:**
```
No individual Story Packs yet.
[Browse Stories]
```

**Buttons:** Browse Stories · Manage Membership · Log Out

---

## Stage 10 — Testing Plan

### Unit Tests (Vitest)

#### `getStoryPackForUser` — access logic

| Case | `hasAccess` | `source` | `storyPack` type |
|------|-------------|----------|------------------|
| Free slug, no user | `true` | `"free"` | `StoryPack` |
| Free user, no purchase | `false` | `"none"` | `StoryPackPreview` |
| Active monthly subscription | `true` | `"subscription"` | `StoryPack` |
| Active yearly subscription | `true` | `"subscription"` | `StoryPack` |
| Canceled subscription, no purchase | `false` | `"none"` | `StoryPackPreview` |
| Past due subscription | `false` | `"none"` | `StoryPackPreview` |
| Purchased matching slug | `true` | `"purchase"` | `StoryPack` |
| Purchased different slug | `false` | `"none"` | `StoryPackPreview` |
| Admin grant, matching story | `true` | `"grant"` | `StoryPack` |
| Expired grant | `false` | `"none"` | `StoryPackPreview` |
| Global grant (`story_slug = null`) | `true` | `"grant"` | `StoryPack` |

#### DB-level content test *(critical)*

These tests confirm that the access layer returns the right data shape from the database — not just that the boolean is correct.

| Case | Expected DB result |
|------|--------------------|
| Free user calls `getStoryPackForUser` on paid story | Returns `StoryPackPreview` — vocab/question/activity counts only, no content |
| Subscribed user calls `getStoryPackForUser` on same story | Returns full `StoryPack` — all vocab, questions, activities, story content |
| One-time purchaser calls on their story | Returns full `StoryPack` |
| One-time purchaser calls on a different story | Returns `StoryPackPreview` |

This is more important than any UI test. If this layer is wrong, the UI cannot save you.

---

### API Route Tests

- Logged out → 401
- Invalid interval → 400
- Invalid / inactive story slug → 400
- Client-supplied price ID is ignored
- Correct Stripe session mode (`subscription` / `payment`)
- Checkout metadata includes `user_id`, `story_slug`, `product_type`

---

### Webhook Tests

#### Signature verification
- Invalid signature → 400, no Supabase writes
- Valid signature → processed

#### Idempotency
- Duplicate `event.id` → 200, no duplicate writes

#### `checkout.session.completed` (subscription)
- `stripe_customers` mapping saved
- Subscription row created or updated

#### `checkout.session.completed` (story pack)
- Purchase row inserted with correct `story_slug` and `user_id`
- Not duplicated on retry

#### `customer.subscription.updated`
- Status changes reflected
- `cancel_at_period_end` saved
- `current_period_end` updated

#### `customer.subscription.deleted`
- Status becomes `canceled`
- `getStoryPackForUser` returns `StoryPackPreview` for a user with only a canceled subscription

---

### Playwright E2E Tests (Stripe test mode)

#### Free browsing
- Story 1 (frog) fully accessible without login
- Stories 2–4 show locked UI for logged-out users

#### Free logged-in user
- Visits story page, sees locked pack with CTAs

#### Monthly membership checkout
- Click monthly → Stripe Checkout → test card → account page
- Account shows active monthly, story pack visible

#### Yearly membership checkout
- Same as monthly but yearly

#### One-time Story Pack checkout
- Click Unlock → Stripe Checkout → test card → story page
- Purchased story unlocked, different story still locked

#### Logout behavior
- Subscribed user sees story content
- After logout: story returns to locked state

---

## Stage 11 — GitHub Actions CI

### CI commands

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run build
npx playwright test --project=chromium
```

### GitHub Actions secrets

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET

TEST_USER_EMAIL
TEST_USER_PASSWORD
```

Test-mode Stripe keys only in CI.

---

## Stage 12 — Manual QA Checklist

### Auth
- [ ] New user can sign up
- [ ] Email confirmation works
- [ ] Existing user can log in
- [ ] Google login still works
- [ ] Logout works
- [ ] Account page requires login

### Payments
- [ ] Monthly checkout works
- [ ] Yearly checkout works
- [ ] One-time Story Pack checkout works
- [ ] Canceled checkout returns cleanly
- [ ] Payment success redirects correctly
- [ ] Stripe webhook updates Supabase

### Access
- [ ] Story 1 accessible without login
- [ ] Free user sees locked packs on stories 2–4
- [ ] Monthly member sees all packs unlocked
- [ ] Yearly member sees all packs unlocked
- [ ] One-time purchaser sees only purchased pack unlocked
- [ ] Logout removes visible access on paid stories

### Account Page
- [ ] Membership status correct
- [ ] Renewal date correct
- [ ] Purchased Story Packs listed
- [ ] Manage Membership opens Stripe portal
- [ ] Free users see Join the Circle CTA

---

## Stage 13 — Production Readiness

### Security gate (all must be true before switching to live Stripe)

- [ ] Stripe Checkout used for all payments
- [ ] Stripe Customer Portal used for billing management
- [ ] No card data stored in Supabase
- [ ] Webhook signature verification implemented
- [ ] Webhook idempotency implemented
- [ ] `SUPABASE_SERVICE_ROLE_KEY` server-only
- [ ] RLS enabled on all payment and access tables
- [ ] `getStoryPackForUser` is the sole gating point — no parallel access checks
- [ ] Checkout routes reject client-supplied price IDs
- [ ] Rate limiting on checkout routes (Upstash Ratelimit)
- [ ] Test/live Stripe keys separated
- [ ] Privacy policy, terms, and refund/cancel policy published

### Production switch steps

1. Finish EIN/business bank account
2. Activate Stripe live account
3. Create live products and prices (mirror test setup)
4. Insert live price IDs into `products` table
5. Add live webhook endpoint in Stripe dashboard
6. Add live webhook secret to Vercel env vars
7. Update all production Stripe env vars in Vercel
8. Run one real payment with a low-price or coupon-discounted product
9. Confirm webhook updates Supabase
10. Confirm payout settings
11. Confirm receipts show correct business name
12. Confirm refund/cancel policy is in place

---

## Build Order

### PR 1 — Schema audit + database foundation

- Run Stage 0 audit: document current schema for `auth.users`, `profiles`, `subscriptions`
- Produce Current Schema → Desired Schema → Migration Plan
- Migration: ALTER `subscriptions` to add missing columns
- Migration: CREATE `stripe_customers`, `story_pack_purchases`, `entitlement_grants`, `products`, `stripe_events`
- RLS: verify/enable on `subscriptions`, enable + add policies on all new tables
- Seed `products` table: 2 membership rows + 4 live story pack rows

### PR 2 — `getStoryPackForUser` + unit tests

- Implement `getStoryPackForUser` server helper
- Define `StoryPack` and `StoryPackPreview` types
- Full unit test coverage (access logic table above)
- DB-level content tests (free user vs. subscribed user SELECT results)

### PR 3 — Stripe checkout routes

- Install Stripe SDK
- `create-membership-checkout` route
- `create-story-pack-checkout` route
- `create-portal-session` route
- API route tests

### PR 4 — Stripe webhook

- Webhook route with signature verification
- Idempotency via `stripe_events`
- Handle all subscription and one-time purchase events
- Webhook tests

### PR 5 — Account page

- New `/account` route
- Membership status + renewal date
- Purchased Story Packs list
- Manage Membership → portal route
- Log out button
- Tests

### PR 6 — Story page gating + membership page wiring

- Replace story page access logic with `getStoryPackForUser`
- Pass result directly to `<StoryPack />` — no access logic in component
- Logged-in and logged-out locked CTAs
- Wire membership page buttons to checkout route
- Playwright E2E tests

### PR 7 — Production polish

- Empty and error states
- Toasts (checkout success, checkout cancel, logout)
- Loading states
- Mobile QA
- Rate limiting on checkout routes (Upstash Ratelimit)

---

## UX Copy Reference

**Locked Story Pack:**
> Join the Circle to open the full Story Pack.
> Includes read-alongs, vocabulary, discussion prompts, and cultural activities for the whole family.

**One-time purchase:**
> Only want this story? Unlock this Story Pack once and keep access forever.

**Membership pitch:**
> Circle Members get access to every Story Pack, including new materials as they are released.

**Free account (account page):**
> You're currently on a free account. You can listen to every story for free. Join the Circle to unlock Story Packs.

**Active membership:**
> Your Circle Membership is active.

**Purchased packs:**
> Your unlocked Story Packs

