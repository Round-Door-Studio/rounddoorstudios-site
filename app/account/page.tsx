import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { STORIES } from '@/lib/stories'
import AccountClient from './AccountClient'

export const metadata = { title: 'Your Account · Round Door Studio' }

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const service = createServiceClient()

  // Get the most recent active or trialing subscription
  const { data: subscriptions } = await service
    .from('subscriptions')
    .select('status, plan_interval, current_period_end, cancel_at_period_end')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .order('current_period_end', { ascending: false })
    .limit(1)

  const subscription = subscriptions?.[0] ?? null

  // Get individually purchased story slugs
  const { data: purchases } = await service
    .from('story_pack_purchases')
    .select('story_slug')
    .eq('user_id', user.id)

  const purchasedSlugs = (purchases ?? []).map((p: { story_slug: string }) => p.story_slug)

  // Membership state
  let membershipState: 'active' | 'canceling' | 'free' = 'free'
  if (subscription) {
    membershipState = subscription.cancel_at_period_end ? 'canceling' : 'active'
  }

  // Which packs to show: members see all released packs, others see only purchased
  const releasedBundleStories = STORIES.filter(s => s.released && s.hasBundle)
  const packsToShow =
    membershipState === 'active' || membershipState === 'canceling'
      ? releasedBundleStories
      : releasedBundleStories.filter(s => purchasedSlugs.includes(s.slug))

  const params = await searchParams
  const checkoutSuccess = params.checkout === 'success'

  return (
    <>
      <style>{`
        .acct-wrap { max-width: 760px; margin: 0 auto; padding: 56px 24px 96px; }

        .banner[hidden] { display: none; }
        .banner {
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          background: var(--accent-tint); border: 1px solid rgba(155,71,97,0.28);
          border-radius: 10px; padding: 14px 18px; margin-bottom: 28px;
          font-size: 14px; color: var(--accent-dk);
        }
        .banner p { display: flex; align-items: center; gap: 10px; margin: 0; }
        .banner .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
        .banner-close {
          border: 0; background: transparent; color: var(--accent-dk); opacity: 0.65;
          font-size: 20px; line-height: 1; cursor: pointer; padding: 0 2px;
        }
        .banner-close:hover { opacity: 1; }

        .acct-head { margin-bottom: 32px; }
        .acct-head .eyebrow { margin-bottom: 8px; }
        .acct-head h1 { font-size: clamp(30px, 4.5vw, 40px); margin-bottom: 8px; }
        .acct-head .acct-email { color: var(--muted); font-size: 15px; }

        .acct-section { margin-bottom: 24px; }
        .acct-section-title {
          font-family: var(--serif); font-size: 11px; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--muted); margin-bottom: 10px;
        }

        .mship-body { display: flex; align-items: flex-end; justify-content: space-between; gap: 14px; }
        .mship-badge {
          display: inline-flex; align-items: center; gap: 7px;
          font-family: var(--display); font-size: 13px; letter-spacing: 0.04em;
          color: var(--accent-dk); background: var(--accent-tint);
          border: 1px solid rgba(155,71,97,0.22);
          padding: 6px 12px; border-radius: 999px; margin-bottom: 16px;
        }
        .mship-badge .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); }
        .mship-badge.is-canceling { color: var(--warning); background: rgba(196,153,79,0.14); border-color: rgba(196,153,79,0.3); }
        .mship-badge.is-canceling .dot { background: var(--warning); }
        .mship-body .btn { flex-shrink: 0; }
        .mship-plan { font-family: var(--display); font-size: 22px; margin-bottom: 4px; }
        .mship-renew { color: var(--ink-soft); font-size: 14px; }
        .mship-free-copy { color: var(--ink-soft); font-size: 16px; line-height: 1.6; margin-bottom: 20px; max-width: 46ch; }

        .pack-list { display: flex; flex-direction: column; gap: 18px; }
        .pack-item {
          display: grid; grid-template-columns: 64px 1fr auto; gap: 18px; align-items: start;
          padding-bottom: 18px; border-bottom: 1px dashed var(--rule);
        }
        .pack-item:last-child { padding-bottom: 0; border-bottom: 0; }
        .pack-cover { width: 64px; height: 64px; border-radius: 6px; object-fit: cover; }
        .pack-cover-fallback {
          width: 64px; height: 64px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--zh-simp); font-size: 18px; color: rgba(255,255,255,0.9);
        }
        .pack-row-title-link { text-decoration: none; }
        .pack-row-title { font-family: var(--display); font-size: 16px; color: var(--ink); }
        .pack-row-title-link:hover .pack-row-title { color: var(--accent-dk); }
        .pack-row-en { font-size: 12px; color: var(--muted); margin-top: 2px; }
        .pack-quick { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .pack-quick a {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; letter-spacing: 0.02em; color: var(--ink-soft);
          background: var(--bg); border: 1px solid var(--border);
          padding: 6px 10px; border-radius: 8px; text-decoration: none;
          white-space: nowrap;
          transition: border-color .15s, color .15s, background .15s;
        }
        .pack-quick a:hover { border-color: var(--accent); color: var(--accent-dk); background: var(--accent-tint); }
        .pack-empty-copy { color: var(--muted); font-size: 14px; margin-bottom: 16px; }

        .acct-logout { text-align: center; margin-top: 36px; }
        .acct-logout button {
          border: 0; background: transparent; color: var(--muted);
          font-family: var(--serif); font-size: 13px; letter-spacing: 0.04em;
          cursor: pointer; text-decoration: underline; text-underline-offset: 3px;
        }
        .acct-logout button:hover { color: var(--accent-dk); }

        @media (max-width: 600px) {
          .pack-item { grid-template-columns: 52px 1fr; }
          .pack-quick { display: none; }
          .mship-body { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
      <AccountClient
        email={user.email ?? ''}
        membershipState={membershipState}
        planInterval={subscription?.plan_interval ?? null}
        periodEnd={subscription?.current_period_end ?? null}
        packs={packsToShow}
        checkoutSuccess={checkoutSuccess}
      />
    </>
  )
}
