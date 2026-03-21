import { useState, useEffect } from 'react'
import { getCompletedMatches } from '../lib/db'
import type { Match } from '../lib/types'
import { useApp } from '../contexts/AppContext'

function MatchCard({ match, myName }: { match: Match; myName: string }) {
  const isP1 = match.p1 === myName
  const isWin = match.winner === (isP1 ? 1 : 2)
  const opponent = isP1 ? match.p2 : match.p1
  const date = new Date(match.startTime).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div style={{
      background: '#0f1117', border: '1px solid #252a38', borderRadius: 12,
      padding: '14px', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 8, flexShrink: 0,
        background: isWin ? 'rgba(52,211,153,0.1)' : 'rgba(251,113,133,0.1)',
        border: `1px solid ${isWin ? 'rgba(52,211,153,0.25)' : 'rgba(251,113,133,0.25)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: isWin ? '#34d399' : '#fb7185' }}>
          {isWin ? 'W' : 'L'}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e4e8f2', marginBottom: 2 }}>
          {myName} vs {opponent}
        </div>
        <div style={{ fontSize: 11, color: '#636b84' }}>{date} · {match.surface} · Bo{match.format}</div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {match.sets.map((s, i) => (
          <span key={i} style={{
            fontFamily: '"IBM Plex Mono"', fontSize: 13,
            color: '#949cb4', fontWeight: 600,
          }}>
            {isP1 ? `${s[0]}-${s[1]}` : `${s[1]}-${s[0]}`}
          </span>
        ))}
      </div>
    </div>
  )
}

export function HistoryPage() {
  const { playerName } = useApp()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCompletedMatches().then(m => { setMatches(m); setLoading(false) })
  }, [])

  const myName = playerName || 'You'

  return (
    <div style={{ padding: '16px 16px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#e4e8f2' }}>All Matches</h1>
        <span style={{ fontSize: 13, color: '#636b84', fontWeight: 600 }}>{matches.length} total</span>
      </div>

      {loading ? (
        <div style={{ color: '#636b84', fontSize: 14, padding: 32, textAlign: 'center' }}>Loading…</div>
      ) : matches.length === 0 ? (
        <div style={{
          background: '#0f1117', border: '1px solid #252a38', borderRadius: 14,
          padding: 48, textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎾</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#e4e8f2', marginBottom: 4 }}>No matches yet</div>
          <div style={{ fontSize: 13, color: '#636b84' }}>Complete a match to see it here</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {matches.map(m => (
            <MatchCard key={m.id} match={m} myName={myName} />
          ))}
        </div>
      )}
    </div>
  )
}
