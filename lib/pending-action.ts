export type PendingAction =
  | { type: 'purchase_story_pack'; storySlug: string }
  | { type: 'membership'; interval: 'monthly' | 'yearly' }

const KEY = 'rds-pending-action'

export function setPendingAction(action: PendingAction): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(action))
  } catch {
    // sessionStorage unavailable (e.g. private browsing with storage blocked)
  }
}

export function getPendingAction(): PendingAction | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as PendingAction) : null
  } catch {
    return null
  }
}

export function clearPendingAction(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
