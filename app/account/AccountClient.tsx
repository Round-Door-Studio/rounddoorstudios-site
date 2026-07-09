'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/app/auth/actions'
import { Toast } from '@/components/Toast'
import type { Story } from '@/lib/types'

type MembershipState = 'active' | 'canceling' | 'free'

interface Props {
  email: string
  membershipState: MembershipState
  planInterval: string | null
  periodEnd: string | null
  packs: Story[]
  purchasedSlugs: string[]
  checkoutSuccess: boolean
  bannerMessage: string
}

const PACK_SECTIONS = [
  { id: 'read',      icon: '📖', label: 'Read Along' },
  { id: 'words',     icon: '🔤', label: 'New Words' },
  { id: 'questions', icon: '💬', label: 'Curious Questions' },
  { id: 'explore',   icon: '🌏', label: 'Culture Corner' },
]

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

export default function AccountClient({
  email,
  membershipState,
  planInterval,
  periodEnd,
  packs,
  purchasedSlugs,
  checkoutSuccess,
  bannerMessage,
}: Props) {
  const [toast, setToast] = useState<string | null>(checkoutSuccess ? bannerMessage : null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [awaitingPortalReturn, setAwaitingPortalReturn] = useState(false)
  const portalInFlight = useRef(false)
  const router = useRouter()

  const dismissToast = useCallback(() => setToast(null), [])

  // Webhook fires async — if we land here right after checkout and the DB
  // hasn't updated yet, refresh after 3s to pick up the new subscription/purchase.
  // Also replace the URL immediately to strip ?checkout=success so back-navigation
  // doesn't re-trigger the toast.
  useEffect(() => {
    if (!checkoutSuccess) return
    router.replace('/account', { scroll: false })
    const t = setTimeout(() => router.refresh(), 3000)
    return () => clearTimeout(t)
  }, [checkoutSuccess, router])

  // Refresh only once when returning from Stripe portal — not on every tab switch.
  useEffect(() => {
    if (!awaitingPortalReturn) return
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        setAwaitingPortalReturn(false)
        router.refresh()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [awaitingPortalReturn, router])

  const planLabel = planInterval === 'yearly' ? 'Yearly / $216/yr' : 'Monthly / $20/mo'
  const dateLabel = formatDate(periodEnd)
  const isCanceling = membershipState === 'canceling'

  async function handleManageMembership() {
    if (portalInFlight.current) return
    portalInFlight.current = true
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/create-portal-session', { method: 'POST' })
      if (res.status === 429) {
        setToast('Too many requests — please wait a moment and try again.')
        setPortalLoading(false)
        portalInFlight.current = false
        return
      }
      const { url } = await res.json()
      if (url) {
        setAwaitingPortalReturn(true)
        router.push(url)
      } else {
        setPortalLoading(false)
        portalInFlight.current = false
      }
    } catch {
      setPortalLoading(false)
      portalInFlight.current = false
    }
  }

  return (
    <main className="acct-wrap">

      {toast && <Toast message={toast} onDismiss={dismissToast} />}

      {/* Header */}
      <div className="acct-head">
        <p className="eyebrow">Account</p>
        <h1 className="display">Hi, {email.split('@')[0]}.</h1>
        <p className="acct-email">{email}</p>
      </div>

      {/* Membership */}
      <section className="acct-section">
        <p className="acct-section-title">Membership</p>
        <div className="card">
          {membershipState === 'free' ? (
            <div className="mship-free-row">
              <p className="mship-free-copy">
                You&rsquo;re on a free account. Join the Circle to unlock every Story Pack.
              </p>
              <a className="btn btn-primary" href="/membership">Join the Circle</a>
            </div>
          ) : (
            <div className="mship-body">
              <div>
                <span className={`mship-badge${isCanceling ? ' is-canceling' : ''}`}>
                  <span className="dot" />
                  Circle Membership · {isCanceling ? 'Canceling' : 'Active'}
                </span>
                <p className="mship-plan">{planLabel}</p>
                <p className="mship-renew">
                  {isCanceling ? `Access until ${dateLabel}` : `Renews ${dateLabel}`}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleManageMembership}
                disabled={portalLoading}
              >
                {portalLoading ? 'Opening portal…' : 'Manage Membership'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Story Packs */}
      <section className="acct-section">
        <p className="acct-section-title">Story Packs</p>
        <div className="card">
          {packs.length === 0 ? (
            <>
              <p className="pack-empty-copy">No individual Story Packs purchased yet.</p>
              <a className="btn btn-ghost" href="/library">Browse Stories</a>
            </>
          ) : (
            <div className="pack-list">
              {packs.map((story) => (
                <div className="pack-item" key={story.slug}>
                  {story.coverImage ? (
                    <img
                      className="pack-cover"
                      src={story.coverImage}
                      alt={story.title.en}
                    />
                  ) : (
                    <div
                      className="pack-cover-fallback"
                      style={{ background: story.coverColor ?? 'var(--accent)' }}
                    >
                      {story.title.simp}
                    </div>
                  )}
                  <div>
                    <div className="pack-row-title-row">
                      <a className="pack-row-title-link" href={`/story/${story.slug}`}>
                        <span className="pack-row-title">{story.title.simp}</span>
                      </a>
                      {purchasedSlugs.includes(story.slug) && (
                        <span className="pack-yours-badge">Yours to keep</span>
                      )}
                    </div>
                    <p className="pack-row-en">{story.title.en}</p>
                  </div>
                  <div className="pack-quick">
                    {PACK_SECTIONS.map((sec) => (
                      <a key={sec.id} href={`/story/${story.slug}?tab=${sec.id}`}>
                        {sec.icon} {sec.label}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Log out */}
      <div className="acct-logout">
        <form action={signOut}>
          <input type="hidden" name="redirectTo" value="/" />
          <button type="submit">Log Out</button>
        </form>
      </div>

    </main>
  )
}
