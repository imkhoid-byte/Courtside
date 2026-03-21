import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { useScore } from '../contexts/ScoreContext'
import { getCompletedMatches } from '../lib/db'
import type { Match } from '../lib/types'
import { useI18n } from '../contexts/I18nContext'

// ─── Streak calculation ───────────────────────────────────────────────────────

function calcStreak(matches: Match[], myName: string): { current: number; isWin: boolean; best: number } {
  const sorted = [...matches].sort((a, b) => b.startTime.localeCompare(a.startTime))
  let current = 0
  let isWin = true
  let best = 0
  let streak = 0

  for (const m of sorted) {
    const inA = m.teamA.player1 === myName || m.teamA.player2 === myName
    const won = m.winner === (inA ? 'A' : 'B')
    if (current === 0) { isWin = won; streak = 1; current = 1 }
    else if (won === isWin) { streak++; current = streak }
    else break
  }

  // Best win streak
  let runWins = 0
  for (const m of sorted) {
    const inA = m.teamA.player1 === myName || m.teamA.player2 === myName
    if (m.winner === (inA ? 'A' : 'B')) { runWins++; best = Math.max(best, runWins) }
    else runWins = 0
  }

  return { current, isWin, best }
}

// ─── Live banner ──────────────────────────────────────────────────────────────

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

// ─── Stat card ────────────────────────────────────────────────────────────────

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

// ─── Home Page ────────────────────────────────────────────────────────────────

export function HomePage() {
  const { myName } = useApp()
  const { t } = useI18n()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const touchStartY = useRef(0)

  const load = useCallback(async () => {
    const m = await getCompletedMatches()
    setMatches(m)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Pull-to-refresh
  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY }
  const handleTouchEnd = async (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (dy > 80 && !refreshing) {
      setRefreshing(true)
      await load()
      setRefreshing(false)
      if (navigator.vibrate) navigator.vibrate(10)
    }
  }

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
    const team = (m.teamA.player1 === me || m.teamA.player2 === me) ? 'A' : 'B'
    return s + m.stats[team].smashes
  }, 0)
  const totalAces = myMatches.reduce((s, m) => {
    const team = (m.teamA.player1 === me || m.teamA.player2 === me) ? 'A' : 'B'
    return s + m.stats[team].aces
  }, 0)
  const smPerMatch = myMatches.length ? (totalSmashes / myMatches.length).toFixed(1) : '0'
  const acesPerMatch = myMatches.length ? (totalAces / myMatches.length).toFixed(1) : '0'

  const streak = myName ? calcStreak(myMatches, me) : null

  return (
    <div
      style={{ padding: '16px 16px 80px' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {refreshing && (
        <div style={{ textAlign: 'center', marginBottom: 8, color: '#636b84', fontSize: 12 }}>
          Refreshing…
        </div>
      )}

      <LiveBanner />

      {/* Streak banner */}
      {streak && streak.current >= 2 && (
        <div style={{
          background: streak.isWin
            ? 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(190,242,100,0.05))'
            : 'linear-gradient(135deg, rgba(251,113,133,0.1), rgba(251,113,133,0.03))',
          border: `1px solid ${streak.isWin ? 'rgba(52,211,153,0.25)' : 'rgba(251,113,133,0.2)'}`,
          borderRadius: 14, padding: '12px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 24 }}>{streak.isWin ? '🔥' : '💪'}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: streak.isWin ? '#34d399' : '#fb7185' }}>
              {streak.current} match {streak.isWin ? t('winStreak') : t('loseStreak')}
            </div>
            <div style={{ fontSize: 11, color: '#636b84' }}>
              {t('bestStreak')}: {streak.best}W
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Season Stats</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <StatCard label={t('winRate')} value={`${winRate}%`} color="#34d399" progress={winRate} />
          <StatCard label={t('matches')} value={String(myMatches.length)} sub={`${wins}W – ${losses}L`} color="#e4e8f2" />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <StatCard label={t('acesMatch')} value={String(totalAces)} sub={`${acesPerMatch}/match`} color="#bef264" />
          <StatCard label={t('smashesMatch')} value={String(totalSmashes)} sub={`${smPerMatch}/match`} color="#38bdf8" />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>{t('recentMatches')}</div>
        {loading ? (
          <div style={{ color: '#636b84', fontSize: 14, padding: 16, textAlign: 'center' }}>{t('loading')}</div>
        ) : myMatches.length === 0 ? (
          <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎾</div>
            <div style={{ color: '#636b84', fontSize: 14 }}>{t('noMatches')}</div>
            <div style={{ color: '#636b84', fontSize: 12, marginTop: 4 }}>{t('startFirst')}</div>
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
