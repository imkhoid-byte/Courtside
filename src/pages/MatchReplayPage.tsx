import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMatch } from '../lib/db'
import { useApp } from '../contexts/AppContext'
import type { Match, RallyEvent } from '../lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const SHOT_LABELS: Record<string, string> = {
  forehand: 'Forehand', backhand: 'Backhand', serve: 'Serve',
  volley: 'Volley', smash: 'Smash', lob: 'Lob',
  bajada: 'Bajada', vibora: 'Víbora', bandeja: 'Bandeja',
  wall_shot: 'Wall Shot', chiquita: 'Chiquita',
}

const TYPE_CFG: Record<RallyEvent['type'], { label: string; color: string; bg: string }> = {
  ace:            { label: 'Ace',          color: '#bef264', bg: 'rgba(190,242,100,0.10)' },
  winner:         { label: 'Winner',       color: '#34d399', bg: 'rgba(52,211,153,0.10)'  },
  forced_error:   { label: 'Forced Err',   color: '#fbbf24', bg: 'rgba(251,191,36,0.10)'  },
  unforced_error: { label: 'Unforced Err', color: '#fb7185', bg: 'rgba(251,113,133,0.10)' },
  double_fault:   { label: 'Dbl Fault',    color: '#f87171', bg: 'rgba(248,113,113,0.10)' },
}

const SPEEDS = [0.5, 1, 2, 3] as const
type Speed = typeof SPEEDS[number]
const BASE_MS = 1800
type View = 'pbp' | 'replay' | 'coaching'

// ─── Sub-components ───────────────────────────────────────────────────────────

function RallyRow({ rally, index, isNew }: { rally: RallyEvent; index: number; isNew: boolean }) {
  const cfg = TYPE_CFG[rally.type]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', borderRadius: 10,
      background: isNew ? cfg.color + '18' : cfg.bg,
      borderLeft: `3px solid ${cfg.color}`,
      boxShadow: isNew ? `0 0 0 1px ${cfg.color}44` : 'none',
      animation: isNew ? 'slideIn 0.28s ease-out' : 'none',
      transition: 'background 0.3s, box-shadow 0.3s',
    }}>
      <span style={{ fontFamily: '"IBM Plex Mono"', fontSize: 10, color: '#636b84', width: 24, textAlign: 'right', flexShrink: 0 }}>
        {index + 1}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#e4e8f2' }}>{rally.player}</span>
        <span style={{ fontSize: 12, color: '#636b84', marginLeft: 6 }}>{SHOT_LABELS[rally.shot] ?? rally.shot}</span>
      </div>
      <span style={{
        fontSize: 10, fontWeight: 700, color: cfg.color,
        background: cfg.bg, border: `1px solid ${cfg.color}33`,
        padding: '2px 7px', borderRadius: 5, flexShrink: 0,
      }}>{cfg.label}</span>
    </div>
  )
}

function SetDivider({ setIndex, score, count }: { setIndex: number; score: [number, number]; count?: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      margin: '10px 0 6px', fontSize: 10, fontWeight: 700,
      color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em',
    }}>
      <span style={{ flexShrink: 0 }}>Set {setIndex + 1}</span>
      <span style={{ color: '#252a38' }}>·</span>
      <span style={{ fontFamily: '"IBM Plex Mono"', color: '#949cb4', flexShrink: 0 }}>{score[0]}–{score[1]}</span>
      <span style={{ flex: 1, height: 1, background: '#1e2330' }} />
      {count !== undefined && <span style={{ flexShrink: 0 }}>{count} shots</span>}
    </div>
  )
}

// ─── Court Animation ──────────────────────────────────────────────────────────

const TEAM_A_COLOR = '#60a5fa'  // blue
const TEAM_B_COLOR = '#f97316'  // orange

