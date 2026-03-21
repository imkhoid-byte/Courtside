import { useState, useEffect, lazy, Suspense } from 'react'
import { getCompletedMatches } from '../lib/db'
import type { Match } from '../lib/types'
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
const LineChart = lazy(() => import('recharts').then(m => ({ default: m.LineChart })))
const Line = lazy(() => import('recharts').then(m => ({ default: m.Line })))
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
  const winLossData = (() => {
    const byMonth: Record<string, { wins: number; losses: number }> = {}
    matches.forEach(m => {
      const key = new Date(m.startTime).toLocaleDateString('en-US', { month: 'short' })
      if (!byMonth[key]) byMonth[key] = { wins: 0, losses: 0 }
      const isP1 = m.p1 === myName
      if (m.winner === (isP1 ? 1 : 2)) byMonth[key].wins++
      else byMonth[key].losses++
    })
    return Object.entries(byMonth).map(([name, v]) => ({ name, ...v }))
  })()

  const totalAces = matches.reduce((s, m) => s + m.stats[m.p1 === myName ? 0 : 1].aces, 0)
  const totalWinners = matches.reduce((s, m) => s + m.stats[m.p1 === myName ? 0 : 1].winners, 0)
  const totalUE = matches.reduce((s, m) => s + m.stats[m.p1 === myName ? 0 : 1].unforcedErrors, 0)
  const totalDF = matches.reduce((s, m) => s + m.stats[m.p1 === myName ? 0 : 1].doubleFaults, 0)

  const pieData = [
    { name: 'Aces', value: totalAces, color: '#bef264' },
    { name: 'Winners', value: totalWinners, color: '#38bdf8' },
    { name: 'UE', value: totalUE, color: '#fb7185' },
    { name: 'DF', value: totalDF, color: '#fbbf24' },
  ].filter(d => d.value > 0)

  // Best surface
  const surfaceWins: Record<string, { w: number; t: number }> = {}
  matches.forEach(m => {
    if (!surfaceWins[m.surface]) surfaceWins[m.surface] = { w: 0, t: 0 }
    surfaceWins[m.surface].t++
    const isP1 = m.p1 === myName
    if (m.winner === (isP1 ? 1 : 2)) surfaceWins[m.surface].w++
  })
  const bestSurface = Object.entries(surfaceWins).sort((a, b) => (b[1].w / b[1].t) - (a[1].w / a[1].t))[0]?.[0] || '—'

  const avg = (n: number) => matches.length ? (n / matches.length).toFixed(1) : '0'

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
          { label: 'Total Winners', value: String(totalWinners), color: '#34d399' },
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

