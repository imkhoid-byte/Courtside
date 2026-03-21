import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Logo } from './Logo'
import { ToastContainer } from './Toast'
import { useApp } from '../contexts/AppContext'
import { NewMatchModal } from './NewMatchModal'

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

function ScoreIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="20" height="12" rx="2" stroke={active ? '#bef264' : '#636b84'} strokeWidth="1.8"/>
      <line x1="12" y1="6" x2="12" y2="18" stroke={active ? '#bef264' : '#636b84'} strokeWidth="1.5"/>
      <text x="6" y="15" fontFamily="IBM Plex Mono" fontSize="7" fontWeight="700" fill={active ? '#bef264' : '#636b84'} textAnchor="middle">0</text>
      <text x="18" y="15" fontFamily="IBM Plex Mono" fontSize="7" fontWeight="700" fill={active ? '#bef264' : '#636b84'} textAnchor="middle">0</text>
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
  { path: '/', label: 'Home', icon: HomeIcon },
  { path: '/stats', label: 'Stats', icon: StatsIcon },
  { path: null, label: '', icon: null }, // FAB placeholder
  { path: '/score', label: 'Score', icon: ScoreIcon },
  { path: '/me', label: 'Me', icon: ProfileIcon },
]

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { setNewMatchOpen } = useApp()

  const isActive = (path: string | null) => path !== null && location.pathname === path

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
                  onClick={() => setNewMatchOpen(true)}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: '#bef264',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 0 6px #0f1117, 0 4px 20px rgba(190,242,100,0.35)',
                    position: 'absolute',
                    bottom: 6,
                    transform: 'translateX(-50%)',
                    left: '50%',
                  }}
                  aria-label="New match"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="#08090d" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            )
          }

          const Icon = item.icon!
          const active = isActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path!)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 0',
                minHeight: 44,
                minWidth: 44,
              }}
            >
              <Icon active={active} />
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                color: active ? '#bef264' : '#636b84',
                fontFamily: '"DM Sans"',
              }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Toast container */}
      <ToastContainer />

      {/* New Match Modal */}
      <NewMatchModal />
    </div>
  )
}
