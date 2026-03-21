import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScore } from '../contexts/ScoreContext'
import { useApp } from '../contexts/AppContext'
import type { Player, RallyEvent } from '../lib/types'
import { displayPoints, getAdvantage, isDeuce } from '../lib/tennis'
import { useNavigate } from 'react-router-dom'

function createRipple(e: React.MouseEvent<HTMLElement>, color: string) {
  const rect = e.currentTarget.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const size = Math.max(rect.width, rect.height)
  const ripple = document.createElement('span')
  ripple.className = 'ripple'
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x - size/2}px;top:${y - size/2}px;background:${color};opacity:0.2;`
  e.currentTarget.appendChild(ripple)
  setTimeout(() => ripple.remove(), 500)
}

type ShotButtonDef = {
  label: string
  emoji: string
  type: RallyEvent['type']
  shot: RallyEvent['shot']
  player: Player
}

const SHOT_BUTTONS: ShotButtonDef[][] = [
  [
    { label: 'Ace', emoji: '🔥', type: 'ace', shot: 'serve', player: 1 },
    { label: 'Dbl Fault', emoji: '❌', type: 'double_fault', shot: 'serve', player: 1 },
    { label: 'FH Winner', emoji: '💥', type: 'winner', shot: 'forehand', player: 1 },
    { label: 'BH Winner', emoji: '💥', type: 'winner', shot: 'backhand', player: 1 },
  ],
  [
    { label: 'FH Error', emoji: '😬', type: 'unforced_error', shot: 'forehand', player: 1 },
    { label: 'BH Error', emoji: '😬', type: 'unforced_error', shot: 'backhand', player: 1 },
    { label: 'Volley W', emoji: '🎯', type: 'winner', shot: 'volley', player: 1 },
    { label: 'Drop Shot', emoji: '🪶', type: 'winner', shot: 'drop_shot', player: 1 },
  ],
]

function getToastMessage(btn: ShotButtonDef): string {
  if (btn.type === 'ace') return '🔥 Ace!'
  if (btn.type === 'double_fault') return '❌ Double Fault'
  if (btn.type === 'winner' && btn.shot === 'forehand') return '💥 Forehand Winner!'
  if (btn.type === 'winner' && btn.shot === 'backhand') return '💥 Backhand Winner!'
  if (btn.type === 'winner' && btn.shot === 'volley') return '🎯 Volley Winner!'
  if (btn.type === 'winner' && btn.shot === 'drop_shot') return '🪶 Drop Shot!'
  if (btn.type === 'unforced_error' && btn.shot === 'forehand') return '😬 Forehand Error'
  if (btn.type === 'unforced_error' && btn.shot === 'backhand') return '😬 Backhand Error'
  return btn.label
}

function getRallyLabel(r: RallyEvent): string {
  const typeName = r.type === 'ace' ? 'Ace' : r.type === 'double_fault' ? 'Double Fault' : r.type === 'winner' ? 'Winner' : 'Error'
  const shotName = r.shot === 'forehand' ? 'Forehand' : r.shot === 'backhand' ? 'Backhand' : r.shot === 'serve' ? 'Serve' : r.shot === 'volley' ? 'Volley' : r.shot === 'overhead' ? 'Overhead' : 'Drop Shot'
  return `${shotName} ${typeName}`
}

function ScoreZone({ player, onClick }: { player: Player; onClick: (e: React.MouseEvent<HTMLDivElement>) => void }) {
  const { state } = useScore()
  if (!state) return null

  const isP1 = player === 1
  const name = isP1 ? state.p1 : state.p2
  const color = isP1 ? '#38bdf8' : '#fb7185'
  const bg = isP1 ? 'rgba(56,189,248,0.06)' : 'rgba(251,113,133,0.06)'
  const serving = state.server === player

  const adv = getAdvantage(state.gameScore)
  const deuce = isDeuce(state.gameScore)
  const isTb = state.gameScore.isTiebreak
  const rawPoints = isP1 ? state.gameScore.p1 : state.gameScore.p2

  let displayScore: string
  if (isTb) {
    displayScore = String(rawPoints)
  } else if (deuce) {
    displayScore = 'D'
  } else if (adv !== null) {
    displayScore = adv === player ? 'Ad' : '40'
  } else {
    displayScore = displayPoints(rawPoints, false)
  }

  const setScores = [
    ...state.sets.map((s, i) => ({ g: isP1 ? s[0] : s[1], key: i, current: false })),
    { g: isP1 ? state.currentSet[0] : state.currentSet[1], key: 'current', current: true },
  ]

  return (
    <div
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: bg, padding: '24px 12px',
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
        userSelect: 'none', WebkitUserSelect: 'none',
        minHeight: 200,
      }}
    >
      {/* Player name + serve indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        {serving && (
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: '#bef264',
            boxShadow: '0 0 6px #bef264',
          }} className="pulse-live" />
        )}
        <span style={{ fontSize: 13, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {name}
        </span>
      </div>

      {/* Big game score */}
      <div
        style={{
          fontSize: 72, fontFamily: '"IBM Plex Mono"', fontWeight: 700,
          color, lineHeight: 1, marginBottom: 16,
        }}
        key={displayScore}
      >
        {displayScore}
      </div>

      {/* Set scores */}
      <div style={{ display: 'flex', gap: 6 }}>
        {setScores.map(s => (
          <span
            key={s.key}
            style={{
              fontFamily: '"IBM Plex Mono"', fontSize: 16, fontWeight: s.current ? 700 : 400,
              color: s.current ? color : '#636b84',
              opacity: s.current ? 1 : 0.7,
            }}
          >
            {s.g}
          </span>
        ))}
      </div>
    </div>
  )
}

function MatchCompleteOverlay({ onDone }: { onDone: () => void }) {
  const { state } = useScore()
  if (!state || !state.winner) return null

  const winnerName = state.winner === 1 ? state.p1 : state.p2
  const loserName = state.winner === 1 ? state.p2 : state.p1

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(8,9,13,0.92)',
        backdropFilter: 'blur(14px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        style={{ textAlign: 'center' }}
      >
        <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#bef264', marginBottom: 4 }}>
          {winnerName} Wins!
        </div>
        <div style={{ fontSize: 15, color: '#636b84', marginBottom: 24 }}>
          def. {loserName}
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
          {state.sets.map((s, i) => (
            <span key={i} style={{
              fontFamily: '"IBM Plex Mono"', fontSize: 18, fontWeight: 600,
              color: '#e4e8f2',
            }}>
              {s[0]}-{s[1]}{i < state.sets.length - 1 ? ' ' : ''}
            </span>
          ))}
        </div>
        <button
          onClick={onDone}
          style={{
            width: '100%', maxWidth: 280,
            padding: '16px', background: '#bef264',
            border: 'none', borderRadius: 12, cursor: 'pointer',
            color: '#08090d', fontSize: 16, fontWeight: 800,
            fontFamily: '"DM Sans"',
          }}
        >
          Done
        </button>
      </motion.div>
    </motion.div>
  )
}

export function ScorePage() {
  const { state, history, addPoint, undo, endMatch, addRally, currentMatch, clearMatch } = useScore()
  const { showToast, setNewMatchOpen } = useApp()
  const navigate = useNavigate()
  const [flashingBtn, setFlashingBtn] = useState<number | null>(null)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const prevStatusRef = useRef<string | null>(null)

  useEffect(() => {
    if (state?.status === 'complete' && prevStatusRef.current === 'playing') {
      // Natural match completion — DB already saved by addPoint
      setTimeout(() => setShowComplete(true), 300)
    }
    prevStatusRef.current = state?.status ?? null
  }, [state?.status])

  const handlePoint = useCallback((player: Player, e: React.MouseEvent<HTMLDivElement>) => {
    if (!state || state.status === 'complete') return
    createRipple(e, player === 1 ? '#38bdf8' : '#fb7185')
    addPoint(player)
  }, [state, addPoint])

  const handleShotBtn = useCallback((btn: ShotButtonDef, idx: number) => {
    if (!state) return
    // Determine player: buttons apply to the server by default
    const player = state.server
    addRally({ type: btn.type, shot: btn.shot, player })
    showToast(getToastMessage(btn))
    setFlashingBtn(idx)
    setTimeout(() => setFlashingBtn(null), 220)
  }, [state, addRally, showToast])

  const handleEndMatch = () => {
    if (!state) return
    const leader = state.currentSet[0] > state.currentSet[1] ? 1 :
                   state.currentSet[1] > state.currentSet[0] ? 2 :
                   state.sets.reduce((a, s) => {
                     const p1Wins = s[0] > s[1] ? 1 : 0
                     const p2Wins = s[1] > s[0] ? 1 : 0
                     return a + p1Wins - p2Wins
                   }, 0) >= 0 ? 1 : 2
    endMatch(leader)
    setShowEndConfirm(false)
    navigate('/')
  }

  if (!state) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16, minHeight: 300 }}>
        <div style={{ fontSize: 48 }}>🎾</div>
        <div style={{ color: '#949cb4', fontSize: 16, fontWeight: 600, textAlign: 'center' }}>
          No active match
        </div>
        <button
          onClick={() => setNewMatchOpen(true)}
          style={{
            padding: '14px 28px', background: '#bef264', border: 'none',
            borderRadius: 12, cursor: 'pointer', color: '#08090d',
            fontSize: 15, fontWeight: 800, fontFamily: '"DM Sans"',
          }}
        >
          Start New Match
        </button>
      </div>
    )
  }

  const serverName = state.server === 1 ? state.p1 : state.p2

  return (
    <div style={{ padding: '16px 16px 0', paddingBottom: 80 }}>
      {/* Score Card */}
      <div style={{
        background: '#0f1117', border: '1px solid #252a38',
        borderRadius: 14, overflow: 'hidden',
        position: 'relative', marginBottom: 16,
      }}>
        {/* Top controls */}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          display: 'flex', gap: 8, zIndex: 10,
        }}>
          <button
            onClick={undo}
            disabled={history.length === 0}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#161922', border: '1px solid #252a38',
              cursor: history.length ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: history.length ? 1 : 0.4,
            }}
            title="Undo"
          >
            <span style={{ fontSize: 14, color: '#e4e8f2' }}>↩</span>
          </button>
          <button
            onClick={() => setShowEndConfirm(true)}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#161922', border: '1px solid #252a38',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="End Match"
          >
            <span style={{ fontSize: 14, color: '#fb7185' }}>✕</span>
          </button>
        </div>

        {/* Score zones */}
        <div style={{ display: 'flex', borderBottom: '1px solid #252a38' }}>
          <ScoreZone player={1} onClick={(e) => handlePoint(1, e)} />
          <div style={{ width: 1, background: '#252a38', flexShrink: 0 }} />
          <ScoreZone player={2} onClick={(e) => handlePoint(2, e)} />
        </div>

        {/* Hint text */}
        <div style={{ padding: '10px 16px', textAlign: 'center' }}>
          <span style={{ fontSize: 12, color: '#636b84', fontWeight: 500 }}>
            Tap side to score · Serving: <span style={{ color: '#bef264' }}>{serverName}</span>
            {state.gameScore.isTiebreak && <span style={{ color: '#949cb4' }}> · Tiebreak</span>}
          </span>
        </div>
      </div>

      {/* Shot Tracker */}
      <div style={{
        background: '#0f1117', border: '1px solid #252a38',
        borderRadius: 14, padding: 16, marginBottom: 16,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
          Shot Tracker
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SHOT_BUTTONS.map((row, rowIdx) => (
            <div key={rowIdx} style={{ display: 'flex', gap: 8 }}>
              {row.map((btn, colIdx) => {
                const idx = rowIdx * 4 + colIdx
                const flashing = flashingBtn === idx
                return (
                  <button
                    key={idx}
                    onClick={() => handleShotBtn(btn, idx)}
                    className={flashing ? 'flash-lime' : ''}
                    style={{
                      flex: 1, padding: '10px 4px',
                      background: '#161922',
                      border: `1px solid ${flashing ? '#bef264' : '#252a38'}`,
                      borderRadius: 8, cursor: 'pointer',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 2,
                      transition: 'border-color 0.1s',
                      minHeight: 52,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{btn.emoji}</span>
                    <span style={{ fontSize: 9, color: '#636b84', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>
                      {btn.label}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Rally log */}
        {currentMatch && currentMatch.rallies.length > 0 && (
          <div style={{ marginTop: 12, maxHeight: 140, overflowY: 'auto' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#636b84', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Recent Events
            </div>
            {[...currentMatch.rallies].reverse().slice(0, 20).map(r => (
              <div key={r.id} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '5px 0', borderBottom: '1px solid rgba(37,42,56,0.5)',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: 12, color: '#949cb4' }}>{getRallyLabel(r)}</span>
                <span style={{ fontSize: 11, color: '#636b84' }}>
                  {r.player === 1 ? state.p1 : state.p2}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* End Match Confirm */}
      <AnimatePresence>
        {showEndConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowEndConfirm(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 150, backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{
                position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
                background: '#0f1117', border: '1px solid #252a38', borderRadius: 16,
                padding: 24, zIndex: 151, width: '80%', maxWidth: 300,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: '#e4e8f2', marginBottom: 8 }}>End Match?</div>
              <div style={{ fontSize: 13, color: '#636b84', marginBottom: 20 }}>
                The current leader will be recorded as the winner.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowEndConfirm(false)}
                  style={{ flex: 1, padding: '12px', background: '#161922', border: '1px solid #252a38', borderRadius: 10, cursor: 'pointer', color: '#949cb4', fontSize: 14, fontWeight: 600 }}>
                  Cancel
                </button>
                <button onClick={handleEndMatch}
                  style={{ flex: 1, padding: '12px', background: '#fb7185', border: 'none', borderRadius: 10, cursor: 'pointer', color: '#08090d', fontSize: 14, fontWeight: 800 }}>
                  End Match
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Match Complete Overlay */}
      <AnimatePresence>
        {showComplete && state.status === 'complete' && (
          <MatchCompleteOverlay onDone={() => {
            setShowComplete(false)
            clearMatch()
            navigate('/')
          }} />
        )}
      </AnimatePresence>
    </div>
  )
}
