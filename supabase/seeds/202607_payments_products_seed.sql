-- ============================================================
-- PR 1 — Products Table Seed
-- Branch: f3/payments-pr1-schema
-- Date: 2026-07
--
-- Run AFTER 202607_payments_pr1_schema.sql has been applied.
-- Stripe test mode. Replace with live IDs before production.
-- ============================================================


INSERT INTO public.products (product_type, name, story_slug, stripe_product_id, stripe_price_id, active)
VALUES

  -- ── Memberships ────────────────────────────────────────────
  (
    'membership_monthly',
    'Circle Membership — Monthly',
    null,
    'prod_Uq9Ai8oxSUGpRZ',
    'price_1TqSsa228cC4fyy1baxlEJZr',  -- $20/month
    true
  ),
  (
    'membership_yearly',
    'Circle Membership — Yearly',
    null,
    'prod_Uq9Ai8oxSUGpRZ',
    'price_1TqSse228cC4fyy159GQQ7p8',  -- $216/year
    true
  ),

  -- ── Story Packs ─────────────────────────────────────────────
  (
    'story_pack',
    'Story Pack: The Frog at the Bottom of the Well',
    'frog-at-the-bottom-of-the-well',
    'prod_Uq9CH5nNw6Wnxr',
    'price_1TqSug228cC4fyy1Eo7fSARI',  -- $8 one-time
    true
  ),
  (
    'story_pack',
    'Story Pack: Qu Yuan and Dragonboat Festival',
    'qu-yuan-and-dragon-boat-festival',
    'prod_Uq9CmpysXBsmsc',
    'price_1TqSuk228cC4fyy11eHqVvuD',  -- $8 one-time
    true
  ),
  (
    'story_pack',
    'Story Pack: Never Too Late to Mend the Sheep Pen',
    'mend-the-sheep-pen',
    'prod_Uq9CfDCz4jM6Qk',
    'price_1TqSun228cC4fyy1s7iMC90t',  -- $8 one-time
    true
  ),
  (
    'story_pack',
    'Story Pack: The Fox Borrows the Tiger''s Might',
    'fox-borrows-the-tigers-might',
    'prod_Uq9D3k8JxTjwRM',
    'price_1TqSur228cC4fyy1JI1NcyGI',  -- $8 one-time
    true
  );
