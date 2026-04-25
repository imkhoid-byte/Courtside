import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { useScore } from '../contexts/ScoreContext'
import { getCompletedMatches } from '../lib/db'
import type { Match } from '../lib/types'
import { useI18n } from '../contexts/I18nContext'
import { getTier, getTierProgress } from '../lib/achievements'
import { C, F } from '../lib/design'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcStreak(matches: Match[], myName: string): { current: number; isWin: boolean; best: number } {
  const sorted = [...matches].sort((a, b) => b.startTime.localeCompare(a.startTime))
  let current = 0
  let isWin = true
  let streak = 0
  let best = 0
  let runWins = 0

  for (const m of sorted) {
    const inA = m.teamA.player1 === myName || m.teamA.player2 === myName
    const won = m.winner === (inA ? 'A' : 'B')
    if (current === 0) { isWin = won; streak = 1; current = 1 }
    else if (won === isWin) { streak++; current = streak }
    else break
  }
  for (const m of sorted) {
    const inA = m.teamA.player1 === myName || m.teamA.player2 === myName
    if (m.winner === (inA ? 'A' : 'B')) { runWins++; best = Math.max(best, runWins) }
    else runWins = 0
  }
  return { current, isWin, best }
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

// ─── Live Match Banner ────────────────────────────────────────────────────────

function LiveBanner() {
  const { liveMatch } = useApp()
  const { state } = useScore()
  const navigate = useNavigate()
  if (!liveMatch || !state) return null

  return (
    <div
      onClick={() => navigate('/score')}
      style={{
        background: 'rgba(74,222,128,0.07)',
        border: `1px solid rgba(74,222,128,0.25)`,
        borderRadius: 16, padding: '14px 16px', cursor: 'pointer',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${C.win}, transparent)` }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div className="pulse-live" style={{ width: 6, height: 6, borderRadius: '50%', background: C.win }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: C.win, letterSpacing: '0.1em' }}>LIVE NOW</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Match in progress</div>
          <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>
            {state.teamA.player1} & {state.teamA.player2}
            <span style={{ color: C.text3 }}> vs </span>
            {state.teamB.player1} & {state.teamB.player2}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {[...state.sets, state.currentSet].map((s, i) => {
              const isCur = i === state.sets.length
              return (
                <div key={i} style={{ textAlign: 'center', minWidth: 20 }}>
                  <div style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 700, color: isCur ? C.teamA : C.text2 }}>{s[0]}</div>
                  <div style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 700, color: isCur ? C.teamB : C.text2 }}>{s[1]}</div>
                </div>
              )
            })}
          </div>
          <span style={{ fontSize: 12, color: C.accentLight, fontWeight: 600 }}>Resume →</span>
        </div>
      </div>
    </div>
  )
}

// ─── Quick Stat ───────────────────────────────────────────────────────────────

function QuickStat({ label, value, color = C.text }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      flex: 1, background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 14, padding: '14px 12px', textAlign: 'center',
    }}>
      <div style={{ fontFamily: F.mono, fontSize: 22, fontWeight: 700, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
    </div>
  )
}

// ─── Match Card ───────────────────────────────────────────────────────────────

function MatchCard({ match, myName }: { match: Match; myName: string }) {
  const navigate = useNavigate()
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
    <div
      onClick={() => navigate(`/match/${match.id}`)}
      style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 14, padding: '13px 14px',
        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: isWin ? C.winDim : C.lossDim,
        border: `1px solid ${isWin ? `${C.win}40` : `${C.loss}40`}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: isWin ? C.win : C.loss }}>
          {isWin ? 'W' : 'L'}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {myName} & {partner}
        </div>
        <div style={{ fontSize: 11, color: C.text2 }}>
          vs {opp1} & {opp2}
          {match.venue ? <span style={{ color: C.text3 }}> · {match.venue}</span> : ''}
        </div>
        <div style={{ fontSize: 10, color: C.text3, marginTop: 1 }}>{date}</div>
      </div>
      <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'center' }}>
        {setScores.map((s, i) => (
          <span key={i} style={{
            fontFamily: F.mono, fontSize: 13, fontWeight: 600,
            color: isWin ? C.win : C.text2,
          }}>{s}</span>
        ))}
        <span style={{ color: C.text3, fontSize: 14, marginLeft: 2 }}>›</span>
      </div>
    </div>
  )
}

// ─── Home Page ────────────────────────────────────────────────────────────────

