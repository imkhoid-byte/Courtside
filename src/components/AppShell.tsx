import React, { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Logo } from './Logo'
import { ToastContainer } from './Toast'
import { useApp } from '../contexts/AppContext'
import { NewMatchModal } from './NewMatchModal'
import { useI18n } from '../contexts/I18nContext'
import { C } from '../lib/design'

interface AppShellProps { children: React.ReactNode }

// ─── Icons ────────────────────────────────────────────────────────────────────

function HomeIcon({ active }: { active: boolean }) {
  const c = active ? C.accentLight : C.text3
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
        stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        fill={active ? C.accentDim : 'none'}/>
      <path d="M9 21V12h6v9" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function StatsIcon({ active }: { active: boolean }) {
  const c = active ? C.accentLight : C.text3
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="13" width="4" height="8" rx="1.5" fill={c} opacity={active ? 0.6 : 0.35}/>
      <rect x="10" y="8" width="4" height="13" rx="1.5" fill={c} opacity={active ? 0.8 : 0.5}/>
      <rect x="17" y="3" width="4" height="18" rx="1.5" fill={c}/>
    </svg>
  )
}

function PartyIcon({ active, partyMode }: { active: boolean; partyMode: boolean }) {
  const c = active ? C.party : partyMode ? `${C.party}99` : C.text3
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L14.5 9H22L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L2 9H9.5L12 2Z"
        fill={active || partyMode ? `${C.party}22` : 'none'}
        stroke={c} strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  const c = active ? C.accentLight : C.text3
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.8" fill={active ? C.accentDim : 'none'}/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

// ─── FAB Menu ─────────────────────────────────────────────────────────────────

function FabMenu({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { setNewMatchOpen } = useApp()
  const { t } = useI18n()
  const overlayRef = useRef<HTMLDivElement>(null)

  const items = [
    { emoji: '🏓', label: t('newLiveMatch'),  action: () => { setNewMatchOpen(true); onClose() } },
    { emoji: '📝', label: t('logMatch'),      action: () => { navigate('/log'); onClose() } },
    { emoji: '🏆', label: t('tournament'),    action: () => { navigate('/tournament'); onClose() } },
    { emoji: '📋', label: 'Match History',    action: () => { navigate('/history'); onClose() } },
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
      transition={{ duration: 0.18 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(7,7,15,0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-end',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 84px)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', width: '100%', paddingLeft: 20, paddingRight: 20 }}>
        {items.map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ delay: (items.length - 1 - i) * 0.04, type: 'spring', stiffness: 340, damping: 28 }}
            onClick={item.action}
            style={{
              width: '100%', padding: '15px 20px', borderRadius: 16,
              background: C.elevated, border: `1px solid ${C.borderStrong}`,
              display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}
          >
            <span style={{ fontSize: 22, width: 28, textAlign: 'center' }}>{item.emoji}</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: '"DM Sans"' }}>{item.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

// ─── App Shell ────────────────────────────────────────────────────────────────

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { fabMenuOpen, setFabMenuOpen, partyMode } = useApp()
  const { t } = useI18n()

  const isActive = (path: string) => location.pathname === path

  const navItems = [
    { path: '/',      key: 'home',    label: t('home'),   Icon: HomeIcon },
    { path: '/stats', key: 'stats',   label: t('stats'),  Icon: StatsIcon },
  ]
  const navRight = [
    { path: '/party', key: 'party',   label: 'Party',     Icon: (_p: { active: boolean }) => <PartyIcon active={_p.active} partyMode={partyMode} /> },
    { path: '/me',    key: 'profile', label: t('profile'), Icon: ProfileIcon },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>

      {/* Header */}
      <header style={{
        paddingTop:    `calc(env(safe-area-inset-top) + 10px)`,
        paddingBottom: 10,
        paddingLeft:   `calc(env(safe-area-inset-left) + 20px)`,
        paddingRight:  `calc(env(safe-area-inset-right) + 20px)`,
        background: C.bg,
        borderBottom: `1px solid ${partyMode ? `${C.party}25` : C.border}`,
        flexShrink: 0, zIndex: 10,
        position: 'relative',
      }}>
        {/* Party mode top accent strip */}
        {partyMode && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, ${C.accent}, ${C.party})`,
          }} />
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo />
          {partyMode && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: C.partyDim, border: `1px solid ${C.party}40`,
              borderRadius: '9999px', padding: '3px 9px',
            }}>
              <div className="pulse-live" style={{
                width: 5, height: 5, borderRadius: '50%', background: C.party,
                boxShadow: `0 0 6px ${C.party}`,
              }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: C.party, letterSpacing: '0.08em' }}>PARTY ON</span>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{ minHeight: '100%' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav style={{
        paddingBottom: `calc(env(safe-area-inset-bottom) + 6px)`,
        paddingTop: 6,
        paddingLeft:  `calc(env(safe-area-inset-left) + 4px)`,
        paddingRight: `calc(env(safe-area-inset-right) + 4px)`,
        background: C.surface,
        borderTop: `1px solid ${partyMode ? `${C.party}20` : C.border}`,
        display: 'flex', alignItems: 'stretch', justifyContent: 'space-around',
        flexShrink: 0, position: 'relative', zIndex: 10,
      }}>

        {/* Left tabs */}
        {navItems.map(({ path, key, label, Icon }) => {
          const active = isActive(path)
          return (
            <NavTab key={key} active={active} label={label} accent={C.accentLight}
              onClick={() => { navigate(path); if (navigator.vibrate) navigator.vibrate(6) }}>
              <Icon active={active} />
            </NavTab>
          )
        })}

        {/* FAB */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', width: 64, paddingBottom: 2 }}>
          <motion.button
            animate={{ rotate: fabMenuOpen ? 45 : 0 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 22 }}
            onClick={() => { setFabMenuOpen(!fabMenuOpen); if (navigator.vibrate) navigator.vibrate(10) }}
            style={{
              width: 50, height: 50, borderRadius: '50%',
              background: fabMenuOpen
                ? C.elevated
                : partyMode
                  ? `linear-gradient(135deg, ${C.accent}, ${C.party})`
                  : C.accent,
              border: `2px solid ${fabMenuOpen ? C.borderStrong : 'transparent'}`,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: fabMenuOpen
                ? 'none'
                : partyMode
                  ? `0 0 0 5px ${C.surface}, 0 4px 20px rgba(236,72,153,0.4)`
                  : `0 0 0 5px ${C.surface}, 0 4px 20px rgba(124,58,237,0.45)`,
              position: 'absolute', bottom: 8,
              flexShrink: 0,
            }}
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14"
                stroke={fabMenuOpen ? C.text2 : '#fff'}
                strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </motion.button>
        </div>

        {/* Right tabs */}
        {navRight.map(({ path, key, label, Icon }) => {
          const active = isActive(path)
          const isPartyTab = key === 'party'
          const tabAccent = isPartyTab ? C.party : C.accentLight
          return (
            <NavTab key={key} active={active} label={label} accent={tabAccent}
              onClick={() => { navigate(path); if (navigator.vibrate) navigator.vibrate(6) }}>
              <Icon active={active} />
            </NavTab>
          )
        })}
      </nav>

      <ToastContainer />
      <NewMatchModal />
      <AnimatePresence>
        {fabMenuOpen && <FabMenu onClose={() => setFabMenuOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}

function NavTab({
  active, label, accent, onClick, children,
}: {
  active: boolean; label: string; accent: string; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 3,
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '4px 2px', minHeight: 44, minWidth: 40,
        position: 'relative',
      }}
    >
      {/* Active indicator dot */}
      {active && (
        <div style={{
          position: 'absolute', top: 3, width: 3, height: 3,
          borderRadius: '50%', background: accent,
          boxShadow: `0 0 6px ${accent}`,
        }} />
      )}
      {children}
      <span style={{
        fontSize: 9, fontWeight: active ? 700 : 500,
        color: active ? accent : C.text3,
        fontFamily: '"DM Sans"',
        letterSpacing: '0.03em',
      }}>
        {label}
      </span>
    </button>
  )
}

// Re-export C.full as a radius constant for inline use elsewhere
export { C as DesignC }
