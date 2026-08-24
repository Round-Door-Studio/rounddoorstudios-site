# Schema Audit — Stage 0

**Date:** 2026-07-06
**Branch:** f3/payments
**Purpose:** Baseline schema documentation before payments migration. This document drives PR 1.

---

## 1. Current Schema

### Tables

#### `profiles`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | — |
| `email` | `text` | NOT NULL | — |
| `full_name` | `text` | NULL | — |
| `created_at` | `timestamptz` | NULL | `now()` |

#### `stories`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` |
| `num` | `int` | NOT NULL | — |
| `slug` | `text` | NOT NULL | — |
| `season` | `int` | NOT NULL | — |
| `released` | `bool` | NULL | `false` |
| `part` | `int` | NULL | — |
| `parts` | `int` | NULL | — |
| `title_en` | `text` | NOT NULL | — |
| `title_simp` | `text` | NOT NULL | — |
| `title_trad` | `text` | NOT NULL | — |
| `blurb` | `text` | NULL | — |
| `runtime` | `text` | NULL | — |
| `pub` | `text` | NULL | — |
| `cover_color` | `text` | NULL | — |
| `cover_image` | `text` | NULL | — |
| `cover_image_landscape` | `text` | NULL | — |
| `audio` | `jsonb` | NULL | — |
| `has_bundle` | `bool` | NULL | `false` |
| `created_at` | `timestamptz` | NULL | `now()` |

#### `story_content`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `slug` | `text` | NOT NULL | — |
| `read_along` | `jsonb` | NULL | — |
| `vocab` | `jsonb` | NULL | — |
| `questions` | `jsonb` | NULL | — |
| `activities` | `jsonb` | NULL | — |
| `updated_at` | `timestamptz` | NULL | `now()` |

#### `subscriptions`

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL | — |
| `status` | `text` | NOT NULL | — |
| `stripe_customer_id` | `text` | NULL | — |
| `stripe_subscription_id` | `text` | NULL | — |
| `current_period_end` | `timestamptz` | NULL | — |
| `created_at` | `timestamptz` | NULL | `now()` |

---

### Foreign Keys

| Constraint | From | To | Notes |
|-----------|------|----|-------|
| `subscriptions_user_id_fkey` | `subscriptions.user_id` | `profiles.id` | — |
| `story_content_slug_fkey` | `story_content.slug` | `stories.slug` | — |
| *(implicit, via trigger)* | `profiles.id` | `auth.users.id` | No formal FK in public schema; enforced by `on_auth_user_created` trigger |

---

### Indexes

| Table | Index Name | Type | Columns |
|-------|-----------|------|---------|
| `profiles` | `profiles_pkey` | UNIQUE btree | `id` |
| `stories` | `stories_pkey` | UNIQUE btree | `id` |
| `stories` | `stories_slug_key` | UNIQUE btree | `slug` |
| `story_content` | `story_content_pkey` | UNIQUE btree | `slug` |
| `subscriptions` | `subscriptions_pkey` | UNIQUE btree | `id` |

**No index on `subscriptions.user_id`.**

---

### RLS Status

All four tables have RLS enabled.

| Table | RLS Enabled |
|-------|-------------|
| `profiles` | Yes |
| `stories` | Yes |
| `story_content` | Yes |
| `subscriptions` | Yes |

---

### RLS Policies

| Table | Operation | Policy Expression |
|-------|-----------|-------------------|
| `profiles` | SELECT | `auth.uid() = id` |
| `profiles` | UPDATE | `auth.uid() = id` |
| `stories` | SELECT | `released = true` |
| `stories` | SELECT | `auth.role() = 'authenticated' AND released = true` |
| `story_content` | SELECT | `auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM stories s WHERE s.slug = story_content.slug AND s.released = true)` |
| `subscriptions` | SELECT | `auth.uid() = user_id` |

No INSERT, UPDATE, or DELETE policies exist on any table. All writes use the service role.

---

### Trigger and Function

**Trigger:** `on_auth_user_created`
- Fires: `AFTER INSERT` on `auth.users`
- Executes: `handle_new_user()`

**Function: `handle_new_user`**

```sql
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name;
  return new;
end;
```

The upsert on conflict means re-logins (e.g. OAuth re-auth) will refresh `email` and `full_name` on the profile row.

---

## 2. Findings

**FK pattern: user_id → profiles.id, not auth.users.id**
`subscriptions.user_id` references `profiles.id`, not `auth.users.id` directly. All new payment tables with a `user_id` column must follow the same pattern.

**Nullable Stripe columns on subscriptions**
`stripe_customer_id` and `stripe_subscription_id` are nullable. This is intentional — both are written by the webhook after the initial row is created. Nullable is correct here, but callers must not assume these are populated.

**Missing index on subscriptions.user_id**
Every subscription access check queries `WHERE user_id = ?`. There is no index on this column. This needs to be added before any production payment traffic runs through it.