function CourtAnimation({ rally, animKey, match, speed }: {
  rally: RallyEvent | null
  animKey: number
  match: Match
  speed: Speed
}) {
  const W = 320, H = 162
  const nx = W / 2
  const [cx1, cy1, cx2, cy2] = [14, 12, W - 14, H - 12]

  // Player positions: two per side, top & bottom
  const pos = {
    A1: { x: 56, y: 52 },
    A2: { x: 56, y: H - 52 },
    B1: { x: W - 56, y: 52 },
    B2: { x: W - 56, y: H - 52 },
  }

  // Identify hitter
  type PosKey = 'A1' | 'A2' | 'B1' | 'B2'
  let hitter: PosKey | null = null
  let isError = false
  let ballPath = ''

  if (rally) {
    isError = rally.type !== 'winner' && rally.type !== 'ace'
    if (rally.team === 'A') {
      hitter = rally.player === match.teamA.player2 ? 'A2' : 'A1'
    } else {
      hitter = rally.player === match.teamB.player2 ? 'B2' : 'B1'
    }

    const start = pos[hitter]
    let ex: number, ey: number, apexX: number, apexY: number

    if (!isError) {
      // Ball lands in opponent's half
      if (rally.team === 'A') {
        ex = W - 60; ey = hitter === 'A1' ? H - 58 : 58
      } else {
        ex = 60; ey = hitter === 'B1' ? H - 58 : 58
      }
      apexX = (start.x + ex) / 2
      apexY = rally.shot === 'lob' ? 8 : rally.shot === 'smash' ? H / 2 : Math.min(start.y, ey) - 22
    } else {
      // Error: ball goes into net
      ex = rally.team === 'A' ? nx - 6 : nx + 6
      ey = H / 2
      apexX = (start.x + ex) / 2
      apexY = Math.min(start.y, ey) - 10
    }

    ballPath = `M ${start.x},${start.y} Q ${apexX},${apexY} ${ex},${ey}`
  }

  const ballFill = isError ? '#fb7185' : '#bef264'
  const dur = `${Math.round((BASE_MS / speed) * 0.72)}ms`
  // Label appears after ball arrives
  const labelDelay = `${Math.round((BASE_MS / speed) * 0.68)}ms`

  const outcomeLabel = rally
    ? rally.type === 'ace' ? 'ACE'
      : rally.type === 'winner' ? 'WINNER'
      : rally.type === 'double_fault' ? 'DBL FAULT'
      : 'ERROR'
    : ''

  function Player({ pk, name, team }: { pk: PosKey; name: string; team: 'A' | 'B' }) {
    const p = pos[pk]
    const isHitter = pk === hitter
    const c = team === 'A' ? TEAM_A_COLOR : TEAM_B_COLOR
    return (
      <g>
        {isHitter && (
          <circle cx={p.x} cy={p.y} r={17} fill="none" stroke={c} strokeWidth={1.5} opacity={0}>
            <animate attributeName="r" values="15;21;15" dur="0.55s" repeatCount="2" begin="0s" />
            <animate attributeName="opacity" values="0.6;0.1;0.6" dur="0.55s" repeatCount="2" begin="0s" />
          </circle>
        )}
        <circle cx={p.x} cy={p.y} r={13} fill={isHitter ? c : '#122318'} stroke={c} strokeWidth={isHitter ? 2 : 1} opacity={isHitter ? 1 : 0.55} />
        <text x={p.x} y={p.y + 1} textAnchor="middle" dominantBaseline="middle"
          fontSize={9} fontWeight="800" fill={isHitter ? '#08090d' : c} fontFamily='"DM Sans"'>
          {(name || '?')[0].toUpperCase()}
        </text>
      </g>
    )
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', borderRadius: 12, display: 'block', marginBottom: 10 }}>
      <defs>
        <filter id="ballGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="labelGlow" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width={W} height={H} fill="#07120d" rx={12} />
      {/* Court surface */}
      <rect x={cx1} y={cy1} width={cx2 - cx1} height={cy2 - cy1} fill="#0c2918" rx={3} />
      {/* Outer court line */}
      <rect x={cx1} y={cy1} width={cx2 - cx1} height={cy2 - cy1} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1} rx={3} />
      {/* Center horizontal */}
      <line x1={cx1} y1={H / 2} x2={cx2} y2={H / 2} stroke="rgba(255,255,255,0.2)" strokeWidth={0.6} />
      {/* Service box verticals */}
      <line x1={nx - 68} y1={cy1} x2={nx - 68} y2={cy2} stroke="rgba(255,255,255,0.18)" strokeWidth={0.6} />
      <line x1={nx + 68} y1={cy1} x2={nx + 68} y2={cy2} stroke="rgba(255,255,255,0.18)" strokeWidth={0.6} />
      {/* Net */}
      <line x1={nx} y1={cy1} x2={nx} y2={cy2} stroke="#ffffff" strokeWidth={2.5} />
      <circle cx={nx} cy={cy1} r={2.5} fill="#fff" />
      <circle cx={nx} cy={cy2} r={2.5} fill="#fff" />
      {/* Glass wall tint */}
      <rect x={cx1} y={cy1} width={11} height={cy2 - cy1} fill="rgba(147,197,253,0.05)" />
      <rect x={cx2 - 11} y={cy1} width={11} height={cy2 - cy1} fill="rgba(147,197,253,0.05)" />

      {/* Team labels */}
      <text x={nx / 2 + cx1 / 2} y={cy1 - 2} textAnchor="middle" fontSize={6.5} fill={TEAM_A_COLOR} fontFamily='"DM Sans"' opacity={0.55}>
        {[match.teamA.player1, match.teamA.player2].filter(Boolean).join(' & ')}
      </text>
      <text x={nx + (cx2 - nx) / 2} y={cy1 - 2} textAnchor="middle" fontSize={6.5} fill={TEAM_B_COLOR} fontFamily='"DM Sans"' opacity={0.55}>
        {[match.teamB.player1, match.teamB.player2].filter(Boolean).join(' & ')}
      </text>

      {/* Players */}
      <Player pk="A1" name={match.teamA.player1 || 'A'} team="A" />
      {match.teamA.player2 && <Player pk="A2" name={match.teamA.player2} team="A" />}
      <Player pk="B1" name={match.teamB.player1 || 'B'} team="B" />
      {match.teamB.player2 && <Player pk="B2" name={match.teamB.player2} team="B" />}

      {/* Ball + outcome label */}
      {rally && ballPath && (
        <g key={animKey}>
          {/* Ball */}
          <circle r={5} fill={ballFill} filter="url(#ballGlow)">
            <animateMotion dur={dur} path={ballPath} fill="freeze" />
          </circle>
          {/* Outcome label fades in when ball arrives */}
          <text
            x={nx} y={H / 2 - 22}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={12} fontWeight="900"
            fill={isError ? '#fb7185' : '#bef264'}
            fontFamily='"DM Sans"'
            filter="url(#labelGlow)"
            opacity={0}
          >
            {outcomeLabel}
            <animate attributeName="opacity" values="0;1" dur="0.25s" begin={labelDelay} fill="freeze" />
          </text>
        </g>
      )}

      {/* Idle state hint */}
      {!rally && (
        <text x={nx} y={H / 2 + 1} textAnchor="middle" dominantBaseline="middle"
          fontSize={10} fill="rgba(255,255,255,0.2)" fontFamily='"DM Sans"'>
          Press Play
        </text>
      )}
    </svg>
  )
}

