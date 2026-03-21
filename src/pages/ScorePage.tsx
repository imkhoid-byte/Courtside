import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScore } from '../contexts/ScoreContext'
import { useApp } from '../contexts/AppContext'
import type { TeamPlayer, RallyEvent } from '../lib/types'
import { displayPoints, getAdvantage, isDeuce, isGoldenPoint } from '../lib/padel'
import { useNavigate } from 'react-router-dom'

function createRipple(e: React.MouseEvent<HTMLElement>, color: string) {
  const rect = e.currentTarget.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const size = Math.max(rect.width, rect.height)
  const el = document.createElement('span')
  el.className = 'ripple'
  el.style.cssText = `width:${size}px;height:${size}px;left:${x - size / 2}px;top:${y - size / 2}px;background:${color};opacity:0.18;`
  e.currentTarget.appendChild(el)
  setTimeout(() => el.remove(), 500)
}

// ─── Shot buttons ────────────────────────────────────────────────────────────

type ShotBtn = {
  label: string
  emoji: string
  type: RallyEvent['type']
  shot: RallyEvent['shot']
}

const SHOT_BTNS: ShotBtn[][] = [
  [
    { label: 'Ace', emoji: '🔥', type: 'ace', shot: 'serve' },
    { label: 'Dbl Fault', emoji: '❌', type: 'double_fault', shot: 'serve' },
    { label: 'FH Win', emoji: '💥', type: 'winner', shot: 'forehand' },
    { label: 'BH Win', emoji: '💥', type: 'winner', shot: 'backhand' },
  ],
  [
    { label: 'Smash', emoji: '💣', type: 'winner', shot: 'smash' },
    { label: 'Bajada', emoji: '🪃', type: 'winner', shot: 'bajada' },
    { label: 'Vibora', emoji: '🌀', type: 'winner', shot: 'vibora' },
    { label: 'Bandeja', emoji: '🎯', type: 'winner', shot: 'bandeja' },
  ],
  [
    { label: 'Wall Shot', emoji: '🧱', type: 'winner', shot: 'wall_shot' },
    { label: 'Lob Win', emoji: '🪶', type: 'winner', shot: 'lob' },
    { label: 'Chiquita', emoji: '🐁', type: 'winner', shot: 'chiquita' },
    { label: 'UE', emoji: '😬', type: 'unforced_error', shot: 'forehand' },
  ],
]

function toastMsg(btn: ShotBtn): string {
  const m: Record<string, string> = {
    ace: '🔥 Ace!', double_fault_serve: '❌ Double Fault',
    winner_forehand: '💥 FH Winner!', winner_backhand: '💥 BH Winner!',
    winner_smash: '💣 Smash!', winner_bajada: '🪃 Bajada!',
    winner_vibora: '🌀 Vibora!', winner_bandeja: '🎯 Bandeja!',
    winner_wall_shot: '🧱 Wall Shot!', winner_lob: '🪶 Lob Winner!',
    winner_chiquita: '🐁 Chiquita!', unforced_error_forehand: '😬 Unforced Error',
  }
  return m[`${btn.type}_${btn.shot}`] ?? m[btn.type] ?? btn.label
}

// ─── Team score zone ─────────────────────────────────────────────────────────

