import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScore } from '../contexts/ScoreContext'
import { useApp } from '../contexts/AppContext'
import { useI18n } from '../contexts/I18nContext'
import type { TeamPlayer, RallyEvent } from '../lib/types'
import { displayPoints, getAdvantage, isDeuce, isGoldenPoint } from '../lib/padel'
import { useNavigate } from 'react-router-dom'
import type { DrinkEvent } from '../lib/party'

// ─── Voice Commands ───────────────────────────────────────────────────────────

// Web Speech API type shims
interface SpeechRecognitionShim extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((e: { results: { [k: number]: { [k: number]: { transcript: string } }; length: number } }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionShim

function getSR(): SpeechRecognitionCtor | null {
  type W = { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }
  const w = window as unknown as W
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

type VoiceCallback = (cmd: string) => void

function useVoiceCommands(onCommand: VoiceCallback, lang = 'en-US') {
  const [isListening, setIsListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionShim | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  // Use a ref so onresult always calls the latest callback without stale closures
  const onCommandRef = useRef(onCommand)
  const shouldRestartRef = useRef(false)
  useEffect(() => { onCommandRef.current = onCommand }, [onCommand])

  useEffect(() => {
    setSupported(!!getSR())
  }, [])

  const startRecognition = useCallback(() => {
    const SR = getSR()
    if (!SR) return
    const r = new SR()
    r.continuous = true
    r.interimResults = false
    r.lang = lang
    r.onresult = (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.toLowerCase().trim()
      onCommandRef.current(transcript)
    }
    r.onerror = () => {
      shouldRestartRef.current = false
      setIsListening(false)
    }
    r.onend = () => {
      // Auto-restart if we're still supposed to be listening
      if (shouldRestartRef.current) {
        try { r.start() } catch { /* already started */ }
      } else {
        setIsListening(false)
      }
    }
    recognitionRef.current = r
    try { r.start() } catch { return }
    setIsListening(true)
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then(wl => { wakeLockRef.current = wl }).catch(() => {})
    }
  }, [lang])

  const start = useCallback(() => {
    shouldRestartRef.current = true
    startRecognition()
  }, [startRecognition])

  const stop = useCallback(() => {
    shouldRestartRef.current = false
    recognitionRef.current?.stop()
    recognitionRef.current = null
    wakeLockRef.current?.release().catch(() => {})
    wakeLockRef.current = null
    setIsListening(false)
  }, [])

  const toggle = useCallback(() => {
    if (isListening) stop(); else start()
  }, [isListening, start, stop])

  useEffect(() => () => { stop() }, [stop])

  return { isListening, supported, toggle }
}

// ─── Match Timer ──────────────────────────────────────────────────────────────

function useMatchTimer(startTime?: string) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!startTime) return
    const start = new Date(startTime).getTime()
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    update()
    const id = setInterval(update, 10000)
    return () => clearInterval(id)
  }, [startTime])
  const mins = Math.floor(elapsed / 60)
  const hrs = Math.floor(mins / 60)
  return hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`
}

// ─── Generate share image (canvas) ───────────────────────────────────────────

function generateShareText(winPair: string, losePair: string, sets: [number, number][], stats: { aces: number; smashes: number; winners: number }, venue?: string): string {
  return [
    '🏆 SideCourt Match Result',
    '━━━━━━━━━━━━━━━━━',
    `${winPair}  🏆  def.  ${losePair}`,
    sets.map(s => `${s[0]}-${s[1]}`).join('  '),
    '━━━━━━━━━━━━━━━━━',
    `🔥 Aces: ${stats.aces}  💣 Smashes: ${stats.smashes}  💥 Winners: ${stats.winners}`,
    venue ? `📍 ${venue}` : '',
    '━━━━━━━━━━━━━━━━━',
    'sidecourt.app',
  ].filter(Boolean).join('\n')
}

async function generateShareImage(text: string): Promise<Blob | null> {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1920
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // Background
    ctx.fillStyle = '#08090d'
    ctx.fillRect(0, 0, 1080, 1920)

    // Lime accent bar
    ctx.fillStyle = '#bef264'
    ctx.fillRect(80, 200, 920, 8)

    // Title
    ctx.fillStyle = '#bef264'
    ctx.font = 'bold 64px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('SideCourt', 540, 160)

    // Content
    ctx.fillStyle = '#e4e8f2'
    ctx.font = '48px sans-serif'
    const lines = text.split('\n')
    lines.forEach((line, i) => {
      if (line.includes('━')) {
        ctx.fillStyle = '#252a38'
        ctx.fillRect(80, 260 + i * 80 - 10, 920, 2)
      } else {
        ctx.fillStyle = line.startsWith('🏆') ? '#bef264' : '#e4e8f2'
        ctx.fillText(line, 540, 300 + i * 80)
      }
    })

    // Footer
    ctx.fillStyle = '#636b84'
    ctx.font = '36px sans-serif'
    ctx.fillText('sidecourt.app', 540, 1820)

    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  } catch {
    return null
  }
}

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

  const shareText = generateShareText(
    winPair, losePair, state.sets,
    currentMatch.stats[state.winner],
    currentMatch.venue
  )
  const { showToast } = useApp()

  const handleShare = async () => {
    const blob = await generateShareImage(shareText)
    if (navigator.share) {
      const files = blob ? [new File([blob], 'sidecourt-result.png', { type: 'image/png' })] : []
      const shareData: ShareData = { text: shareText, title: 'SideCourt Match Result' }
      if (files.length && navigator.canShare?.({ files })) shareData.files = files
      navigator.share(shareData).catch(() => navigator.clipboard?.writeText(shareText))
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText)
      showToast('Copied!')
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

// ─── Drink overlay ────────────────────────────────────────────────────────────

function DrinkOverlay({ event, onDismiss }: { event: DrinkEvent; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3200)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(8,9,13,0.93)',
        backdropFilter: 'blur(16px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 32,
      }}
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 20 }}
        style={{ textAlign: 'center', maxWidth: 300 }}
      >
        <div style={{ fontSize: 72, marginBottom: 12, lineHeight: 1 }}>{event.emoji}</div>
        <div style={{
          fontSize: 13, fontWeight: 700, color: '#f472b6',
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
        }}>
          {event.reason}
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#e4e8f2', marginBottom: 8, lineHeight: 1.3 }}>
          {event.players.join(' & ')}
        </div>
        <div style={{
          display: 'inline-block',
          background: event.isFinish
            ? 'linear-gradient(135deg, #f472b6, #a855f7)'
            : 'rgba(244,114,182,0.12)',
          border: event.isFinish ? 'none' : '1px solid rgba(244,114,182,0.3)',
          borderRadius: 14, padding: '10px 24px', marginBottom: 20,
        }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: event.isFinish ? '#fff' : '#f472b6' }}>
            {event.isFinish ? '🥂 FINISH YOUR DRINK!' : `🍺 ${event.sips} SIP${event.sips !== 1 ? 'S' : ''}!`}
          </span>
        </div>
        <div style={{ fontSize: 12, color: '#636b84' }}>Tap anywhere to dismiss</div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main Score Page ─────────────────────────────────────────────────────────

export function ScorePage() {
  const { state, history, addPoint, undo, endMatch, addRally, currentMatch, clearMatch } = useScore()
  const { showToast, setNewMatchOpen, partyMode, partyRules, addDrinks } = useApp()
  const { t, language } = useI18n()
  const navigate = useNavigate()
  const [flashingBtn, setFlashingBtn] = useState<number | null>(null)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [pendingShot, setPendingShot] = useState<{ btn: ShotBtn; idx: number } | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<string>('')
  const [scorekeeperMode, setScorekeeperMode] = useState(state?.scorekeeperMode ?? false)
  const prevStatusRef = useRef<string | null>(null)

  // Party — drink event queue
  const [drinkQueue, setDrinkQueue] = useState<DrinkEvent[]>([])
  const pushDrink = useCallback((e: DrinkEvent) => {
    setDrinkQueue(q => [...q, e])
    e.players.forEach(p => addDrinks(p, e.isFinish ? 3 : e.sips))
  }, [addDrinks])
  const shiftDrink = useCallback(() => setDrinkQueue(q => q.slice(1)), [])

  // Snapshot for detecting game/set/rally changes
  const snapRef = useRef<{ sets: number; csA: number; csB: number; ralliesLen: number } | null>(null)

  useEffect(() => {
    if (!state) { snapRef.current = null; return }
    const sets = state.sets.length
    const csA = state.currentSet[0]
    const csB = state.currentSet[1]
    const ralliesLen = currentMatch?.rallies?.length ?? 0
    const prev = snapRef.current
    snapRef.current = { sets, csA, csB, ralliesLen }

    if (!partyMode || !prev) return

    // Rally-based events (ace, double fault, etc.)
    if (ralliesLen > prev.ralliesLen && currentMatch?.rallies?.length) {
      const rally = currentMatch.rallies[currentMatch.rallies.length - 1]
      const hitterTeam = rally.team
      const oppTeam = hitterTeam === 'A' ? 'B' : 'A'
      const oppPlayers = oppTeam === 'A'
        ? [state.teamA.player1, state.teamA.player2].filter(Boolean)
        : [state.teamB.player1, state.teamB.player2].filter(Boolean)

      for (const rule of partyRules.filter(r => r.enabled)) {
        let match = false
        let drinkers: string[] = []
        if (rule.id === 'double_fault' && rally.type === 'double_fault') {
          match = true; drinkers = [rally.player]
        } else if (rule.id === 'ace' && rally.type === 'ace') {
          match = true; drinkers = oppPlayers
        } else if (rule.id === 'unforced_error' && rally.type === 'unforced_error') {
          match = true; drinkers = [rally.player]
        } else if (rule.id === 'smash_winner' && rally.type === 'winner' && rally.shot === 'smash') {
          match = true; drinkers = oppPlayers
        } else if (rule.id === 'lob_winner' && rally.type === 'winner' && rally.shot === 'lob') {
          match = true; drinkers = oppPlayers
        } else if (rule.id === 'wall_shot' && rally.type === 'winner' && rally.shot === 'wall_shot') {
          match = true; drinkers = oppPlayers
        } else if (rule.id === 'vibora_winner' && rally.type === 'winner' && rally.shot === 'vibora') {
          match = true; drinkers = oppPlayers
        }
        if (match && drinkers.length > 0) {
          pushDrink({ players: drinkers, sips: rule.sips, reason: rule.label, emoji: rule.emoji, isFinish: rule.isFinish })
        }
      }
    }

    // Set completed
    if (sets > prev.sets && state.sets.length > 0) {
      const completedSet = state.sets[state.sets.length - 1]
      const teamAWon = completedSet[0] > completedSet[1]
      const loserTeam = teamAWon ? 'B' : 'A'
      const losers = loserTeam === 'A'
        ? [state.teamA.player1, state.teamA.player2].filter(Boolean)
        : [state.teamB.player1, state.teamB.player2].filter(Boolean)

      const loseSetRule = partyRules.find(r => r.id === 'lose_set' && r.enabled)
      if (loseSetRule) {
        pushDrink({ players: losers, sips: 0, reason: `Lost set ${completedSet[0]}-${completedSet[1]}`, emoji: loseSetRule.emoji, isFinish: true })
      }
      const bagelRule = partyRules.find(r => r.id === 'bagel_set' && r.enabled)
      const loserScore = teamAWon ? completedSet[1] : completedSet[0]
      if (bagelRule && loserScore === 0) {
        pushDrink({ players: losers, sips: 0, reason: '6-0 Bagel!', emoji: bagelRule.emoji, isFinish: true })
      }
    }
    // Game completed (sets unchanged, but total games in current set increased)
    else if (sets === prev.sets && csA + csB > prev.csA + prev.csB) {
      const teamAWon = csA > prev.csA
      const loserTeam = teamAWon ? 'B' : 'A'
      const losers = loserTeam === 'A'
        ? [state.teamA.player1, state.teamA.player2].filter(Boolean)
        : [state.teamB.player1, state.teamB.player2].filter(Boolean)
      const loseGameRule = partyRules.find(r => r.id === 'lose_game' && r.enabled)
      if (loseGameRule) {
        pushDrink({ players: losers, sips: loseGameRule.sips, reason: loseGameRule.label, emoji: loseGameRule.emoji })
      }
    }
  }, [state?.sets.length, state?.currentSet[0], state?.currentSet[1], currentMatch?.rallies?.length, partyMode, partyRules, pushDrink, state, currentMatch])

  // Match timer
  const elapsedStr = useMatchTimer(currentMatch?.startTime)

  // Voice commands
  const handleVoiceCommand = useCallback((transcript: string) => {
    if (!state || state.status === 'complete') return
    const cmd = transcript.toLowerCase()
    // Score commands
    if (/\b(point left|point us|nuestro|punto nuestro|punto izquierda)\b/.test(cmd)) {
      addPoint('A'); showToast('✓ Point Team A')
    } else if (/\b(point right|point them|suyo|punto suyo|punto derecha)\b/.test(cmd)) {
      addPoint('B'); showToast('✓ Point Team B')
    } else if (/\b(undo|back|deshacer|atrás)\b/.test(cmd)) {
      undo(); showToast('↩ Undone')
    } else if (/\b(ace|as)\b/.test(cmd)) {
      const server = state.serverOrder[state.serverIndex]
      const team: 'A' | 'B' = (server === state.teamA.player1 || server === state.teamA.player2) ? 'A' : 'B'
      addRally({ type: 'ace', shot: 'serve', player: server, team })
      addPoint(team)
      showToast('🔥 Ace!')
    } else if (/\b(double fault|doble falta)\b/.test(cmd)) {
      const server = state.serverOrder[state.serverIndex]
      const team: 'A' | 'B' = (server === state.teamA.player1 || server === state.teamA.player2) ? 'A' : 'B'
      const opp: 'A' | 'B' = team === 'A' ? 'B' : 'A'
      addRally({ type: 'double_fault', shot: 'serve', player: server, team })
      addPoint(opp)
      showToast('❌ Double Fault')
    } else if (/\b(smash|remate)\b/.test(cmd)) {
      addRally({ type: 'winner', shot: 'smash', player: state.serverOrder[state.serverIndex], team: 'A' })
      addPoint('A')
      showToast('💣 Smash!')
    } else if (/\b(bajada)\b/.test(cmd)) {
      addRally({ type: 'winner', shot: 'bajada', player: state.serverOrder[state.serverIndex], team: 'A' })
      addPoint('A')
      showToast('🪃 Bajada!')
    } else if (/\b(vibora|víbora)\b/.test(cmd)) {
      addRally({ type: 'winner', shot: 'vibora', player: state.serverOrder[state.serverIndex], team: 'A' })
      addPoint('A')
      showToast('🌀 Vibora!')
    } else if (/\b(lob|globo)\b/.test(cmd)) {
      addRally({ type: 'winner', shot: 'lob', player: state.serverOrder[state.serverIndex], team: 'A' })
      addPoint('A')
      showToast('🪶 Lob!')
    } else if (/\b(winner|ganador)\b/.test(cmd)) {
      addRally({ type: 'winner', shot: 'forehand', player: state.serverOrder[state.serverIndex], team: 'A' })
      addPoint('A')
      showToast('💥 Winner!')
    } else if (/\b(error|fallo)\b/.test(cmd)) {
      addRally({ type: 'unforced_error', shot: 'forehand', player: state.serverOrder[state.serverIndex], team: 'A' })
      addPoint('B')
      showToast('😬 Error → point them')
    } else if (/\b(their error|su error|their fault)\b/.test(cmd)) {
      addRally({ type: 'unforced_error', shot: 'forehand', player: state.serverOrder[state.serverIndex], team: 'B' })
      addPoint('A')
      showToast('😬 Their error → point us')
    }
  }, [state, addPoint, undo, addRally, showToast])

  const { isListening, supported: voiceSupported, toggle: toggleVoice } = useVoiceCommands(handleVoiceCommand, language === 'es' ? 'es-ES' : 'en-US')

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

  // Scorekeeper mode: full-height tap zones
  if (scorekeeperMode) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '8px 12px 80px' }}>
        {/* Top bar: timer + controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: '"IBM Plex Mono"', fontSize: 13, color: '#636b84' }}>⏱ {elapsedStr}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setScorekeeperMode(false)}
              style={{ padding: '6px 12px', borderRadius: 8, background: '#161922', border: '1px solid #252a38', color: '#636b84', fontSize: 12, cursor: 'pointer' }}>
              Full UI
            </button>
            <button onClick={undo} disabled={history.length === 0}
              style={{ width: 36, height: 36, borderRadius: '50%', background: '#161922', border: '1px solid #252a38', cursor: history.length ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: history.length ? 1 : 0.35 }}>
              <span style={{ fontSize: 16, color: '#e4e8f2' }}>↩</span>
            </button>
            <button onClick={() => setShowEndConfirm(true)}
              style={{ width: 36, height: 36, borderRadius: '50%', background: '#161922', border: '1px solid #252a38', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 16, color: '#fb7185' }}>✕</span>
            </button>
          </div>
        </div>

        {/* Serve indicator */}
        <div style={{ textAlign: 'center', fontSize: 11, color: '#636b84', marginBottom: 8 }}>
          Serving: <span style={{ color: '#bef264', fontWeight: 700 }}>{serverName}</span>
          {isGP && <span style={{ marginLeft: 8, background: '#fbbf24', color: '#08090d', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 800 }}>GOLDEN</span>}
        </div>

        {/* Big tap zones */}
        <div style={{ flex: 1, display: 'flex', gap: 10 }}>
          <div
            onClick={e => handlePoint('A', e as unknown as React.MouseEvent<HTMLDivElement>)}
            style={{
              flex: 1, borderRadius: 16, background: 'rgba(56,189,248,0.08)',
              border: '2px solid rgba(56,189,248,0.2)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', userSelect: 'none', position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>TEAM A</div>
            <div style={{ fontSize: 14, color: '#949cb4', marginBottom: 4 }}>{state.teamA.player1}</div>
            <div style={{ fontSize: 12, color: '#636b84' }}>{state.teamA.player2}</div>
            <div style={{ fontSize: 80, fontFamily: '"IBM Plex Mono"', fontWeight: 700, color: '#38bdf8', lineHeight: 1, margin: '12px 0' }}>
              {state.gameScore.isTiebreak ? state.gameScore.a : displayPoints(state.gameScore.a, false)}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[...state.sets.map(s => s[0]), state.currentSet[0]].map((g, i) => (
                <span key={i} style={{ fontFamily: '"IBM Plex Mono"', fontSize: 22, color: i === state.sets.length ? '#38bdf8' : '#636b84', fontWeight: i === state.sets.length ? 700 : 400 }}>{g}</span>
              ))}
            </div>
          </div>
          <div
            onClick={e => handlePoint('B', e as unknown as React.MouseEvent<HTMLDivElement>)}
            style={{
              flex: 1, borderRadius: 16, background: 'rgba(251,113,133,0.08)',
              border: '2px solid rgba(251,113,133,0.2)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', userSelect: 'none', position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>TEAM B</div>
            <div style={{ fontSize: 14, color: '#949cb4', marginBottom: 4 }}>{state.teamB.player1}</div>
            <div style={{ fontSize: 12, color: '#636b84' }}>{state.teamB.player2}</div>
            <div style={{ fontSize: 80, fontFamily: '"IBM Plex Mono"', fontWeight: 700, color: '#fb7185', lineHeight: 1, margin: '12px 0' }}>
              {state.gameScore.isTiebreak ? state.gameScore.b : displayPoints(state.gameScore.b, false)}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[...state.sets.map(s => s[1]), state.currentSet[1]].map((g, i) => (
                <span key={i} style={{ fontFamily: '"IBM Plex Mono"', fontSize: 22, color: i === state.sets.length ? '#fb7185' : '#636b84', fontWeight: i === state.sets.length ? 700 : 400 }}>{g}</span>
              ))}
            </div>
          </div>
        </div>

        {/* End confirm + Complete overlay */}
        <AnimatePresence>
          {showEndConfirm && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowEndConfirm(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 150 }} />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', background: '#0f1117', border: '1px solid #252a38', borderRadius: 16, padding: 24, zIndex: 151, width: '80%', maxWidth: 300 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#e4e8f2', marginBottom: 8 }}>End Match?</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowEndConfirm(false)} style={{ flex: 1, padding: '12px', background: '#161922', border: '1px solid #252a38', borderRadius: 10, cursor: 'pointer', color: '#949cb4', fontSize: 14, fontWeight: 600 }}>Cancel</button>
                  <button onClick={handleEndMatch} style={{ flex: 1, padding: '12px', background: '#fb7185', border: 'none', borderRadius: 10, cursor: 'pointer', color: '#08090d', fontSize: 14, fontWeight: 800 }}>End</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showComplete && state.status === 'complete' && (
            <MatchCompleteOverlay onDone={() => { setShowComplete(false); clearMatch(); navigate('/') }} onRematch={handleRematch} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {drinkQueue[0] && <DrinkOverlay event={drinkQueue[0]} onDismiss={shiftDrink} />}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px 16px 0', paddingBottom: 80 }}>

      {/* Top bar: timer + mode toggle + mic */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontFamily: '"IBM Plex Mono"', fontSize: 12, color: '#636b84', flex: 1 }}>⏱ {elapsedStr}</span>
        {voiceSupported && (
          <button
            onClick={() => { toggleVoice(); if (navigator.vibrate) navigator.vibrate(10) }}
            style={{
              padding: '6px 10px', borderRadius: 8, border: 'none',
              background: isListening ? '#dc2626' : '#161922',
              color: isListening ? '#fff' : '#636b84',
              fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            🎙️ {isListening ? <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.05em' }}>{t('listening')}</span> : null}
          </button>
        )}
        <button
          onClick={() => setScorekeeperMode(true)}
          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #252a38', background: '#161922', color: '#636b84', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
        >
          {t('scorekeeperMode')}
        </button>
      </div>

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

      {/* Party drink overlay */}
      <AnimatePresence>
        {drinkQueue[0] && <DrinkOverlay event={drinkQueue[0]} onDismiss={shiftDrink} />}
      </AnimatePresence>
    </div>
  )
}