**story_content requires authenticated role**
The `story_content` SELECT policy gates on `auth.role() = 'authenticated'`. Anonymous users cannot read `story_content` at all. This is why application code uses the service role when fetching story content for locked preview counts — an anon client would return nothing.

**profiles.email is NOT NULL; full_name is nullable**
`handle_new_user` upserts on conflict so re-logins keep the profile in sync. `full_name` being nullable is correct since not all auth providers supply it.

**story_content uses slug as primary key**
`story_content` uses `slug` (text) as its PK, not a UUID. The FK into `stories.slug` means story slugs must remain stable — renaming a slug requires updating both tables.

---

## 3. New Tables Required

The following tables need to be created for the payments feature.

| Table | Purpose |
|-------|---------|
| `stripe_customers` | Maps a `profiles.id` to a Stripe customer ID |
| `story_pack_purchases` | Records one-time story pack purchases |
| `entitlement_grants` | Tracks what content a user is entitled to access |
| `products` | Catalogue of purchasable products (subscriptions and packs) |
| `stripe_events` | Logs raw Stripe webhook events for idempotency and audit |

All `user_id` columns reference `profiles.id ON DELETE CASCADE` to match the existing FK pattern.

`stripe_events` has no `user_id` — no RLS policy is needed; service role only.

---

## 4. Migration Plan

Steps must be executed in order.

---

### Step 1 — ALTER subscriptions: add missing columns

```sql
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_interval         text,
  ADD COLUMN IF NOT EXISTS price_id              text,
  ADD COLUMN IF NOT EXISTS current_period_start  timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at            timestamptz DEFAULT now();
```

---

### Step 2 — Add index on subscriptions.user_id

```sql
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx
  ON public.subscriptions (user_id);
```

---

### Step 3 — CREATE stripe_customers

```sql
CREATE TABLE public.stripe_customers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id  text NOT NULL UNIQUE,
  created_at          timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX stripe_customers_user_id_idx ON public.stripe_customers (user_id);

ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stripe customer record"
  ON public.stripe_customers
  FOR SELECT
  USING (auth.uid() = user_id);
```

---

### Step 4 — CREATE story_pack_purchases

```sql
CREATE TABLE public.story_pack_purchases (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  story_slug                  text NOT NULL,
  stripe_customer_id          text,
  stripe_checkout_session_id  text UNIQUE,
  stripe_payment_intent_id    text,
  amount_total                integer,
  currency                    text,
  purchased_at                timestamptz DEFAULT now(),

  UNIQUE (user_id, story_slug)
);

CREATE INDEX story_pack_purchases_user_id_idx ON public.story_pack_purchases (user_id);

ALTER TABLE public.story_pack_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON public.story_pack_purchases
  FOR SELECT
  USING (auth.uid() = user_id);
```

---

### Step 5 — CREATE entitlement_grants

```sql
CREATE TABLE public.entitlement_grants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  story_slug  text,
  grant_type  text NOT NULL,
  expires_at  timestamptz,
  notes       text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX entitlement_grants_user_id_idx ON public.entitlement_grants (user_id);

ALTER TABLE public.entitlement_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entitlements"
  ON public.entitlement_grants
  FOR SELECT
  USING (auth.uid() = user_id);
```

`story_slug` is nullable — a `null` value means global access to all story packs. `grant_type` values: `admin`, `promo`, `test`.

---

### Step 6 — CREATE products

```sql
CREATE TABLE public.products (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type      text NOT NULL,
  name              text NOT NULL,
  story_slug        text,
  stripe_product_id text,
  stripe_price_id   text NOT NULL UNIQUE,
  active            boolean NOT NULL DEFAULT true,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON public.products
  FOR SELECT
  USING (active = true);
```

`product_type` values: `membership_monthly`, `membership_yearly`, `story_pack`. `story_slug` is null for membership products, set for story pack products. The checkout routes look up `stripe_price_id` from this table — the client never sends a price ID.

---

### Step 7 — CREATE stripe_events

```sql
CREATE TABLE public.stripe_events (
  id           text PRIMARY KEY,
  type         text NOT NULL,
  processed_at timestamptz DEFAULT now()
);
```

No RLS. No policies. Access via service role only.

---

### Step 8 — Enable RLS on all new tables (summary)

RLS is enabled inline in each CREATE block above. For reference, the complete set:

```sql
ALTER TABLE public.stripe_customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_pack_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlement_grants   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products             ENABLE ROW LEVEL SECURITY;
-- stripe_events: no RLS, service role only
```

---

### Step 9 — Seed products table

Once Stripe price IDs are confirmed, insert one row per purchasable product:

- One row for each subscription tier (monthly, annual), with `type = 'subscription'`, `interval` set to `'month'` or `'year'`, and the corresponding `stripe_price_id`.
- One row per story pack SKU, with `type = 'one_time'` and `interval = null`.
- Set `active = true` for all live products.
- Use the `metadata` jsonb column for any app-specific data (e.g. which story slugs are included in a pack, display order, feature flags).

Do not hard-code price IDs anywhere in application code — always read them from this table.