export function HomePage() {
  const { myName, setNewMatchOpen } = useApp()
  const { t } = useI18n()
  const navigate = useNavigate()
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
  const winRate = myMatches.length ? Math.round((wins / myMatches.length) * 100) : 0

  const totalAces = myMatches.reduce((s, m) => {
    const team = (m.teamA.player1 === me || m.teamA.player2 === me) ? 'A' : 'B'
    return s + m.stats[team].aces
  }, 0)

  const streak = myName ? calcStreak(myMatches, me) : null

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const weekMatches = useMemo(
    () => myMatches.filter(m => new Date(m.startTime).getTime() >= weekAgo),
    [myMatches] // eslint-disable-line react-hooks/exhaustive-deps
  )
  const weekWins = weekMatches.filter(m => {
    const inA = m.teamA.player1 === me || m.teamA.player2 === me
    return m.winner === (inA ? 'A' : 'B')
  }).length

  const elo = myMatches.length >= 3 ? Math.round(1000 + (winRate - 50) * 4) : 1000
  const tier = getTier(elo)
  const tierPct = getTierProgress(elo)

  const firstName = me.split(' ')[0]

  return (
    <div
      style={{ padding: '12px 16px 96px', display: 'flex', flexDirection: 'column', gap: 12 }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {refreshing && (
        <div style={{ textAlign: 'center', fontSize: 12, color: C.text3 }}>Refreshing…</div>
      )}

      {/* ── Greeting ──────────────────────────────────────────────────────── */}
      <div style={{ paddingTop: 6, paddingBottom: 4 }}>
        <div style={{ fontSize: 12, color: C.text3, marginBottom: 3, letterSpacing: '0.02em' }}>
          {todayLabel()}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: '-0.5px', lineHeight: 1.15 }}>
          {greeting()}, {firstName} 👋
        </div>
        {weekMatches.length > 0 && (
          <div style={{ fontSize: 13, color: C.text2, marginTop: 4 }}>
            {weekMatches.length} match{weekMatches.length !== 1 ? 'es' : ''} this week
            {' '}· {weekWins}W {weekMatches.length - weekWins}L
          </div>
        )}
      </div>

      {/* ── Live banner ───────────────────────────────────────────────────── */}
      <LiveBanner />

      {/* ── Rating / Tier card ────────────────────────────────────────────── */}
      {myMatches.length >= 3 && (
        <div
          onClick={() => navigate('/me')}
          style={{
            background: C.surface, borderRadius: 16, padding: '14px 16px', cursor: 'pointer',
            border: `1px solid ${tier.color}33`,
            boxShadow: `0 0 24px ${tier.color}0d`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: `${tier.color}18`, border: `1px solid ${tier.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
            }}>{tier.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: tier.color }}>{tier.name}</span>
                <span style={{ fontFamily: F.mono, fontSize: 12, color: C.text2 }}>{elo} ELO</span>
              </div>
              <div style={{ height: 5, background: C.border, borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${tierPct}%`, background: tier.color, borderRadius: 3, transition: 'width 0.7s ease' }} />
              </div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>
                {100 - tierPct}% to next tier
              </div>
            </div>
            <span style={{ fontSize: 16, color: C.text3 }}>›</span>
          </div>
        </div>
      )}

      {/* ── Streak banner ────────────────────────────────────────────────── */}
      {streak && streak.current >= 2 && (
        <div style={{
          background: streak.isWin ? C.winDim : C.lossDim,
          border: `1px solid ${streak.isWin ? `${C.win}30` : `${C.loss}30`}`,
          borderRadius: 14, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 22 }}>{streak.isWin ? '🔥' : '💪'}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: streak.isWin ? C.win : C.loss }}>
              {streak.current} {streak.isWin ? 'win' : 'loss'} streak
            </div>
            <div style={{ fontSize: 11, color: C.text2 }}>Best: {streak.best}W in a row</div>
          </div>
        </div>
      )}

      {/* ── Quick stats ───────────────────────────────────────────────────── */}
      {myMatches.length > 0 && (
        <div style={{ display: 'flex', gap: 8 }}>
          <QuickStat label="Win Rate" value={`${winRate}%`} color={winRate >= 50 ? C.win : C.loss} />
          <QuickStat label="Matches"  value={String(myMatches.length)} />
          <QuickStat label="Aces"     value={String(totalAces)} color={C.accentLight} />
        </div>
      )}

      {/* ── Recent Matches ────────────────────────────────────────────────── */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
          {t('recentMatches')}
        </div>
        {loading ? (
          <div style={{ color: C.text3, fontSize: 14, padding: '20px 0', textAlign: 'center' }}>{t('loading')}</div>
        ) : myMatches.length === 0 ? (
          <EmptyState onLive={() => setNewMatchOpen(true)} onLog={() => navigate('/log')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myMatches.slice(0, 5).map(m => <MatchCard key={m.id} match={m} myName={me} />)}
            {myMatches.length > 5 && (
              <button
                onClick={() => navigate('/history')}
                style={{
                  padding: '11px', background: 'none',
                  border: `1px solid ${C.border}`, borderRadius: 12,
                  color: C.text2, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                View all {myMatches.length} matches →
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Rules banner ──────────────────────────────────────────────────── */}
      <div
        onClick={() => navigate('/rules')}
        style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: C.accentDim, border: `1px solid ${C.accent}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>
          🎓
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Learn Padel Rules</div>
          <div style={{ fontSize: 12, color: C.text2 }}>Scoring, tactics & tips for beginners</div>
        </div>
        <span style={{ fontSize: 16, color: C.text3 }}>›</span>
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onLive, onLog }: { onLive: () => void; onLog: () => void }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.accentDim}, rgba(56,189,248,0.06))`,
      border: `1px solid ${C.border}`,
      borderRadius: 16, padding: '28px 20px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 44, marginBottom: 12 }}>🎾</div>
      <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 8 }}>
        No matches yet
      </div>
      <div style={{ fontSize: 13, color: C.text2, marginBottom: 24, lineHeight: 1.6 }}>
        Track your first match — live during a game<br />or log it after. Takes 30 seconds.
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button
          onClick={onLive}
          style={{
            padding: '12px 22px', background: C.accent, border: 'none',
            borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', boxShadow: `0 4px 14px ${C.accentDim}`,
          }}
        >
          ▶ Live Match
        </button>
        <button
          onClick={onLog}
          style={{
            padding: '12px 22px', background: C.elevated,
            border: `1px solid ${C.border}`,
            borderRadius: 12, color: C.text, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          📋 Log Result
        </button>
      </div>
    </div>
  )
}