function EmptyShots() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: '#636b84' }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>🎾</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#949cb4', marginBottom: 4 }}>No Shot Data</div>
      <div style={{ fontSize: 12 }}>Use the shot tracker during matches to unlock this</div>
    </div>
  )
}

function CoachingTab({ rallies }: { rallies: RallyEvent[] }) {
  if (rallies.length === 0) return <EmptyShots />

  // Shot stats
  const shotMap: Record<string, { w: number; e: number; n: number }> = {}
  rallies.forEach(r => {
    if (!shotMap[r.shot]) shotMap[r.shot] = { w: 0, e: 0, n: 0 }
    shotMap[r.shot].n++
    if (r.type === 'winner' || r.type === 'ace') shotMap[r.shot].w++
    if (r.type === 'unforced_error' || r.type === 'double_fault') shotMap[r.shot].e++
  })
  const shots = Object.entries(shotMap).sort((a, b) => b[1].n - a[1].n)
  const best = shots.length ? [...shots].sort((a, b) => (b[1].w / b[1].n) - (a[1].w / a[1].n))[0] : null
  const worst = shots.filter(([, s]) => s.e > 0).sort((a, b) => (b[1].e / b[1].n) - (a[1].e / a[1].n))[0] ?? null

  // Player stats
  const pMap: Record<string, { w: number; e: number; n: number }> = {}
  rallies.forEach(r => {
    if (!pMap[r.player]) pMap[r.player] = { w: 0, e: 0, n: 0 }
    pMap[r.player].n++
    if (r.type === 'winner' || r.type === 'ace') pMap[r.player].w++
    if (r.type === 'unforced_error' || r.type === 'double_fault') pMap[r.player].e++
  })
  const players = Object.entries(pMap).sort((a, b) => b[1].n - a[1].n)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Callouts */}
      <div style={{ display: 'flex', gap: 8 }}>
        {best && (
          <div style={{ flex: 1, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 10, color: '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Best Shot</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#e4e8f2' }}>{SHOT_LABELS[best[0]] ?? best[0]}</div>
            <div style={{ fontSize: 11, color: '#636b84', marginTop: 3 }}>{best[1].w}W · {best[1].n} plays</div>
          </div>
        )}
        {worst && (
          <div style={{ flex: 1, background: 'rgba(251,113,133,0.06)', border: '1px solid rgba(251,113,133,0.2)', borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 10, color: '#fb7185', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Most Errors</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#e4e8f2' }}>{SHOT_LABELS[worst[0]] ?? worst[0]}</div>
            <div style={{ fontSize: 11, color: '#636b84', marginTop: 3 }}>{worst[1].e}E · {worst[1].n} plays</div>
          </div>
        )}
      </div>

      {/* Shot efficiency table */}
      <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #252a38', fontSize: 11, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Shot Efficiency</div>
        {shots.map(([shot, s]) => {
          const eff = Math.round((s.w / s.n) * 100)
          const good = eff >= 50
          return (
            <div key={shot} style={{ padding: '9px 14px', borderBottom: '1px solid #161922', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 78, fontSize: 12, fontWeight: 600, color: '#e4e8f2', flexShrink: 0 }}>{SHOT_LABELS[shot] ?? shot}</div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 4, background: '#252a38', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${eff}%`, background: good ? '#34d399' : '#fb7185', borderRadius: 2 }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
                <span style={{ fontFamily: '"IBM Plex Mono"', fontSize: 11, fontWeight: 700, color: good ? '#34d399' : '#fb7185' }}>{eff}%</span>
                <span style={{ fontSize: 10, color: '#636b84', marginLeft: 6 }}>{s.w}W {s.e}E</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Player breakdown */}
      <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #252a38', fontSize: 11, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Player Breakdown</div>
        {players.map(([name, s]) => {
          const rate = s.n > 0 ? Math.round((s.w / s.n) * 100) : 0
          return (
            <div key={name} style={{ padding: '10px 14px', borderBottom: '1px solid #161922', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#252a38', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#636b84' }}>{name[0]?.toUpperCase()}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e4e8f2', marginBottom: 4 }}>{name}</div>
                <div style={{ height: 3, background: '#252a38', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${rate}%`, background: rate >= 50 ? '#34d399' : '#fb7185', borderRadius: 2 }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: '"IBM Plex Mono"', fontSize: 12, fontWeight: 700, color: '#bef264' }}>{s.w}W {s.e}E</div>
                <div style={{ fontSize: 10, color: '#636b84' }}>{s.n} shots</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function MatchReplayPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { myName } = useApp()

  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<View>('pbp')
  const [activeSet, setActiveSet] = useState<number | 'all'>('all')

  // Replay state
  const [replayIdx, setReplayIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<Speed>(1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    getMatch(id).then(m => { setMatch(m ?? null); setLoading(false) })
  }, [id])

  // Reset replay index whenever user switches TO the replay tab
  useEffect(() => {
    if (activeView === 'replay') {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setPlaying(false)
      setReplayIdx(0)
    }
  }, [activeView])

  // Replay ticker — setInterval, replayIdx NOT in deps to avoid rapid re-firing
  useEffect(() => {
    if (!playing || !match) return
    const totalRallies = match.rallies.length
    if (totalRallies === 0) { setPlaying(false); return }
    intervalRef.current = setInterval(() => {
      // Only increment index here — never call other setters inside functional updater
      setReplayIdx(prev => Math.min(prev + 1, totalRallies))
    }, BASE_MS / speed)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [playing, speed, match])

  // Stop playing when replay reaches the end (separate effect — clean separation)
  useEffect(() => {
    if (!match) return
    if (playing && replayIdx >= match.rallies.length && match.rallies.length > 0) {
      setPlaying(false)
    }
  }, [replayIdx, playing, match])

  // Auto-scroll to newest rally
  useEffect(() => {
    if (playing && lastRef.current) lastRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [replayIdx, playing])

  const resetReplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPlaying(false)
    setReplayIdx(0)
  }, [])
  const stepBack = useCallback(() => { setPlaying(false); setReplayIdx(i => Math.max(0, i - 1)) }, [])
  const stepFwd = useCallback(() => {
    if (!match) return
    setPlaying(false); setReplayIdx(i => Math.min(match.rallies.length, i + 1))
  }, [match])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#636b84', fontFamily: '"DM Sans"' }}>Loading…</div>
  if (!match) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#636b84', fontFamily: '"DM Sans"' }}>
      Match not found.
      <br /><button onClick={() => navigate(-1)} style={{ marginTop: 12, color: '#bef264', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>← Go back</button>
    </div>
  )

  const me = myName || 'You'
  const inA = match.teamA.player1 === me || match.teamA.player2 === me
  const labelA = [match.teamA.player1, match.teamA.player2].filter(Boolean).join(' & ')
  const labelB = [match.teamB.player1, match.teamB.player2].filter(Boolean).join(' & ')
  const isWin = match.winner === (inA ? 'A' : 'B')
  const date = new Date(match.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const sA = match.stats.A
  const sB = match.stats.B
  const total = match.rallies.length
  const done = total > 0 && replayIdx >= total   // never true when no shot data
  // Running replay stats
  const shown = match.rallies.slice(0, replayIdx)
  const rA = { w: 0, e: 0 }; const rB = { w: 0, e: 0 }
  shown.forEach(r => {
    const t = r.team === 'A' ? rA : rB
    if (r.type === 'winner' || r.type === 'ace') t.w++
    if (r.type === 'unforced_error' || r.type === 'double_fault') t.e++
  })
  const curSet = replayIdx > 0 ? (match.rallies[replayIdx - 1]?.setIndex ?? 0) : 0

  // PBP filtered rallies
  const pbpRallies = match.rallies.filter(r => activeSet === 'all' || r.setIndex === activeSet)

  return (
    <div style={{ fontFamily: '"DM Sans"', background: '#08090d', minHeight: '100%', paddingBottom: 96 }}>
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(9px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {/* ── Sticky header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px',
        background: 'rgba(8,9,13,0.97)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #1e2330',
      }}>
        <button onClick={() => navigate(-1)} style={{
          width: 32, height: 32, borderRadius: 8, border: '1px solid #252a38',
          background: '#0f1117', cursor: 'pointer', color: '#949cb4',
          fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>‹</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#e4e8f2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Match Replay</div>
          <div style={{ fontSize: 11, color: '#636b84' }}>{date}{match.venue ? ` · ${match.venue}` : ''}</div>
        </div>
        <div style={{
          padding: '4px 10px', borderRadius: 6, flexShrink: 0,
          background: isWin ? 'rgba(52,211,153,0.12)' : 'rgba(251,113,133,0.12)',
          border: `1px solid ${isWin ? 'rgba(52,211,153,0.3)' : 'rgba(251,113,133,0.3)'}`,
          color: isWin ? '#34d399' : '#fb7185', fontSize: 11, fontWeight: 800,
        }}>{isWin ? 'WIN' : 'LOSS'}</div>
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        {/* ── Match summary ── */}
        <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ flex: 1, textAlign: 'right', paddingRight: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: match.winner === 'A' ? '#e4e8f2' : '#636b84' }}>{labelA}</div>
            </div>
            <div style={{ fontSize: 11, color: '#636b84', fontWeight: 700, flexShrink: 0 }}>vs</div>
            <div style={{ flex: 1, paddingLeft: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: match.winner === 'B' ? '#e4e8f2' : '#636b84' }}>{labelB}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 10 }}>
            {match.sets.map((s, i) => {
              const aW = s[0] > s[1]
              return (
                <div key={i} style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #252a38' }}>
                  <div style={{ padding: '5px 11px', background: aW ? 'rgba(190,242,100,0.1)' : 'transparent' }}>
                    <span style={{ fontFamily: '"IBM Plex Mono"', fontSize: 15, fontWeight: 800, color: aW ? '#bef264' : '#636b84' }}>{s[0]}</span>
                  </div>
                  <div style={{ padding: '5px 0', background: '#0d0f14', display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#1e2330', width: 8, textAlign: 'center' }}>–</span>
                  </div>
                  <div style={{ padding: '5px 11px', background: !aW ? 'rgba(190,242,100,0.1)' : 'transparent' }}>
                    <span style={{ fontFamily: '"IBM Plex Mono"', fontSize: 15, fontWeight: 800, color: !aW ? '#bef264' : '#636b84' }}>{s[1]}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ fontSize: 11, color: '#636b84', textAlign: 'center' }}>
            {match.surface} · {match.scoringMode === 'golden_point' ? 'Golden Point' : 'Advantage'}{match.duration ? ` · ${match.duration}m` : ''}
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
          {([
            { label: 'Aces',        a: sA.aces,           b: sB.aces },
            { label: 'Winners',     a: sA.winners,        b: sB.winners },
            { label: 'Unforced E',  a: sA.unforcedErrors, b: sB.unforcedErrors },
            { label: 'Dbl Faults',  a: sA.doubleFaults,   b: sB.doubleFaults },
            { label: 'Smashes',     a: sA.smashes,        b: sB.smashes },
          ] as { label: string; a: number; b: number }[]).map((row, i, arr) => (
            <div key={row.label} style={{
              display: 'grid', gridTemplateColumns: '1fr auto 1fr',
              padding: '7px 14px', borderBottom: i < arr.length - 1 ? '1px solid #161922' : 'none',
            }}>
              <span style={{ fontFamily: '"IBM Plex Mono"', fontSize: 14, fontWeight: 700, textAlign: 'right', color: row.a > row.b ? '#bef264' : '#636b84' }}>{row.a}</span>
              <span style={{ fontSize: 10, color: '#636b84', textAlign: 'center', padding: '0 12px', alignSelf: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.label}</span>
              <span style={{ fontFamily: '"IBM Plex Mono"', fontSize: 14, fontWeight: 700, color: row.b > row.a ? '#bef264' : '#636b84' }}>{row.b}</span>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', padding: '6px 14px', background: '#161922' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#949cb4', textAlign: 'right' }}>{labelA}</span>
            <span style={{ width: 32 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#949cb4' }}>{labelB}</span>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div style={{ display: 'flex', background: '#0f1117', borderRadius: 10, padding: 3, marginBottom: 14, border: '1px solid #252a38' }}>
          {([['pbp', 'Play by Play'], ['replay', '▶ Live Replay'], ['coaching', 'Coaching']] as [View, string][]).map(([v, label]) => (
            <button key={v} onClick={() => setActiveView(v)} style={{
              flex: 1, padding: '8px 4px', borderRadius: 7, border: 'none', cursor: 'pointer',
              background: activeView === v ? '#252a38' : 'none',
              color: activeView === v ? '#e4e8f2' : '#636b84',
              fontSize: 11, fontWeight: 700, fontFamily: '"DM Sans"',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}>{label}</button>
          ))}
        </div>

        {/* ══════════ PLAY BY PLAY ══════════ */}
        {activeView === 'pbp' && (
          <>
            {match.sets.length > 1 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
                {(['all', ...match.sets.map((_, i) => i)] as Array<'all' | number>).map(key => {
                  const active = activeSet === key
                  return (
                    <button key={String(key)} onClick={() => setActiveSet(key)} style={{
                      flexShrink: 0, padding: '6px 14px', borderRadius: 7, cursor: 'pointer',
                      background: active ? '#bef264' : '#0f1117',
                      color: active ? '#08090d' : '#636b84',
                      border: active ? 'none' : '1px solid #252a38',
                      fontSize: 11, fontWeight: 700, fontFamily: '"DM Sans"',
                    }}>{key === 'all' ? 'All Sets' : `Set ${(key as number) + 1}`}</button>
                  )
                })}
              </div>
            )}
            {pbpRallies.length === 0 ? <EmptyShots /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {activeSet === 'all'
                  ? match.sets.map((score, si) => {
                      const sr = match.rallies.filter(r => r.setIndex === si)
                      if (!sr.length) return null
                      const offset = match.rallies.filter(r => r.setIndex < si).length
                      return (
                        <div key={si}>
                          <SetDivider setIndex={si} score={score} count={sr.length} />
                          {sr.map((r, i) => <div key={r.id} style={{ marginBottom: 5 }}><RallyRow rally={r} index={offset + i} isNew={false} /></div>)}
                        </div>
                      )
                    })
                  : pbpRallies.map((r, i) => <div key={r.id} style={{ marginBottom: 5 }}><RallyRow rally={r} index={i} isNew={false} /></div>)
                }
              </div>
            )}
          </>
        )}

        {/* ══════════ LIVE REPLAY ══════════ */}
        {activeView === 'replay' && (
          <div>
            {total === 0 ? <EmptyShots /> : (
              <>
                {/* Court animation */}
                <CourtAnimation
                  rally={replayIdx > 0 ? match.rallies[replayIdx - 1] : null}
                  animKey={replayIdx}
                  match={match}
                  speed={speed}
                />
                {/* Scoreboard */}
                <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ flex: 1, textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#e4e8f2', marginBottom: 3 }}>{labelA}</div>
                      <div style={{ fontFamily: '"IBM Plex Mono"', fontSize: 12 }}>
                        <span style={{ color: '#34d399' }}>{rA.w}▲ </span>
                        <span style={{ color: '#fb7185' }}>{rA.e}✕</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 60 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                        {done ? 'Full Time' : replayIdx === 0 ? 'Ready' : `Set ${curSet + 1}`}
                      </div>
                      <div style={{ fontFamily: '"IBM Plex Mono"', fontSize: 11, color: '#949cb4' }}>{replayIdx}/{total}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#e4e8f2', marginBottom: 3 }}>{labelB}</div>
                      <div style={{ fontFamily: '"IBM Plex Mono"', fontSize: 12 }}>
                        <span style={{ color: '#34d399' }}>{rB.w}▲ </span>
                        <span style={{ color: '#fb7185' }}>{rB.e}✕</span>
                      </div>
                    </div>
                  </div>
                  {/* Scrubber — drag to jump to any point */}
                  <input
                    type="range" min={0} max={total} value={replayIdx}
                    onChange={e => { setPlaying(false); setReplayIdx(Number(e.target.value)) }}
                    style={{ width: '100%', accentColor: '#bef264', cursor: 'pointer' }}
                  />
                </div>

                {/* Controls */}
                <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 12, padding: '14px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
                    {/* Reset */}
                    <button onClick={resetReplay} title="Reset" style={{ width: 38, height: 38, borderRadius: 8, border: '1px solid #252a38', background: '#161922', cursor: 'pointer', color: '#636b84', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↺</button>
                    {/* Step back */}
                    <button onClick={stepBack} disabled={replayIdx === 0} title="Previous shot" style={{ width: 38, height: 38, borderRadius: 8, border: '1px solid #252a38', background: '#161922', cursor: replayIdx === 0 ? 'default' : 'pointer', color: replayIdx === 0 ? '#252a38' : '#949cb4', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                    {/* Play / Pause */}
                    <button
                      onClick={() => done ? resetReplay() : setPlaying(p => !p)}
                      title={done ? 'Replay from start' : playing ? 'Pause' : 'Play'}
                      style={{
                        width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: done ? '#34d399' : playing ? '#fb7185' : '#bef264',
                        boxShadow: `0 4px 18px ${done ? 'rgba(52,211,153,0.35)' : playing ? 'rgba(251,113,133,0.35)' : 'rgba(190,242,100,0.35)'}`,
                        fontSize: 22, color: '#08090d', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.15s, box-shadow 0.15s',
                      }}
                    >{done ? '↺' : playing ? '⏸' : '▶'}</button>
                    {/* Step forward */}
                    <button onClick={stepFwd} disabled={done} title="Next shot" style={{ width: 38, height: 38, borderRadius: 8, border: '1px solid #252a38', background: '#161922', cursor: done ? 'default' : 'pointer', color: done ? '#252a38' : '#949cb4', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
                  </div>
                  {/* Speed */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, color: '#636b84', alignSelf: 'center', marginRight: 4 }}>Speed</span>
                    {SPEEDS.map(s => (
                      <button key={s} onClick={() => setSpeed(s)} style={{
                        padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                        background: speed === s ? '#252a38' : 'none',
                        color: speed === s ? '#bef264' : '#636b84',
                        fontSize: 11, fontWeight: 700, fontFamily: '"IBM Plex Mono"',
                      }}>{s === 0.5 ? '0.5×' : `${s}×`}</button>
                    ))}
                  </div>
                </div>

                {/* Replay timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {replayIdx === 0 && !playing && (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#636b84' }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>▶</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#949cb4', marginBottom: 4 }}>Press Play to start the replay</div>
                      <div style={{ fontSize: 12 }}>{total} shot{total !== 1 ? 's' : ''} recorded · or drag the slider above</div>
                    </div>
                  )}
                  {match.sets.map((score, si) => {
                    const sr = shown.filter(r => r.setIndex === si)
                    if (!sr.length) return null
                    const offset = match.rallies.filter(r => r.setIndex < si).length
                    return (
                      <div key={si}>
                        <SetDivider setIndex={si} score={score} />
                        {sr.map((r, i) => {
                          const gi = offset + i
                          const isNew = gi === replayIdx - 1
                          return (
                            <div key={r.id} ref={isNew ? lastRef : undefined} style={{ marginBottom: 5 }}>
                              <RallyRow rally={r} index={gi} isNew={isNew} />
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                  {done && (
                    <div style={{
                      margin: '10px 0', padding: 16, borderRadius: 12, textAlign: 'center',
                      background: isWin ? 'rgba(52,211,153,0.08)' : 'rgba(251,113,133,0.08)',
                      border: `1px solid ${isWin ? 'rgba(52,211,153,0.25)' : 'rgba(251,113,133,0.25)'}`,
                      animation: 'slideIn 0.4s ease-out',
                    }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{isWin ? '🏆' : '🎾'}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: isWin ? '#34d399' : '#fb7185', marginBottom: 4 }}>Match Complete</div>
                      <div style={{ fontFamily: '"IBM Plex Mono"', fontSize: 13, color: '#949cb4' }}>
                        {match.sets.map(s => `${s[0]}–${s[1]}`).join('  ')}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════ COACHING ══════════ */}
        {activeView === 'coaching' && <CoachingTab rallies={match.rallies} />}

        {/* Notes */}
        {match.notes && (
          <div style={{ marginTop: 14, background: '#0f1117', border: '1px solid #252a38', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Notes</div>
            <div style={{ fontSize: 13, color: '#949cb4', lineHeight: 1.5 }}>{match.notes}</div>
          </div>
        )}
      </div>
    </div>
  )
}