function ShotAnalysisTab({ matches }: { matches: Match[] }) {
  const allRallies = matches.flatMap(m => m.rallies)
  if (allRallies.length === 0) {
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
  allRallies.forEach(r => {
    shotCounts[r.shot] = (shotCounts[r.shot] || 0) + 1
  })
  const shotData = Object.entries(shotCounts).map(([name, value]) => ({
    name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value,
  })).sort((a, b) => b.value - a.value)

  // FH vs BH wins/errors
  const comparison = [
    {
      name: 'Forehand',
      winners: allRallies.filter(r => r.shot === 'forehand' && r.type === 'winner').length,
      errors: allRallies.filter(r => r.shot === 'forehand' && r.type === 'unforced_error').length,
    },
    {
      name: 'Backhand',
      winners: allRallies.filter(r => r.shot === 'backhand' && r.type === 'winner').length,
      errors: allRallies.filter(r => r.shot === 'backhand' && r.type === 'unforced_error').length,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#949cb4', marginBottom: 12 }}>Shot Distribution</div>
        <Suspense fallback={<ChartSkeleton />}>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={shotData} layout="vertical" style={DARK_CHART_STYLE}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" tick={{ fill: '#636b84', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ background: '#161922', border: '1px solid #252a38', borderRadius: 8, color: '#e4e8f2', fontSize: 12 }} />
              <Bar dataKey="value" fill="#bef264" radius={[0, 4, 4, 0]} name="Shots" />
            </BarChart>
          </ResponsiveContainer>
        </Suspense>
      </div>

      <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#949cb4', marginBottom: 12 }}>Winners vs Errors</div>
        <Suspense fallback={<ChartSkeleton />}>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={comparison} style={DARK_CHART_STYLE} barCategoryGap="30%">
              <XAxis dataKey="name" tick={{ fill: '#636b84', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: '#161922', border: '1px solid #252a38', borderRadius: 8, color: '#e4e8f2', fontSize: 12 }} />
              <Bar dataKey="winners" fill="#34d399" radius={[4, 4, 0, 0]} name="Winners" />
              <Bar dataKey="errors" fill="#fb7185" radius={[4, 4, 0, 0]} name="Errors" />
            </BarChart>
          </ResponsiveContainer>
        </Suspense>
      </div>
    </div>
  )
}

function HeadToHeadTab({ matches, myName }: { matches: Match[]; myName: string }) {
  const opponents: Record<string, { wins: number; losses: number }> = {}
  matches.forEach(m => {
    const opp = m.p1 === myName ? m.p2 : m.p1
    if (!opponents[opp]) opponents[opp] = { wins: 0, losses: 0 }
    const isP1 = m.p1 === myName
    if (m.winner === (isP1 ? 1 : 2)) opponents[opp].wins++
    else opponents[opp].losses++
  })

  const sorted = Object.entries(opponents).sort((a, b) => (b[1].wins + b[1].losses) - (a[1].wins + a[1].losses))

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
      {sorted.map(([opp, rec]) => {
        const total = rec.wins + rec.losses
        const winPct = Math.round((rec.wins / total) * 100)
        const favorable = winPct >= 50
        return (
          <div key={opp} style={{
            background: '#0f1117', border: '1px solid #252a38', borderRadius: 12,
            padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#e4e8f2' }}>{opp}</span>
              <span style={{ fontFamily: '"IBM Plex Mono"', fontSize: 13, fontWeight: 600, color: favorable ? '#34d399' : '#fb7185' }}>
                {rec.wins}–{rec.losses}
              </span>
            </div>
            <div style={{ height: 4, background: '#252a38', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${winPct}%`, background: favorable ? '#34d399' : '#fb7185', borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: 11, color: '#636b84', marginTop: 4 }}>{winPct}% win rate · {total} matches</div>
          </div>
        )
      })}
    </div>
  )
}

function TrendsTab({ matches, myName }: { matches: Match[]; myName: string }) {
  if (matches.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: '#636b84' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📈</div>
        <div style={{ fontSize: 14 }}>Need 2+ matches for trends</div>
      </div>
    )
  }

  // Cumulative win rate
  let wins = 0
  const winRateData = matches.map((m, i) => {
    const isP1 = m.p1 === myName
    if (m.winner === (isP1 ? 1 : 2)) wins++
    return {
      match: i + 1,
      winRate: Math.round((wins / (i + 1)) * 100),
    }
  })

  // Aces per match over time
  const acesData = matches.map((m, i) => {
    const idx = m.p1 === myName ? 0 : 1
    return { match: i + 1, aces: m.stats[idx].aces }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#949cb4', marginBottom: 12 }}>Win Rate Over Time</div>
        <Suspense fallback={<ChartSkeleton />}>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={winRateData} style={DARK_CHART_STYLE}>
              <XAxis dataKey="match" tick={{ fill: '#636b84', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Match #', position: 'insideBottom', fill: '#636b84', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#636b84', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ background: '#161922', border: '1px solid #252a38', borderRadius: 8, color: '#e4e8f2', fontSize: 12 }} />
              <Line type="monotone" dataKey="winRate" stroke="#34d399" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Suspense>
      </div>

      <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#949cb4', marginBottom: 12 }}>Aces Per Match</div>
        <Suspense fallback={<ChartSkeleton />}>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={acesData} style={DARK_CHART_STYLE}>
              <XAxis dataKey="match" tick={{ fill: '#636b84', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: '#161922', border: '1px solid #252a38', borderRadius: 8, color: '#e4e8f2', fontSize: 12 }} />
              <Bar dataKey="aces" fill="#bef264" radius={[4, 4, 0, 0]} name="Aces" />
            </BarChart>
          </ResponsiveContainer>
        </Suspense>
      </div>
    </div>
  )
}

const TABS = ['Overview', 'Shot Analysis', 'Head to Head', 'Trends'] as const
type Tab = typeof TABS[number]

export function AnalyticsPage() {
  const { playerName } = useApp()
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCompletedMatches().then(m => { setMatches(m); setLoading(false) })
  }, [])

  const myName = playerName || 'You'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 0, overflowX: 'auto',
        borderBottom: '1px solid #252a38',
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
              marginBottom: -1,
              transition: 'color 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 80px' }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#636b84' }}>Loading…</div>
        ) : (
          <>
            {activeTab === 'Overview' && <OverviewTab matches={matches} myName={myName} />}
            {activeTab === 'Shot Analysis' && <ShotAnalysisTab matches={matches} />}
            {activeTab === 'Head to Head' && <HeadToHeadTab matches={matches} myName={myName} />}
            {activeTab === 'Trends' && <TrendsTab matches={matches} myName={myName} />}
          </>
        )}
      </div>
    </div>
  )
}
