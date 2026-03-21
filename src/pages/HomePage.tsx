import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { useScore } from '../contexts/ScoreContext'
import { getCompletedMatches } from '../lib/db'
import type { Match } from '../lib/types'

// ─── Live banner ─────────────────────────────────────────────────────────────

function LiveBanner() {
  const { liveMatch } = useApp()
  const { state } = useScore()
  const navigate = useNavigate()
  if (!liveMatch || !state) return null

  const serverName = state.serverOrder[state.serverIndex]

  return (
    <div onClick={() => navigate('/score')} style={{
      background: '#0f1117', border: '1px solid #252a38', borderRadius: 14,
      padding: 16, marginBottom: 16, cursor: 'pointer', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #bef264, transparent)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#bef264' }} className="pulse-live" />
        <span style={{ fontSize: 11, fontWeight: 800, color: '#bef264', letterSpacing: '0.12em' }}>LIVE</span>
        <span style={{ fontSize: 11, color: '#636b84', marginLeft: 4 }}>Serving: <span style={{ color: '#bef264' }}>{serverName}</span></span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8', marginBottom: 3 }}>
            {state.teamA.player1} & {state.teamA.player2}
          </div>
          <div style={{ fontSize: 11, color: '#636b84', marginBottom: 6 }}>vs</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fb7185' }}>
            {state.teamB.player1} & {state.teamB.player2}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {[...state.sets, state.currentSet].map((s, i) => {
            const isCur = i === state.sets.length
            return (
              <div key={i} style={{ textAlign: 'center', minWidth: 22 }}>
                <div style={{ fontFamily: '"IBM Plex Mono"', fontSize: 17, fontWeight: 700, color: isCur ? '#38bdf8' : '#636b84' }}>{s[0]}</div>
                <div style={{ fontFamily: '"IBM Plex Mono"', fontSize: 17, fontWeight: 700, color: isCur ? '#fb7185' : '#636b84' }}>{s[1]}</div>
              </div>
            )
          })}
        </div>
        <div style={{ paddingLeft: 10, color: '#636b84' }}>›</div>
      </div>
    </div>
  )
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = '#bef264', progress }: {
  label: string; value: string; sub?: string; color?: string; progress?: number
}) {
  return (
    <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, padding: '14px', flex: 1 }}>
      <div style={{ fontSize: 10, color: '#636b84', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: '"DM Sans"', marginBottom: sub ? 2 : 0 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#636b84' }}>{sub}</div>}
      {progress !== undefined && (
        <div style={{ marginTop: 7, height: 3, background: '#252a38', borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${Math.min(100, progress)}%`, background: color, borderRadius: 2 }} />
        </div>
      )}
    </div>
  )
}

// ─── Match card ───────────────────────────────────────────────────────────────

function MatchCard({ match, myName }: { match: Match; myName: string }) {
  const inA = match.teamA.player1 === myName || match.teamA.player2 === myName
  const isWin = match.winner === (inA ? 'A' : 'B')
  const partner = inA
    ? (match.teamA.player1 === myName ? match.teamA.player2 : match.teamA.player1)
    : (match.teamB.player1 === myName ? match.teamB.player2 : match.teamB.player1)
  const opp1 = inA ? match.teamB.player1 : match.teamA.player1
  const opp2 = inA ? match.teamB.player2 : match.teamA.player2
  const date = new Date(match.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const setScores = match.sets.map(s => inA ? `${s[0]}-${s[1]}` : `${s[1]}-${s[0]}`)

  return (
    <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: isWin ? 'rgba(52,211,153,0.12)' : 'rgba(251,113,133,0.12)',
        border: `1px solid ${isWin ? 'rgba(52,211,153,0.3)' : 'rgba(251,113,133,0.3)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: isWin ? '#34d399' : '#fb7185' }}>{isWin ? 'W' : 'L'}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#e4e8f2', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {myName} & {partner} vs {opp1} & {opp2}
        </div>
        <div style={{ fontSize: 11, color: '#636b84' }}>{date}{match.venue ? ` · ${match.venue}` : ''}</div>
      </div>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {setScores.map((s, i) => (
          <span key={i} style={{ fontFamily: '"IBM Plex Mono"', fontSize: 12, color: '#949cb4', fontWeight: 600 }}>{s}{i < setScores.length - 1 ? ' ' : ''}</span>
        ))}
      </div>
    </div>
  )
}

// ─── Home Page ───────────────────────────────────────────────────────────────

export function HomePage() {
  const { myName } = useApp()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCompletedMatches().then(m => { setMatches(m); setLoading(false) })
  }, [])

  const me = myName || 'You'
  const myMatches = matches.filter(m =>
    m.teamA.player1 === me || m.teamA.player2 === me ||
    m.teamB.player1 === me || m.teamB.player2 === me
  )
  const wins = myMatches.filter(m => {
    const inA = m.teamA.player1 === me || m.teamA.player2 === me
    return m.winner === (inA ? 'A' : 'B')
  }).length
  const losses = myMatches.length - wins
  const winRate = myMatches.length ? Math.round((wins / myMatches.length) * 100) : 0
  const totalSmashes = myMatches.reduce((s, m) => {
    const t = (m.teamA.player1 === me || m.teamA.player2 === me) ? 'A' : 'B'
    return s + m.stats[t].smashes
  }, 0)
  const totalAces = myMatches.reduce((s, m) => {
    const t = (m.teamA.player1 === me || m.teamA.player2 === me) ? 'A' : 'B'
    return s + m.stats[t].aces
  }, 0)

  const smPerMatch = myMatches.length ? (totalSmashes / myMatches.length).toFixed(1) : '0'
  const acesPerMatch = myMatches.length ? (totalAces / myMatches.length).toFixed(1) : '0'

  return (
    <div style={{ padding: '16px 16px 80px' }}>
      <LiveBanner />

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Season Stats</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <StatCard label="Win Rate" value={`${winRate}%`} color="#34d399" progress={winRate} />
          <StatCard label="Matches" value={String(myMatches.length)} sub={`${wins}W – ${losses}L`} color="#e4e8f2" />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <StatCard label="Aces" value={String(totalAces)} sub={`${acesPerMatch}/match`} color="#bef264" />
          <StatCard label="Smashes" value={String(totalSmashes)} sub={`${smPerMatch}/match`} color="#38bdf8" />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Recent Matches</div>
        {loading ? (
          <div style={{ color: '#636b84', fontSize: 14, padding: 16, textAlign: 'center' }}>Loading…</div>
        ) : myMatches.length === 0 ? (
          <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎾</div>
            <div style={{ color: '#636b84', fontSize: 14 }}>No matches yet</div>
            <div style={{ color: '#636b84', fontSize: 12, marginTop: 4 }}>Tap + to start your first padel match</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myMatches.slice(0, 5).map(m => <MatchCard key={m.id} match={m} myName={me} />)}
          </div>
        )}
      </div>
    </div>
  )
}
