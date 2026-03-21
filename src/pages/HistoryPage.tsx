import { useState, useEffect } from 'react'
import { getCompletedMatches, getAllTournaments } from '../lib/db'
import type { Match, Tournament } from '../lib/types'
import { useApp } from '../contexts/AppContext'
import { useI18n } from '../contexts/I18nContext'
import { getRankings } from '../lib/tournament'

function MatchCard({ match, myName }: { match: Match; myName: string }) {
  const inA = match.teamA.player1 === myName || match.teamA.player2 === myName
  const isWin = match.winner === (inA ? 'A' : 'B')
  const myPartner = inA
    ? (match.teamA.player1 === myName ? match.teamA.player2 : match.teamA.player1)
    : (match.teamB.player1 === myName ? match.teamB.player2 : match.teamB.player1)
  const opp1 = inA ? match.teamB.player1 : match.teamA.player1
  const opp2 = inA ? match.teamB.player2 : match.teamA.player2
  const date = new Date(match.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const setScores = match.sets.map(s => inA ? `${s[0]}-${s[1]}` : `${s[1]}-${s[0]}`)

  return (
    <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 12, padding: '14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 8, flexShrink: 0,
        background: isWin ? 'rgba(52,211,153,0.1)' : 'rgba(251,113,133,0.1)',
        border: `1px solid ${isWin ? 'rgba(52,211,153,0.25)' : 'rgba(251,113,133,0.25)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: isWin ? '#34d399' : '#fb7185' }}>{isWin ? 'W' : 'L'}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#e4e8f2', marginBottom: 2 }}>
          {myName} & {myPartner}
        </div>
        <div style={{ fontSize: 11, color: '#636b84', marginBottom: 4 }}>
          vs {opp1} & {opp2}
        </div>
        <div style={{ fontSize: 11, color: '#636b84' }}>
          {date}{match.venue ? ` · ${match.venue}` : ''} · {match.surface} · {match.scoringMode === 'golden_point' ? 'GP' : 'Ad'}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end', flexShrink: 0 }}>
        {setScores.map((s, i) => (
          <span key={i} style={{ fontFamily: '"IBM Plex Mono"', fontSize: 13, color: '#949cb4', fontWeight: 600 }}>{s}</span>
        ))}
      </div>
    </div>
  )
}

function TournamentCard({ tournament }: { tournament: Tournament }) {
  const rankings = getRankings(tournament)
  const top3 = rankings.slice(0, 3)
  const medals = ['🥇', '🥈', '🥉']
  const date = new Date(tournament.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 12, padding: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#e4e8f2' }}>{tournament.name}</div>
          <div style={{ fontSize: 11, color: '#636b84', marginTop: 2 }}>
            {tournament.format} · {tournament.players.length} players · {date}
          </div>
        </div>
        <div style={{
          padding: '3px 8px', borderRadius: 5, height: 'fit-content',
          background: tournament.status === 'complete' ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.12)',
          color: tournament.status === 'complete' ? '#34d399' : '#fbbf24',
          fontSize: 10, fontWeight: 700,
        }}>
          {tournament.status === 'complete' ? '✓ Done' : 'Active'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {top3.map((r, i) => (
          <div key={r.player} style={{ flex: 1, background: '#161922', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: 14 }}>{medals[i]}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#e4e8f2', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.player}</div>
            <div style={{ fontSize: 10, color: '#636b84' }}>{r.score} pts</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function HistoryPage() {
  const { myName } = useApp()
  const { t } = useI18n()
  const [tab, setTab] = useState<'matches' | 'tournaments'>('matches')
  const [matches, setMatches] = useState<Match[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getCompletedMatches(), getAllTournaments()]).then(([m, tourns]) => {
      setMatches(m)
      setTournaments(tourns)
      setLoading(false)
    })
  }, [])

  const me = myName || 'You'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #252a38', flexShrink: 0 }}>
        {(['matches', 'tournaments'] as const).map(tabKey => (
          <button key={tabKey} onClick={() => setTab(tabKey)} style={{
            flex: 1, padding: '12px', background: 'none', border: 'none',
            borderBottom: tab === tabKey ? '2px solid #bef264' : '2px solid transparent',
            color: tab === tabKey ? '#bef264' : '#636b84',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: -1,
          }}>
            {tabKey === 'matches' ? `Matches (${matches.length})` : `Tournaments (${tournaments.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 80px' }}>
        {loading ? (
          <div style={{ color: '#636b84', fontSize: 14, padding: 32, textAlign: 'center' }}>{t('loading')}</div>
        ) : tab === 'matches' ? (
          matches.length === 0 ? (
            <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎾</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#e4e8f2', marginBottom: 4 }}>No matches yet</div>
              <div style={{ fontSize: 13, color: '#636b84' }}>Complete a match to see it here</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {matches.map(m => <MatchCard key={m.id} match={m} myName={me} />)}
            </div>
          )
        ) : (
          tournaments.length === 0 ? (
            <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#e4e8f2', marginBottom: 4 }}>No tournaments yet</div>
              <div style={{ fontSize: 13, color: '#636b84' }}>Start an Americano or Mexicano!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tournaments.map(tour => <TournamentCard key={tour.id} tournament={tour} />)}
            </div>
          )
        )}
      </div>
    </div>
  )
}
