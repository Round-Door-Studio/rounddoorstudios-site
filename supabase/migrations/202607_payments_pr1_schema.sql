-- ============================================================
-- PR 1 — Payments Schema Migration
-- Branch: f3/payments-pr1-schema
-- Date: 2026-07
-- Apply manually in Supabase SQL editor.
-- ============================================================


-- ------------------------------------------------------------
-- Step 1: ALTER subscriptions — add missing columns
-- ------------------------------------------------------------

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_interval        text,
  ADD COLUMN IF NOT EXISTS price_id             text,
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at           timestamptz DEFAULT now();


-- ------------------------------------------------------------
-- Step 2: Index on subscriptions.user_id
-- Every access check queries WHERE user_id = ?
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx
  ON public.subscriptions (user_id);


-- ------------------------------------------------------------
-- Step 3: stripe_customers
-- Maps a profiles.id to a Stripe customer ID.
-- ------------------------------------------------------------

CREATE TABLE public.stripe_customers (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL UNIQUE,
  created_at         timestamptz DEFAULT now(),

  UNIQUE (user_id)
);

CREATE INDEX stripe_customers_user_id_idx
  ON public.stripe_customers (user_id);

ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stripe customer record"
  ON public.stripe_customers
  FOR SELECT
  USING (auth.uid() = user_id);


-- ------------------------------------------------------------
-- Step 4: story_pack_purchases
-- One-time story pack purchases, written by webhook only.
-- ------------------------------------------------------------

CREATE TABLE public.story_pack_purchases (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  story_slug                 text NOT NULL,
  stripe_customer_id         text,
  stripe_checkout_session_id text UNIQUE,
  stripe_payment_intent_id   text,
  amount_total               integer,
  currency                   text,
  purchased_at               timestamptz DEFAULT now(),

  UNIQUE (user_id, story_slug)
);

CREATE INDEX story_pack_purchases_user_id_idx
  ON public.story_pack_purchases (user_id);

ALTER TABLE public.story_pack_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON public.story_pack_purchases
  FOR SELECT
  USING (auth.uid() = user_id);


-- ------------------------------------------------------------
-- Step 5: entitlement_grants
-- Manual admin/promo/test access.
-- story_slug = NULL means global access to all story packs.
-- ------------------------------------------------------------

CREATE TABLE public.entitlement_grants (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  story_slug text,
  grant_type text NOT NULL,
  expires_at timestamptz,
  notes      text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX entitlement_grants_user_id_idx
  ON public.entitlement_grants (user_id);

ALTER TABLE public.entitlement_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entitlement grants"
  ON public.entitlement_grants
  FOR SELECT
  USING (auth.uid() = user_id);


-- ------------------------------------------------------------
-- Step 6: products
-- Maps purchasable products to Stripe price IDs.
-- Checkout routes read stripe_price_id from here — the client
-- never sends a price ID.
-- product_type values: membership_monthly | membership_yearly | story_pack
-- story_slug is null for membership products.
-- ------------------------------------------------------------

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


-- ------------------------------------------------------------
-- Step 7: stripe_events
-- Idempotency guard — prevents duplicate webhook processing.
-- No RLS. Service role only.
-- ------------------------------------------------------------

CREATE TABLE public.stripe_events (
  id           text PRIMARY KEY,
  type         text NOT NULL,
  processed_at timestamptz DEFAULT now()
);


-- ------------------------------------------------------------
-- Verification queries — run after applying to confirm state
-- ------------------------------------------------------------

-- Check all new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'stripe_customers',
    'story_pack_purchases',
    'entitlement_grants',
    'products',
    'stripe_events'
  )
ORDER BY table_name;

-- Check subscriptions has all expected columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Check RLS is enabled on new tables
SELECT relname AS table_name, relrowsecurity AS rls_enabled
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relkind = 'r'
  AND relname IN (
    'stripe_customers',
    'story_pack_purchases',
    'entitlement_grants',
    'products',
    'stripe_events'
  )
ORDER BY relname;

-- Check all policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'stripe_customers',
    'story_pack_purchases',
    'entitlement_grants',
    'products'
  )
ORDER BY tablename, policyname;
