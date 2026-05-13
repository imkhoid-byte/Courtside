import { useApp } from '../contexts/AppContext'

export function ToastContainer() {
  const { toasts } = useApp()

  return (
    <div
      style={{
        position: 'fixed',
        top: `calc(env(safe-area-inset-top) + 16px)`,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'center',
        pointerEvents: 'none',
        width: '100%',
        maxWidth: 360,
        padding: '0 16px',
      }}
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="toast-in"
          style={{
            background: '#0f1117',
            border: '1px solid #a78bfa',
            borderRadius: 10,
            padding: '10px 16px',
            color: '#a78bfa',
            fontFamily: '"DM Sans"',
            fontWeight: 600,
            fontSize: 14,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
