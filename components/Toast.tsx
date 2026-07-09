'use client'

import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  onDismiss: () => void
  /** Auto-dismiss delay in ms. Default: 5000 */
  duration?: number
}

export function Toast({ message, onDismiss, duration = 5000 }: ToastProps) {
  const [hiding, setHiding] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setHiding(true), duration)
    return () => clearTimeout(t)
  }, [duration])

  useEffect(() => {
    if (!hiding) return
    const t = setTimeout(onDismiss, 300)
    return () => clearTimeout(t)
  }, [hiding, onDismiss])

  return (
    <div
      className={`toast toast--checkout${hiding ? ' toast--hiding' : ''}`}
      role="status"
      aria-live="polite"
    >
      {message}
      <button
        type="button"
        className="toast-close"
        aria-label="Dismiss"
        onClick={() => setHiding(true)}
      >
        ×
      </button>

      <style>{`
        .toast--checkout {
          background: var(--accent);
          color: #fff;
          display: flex;
          align-items: center;
          gap: 12px;
          white-space: normal;
          max-width: min(420px, calc(100vw - 32px));
        }
        .toast-close {
          border: 0;
          background: transparent;
          color: rgba(255,255,255,0.7);
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
          padding: 0;
          flex-shrink: 0;
          margin-left: auto;
        }
        .toast-close:hover { color: #fff; }
      `}</style>
    </div>
  )
}
