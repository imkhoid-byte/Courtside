import React, { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Logo } from './Logo'
import { ToastContainer } from './Toast'
import { useApp } from '../contexts/AppContext'
import { NewMatchModal } from './NewMatchModal'
import { useI18n } from '../contexts/I18nContext'

interface AppShellProps {
  children: React.ReactNode
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
        stroke={active ? '#bef264' : '#636b84'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 21V12h6v9" stroke={active ? '#bef264' : '#636b84'} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function StatsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="13" width="4" height="8" rx="1" fill={active ? '#bef264' : '#636b84'} opacity={active ? 1 : 0.6}/>
      <rect x="10" y="8" width="4" height="13" rx="1" fill={active ? '#bef264' : '#636b84'} opacity={active ? 1 : 0.8}/>
      <rect x="17" y="3" width="4" height="18" rx="1" fill={active ? '#bef264' : '#636b84'}/>
    </svg>
  )
}

function HistoryIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={active ? '#bef264' : '#636b84'} strokeWidth="1.8"/>
      <path d="M12 7v5l3 3" stroke={active ? '#bef264' : '#636b84'} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={active ? '#bef264' : '#636b84'} strokeWidth="1.8"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={active ? '#bef264' : '#636b84'} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

const NAV_ITEMS = [
  { path: '/', key: 'home', icon: HomeIcon },
  { path: '/stats', key: 'stats', icon: StatsIcon },
  { path: null, key: 'fab', icon: null },
  { path: '/history', key: 'history', icon: HistoryIcon },
  { path: '/me', key: 'profile', icon: ProfileIcon },
] as const

// ─── FAB Popup Menu ───────────────────────────────────────────────────────────

function FabMenu({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { setNewMatchOpen } = useApp()
  const { t } = useI18n()
  const overlayRef = useRef<HTMLDivElement>(null)

  const items = [
    { emoji: '🏓', label: t('newLiveMatch'), action: () => { setNewMatchOpen(true); onClose() } },
    { emoji: '📝', label: t('logMatch'), action: () => { navigate('/log'); onClose() } },
    { emoji: '🏆', label: t('tournament'), action: () => { navigate('/tournament'); onClose() } },
  ]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (overlayRef.current === e.target) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <motion.div
      ref={overlayRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(8,9,13,0.85)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-end',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', width: '100%', paddingLeft: 24, paddingRight: 24 }}>
        {items.map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ delay: (items.length - 1 - i) * 0.05, type: 'spring', stiffness: 300, damping: 28 }}
            onClick={item.action}
            style={{
              width: '100%', padding: '14px 20px', borderRadius: 14,
              background: '#0f1117', border: '1px solid #252a38',
              display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 22 }}>{item.emoji}</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#e4e8f2', fontFamily: '"DM Sans"' }}>{item.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { fabMenuOpen, setFabMenuOpen } = useApp()
  const { t } = useI18n()

  const isActive = (path: string | null) => path !== null && location.pathname === path

  const navLabels: Record<string, () => string> = {
    home: () => t('home'),
    stats: () => t('stats'),
    history: () => t('history'),
    profile: () => t('profile'),
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#08090d' }}>
      {/* Header */}
      <header style={{
        paddingTop: `calc(env(safe-area-inset-top) + 12px)`,
        paddingBottom: 12,
        paddingLeft: `calc(env(safe-area-inset-left) + 20px)`,
        paddingRight: `calc(env(safe-area-inset-right) + 20px)`,
        background: '#08090d',
        borderBottom: '1px solid #252a38',
        flexShrink: 0,
        zIndex: 10,
      }}>
        <Logo />
      </header>

      {/* Content */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            style={{ minHeight: '100%' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav style={{
        paddingBottom: `calc(env(safe-area-inset-bottom) + 8px)`,
        paddingTop: 8,
        paddingLeft: `calc(env(safe-area-inset-left) + 4px)`,
        paddingRight: `calc(env(safe-area-inset-right) + 4px)`,
        background: '#0f1117',
        borderTop: '1px solid #252a38',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}>
        {NAV_ITEMS.map((item) => {
          if (item.path === null) {
            // FAB
            return (
              <div key="fab" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 60 }}>
                <button
                  onClick={() => { setFabMenuOpen(!fabMenuOpen); if (navigator.vibrate) navigator.vibrate(10) }}
                  style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: fabMenuOpen ? '#e4e8f2' : '#bef264',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 0 6px #0f1117, 0 4px 20px rgba(190,242,100,0.35)',
                    position: 'absolute', bottom: 6,
                    transform: 'translateX(-50%)', left: '50%',
                    transition: 'background 0.15s, transform 0.15s',
                  }}
                  aria-label="Open menu"
                >
                  <motion.svg
                    width="22" height="22" viewBox="0 0 24 24" fill="none"
                    animate={{ rotate: fabMenuOpen ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <path d="M12 5v14M5 12h14" stroke="#08090d" strokeWidth="2.5" strokeLinecap="round"/>
                  </motion.svg>
                </button>
              </div>
            )
          }

          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); if (navigator.vibrate) navigator.vibrate(6) }}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px 0', minHeight: 44, minWidth: 44,
              }}
            >
              <Icon active={active} />
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: active ? '#bef264' : '#636b84',
                fontFamily: '"DM Sans"',
              }}>
                {navLabels[item.key]?.() ?? item.key}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Toast container */}
      <ToastContainer />

      {/* New Match Modal */}
      <NewMatchModal />

      {/* FAB Menu overlay */}
      <AnimatePresence>
        {fabMenuOpen && <FabMenu onClose={() => setFabMenuOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}
