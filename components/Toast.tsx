'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  onDismiss: () => void
  /** Auto-dismiss delay in ms. Default: 5000 */
  duration?: number
}

export function Toast({ message, onDismiss, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration)
    return () => clearTimeout(t)
  }, [onDismiss, duration])

  return (
    <>
      <div className="toast" role="status" aria-live="polite">
        <span className="toast-dot" />
        <p className="toast-msg">{message}</p>
        <button
          type="button"
          className="toast-close"
          aria-label="Dismiss"
          onClick={onDismiss}
        >
          ×
        </button>
      </div>

      <style>{`
        .toast {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--paper);
          border: 1px solid rgba(155,71,97,0.28);
          border-radius: 12px;
          padding: 14px 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          max-width: 360px;
          animation: toast-in 0.2s ease;
        }
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .toast-dot {
          flex-shrink: 0;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
        }
        .toast-msg {
          margin: 0;
          font-size: 14px;
          color: var(--ink);
          line-height: 1.45;
          flex: 1;
        }
        .toast-close {
          border: 0;
          background: transparent;
          color: var(--muted);
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
          padding: 0 2px;
          flex-shrink: 0;
        }
        .toast-close:hover { color: var(--accent-dk); }
        @media (max-width: 480px) {
          .toast { bottom: 16px; right: 16px; left: 16px; max-width: none; }
        }
      `}</style>
    </>
  )
}
