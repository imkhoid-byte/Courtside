import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { useScore } from '../contexts/ScoreContext'
import { getCompletedMatches } from '../lib/db'
import type { Match } from '../lib/types'

function LiveBanner() {
  const { liveMatch } = useApp()
  const { state } = useScore()
  const navigate = useNavigate()

  if (!liveMatch || !state) return null

  return (
    <div
      onClick={() => navigate('/score')}
      style={{
        background: '#0f1117', border: '1px solid #252a38', borderRadius: 14,
        padding: '16px', marginBottom: 16, cursor: 'pointer',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Subtle lime glow */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #bef264, transparent)' }} />

      {/* LIVE badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#bef264' }} className="pulse-live" />
        <span style={{ fontSize: 11, fontWeight: 800, color: '#bef264', letterSpacing: '0.12em' }}>LIVE</span>
      </div>

      {/* Players + sets */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          {/* P1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            {state.server === 1 && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#bef264' }} />}
            <span style={{ fontSize: 15, fontWeight: 700, color: '#38bdf8' }}>{state.p1}</span>
          </div>
          {/* P2 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {state.server === 2 && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#bef264' }} />}
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fb7185' }}>{state.p2}</span>
          </div>
        </div>

        {/* Set scores */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {[...state.sets, state.currentSet].map((s, i) => {
            const isCurrent = i === state.sets.length
            return (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: '"IBM Plex Mono"', fontSize: 18, fontWeight: 700,
                  color: isCurrent ? '#38bdf8' : '#636b84',
                }}>
                  {s[0]}
                </div>
                <div style={{
                  fontFamily: '"IBM Plex Mono"', fontSize: 18, fontWeight: 700,
                  color: isCurrent ? '#fb7185' : '#636b84',
                }}>
                  {s[1]}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ width: 24, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <span style={{ color: '#636b84', fontSize: 14 }}>›</span>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color = '#bef264', progress }: {
  label: string; value: string; sub?: string; color?: string; progress?: number
}) {
  return (
    <div style={{
      background: '#0f1117', border: '1px solid #252a38', borderRadius: 14,
      padding: '14px', flex: 1,
    }}>
      <div style={{ fontSize: 11, color: '#636b84', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: '"DM Sans"', marginBottom: sub ? 2 : 0 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: '#636b84' }}>{sub}</div>}
      {progress !== undefined && (
        <div style={{ marginTop: 8, height: 3, background: '#252a38', borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${Math.min(100, progress)}%`, background: color, borderRadius: 2 }} />
        </div>
      )}
    </div>
  )
}

function MatchCard({ match, myName }: { match: Match; myName: string }) {
  const isWin = match.winner === (match.p1 === myName ? 1 : 2)
  const opponent = match.p1 === myName ? match.p2 : match.p1
  const date = new Date(match.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div style={{
      background: '#0f1117', border: '1px solid #252a38', borderRadius: 12,
      padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      {/* Win/Loss badge */}
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: isWin ? 'rgba(52,211,153,0.12)' : 'rgba(251,113,133,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${isWin ? 'rgba(52,211,153,0.3)' : 'rgba(251,113,133,0.3)'}`,
      }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: isWin ? '#34d399' : '#fb7185' }}>
          {isWin ? 'W' : 'L'}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#e4e8f2', marginBottom: 1 }}>
          vs {opponent}
        </div>
        <div style={{ fontSize: 11, color: '#636b84' }}>{date} · {match.surface}</div>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {match.sets.map((s, i) => (
          <span key={i} style={{
            fontFamily: '"IBM Plex Mono"', fontSize: 12, color: '#949cb4', fontWeight: 600,
          }}>
            {match.p1 === myName ? `${s[0]}-${s[1]}` : `${s[1]}-${s[0]}`}
            {i < match.sets.length - 1 && ' '}
          </span>
        ))}
      </div>
    </div>
  )
}

export function HomePage() {
  const { playerName } = useApp()
  const [completedMatches, setCompletedMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCompletedMatches().then(m => { setCompletedMatches(m); setLoading(false) })
  }, [])

  const myName = playerName || 'You'
  const myMatches = completedMatches

  // Stats
  const wins = myMatches.filter(m => {
    const isP1 = m.p1 === myName
    return m.winner === (isP1 ? 1 : 2)
  }).length
  const losses = myMatches.length - wins
  const winRate = myMatches.length ? Math.round((wins / myMatches.length) * 100) : 0
  const totalAces = myMatches.reduce((sum, m) => {
    const idx = m.p1 === myName ? 0 : 1
    return sum + m.stats[idx].aces
  }, 0)
  const totalWinners = myMatches.reduce((sum, m) => {
    const idx = m.p1 === myName ? 0 : 1
    return sum + m.stats[idx].winners
  }, 0)
  const acesPerMatch = myMatches.length ? (totalAces / myMatches.length).toFixed(1) : '0'
  const winnersPerMatch = myMatches.length ? (totalWinners / myMatches.length).toFixed(1) : '0'

  return (
    <div style={{ padding: '16px 16px 80px' }}>
      <LiveBanner />

      {/* Season Stats */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
          Season Stats
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <StatCard label="Win Rate" value={`${winRate}%`} color="#34d399" progress={winRate} />
          <StatCard label="Matches" value={String(myMatches.length)} sub={`${wins}W – ${losses}L`} color="#e4e8f2" />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <StatCard label="Aces" value={String(totalAces)} sub={`${acesPerMatch}/match`} color="#bef264" />
          <StatCard label="Winners" value={String(totalWinners)} sub={`${winnersPerMatch}/match`} color="#38bdf8" />
        </div>
      </div>

      {/* Recent Matches */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
          Recent Matches
        </div>

        {loading ? (
          <div style={{ color: '#636b84', fontSize: 14, padding: 16, textAlign: 'center' }}>Loading…</div>
        ) : myMatches.length === 0 ? (
          <div style={{
            background: '#0f1117', border: '1px solid #252a38', borderRadius: 14,
            padding: 32, textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎾</div>
            <div style={{ color: '#636b84', fontSize: 14 }}>No matches yet</div>
            <div style={{ color: '#636b84', fontSize: 12, marginTop: 4 }}>Tap + to start your first match</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myMatches.slice(0, 5).map(m => (
              <MatchCard key={m.id} match={m} myName={myName} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
