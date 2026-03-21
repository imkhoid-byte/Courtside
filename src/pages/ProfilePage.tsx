import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../contexts/AppContext'
import { getCompletedMatches, clearAllData } from '../lib/db'
import type { Match } from '../lib/types'

export function ProfilePage() {
  const { playerName } = useApp()
  const [matches, setMatches] = useState<Match[]>([])
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  useEffect(() => {
    getCompletedMatches().then(setMatches)
  }, [])

  const myName = playerName || 'You'
  const firstLetter = myName[0]?.toUpperCase() || '?'

  const wins = matches.filter(m => {
    const isP1 = m.p1 === myName
    return m.winner === (isP1 ? 1 : 2)
  }).length
  const total = matches.length
  const winPct = total ? Math.round((wins / total) * 100) : 0

  const handleReset = async () => {
    await clearAllData()
    setMatches([])
    setResetDone(true)
    setShowResetConfirm(false)
  }

  return (
    <div style={{ padding: '16px 16px 80px' }}>
      {/* Hero */}
      <div style={{
        background: '#0f1117', border: '1px solid #252a38', borderRadius: 14,
        padding: 24, marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, #bef264, #34d399)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 12,
        }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: '#08090d', fontFamily: '"DM Sans"' }}>
            {firstLetter}
          </span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#e4e8f2', marginBottom: 2 }}>{myName}</div>
        <div style={{ fontSize: 12, color: '#636b84' }}>CourtSide Tennis</div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 0, marginTop: 20, width: '100%', borderTop: '1px solid #252a38', paddingTop: 16 }}>
          {[
            { label: 'Matches', value: String(total) },
            { label: 'Wins', value: String(wins) },
            { label: 'Win %', value: `${winPct}%` },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center',
              borderRight: i < 2 ? '1px solid #252a38' : 'none',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#e4e8f2', fontFamily: '"IBM Plex Mono"' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#636b84', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
          Settings
        </div>
        <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, overflow: 'hidden' }}>
          {[
            { label: 'Default Format', value: 'Best of 3' },
            { label: 'Scoring', value: 'Standard (Ad)' },
            { label: 'Tiebreak', value: 'At 6-6' },
          ].map((row, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px',
              borderBottom: i < 2 ? '1px solid #252a38' : 'none',
            }}>
              <span style={{ fontSize: 14, color: '#e4e8f2', fontWeight: 500 }}>{row.label}</span>
              <span style={{ fontSize: 14, color: '#636b84' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reset button */}
      <button
        onClick={() => setShowResetConfirm(true)}
        style={{
          width: '100%', padding: '14px',
          background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.25)',
          borderRadius: 12, cursor: 'pointer',
          color: '#fb7185', fontSize: 14, fontWeight: 700, fontFamily: '"DM Sans"',
        }}
      >
        Reset All Data
      </button>

      {resetDone && (
        <div style={{ textAlign: 'center', padding: 16, color: '#34d399', fontSize: 14 }}>
          All data has been cleared.
        </div>
      )}

      {/* Confirm dialog */}
      <AnimatePresence>
        {showResetConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 150, backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{
                position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
                background: '#0f1117', border: '1px solid #252a38', borderRadius: 16,
                padding: 24, zIndex: 151, width: '82%', maxWidth: 320,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: '#e4e8f2', marginBottom: 8 }}>Reset All Data?</div>
              <div style={{ fontSize: 13, color: '#636b84', marginBottom: 20 }}>
                This will permanently delete all matches, stats, and preferences. This cannot be undone.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowResetConfirm(false)}
                  style={{ flex: 1, padding: '12px', background: '#161922', border: '1px solid #252a38', borderRadius: 10, cursor: 'pointer', color: '#949cb4', fontSize: 14, fontWeight: 600 }}>
                  Cancel
                </button>
                <button onClick={handleReset}
                  style={{ flex: 1, padding: '12px', background: '#fb7185', border: 'none', borderRadius: 10, cursor: 'pointer', color: '#08090d', fontSize: 14, fontWeight: 800 }}>
                  Reset
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
