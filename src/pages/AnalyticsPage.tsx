import { useState, useEffect, lazy, Suspense } from 'react'
import { getCompletedMatches, getAllPlayerRatings } from '../lib/db'
import type { Match, PlayerRating } from '../lib/types'
import { useApp } from '../contexts/AppContext'

// Lazy load recharts
const BarChart = lazy(() => import('recharts').then(m => ({ default: m.BarChart })))
const Bar = lazy(() => import('recharts').then(m => ({ default: m.Bar })))
const XAxis = lazy(() => import('recharts').then(m => ({ default: m.XAxis })))
const YAxis = lazy(() => import('recharts').then(m => ({ default: m.YAxis })))
const ResponsiveContainer = lazy(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })))
const PieChart = lazy(() => import('recharts').then(m => ({ default: m.PieChart })))
const Pie = lazy(() => import('recharts').then(m => ({ default: m.Pie })))
const Cell = lazy(() => import('recharts').then(m => ({ default: m.Cell })))
const Tooltip = lazy(() => import('recharts').then(m => ({ default: m.Tooltip })))

const DARK_CHART_STYLE = {
  background: 'transparent',
}

function ChartSkeleton({ height = 180 }: { height?: number }) {
  return (
    <div style={{ height, background: '#161922', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#636b84', fontSize: 13 }}>Loading chart…</span>
    </div>
  )
}

function OverviewTab({ matches, myName }: { matches: Match[]; myName: string }) {
  const myMatches = matches.filter(m =>
    m.teamA.player1 === myName || m.teamA.player2 === myName ||
    m.teamB.player1 === myName || m.teamB.player2 === myName
  )

  const getTeam = (m: Match) =>
    (m.teamA.player1 === myName || m.teamA.player2 === myName) ? 'A' : 'B'

  const winLossData = (() => {
    const byMonth: Record<string, { wins: number; losses: number }> = {}
    myMatches.forEach(m => {
      const key = new Date(m.startTime).toLocaleDateString('en-US', { month: 'short' })
      if (!byMonth[key]) byMonth[key] = { wins: 0, losses: 0 }
      const t = getTeam(m)
      if (m.winner === t) byMonth[key].wins++
      else byMonth[key].losses++
    })
    return Object.entries(byMonth).map(([name, v]) => ({ name, ...v }))
  })()

  const totalAces = myMatches.reduce((s, m) => s + m.stats[getTeam(m)].aces, 0)
  const totalSmashes = myMatches.reduce((s, m) => s + m.stats[getTeam(m)].smashes, 0)
  const totalUE = myMatches.reduce((s, m) => s + m.stats[getTeam(m)].unforcedErrors, 0)
  const totalDF = myMatches.reduce((s, m) => s + m.stats[getTeam(m)].doubleFaults, 0)

  const pieData = [
    { name: 'Aces', value: totalAces, color: '#bef264' },
    { name: 'Smashes', value: totalSmashes, color: '#38bdf8' },
    { name: 'UE', value: totalUE, color: '#fb7185' },
    { name: 'DF', value: totalDF, color: '#fbbf24' },
  ].filter(d => d.value > 0)

  // Best surface
  const surfaceWins: Record<string, { w: number; t: number }> = {}
  myMatches.forEach(m => {
    if (!surfaceWins[m.surface]) surfaceWins[m.surface] = { w: 0, t: 0 }
    surfaceWins[m.surface].t++
    if (m.winner === getTeam(m)) surfaceWins[m.surface].w++
  })
  const bestSurface = Object.entries(surfaceWins)
    .sort((a, b) => (b[1].w / b[1].t) - (a[1].w / a[1].t))[0]?.[0] || '—'

  const avg = (n: number) => myMatches.length ? (n / myMatches.length).toFixed(1) : '0'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Win/Loss bar chart */}
      <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#949cb4', marginBottom: 12 }}>Win / Loss by Month</div>
        {winLossData.length === 0 ? (
          <div style={{ color: '#636b84', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>No match data</div>
        ) : (
          <Suspense fallback={<ChartSkeleton />}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={winLossData} style={DARK_CHART_STYLE} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fill: '#636b84', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#161922', border: '1px solid #252a38', borderRadius: 8, color: '#e4e8f2', fontSize: 12 }} />
                <Bar dataKey="wins" fill="#34d399" radius={[4, 4, 0, 0]} name="Wins" />
                <Bar dataKey="losses" fill="#fb7185" radius={[4, 4, 0, 0]} name="Losses" />
              </BarChart>
            </ResponsiveContainer>
          </Suspense>
        )}
      </div>

      {/* Points donut */}
      {pieData.length > 0 && (
        <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#949cb4', marginBottom: 12 }}>Points Breakdown</div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Suspense fallback={<ChartSkeleton height={120} />}>
              <PieChart width={120} height={120}>
                <Pie data={pieData} cx={55} cy={55} innerRadius={30} outerRadius={52} dataKey="value" paddingAngle={3}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </Suspense>
            <div style={{ flex: 1 }}>
              {pieData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#949cb4', flex: 1 }}>{d.name}</span>
                  <span style={{ fontSize: 12, fontFamily: '"IBM Plex Mono"', color: '#e4e8f2', fontWeight: 600 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { label: 'Avg Aces/Match', value: avg(totalAces), color: '#bef264' },
          { label: 'Avg UE/Match', value: avg(totalUE), color: '#fb7185' },
          { label: 'Best Surface', value: bestSurface, color: '#38bdf8' },
          { label: 'Total Smashes', value: String(totalSmashes), color: '#34d399' },
        ].map(s => (
          <div key={s.label} style={{ flex: '1 0 40%', background: '#0f1117', border: '1px solid #252a38', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 10, color: '#636b84', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ShotAnalysisTab({ matches, myName }: { matches: Match[]; myName: string }) {
  const myMatches = matches.filter(m =>
    m.teamA.player1 === myName || m.teamA.player2 === myName ||
    m.teamB.player1 === myName || m.teamB.player2 === myName
  )

  const getTeam = (m: Match) =>
    (m.teamA.player1 === myName || m.teamA.player2 === myName) ? 'A' : 'B'

  // Only rallies involving my team
  const myRallies = myMatches.flatMap(m => {
    const t = getTeam(m)
    return m.rallies.filter(r => r.team === t)
  })

  if (myRallies.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: '#636b84' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎾</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#949cb4', marginBottom: 4 }}>No Shot Data</div>
        <div style={{ fontSize: 13 }}>Use the Shot Tracker during matches to see analysis here</div>
      </div>
    )
  }

  // Shot distribution
  const shotCounts: Record<string, number> = {}
  myRallies.forEach(r => {
    shotCounts[r.shot] = (shotCounts[r.shot] || 0) + 1
  })
  const shotData = Object.entries(shotCounts).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value,
  })).sort((a, b) => b.value - a.value)

  // Winners vs errors for padel power shots
  const padel_shots = ['smash', 'bajada', 'vibora', 'bandeja', 'wall_shot', 'lob', 'chiquita']
  const comparison = padel_shots.map(shot => ({
    name: shot.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    winners: myRallies.filter(r => r.shot === shot && r.type === 'winner').length,
    errors: myRallies.filter(r => r.shot === shot && r.type === 'unforced_error').length,
  })).filter(d => d.winners + d.errors > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#949cb4', marginBottom: 12 }}>Shot Distribution</div>
        <Suspense fallback={<ChartSkeleton height={200} />}>
          <ResponsiveContainer width="100%" height={Math.max(160, shotData.length * 28)}>
            <BarChart data={shotData} layout="vertical" style={DARK_CHART_STYLE}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" tick={{ fill: '#636b84', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={{ background: '#161922', border: '1px solid #252a38', borderRadius: 8, color: '#e4e8f2', fontSize: 12 }} />
              <Bar dataKey="value" fill="#bef264" radius={[0, 4, 4, 0]} name="Shots" />
            </BarChart>
          </ResponsiveContainer>
        </Suspense>
      </div>

      {comparison.length > 0 && (
        <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#949cb4', marginBottom: 12 }}>Winners vs Errors by Shot</div>
          <Suspense fallback={<ChartSkeleton />}>
            <ResponsiveContainer width="100%" height={Math.max(140, comparison.length * 32)}>
              <BarChart data={comparison} layout="vertical" style={DARK_CHART_STYLE}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fill: '#636b84', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={{ background: '#161922', border: '1px solid #252a38', borderRadius: 8, color: '#e4e8f2', fontSize: 12 }} />
                <Bar dataKey="winners" fill="#34d399" radius={[0, 4, 4, 0]} name="Winners" />
                <Bar dataKey="errors" fill="#fb7185" radius={[0, 4, 4, 0]} name="Errors" />
              </BarChart>
            </ResponsiveContainer>
          </Suspense>
        </div>
      )}
    </div>
  )
}

function HeadToHeadTab({ matches, myName }: { matches: Match[]; myName: string }) {
  const myMatches = matches.filter(m =>
    m.teamA.player1 === myName || m.teamA.player2 === myName ||
    m.teamB.player1 === myName || m.teamB.player2 === myName
  )

  // Group by opponent PAIR
  const oppPairs: Record<string, { wins: number; losses: number }> = {}
  myMatches.forEach(m => {
    const inA = m.teamA.player1 === myName || m.teamA.player2 === myName
    const opp1 = inA ? m.teamB.player1 : m.teamA.player1
    const opp2 = inA ? m.teamB.player2 : m.teamA.player2
    // Sort names for consistent key regardless of player order
    const pairKey = [opp1, opp2].sort().join(' & ')
    if (!oppPairs[pairKey]) oppPairs[pairKey] = { wins: 0, losses: 0 }
    const myTeam = inA ? 'A' : 'B'
    if (m.winner === myTeam) oppPairs[pairKey].wins++
    else oppPairs[pairKey].losses++
  })

  const sorted = Object.entries(oppPairs).sort((a, b) => (b[1].wins + b[1].losses) - (a[1].wins + a[1].losses))

  if (sorted.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: '#636b84' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🤝</div>
        <div style={{ fontSize: 14 }}>Play matches to see head-to-head records</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sorted.map(([pair, rec]) => {
        const total = rec.wins + rec.losses
        const winPct = Math.round((rec.wins / total) * 100)
        const favorable = winPct >= 50
        return (
          <div key={pair} style={{
            background: '#0f1117', border: '1px solid #252a38', borderRadius: 12,
            padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e4e8f2', flex: 1, marginRight: 8 }}>{pair}</span>
              <span style={{ fontFamily: '"IBM Plex Mono"', fontSize: 13, fontWeight: 600, color: favorable ? '#34d399' : '#fb7185', flexShrink: 0 }}>
                {rec.wins}–{rec.losses}
              </span>
            </div>
            <div style={{ height: 4, background: '#252a38', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${winPct}%`, background: favorable ? '#34d399' : '#fb7185', borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: 11, color: '#636b84', marginTop: 4 }}>{winPct}% win rate · {total} match{total !== 1 ? 'es' : ''}</div>
          </div>
        )
      })}
    </div>
  )
}

function PartnerChemistryTab({ matches, myName }: { matches: Match[]; myName: string }) {
  const myMatches = matches.filter(m =>
    m.teamA.player1 === myName || m.teamA.player2 === myName ||
    m.teamB.player1 === myName || m.teamB.player2 === myName
  )

  if (myMatches.length < 1) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: '#636b84' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🤜🤛</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#949cb4', marginBottom: 4 }}>No Partner Data Yet</div>
        <div style={{ fontSize: 13 }}>Play matches to see your partner chemistry</div>
      </div>
    )
  }

  // Collect partner stats
  const partnerStats: Record<string, { wins: number; total: number }> = {}
  myMatches.forEach(m => {
    const inA = m.teamA.player1 === myName || m.teamA.player2 === myName
    const partner = inA
      ? (m.teamA.player1 === myName ? m.teamA.player2 : m.teamA.player1)
      : (m.teamB.player1 === myName ? m.teamB.player2 : m.teamB.player1)
    if (!partnerStats[partner]) partnerStats[partner] = { wins: 0, total: 0 }
    partnerStats[partner].total++
    const myTeam = inA ? 'A' : 'B'
    if (m.winner === myTeam) partnerStats[partner].wins++
  })

  const sorted = Object.entries(partnerStats).sort((a, b) => b[1].total - a[1].total)

  // Best partner = highest win rate with 3+ matches (or just most wins if none qualify)
  const qualified = sorted.filter(([, s]) => s.total >= 3)
  const bestPartner = qualified.length > 0
    ? qualified.sort((a, b) => (b[1].wins / b[1].total) - (a[1].wins / a[1].total))[0]
    : sorted.sort((a, b) => (b[1].wins / b[1].total) - (a[1].wins / a[1].total))[0]

  const bestName = bestPartner?.[0]
  const bestStats = bestPartner?.[1]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Best Duo card */}
      {bestName && bestStats && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(52,211,153,0.08), rgba(190,242,100,0.04))',
          border: '1px solid rgba(52,211,153,0.3)',
          borderRadius: 14, padding: 16,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Best Duo
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'linear-gradient(135deg, #34d399, #bef264)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#08090d' }}>{bestName[0]?.toUpperCase()}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#e4e8f2', marginBottom: 2 }}>{myName} & {bestName}</div>
              <div style={{ fontSize: 12, color: '#636b84' }}>
                {bestStats.wins}W – {bestStats.total - bestStats.wins}L · {Math.round((bestStats.wins / bestStats.total) * 100)}% win rate
              </div>
            </div>
            <div style={{ fontFamily: '"IBM Plex Mono"', fontSize: 22, fontWeight: 800, color: '#34d399' }}>
              {Math.round((bestStats.wins / bestStats.total) * 100)}%
            </div>
          </div>
        </div>
      )}

      {/* Partner list */}
      <div style={{ fontSize: 10, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
        All Partners
      </div>
      {sorted.map(([partner, stats]) => {
        const winPct = Math.round((stats.wins / stats.total) * 100)
        const isBest = partner === bestName
        return (
          <div key={partner} style={{
            background: isBest ? 'rgba(52,211,153,0.05)' : '#0f1117',
            border: `1px solid ${isBest ? 'rgba(52,211,153,0.25)' : '#252a38'}`,
            borderRadius: 12, padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: isBest ? 'linear-gradient(135deg, #34d399, #bef264)' : '#252a38',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: isBest ? '#08090d' : '#636b84' }}>
                    {partner[0]?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#e4e8f2' }}>{partner}</div>
                  <div style={{ fontSize: 11, color: '#636b84' }}>{stats.total} match{stats.total !== 1 ? 'es' : ''}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: '"IBM Plex Mono"', fontSize: 15, fontWeight: 700, color: isBest ? '#34d399' : (winPct >= 50 ? '#e4e8f2' : '#636b84') }}>
                  {winPct}%
                </div>
                <div style={{ fontSize: 11, color: '#636b84' }}>{stats.wins}W–{stats.total - stats.wins}L</div>
              </div>
            </div>
            <div style={{ height: 3, background: '#252a38', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${winPct}%`, background: isBest ? '#34d399' : '#38bdf8', borderRadius: 2 }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RankingsTab() {
  const [ratings, setRatings] = useState<PlayerRating[]>([])
  const [loading, setLoading] = useState(true)
  const LineChart = lazy(() => import('recharts').then(m => ({ default: m.LineChart })))
  const Line = lazy(() => import('recharts').then(m => ({ default: m.Line })))
  const XAxis = lazy(() => import('recharts').then(m => ({ default: m.XAxis })))
  const YAxis = lazy(() => import('recharts').then(m => ({ default: m.YAxis })))
  const Tooltip = lazy(() => import('recharts').then(m => ({ default: m.Tooltip })))
  const ResponsiveContainerLazy = lazy(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })))

  useEffect(() => {
    getAllPlayerRatings().then(r => { setRatings(r); setLoading(false) })
  }, [])

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#636b84' }}>Loading…</div>

  if (ratings.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: '#636b84' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🏅</div>
        <div style={{ fontSize: 14 }}>Play matches to build your rating</div>
      </div>
    )
  }

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12, color: '#636b84', marginBottom: 4 }}>Player ELO ratings based on match history</div>
      {ratings.map((r, i) => {
        const winPct = r.matchCount > 0 ? Math.round((r.winCount / r.matchCount) * 100) : 0
        return (
          <div key={r.name} style={{
            background: '#0f1117', border: `1px solid ${i === 0 ? 'rgba(251,191,36,0.3)' : '#252a38'}`,
            borderRadius: 12, padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: i < 3 ? 20 : 13, width: 26, textAlign: 'center' }}>
                {i < 3 ? medals[i] : `#${i + 1}`}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#e4e8f2' }}>{r.name}</div>
                <div style={{ fontSize: 11, color: '#636b84' }}>{r.matchCount}M · {winPct}% win rate</div>
              </div>
              <div style={{ fontFamily: '"IBM Plex Mono"', fontSize: 22, fontWeight: 800, color: i === 0 ? '#fbbf24' : '#bef264' }}>
                {r.elo}
              </div>
            </div>
            {r.history.length > 1 && (
              <Suspense fallback={null}>
                <ResponsiveContainerLazy width="100%" height={40}>
                  <LineChart data={r.history.slice(-10)}>
                    <XAxis dataKey="date" hide />
                    <YAxis domain={['auto', 'auto']} hide />
                    <Tooltip contentStyle={{ background: '#161922', border: '1px solid #252a38', borderRadius: 6, color: '#e4e8f2', fontSize: 11 }} />
                    <Line type="monotone" dataKey="elo" stroke="#bef264" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainerLazy>
              </Suspense>
            )}
          </div>
        )
      })}
    </div>
  )
}

const TABS = ['Overview', 'Shot Analysis', 'Head to Head', 'Chemistry', 'Rankings'] as const
type Tab = typeof TABS[number]

export function AnalyticsPage() {
  const { myName } = useApp()
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCompletedMatches().then(m => { setMatches(m); setLoading(false) })
  }, [])

  const me = myName || 'You'

  return (
    <div style={{ fontFamily: '"DM Sans"' }}>
      {/* Sticky tab bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', overflowX: 'auto',
        borderBottom: '1px solid #252a38',
        background: 'rgba(8,9,13,0.97)', backdropFilter: 'blur(10px)',
        padding: '0 16px',
        scrollbarWidth: 'none',
      }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flexShrink: 0, padding: '12px 14px',
              background: 'none', border: 'none',
              borderBottom: activeTab === tab ? '2px solid #bef264' : '2px solid transparent',
              cursor: 'pointer',
              color: activeTab === tab ? '#bef264' : '#636b84',
              fontSize: 13, fontWeight: 600, fontFamily: '"DM Sans"',
              transition: 'color 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '16px 16px 96px' }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#636b84' }}>Loading…</div>
        ) : (
          <>
            {activeTab === 'Overview' && <OverviewTab matches={matches} myName={me} />}
            {activeTab === 'Shot Analysis' && <ShotAnalysisTab matches={matches} myName={me} />}
            {activeTab === 'Head to Head' && <HeadToHeadTab matches={matches} myName={me} />}
            {activeTab === 'Chemistry' && <PartnerChemistryTab matches={matches} myName={me} />}
            {activeTab === 'Rankings' && <RankingsTab />}
          </>
        )}
      </div>
    </div>
  )
}
