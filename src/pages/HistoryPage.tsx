import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCompletedMatches, getAllTournaments, deleteMatch } from '../lib/db'
import type { Match, Tournament } from '../lib/types'
import { useApp } from '../contexts/AppContext'
import { useI18n } from '../contexts/I18nContext'
import { getRankings } from '../lib/tournament'

// ─── Match card ───────────────────────────────────────────────────────────────

function MatchCard({
  match, myName, onDelete,
}: { match: Match; myName: string; onDelete: (id: string) => void }) {
  const navigate = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const inA = match.teamA.player1 === myName || match.teamA.player2 === myName
  const isWin = match.winner === (inA ? 'A' : 'B')
  const myPartner = inA
    ? (match.teamA.player1 === myName ? match.teamA.player2 : match.teamA.player1)
    : (match.teamB.player1 === myName ? match.teamB.player2 : match.teamB.player1)
  const opp1 = inA ? match.teamB.player1 : match.teamA.player1
  const opp2 = inA ? match.teamB.player2 : match.teamA.player2
  const date = new Date(match.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const setScores = match.sets.map(s => inA ? `${s[0]}-${s[1]}` : `${s[1]}-${s[0]}`)

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    const scoreLine = setScores.join(', ')
    const text = `${isWin ? '🏆 Win' : '❌ Loss'} — ${myName} & ${myPartner} vs ${opp1} & ${opp2}\n${scoreLine} · ${date}${match.venue ? ` · ${match.venue}` : ''}\n#SideCourt #Padel`
    if (navigator.share) navigator.share({ text }).catch(() => {})
    else navigator.clipboard?.writeText(text)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirmDelete(true)
  }

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(match.id)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => navigate(`/match/${match.id}`)}
        style={{
          background: '#0f1117', border: '1px solid #252a38',
          borderRadius: 12, padding: '12px 14px',
          display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer',
          transition: 'border-color 0.15s',
        }}
      >
        {/* W/L badge */}
        <div style={{
          width: 38, height: 38, borderRadius: 8, flexShrink: 0,
          background: isWin ? 'rgba(52,211,153,0.1)' : 'rgba(251,113,133,0.1)',
          border: `1px solid ${isWin ? 'rgba(52,211,153,0.25)' : 'rgba(251,113,133,0.25)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: isWin ? '#34d399' : '#fb7185' }}>{isWin ? 'W' : 'L'}</span>
        </div>

        {/* Match info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e4e8f2', marginBottom: 1 }}>
            {myName} & {myPartner || '—'}
          </div>
          <div style={{ fontSize: 11, color: '#636b84', marginBottom: 3 }}>
            vs {opp1} & {opp2 || '—'}
          </div>
          <div style={{ fontSize: 10, color: '#636b84' }}>
            {date}{match.venue ? ` · ${match.venue}` : ''} · {match.surface}
          </div>
        </div>

        {/* Scores + actions */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          {setScores.map((s, i) => (
            <span key={i} style={{ fontFamily: '"IBM Plex Mono"', fontSize: 13, color: '#949cb4', fontWeight: 600 }}>{s}</span>
          ))}
          <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
            <button
              onClick={handleShare}
              style={{ padding: '3px 7px', borderRadius: 5, border: '1px solid #252a38', background: '#161922', color: '#636b84', fontSize: 11, cursor: 'pointer' }}
              title="Share"
            >↗</button>
            <button
              onClick={handleDeleteClick}
              style={{ padding: '3px 7px', borderRadius: 5, border: '1px solid rgba(251,113,133,0.2)', background: 'rgba(251,113,133,0.06)', color: '#fb7185', fontSize: 11, cursor: 'pointer' }}
              title="Delete"
            >✕</button>
          </div>
        </div>
      </div>

      {/* Delete confirm overlay */}
      {confirmDelete && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', inset: 0, zIndex: 10, borderRadius: 12,
            background: 'rgba(8,9,13,0.96)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16,
          }}
        >
          <span style={{ fontSize: 12, color: '#e4e8f2', flex: 1 }}>Delete this match?</span>
          <button
            onClick={() => setConfirmDelete(false)}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #252a38', background: '#161922', color: '#949cb4', fontSize: 12, cursor: 'pointer' }}
          >Cancel</button>
          <button
            onClick={handleConfirmDelete}
            style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#fb7185', color: '#08090d', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >Delete</button>
        </div>
      )}
    </div>
  )
}

// ─── Tournament card ──────────────────────────────────────────────────────────

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

// ─── Main page ────────────────────────────────────────────────────────────────

export function HistoryPage() {
  const { myName } = useApp()
  const { t } = useI18n()
  const [tab, setTab] = useState<'matches' | 'tournaments'>('matches')
  const [matches, setMatches] = useState<Match[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses'>('all')

  const me = myName || 'You'

  useEffect(() => {
    Promise.all([getCompletedMatches(), getAllTournaments()]).then(([m, tourns]) => {
      setMatches(m)
      setTournaments(tourns)
      setLoading(false)
    })
  }, [])

  const handleDelete = async (id: string) => {
    await deleteMatch(id)
    setMatches(prev => prev.filter(m => m.id !== id))
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return matches.filter(m => {
      const inA = m.teamA.player1 === me || m.teamA.player2 === me
      const isWin = m.winner === (inA ? 'A' : 'B')

      if (filter === 'wins' && !isWin) return false
      if (filter === 'losses' && isWin) return false

      if (!q) return true
      const players = [m.teamA.player1, m.teamA.player2, m.teamB.player1, m.teamB.player2, m.venue ?? ''].join(' ').toLowerCase()
      return players.includes(q)
    })
  }, [matches, me, search, filter])

  return (
    <div style={{ fontFamily: '"DM Sans"' }}>
      {/* Sticky tab bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(8,9,13,0.97)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #252a38',
      }}>
        <div style={{ display: 'flex' }}>
          {(['matches', 'tournaments'] as const).map(tabKey => (
            <button key={tabKey} onClick={() => setTab(tabKey)} style={{
              flex: 1, padding: '12px', background: 'none', border: 'none',
              borderBottom: tab === tabKey ? '2px solid #bef264' : '2px solid transparent',
              color: tab === tabKey ? '#bef264' : '#636b84',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              {tabKey === 'matches' ? `Matches (${matches.length})` : `Tournaments (${tournaments.length})`}
            </button>
          ))}
        </div>

        {/* Search + filter row (matches only) */}
        {tab === 'matches' && (
          <div style={{ padding: '8px 12px 10px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8,
              background: '#0f1117', border: '1px solid #252a38', borderRadius: 9,
              padding: '8px 12px',
            }}>
              <span style={{ fontSize: 14, color: '#636b84' }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search player or venue…"
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: '#e4e8f2', fontSize: 13, fontFamily: '"DM Sans"',
                }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#636b84', cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>
              )}
            </div>
            {(['all', 'wins', 'losses'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
                background: filter === f ? (f === 'wins' ? 'rgba(52,211,153,0.12)' : f === 'losses' ? 'rgba(251,113,133,0.12)' : '#252a38') : '#0f1117',
                border: `1px solid ${filter === f ? (f === 'wins' ? 'rgba(52,211,153,0.3)' : f === 'losses' ? 'rgba(251,113,133,0.3)' : '#3a4055') : '#252a38'}`,
                color: filter === f ? (f === 'wins' ? '#34d399' : f === 'losses' ? '#fb7185' : '#e4e8f2') : '#636b84',
                fontSize: 11, fontWeight: 700,
              }}>
                {f === 'all' ? 'All' : f === 'wins' ? 'W' : 'L'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '12px 16px 96px' }}>
        {loading ? (
          <div style={{ color: '#636b84', fontSize: 14, padding: 32, textAlign: 'center' }}>{t('loading')}</div>
        ) : tab === 'matches' ? (
          filtered.length === 0 ? (
            <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{matches.length === 0 ? '🎾' : '🔍'}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#e4e8f2', marginBottom: 4 }}>
                {matches.length === 0 ? 'No matches yet' : 'No results'}
              </div>
              <div style={{ fontSize: 13, color: '#636b84' }}>
                {matches.length === 0 ? 'Complete a match to see it here' : 'Try a different search or filter'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.length !== matches.length && (
                <div style={{ fontSize: 11, color: '#636b84', paddingBottom: 4 }}>
                  Showing {filtered.length} of {matches.length} matches
                </div>
              )}
              {filtered.map(m => (
                <MatchCard key={m.id} match={m} myName={me} onDelete={handleDelete} />
              ))}
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