function ScoreZone({ team, onClick }: { team: TeamPlayer; onClick: (e: React.MouseEvent<HTMLDivElement>) => void }) {
  const { state } = useScore()
  if (!state) return null

  const isA = team === 'A'
  const tData = isA ? state.teamA : state.teamB
  const color = isA ? '#38bdf8' : '#fb7185'
  const bg = isA ? 'rgba(56,189,248,0.06)' : 'rgba(251,113,133,0.06)'
  const rawPoints = isA ? state.gameScore.a : state.gameScore.b
  const isTb = state.gameScore.isTiebreak
  const deuce = isDeuce(state.gameScore, state.scoringMode)
  const adv = getAdvantage(state.gameScore, state.scoringMode)

  let displayScore: string
  if (isTb) {
    displayScore = String(rawPoints)
  } else if (deuce) {
    displayScore = 'D'
  } else if (adv !== null) {
    displayScore = adv === team ? 'Ad' : '40'
  } else {
    displayScore = displayPoints(rawPoints, false)
  }

  const currentServerName = state.serverOrder[state.serverIndex]
  const teamServing = (isA
    ? (currentServerName === state.teamA.player1 || currentServerName === state.teamA.player2)
    : (currentServerName === state.teamB.player1 || currentServerName === state.teamB.player2))

  const setScores = [
    ...state.sets.map((s, i) => ({ g: isA ? s[0] : s[1], key: i, current: false })),
    { g: isA ? state.currentSet[0] : state.currentSet[1], key: 'cur', current: true },
  ]

  return (
    <div
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: bg, padding: '20px 10px',
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
        userSelect: 'none', WebkitUserSelect: 'none', minHeight: 190,
      }}
    >
      {/* Team name + serve indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
        {teamServing && (
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#bef264', boxShadow: '0 0 6px #bef264', flexShrink: 0 }} className="pulse-live" />
        )}
        <span style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          TEAM {team}
        </span>
      </div>
      {/* Player names */}
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e4e8f2', lineHeight: 1.3 }}>{tData.player1}</div>
        <div style={{ fontSize: 11, color: '#636b84', fontWeight: 500 }}>&</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e4e8f2', lineHeight: 1.3 }}>{tData.player2}</div>
      </div>
      {/* Big score */}
      <div style={{ fontSize: 64, fontFamily: '"IBM Plex Mono"', fontWeight: 700, color, lineHeight: 1, marginBottom: 12 }}
        key={displayScore}>
        {displayScore}
      </div>
      {/* Set scores */}
      <div style={{ display: 'flex', gap: 6 }}>
        {setScores.map(s => (
          <span key={String(s.key)} style={{
            fontFamily: '"IBM Plex Mono"', fontSize: 15, fontWeight: s.current ? 700 : 400,
            color: s.current ? color : '#636b84', opacity: s.current ? 1 : 0.7,
          }}>
            {s.g}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Match complete overlay ──────────────────────────────────────────────────

function MatchCompleteOverlay({ onDone, onRematch }: { onDone: () => void; onRematch: () => void }) {
  const { state, currentMatch } = useScore()
  if (!state || !state.winner || !currentMatch) return null

  const winTeam = state.winner === 'A' ? state.teamA : state.teamB
  const loseTeam = state.winner === 'A' ? state.teamB : state.teamA
  const winPair = `${winTeam.player1} & ${winTeam.player2}`
  const losePair = `${loseTeam.player1} & ${loseTeam.player2}`

  const shareText = [
    '🏆 SideCourt Match Result',
    `${winPair} def. ${losePair}`,
    state.sets.map(s => `${s[0]}-${s[1]}`).join(', '),
    `Aces: ${currentMatch.stats[state.winner].aces} | Smashes: ${currentMatch.stats[state.winner].smashes} | Winners: ${currentMatch.stats[state.winner].winners}`,
    '#SideCourt #Padel',
  ].join('\n')

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ text: shareText }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(shareText)
    }
  }

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
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        style={{ textAlign: 'center', width: '100%', maxWidth: 320 }}
      >
        <div style={{ fontSize: 56, marginBottom: 12 }}>🏆</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#bef264', marginBottom: 4 }}>
          {winPair}
        </div>
        <div style={{ fontSize: 14, color: '#636b84', marginBottom: 20 }}>def. {losePair}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
          {state.sets.map((s, i) => (
            <span key={i} style={{ fontFamily: '"IBM Plex Mono"', fontSize: 18, fontWeight: 600, color: '#e4e8f2' }}>
              {s[0]}-{s[1]}{i < state.sets.length - 1 ? ' ' : ''}
            </span>
          ))}
        </div>
        {/* Share button */}
        <button
          onClick={handleShare}
          style={{
            width: '100%', padding: '13px', marginBottom: 10,
            background: '#1e222e', border: '1px solid #252a38',
            borderRadius: 12, cursor: 'pointer',
            color: '#e4e8f2', fontSize: 14, fontWeight: 700, fontFamily: '"DM Sans"',
          }}
        >
          📤 Share Result
        </button>
        {/* Rematch */}
        <button
          onClick={onRematch}
          style={{
            width: '100%', padding: '13px', marginBottom: 10,
            background: '#161922', border: '1px solid #252a38',
            borderRadius: 12, cursor: 'pointer',
            color: '#bef264', fontSize: 14, fontWeight: 700, fontFamily: '"DM Sans"',
          }}
        >
          🔁 Rematch
        </button>
        <button
          onClick={onDone}
          style={{
            width: '100%', padding: '14px',
            background: '#bef264', border: 'none',
            borderRadius: 12, cursor: 'pointer',
            color: '#08090d', fontSize: 15, fontWeight: 800, fontFamily: '"DM Sans"',
          }}
        >
          Done
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── Player selector (for shot attribution) ──────────────────────────────────

function PlayerSelector({
  players,
  selected,
  onSelect,
}: {
  players: { name: string; team: TeamPlayer }[]
  selected: string
  onSelect: (name: string, team: TeamPlayer) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
      {players.map(p => (
        <button
          key={p.name}
          onClick={() => onSelect(p.name, p.team)}
          style={{
            padding: '7px 12px',
            background: selected === p.name ? (p.team === 'A' ? '#38bdf8' : '#fb7185') : '#161922',
            border: `1px solid ${selected === p.name ? (p.team === 'A' ? '#38bdf8' : '#fb7185') : '#252a38'}`,
            borderRadius: 20, cursor: 'pointer',
            color: selected === p.name ? '#08090d' : '#949cb4',
            fontSize: 12, fontWeight: 700,
          }}
        >
          {p.name}
        </button>
      ))}
    </div>
  )
}

// ─── Main Score Page ─────────────────────────────────────────────────────────

export function ScorePage() {
  const { state, history, addPoint, undo, endMatch, addRally, currentMatch, clearMatch } = useScore()
  const { showToast, setNewMatchOpen } = useApp()
  const navigate = useNavigate()
  const [flashingBtn, setFlashingBtn] = useState<number | null>(null)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [pendingShot, setPendingShot] = useState<{ btn: ShotBtn; idx: number } | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<string>('')
  const prevStatusRef = useRef<string | null>(null)

  useEffect(() => {
    if (state?.status === 'complete' && prevStatusRef.current === 'playing') {
      setTimeout(() => setShowComplete(true), 300)
    }
    prevStatusRef.current = state?.status ?? null
  }, [state?.status])

  // Default selected player = current server
  useEffect(() => {
    if (state) {
      setSelectedPlayer(state.serverOrder[state.serverIndex])
    }
  }, [state?.serverIndex])

  const handlePoint = useCallback((team: TeamPlayer, e: React.MouseEvent<HTMLDivElement>) => {
    if (!state || state.status === 'complete') return
    createRipple(e, team === 'A' ? '#38bdf8' : '#fb7185')
    addPoint(team)
  }, [state, addPoint])

  const handleShotBtnTap = useCallback((btn: ShotBtn, idx: number) => {
    if (!state) return
    setPendingShot({ btn, idx })
    setSelectedPlayer(state.serverOrder[state.serverIndex])
  }, [state])

  const confirmShot = useCallback(() => {
    if (!pendingShot || !state) return
    const { btn } = pendingShot
    const team: TeamPlayer = (
      state.teamA.player1 === selectedPlayer || state.teamA.player2 === selectedPlayer
    ) ? 'A' : 'B'
    addRally({ type: btn.type, shot: btn.shot, player: selectedPlayer, team })
    showToast(toastMsg(btn))
    setFlashingBtn(pendingShot.idx)
    setPendingShot(null)
    setTimeout(() => setFlashingBtn(null), 220)
  }, [pendingShot, state, selectedPlayer, addRally, showToast])

  const handleEndMatch = () => {
    if (!state) return
    const leaderA = state.currentSet[0] + state.sets.filter(s => s[0] > s[1]).length
    const leaderB = state.currentSet[1] + state.sets.filter(s => s[1] > s[0]).length
    endMatch(leaderA >= leaderB ? 'A' : 'B')
    setShowEndConfirm(false)
    navigate('/')
  }

  const handleRematch = () => {
    setShowComplete(false)
    clearMatch()
    setNewMatchOpen(true)
  }

  if (!state) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16, minHeight: 320 }}>
        <div style={{ fontSize: 48 }}>🎾</div>
        <div style={{ color: '#949cb4', fontSize: 16, fontWeight: 600, textAlign: 'center' }}>No active match</div>
        <button
          onClick={() => setNewMatchOpen(true)}
          style={{ padding: '14px 28px', background: '#bef264', border: 'none', borderRadius: 12, cursor: 'pointer', color: '#08090d', fontSize: 15, fontWeight: 800, fontFamily: '"DM Sans"' }}
        >
          Start New Match
        </button>
      </div>
    )
  }

  const serverName = state.serverOrder[state.serverIndex]
  const isGP = isGoldenPoint(state.gameScore, state.scoringMode)
  const allPlayers = [
    { name: state.teamA.player1, team: 'A' as TeamPlayer },
    { name: state.teamA.player2, team: 'A' as TeamPlayer },
    { name: state.teamB.player1, team: 'B' as TeamPlayer },
    { name: state.teamB.player2, team: 'B' as TeamPlayer },
  ]

  return (
    <div style={{ padding: '16px 16px 0', paddingBottom: 80 }}>

      {/* Score Card */}
      <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, overflow: 'hidden', position: 'relative', marginBottom: 12 }}>
        {/* Controls */}
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 7, zIndex: 10 }}>
          <button onClick={undo} disabled={history.length === 0}
            style={{ width: 32, height: 32, borderRadius: '50%', background: '#161922', border: '1px solid #252a38', cursor: history.length ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: history.length ? 1 : 0.35 }}>
            <span style={{ fontSize: 14, color: '#e4e8f2' }}>↩</span>
          </button>
          <button onClick={() => setShowEndConfirm(true)}
            style={{ width: 32, height: 32, borderRadius: '50%', background: '#161922', border: '1px solid #252a38', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 14, color: '#fb7185' }}>✕</span>
          </button>
        </div>

        {/* Zones */}
        <div style={{ display: 'flex', borderBottom: '1px solid #252a38' }}>
          <ScoreZone team="A" onClick={e => handlePoint('A', e)} />
          <div style={{ width: 1, background: '#252a38', flexShrink: 0 }} />
          <ScoreZone team="B" onClick={e => handlePoint('B', e)} />
        </div>

        {/* Hint + golden point badge */}
        <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          {isGP && (
            <div style={{ background: '#fbbf24', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 800, color: '#08090d', letterSpacing: '0.08em' }}>
              GOLDEN POINT
            </div>
          )}
          <div style={{ fontSize: 12, color: '#636b84' }}>
            Tap side to score · Serving: <span style={{ color: '#bef264', fontWeight: 600 }}>{serverName}</span>
          </div>
          {/* Serve rotation */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {state.serverOrder.map((name, i) => (
              <span key={name} style={{
                fontSize: 10, fontWeight: 700,
                color: i === state.serverIndex ? '#bef264' : '#636b84',
                padding: '1px 4px',
                background: i === state.serverIndex ? 'rgba(190,242,100,0.12)' : 'transparent',
                borderRadius: 3,
              }}>
                {name.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Shot Tracker */}
      <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
          Shot Tracker
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {SHOT_BTNS.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: 7 }}>
              {row.map((btn, ci) => {
                const idx = ri * 4 + ci
                const flashing = flashingBtn === idx
                return (
                  <button
                    key={idx}
                    onClick={() => handleShotBtnTap(btn, idx)}
                    className={flashing ? 'flash-lime' : ''}
                    style={{
                      flex: 1, padding: '9px 2px',
                      background: '#161922',
                      border: `1px solid ${flashing ? '#bef264' : '#252a38'}`,
                      borderRadius: 8, cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                      minHeight: 50,
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{btn.emoji}</span>
                    <span style={{ fontSize: 9, color: '#636b84', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{btn.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Rally log */}
        {currentMatch && currentMatch.rallies.length > 0 && (
          <div style={{ marginTop: 10, maxHeight: 120, overflowY: 'auto' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#636b84', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent</div>
            {[...currentMatch.rallies].reverse().slice(0, 15).map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(37,42,56,0.4)', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#949cb4' }}>{r.shot.replace('_', ' ')} {r.type.replace('_', ' ')}</span>
                <span style={{ fontSize: 11, color: r.team === 'A' ? '#38bdf8' : '#fb7185', fontWeight: 600 }}>{r.player}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Player selector modal */}
      <AnimatePresence>
        {pendingShot && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPendingShot(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 150, backdropFilter: 'blur(3px)' }} />
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              style={{
                position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
                background: '#0f1117', border: '1px solid #252a38', borderRadius: 16,
                padding: '20px', zIndex: 151, width: '85%', maxWidth: 320,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: '#e4e8f2', textAlign: 'center', marginBottom: 4 }}>
                {pendingShot.btn.emoji} {pendingShot.btn.label}
              </div>
              <div style={{ fontSize: 12, color: '#636b84', textAlign: 'center', marginBottom: 14 }}>Who hit it?</div>
              <PlayerSelector players={allPlayers} selected={selectedPlayer} onSelect={(name) => setSelectedPlayer(name)} />
              <button
                onClick={confirmShot}
                style={{ width: '100%', marginTop: 14, padding: '13px', background: '#bef264', border: 'none', borderRadius: 10, cursor: 'pointer', color: '#08090d', fontSize: 14, fontWeight: 800 }}
              >
                Log Shot
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* End match confirm */}
      <AnimatePresence>
        {showEndConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowEndConfirm(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 150, backdropFilter: 'blur(4px)' }} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', background: '#0f1117', border: '1px solid #252a38', borderRadius: 16, padding: 24, zIndex: 151, width: '80%', maxWidth: 300 }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: '#e4e8f2', marginBottom: 8 }}>End Match?</div>
              <div style={{ fontSize: 13, color: '#636b84', marginBottom: 20 }}>The current leader will be recorded as the winner.</div>
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

      {/* Complete overlay */}
      <AnimatePresence>
        {showComplete && state.status === 'complete' && (
          <MatchCompleteOverlay
            onDone={() => { setShowComplete(false); clearMatch(); navigate('/') }}
            onRematch={handleRematch}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
