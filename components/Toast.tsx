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
          gap: 12px;
          background: var(--ink);
          border-radius: 12px;
          padding: 14px 18px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.14);
          max-width: 380px;
          animation: toast-in 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);
        }
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .toast-dot {
          flex-shrink: 0;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--accent-tint);
        }
        .toast-msg {
          margin: 0;
          font-size: 14px;
          color: rgba(248,242,241,0.92);
          line-height: 1.45;
          flex: 1;
        }
        .toast-close {
          border: 0;
          background: transparent;
          color: rgba(248,242,241,0.45);
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
          padding: 0 2px;
          flex-shrink: 0;
        }
        .toast-close:hover { color: rgba(248,242,241,0.9); }
        @media (max-width: 480px) {
          .toast { bottom: 16px; right: 16px; left: 16px; max-width: none; }
        }
      `}</style>
    </>
  )
}
