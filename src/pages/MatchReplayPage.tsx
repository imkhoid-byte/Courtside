import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMatch } from '../lib/db'
import { useApp } from '../contexts/AppContext'
import type { Match, RallyEvent } from '../lib/types'

const SHOT_LABELS: Record<string, string> = {
  forehand: 'Forehand',
  backhand: 'Backhand',
  serve: 'Serve',
  volley: 'Volley',
  smash: 'Smash',
  lob: 'Lob',
  bajada: 'Bajada',
  vibora: 'Víbora',
  bandeja: 'Bandeja',
  wall_shot: 'Wall Shot',
  chiquita: 'Chiquita',
}

const TYPE_CONFIG: Record<RallyEvent['type'], { label: string; color: string; bg: string }> = {
  ace:            { label: 'Ace',           color: '#bef264', bg: 'rgba(190,242,100,0.08)' },
  winner:         { label: 'Winner',        color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
  forced_error:   { label: 'Forced Error',  color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
  unforced_error: { label: 'Unforced Err',  color: '#fb7185', bg: 'rgba(251,113,133,0.08)' },
  double_fault:   { label: 'Double Fault',  color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
}

function RallyRow({ rally, index, teamANames, teamBNames }: {
  rally: RallyEvent
  index: number
  teamANames: string[]
  teamBNames: string[]
}) {
  const cfg = TYPE_CONFIG[rally.type]
  const isPositive = rally.type === 'ace' || rally.type === 'winner'
  const onMyTeam = teamANames.includes(rally.player) || teamBNames.includes(rally.player)
  void onMyTeam

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px',
      background: cfg.bg,
      borderRadius: 10,
      borderLeft: `3px solid ${cfg.color}`,
    }}>
      {/* Rally number */}
      <span style={{
        fontFamily: '"IBM Plex Mono"', fontSize: 10, color: '#636b84',
        flexShrink: 0, width: 22, textAlign: 'right',
      }}>
        {index + 1}
      </span>

      {/* Player */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#e4e8f2' }}>{rally.player}</span>
        <span style={{ fontSize: 12, color: '#636b84', marginLeft: 6 }}>
          {SHOT_LABELS[rally.shot] ?? rally.shot}
        </span>
      </div>

      {/* Type badge */}
      <span style={{
        fontSize: 10, fontWeight: 700, color: cfg.color,
        background: `rgba(${isPositive ? '52,211,153' : '251,113,133'},0.1)`,
        padding: '2px 7px', borderRadius: 5, flexShrink: 0, letterSpacing: '0.04em',
      }}>
        {cfg.label}
      </span>
    </div>
  )
}

function SetSummaryCard({ setIndex, setScore, teamALabel, teamBLabel }: {
  setIndex: number
  setScore: [number, number]
  teamALabel: string
  teamBLabel: string
}) {
  const aWon = setScore[0] > setScore[1]
  return (
    <div style={{
      background: '#0f1117', border: '1px solid #252a38', borderRadius: 12,
      padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', width: 40, flexShrink: 0 }}>
        Set {setIndex + 1}
      </span>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: aWon ? '#e4e8f2' : '#636b84', flex: 1, textAlign: 'right' }}>{teamALabel}</span>
        <span style={{ fontFamily: '"IBM Plex Mono"', fontSize: 17, fontWeight: 800, color: '#bef264' }}>
          {setScore[0]}–{setScore[1]}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: !aWon ? '#e4e8f2' : '#636b84', flex: 1 }}>{teamBLabel}</span>
      </div>
    </div>
  )
}

function CoachingInsights({ rallies }: { rallies: RallyEvent[] }) {
  if (rallies.length === 0) return null

  // Per-shot: wins vs errors
  const shotStats: Record<string, { wins: number; errors: number; total: number }> = {}
  rallies.forEach(r => {
    if (!shotStats[r.shot]) shotStats[r.shot] = { wins: 0, errors: 0, total: 0 }
    shotStats[r.shot].total++
    if (r.type === 'winner' || r.type === 'ace') shotStats[r.shot].wins++
    if (r.type === 'unforced_error' || r.type === 'double_fault') shotStats[r.shot].errors++
  })

  const shotEntries = Object.entries(shotStats).filter(([, s]) => s.total >= 2)
  if (shotEntries.length === 0) return null

  const bestShot = shotEntries
    .sort((a, b) => (b[1].wins / b[1].total) - (a[1].wins / a[1].total))[0]
  const worstShot = shotEntries
    .filter(([, s]) => s.errors > 0)
    .sort((a, b) => (b[1].errors / b[1].total) - (a[1].errors / a[1].total))[0]

  // Per-player wins/errors
  const playerStats: Record<string, { wins: number; errors: number; total: number }> = {}
  rallies.forEach(r => {
    if (!playerStats[r.player]) playerStats[r.player] = { wins: 0, errors: 0, total: 0 }
    playerStats[r.player].total++
    if (r.type === 'winner' || r.type === 'ace') playerStats[r.player].wins++
    if (r.type === 'unforced_error' || r.type === 'double_fault') playerStats[r.player].errors++
  })

  const playerEntries = Object.entries(playerStats).sort((a, b) => b[1].total - a[1].total)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Coaching Insights
      </div>

      {/* Key shots callouts */}
      <div style={{ display: 'flex', gap: 8 }}>
        {bestShot && (
          <div style={{ flex: 1, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Best Shot</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#e4e8f2' }}>{SHOT_LABELS[bestShot[0]] ?? bestShot[0]}</div>
            <div style={{ fontSize: 11, color: '#636b84', marginTop: 2 }}>{bestShot[1].wins}W / {bestShot[1].total} plays</div>
          </div>
        )}
        {worstShot && (
          <div style={{ flex: 1, background: 'rgba(251,113,133,0.06)', border: '1px solid rgba(251,113,133,0.2)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: '#fb7185', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Most Errors</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#e4e8f2' }}>{SHOT_LABELS[worstShot[0]] ?? worstShot[0]}</div>
            <div style={{ fontSize: 11, color: '#636b84', marginTop: 2 }}>{worstShot[1].errors} errors / {worstShot[1].total} plays</div>
          </div>
        )}
      </div>

      {/* Per-player breakdown */}
      <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #252a38', fontSize: 11, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Player Breakdown
        </div>
        {playerEntries.map(([player, s]) => {
          const winRate = s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0
          return (
            <div key={player} style={{ padding: '10px 14px', borderBottom: '1px solid #161922', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: '#252a38',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#636b84' }}>{player[0]?.toUpperCase()}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e4e8f2', marginBottom: 3 }}>{player}</div>
                <div style={{ height: 3, background: '#252a38', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${winRate}%`, background: winRate >= 50 ? '#34d399' : '#fb7185', borderRadius: 2 }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: '"IBM Plex Mono"', fontSize: 12, fontWeight: 700, color: '#bef264' }}>{s.wins}W {s.errors}E</div>
                <div style={{ fontSize: 10, color: '#636b84' }}>{s.total} shots</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function MatchReplayPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { myName } = useApp()
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSet, setActiveSet] = useState<number | 'all'>('all')
  const [activeView, setActiveView] = useState<'timeline' | 'insights'>('timeline')

  useEffect(() => {
    if (!id) return
    getMatch(id).then(m => {
      setMatch(m ?? null)
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#636b84', fontFamily: '"DM Sans"' }}>
        Loading…
      </div>
    )
  }

  if (!match) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#636b84', fontFamily: '"DM Sans"' }}>
        Match not found.
        <br />
        <button onClick={() => navigate(-1)} style={{ marginTop: 12, color: '#bef264', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
          Go back
        </button>
      </div>
    )
  }

  const me = myName || 'You'
  const inA = match.teamA.player1 === me || match.teamA.player2 === me
  const teamALabel = [match.teamA.player1, match.teamA.player2].filter(Boolean).join(' & ')
  const teamBLabel = [match.teamB.player1, match.teamB.player2].filter(Boolean).join(' & ')
  const myTeamLabel = inA ? teamALabel : teamBLabel
  const oppTeamLabel = inA ? teamBLabel : teamALabel
  const isWin = match.winner === (inA ? 'A' : 'B')
  const date = new Date(match.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const setScores = match.sets.map(s => inA ? s : ([s[1], s[0]] as [number, number]))
  const numSets = match.sets.length

  // Filter rallies by selected set
  const visibleRallies = match.rallies.filter(r =>
    activeSet === 'all' || r.setIndex === activeSet
  )

  // Team stats
  const statA = match.stats.A
  const statB = match.stats.B

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: '"DM Sans"' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', borderBottom: '1px solid #252a38', flexShrink: 0,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#949cb4', fontSize: 20, padding: 0, lineHeight: 1,
            display: 'flex', alignItems: 'center',
          }}
        >
          ‹
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#e4e8f2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Match Replay
          </div>
          <div style={{ fontSize: 11, color: '#636b84' }}>{date}{match.venue ? ` · ${match.venue}` : ''}</div>
        </div>
        <div style={{
          padding: '4px 10px', borderRadius: 6,
          background: isWin ? 'rgba(52,211,153,0.12)' : 'rgba(251,113,133,0.12)',
          color: isWin ? '#34d399' : '#fb7185',
          fontSize: 11, fontWeight: 800,
        }}>
          {isWin ? 'WIN' : 'LOSS'}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 80px' }}>
        {/* Match summary */}
        <div style={{
          background: '#0f1117', border: '1px solid #252a38', borderRadius: 14,
          padding: '14px 16px', marginBottom: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: match.winner === 'A' ? '#e4e8f2' : '#636b84' }}>{teamALabel}</div>
            </div>
            <div style={{ fontFamily: '"IBM Plex Mono"', fontSize: 11, color: '#636b84', fontWeight: 700, padding: '0 6px' }}>vs</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: match.winner === 'B' ? '#e4e8f2' : '#636b84' }}>{teamBLabel}</div>
            </div>
          </div>

          {/* Set scores */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {match.sets.map((s, i) => {
              const aWon = s[0] > s[1]
              return (
                <div key={i} style={{
                  display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden',
                  border: '1px solid #252a38', flexShrink: 0,
                }}>
                  <div style={{ padding: '5px 10px', background: aWon ? 'rgba(190,242,100,0.1)' : '#161922' }}>
                    <span style={{ fontFamily: '"IBM Plex Mono"', fontSize: 14, fontWeight: 800, color: aWon ? '#bef264' : '#636b84' }}>{s[0]}</span>
                  </div>
                  <div style={{ padding: '5px 4px', background: '#0d0f14', display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#252a38' }}>–</span>
                  </div>
                  <div style={{ padding: '5px 10px', background: !aWon ? 'rgba(190,242,100,0.1)' : '#161922' }}>
                    <span style={{ fontFamily: '"IBM Plex Mono"', fontSize: 14, fontWeight: 800, color: !aWon ? '#bef264' : '#636b84' }}>{s[1]}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Surface / mode */}
          <div style={{ fontSize: 11, color: '#636b84', textAlign: 'center', marginTop: 8 }}>
            {match.surface} · {match.scoringMode === 'golden_point' ? 'Golden Point' : 'Advantage'}
            {match.duration ? ` · ${match.duration}min` : ''}
          </div>
        </div>

        {/* Team stats strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 0,
          background: '#0f1117', border: '1px solid #252a38', borderRadius: 12,
          overflow: 'hidden', marginBottom: 14,
        }}>
          {[
            { label: 'Aces', a: statA.aces, b: statB.aces },
            { label: 'Winners', a: statA.winners, b: statB.winners },
            { label: 'Unforced E', a: statA.unforcedErrors, b: statB.unforcedErrors },
            { label: 'Dbl Faults', a: statA.doubleFaults, b: statB.doubleFaults },
            { label: 'Smashes', a: statA.smashes, b: statB.smashes },
          ].map((row, i) => (
            <div key={row.label} style={{
              gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr auto 1fr',
              padding: '7px 14px', borderBottom: i < 4 ? '1px solid #161922' : 'none',
            }}>
              <span style={{ fontFamily: '"IBM Plex Mono"', fontSize: 14, fontWeight: 700, color: row.a > row.b ? '#bef264' : '#636b84', textAlign: 'right' }}>{row.a}</span>
              <span style={{ fontSize: 10, color: '#636b84', textAlign: 'center', padding: '0 10px', alignSelf: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.label}</span>
              <span style={{ fontFamily: '"IBM Plex Mono"', fontSize: 14, fontWeight: 700, color: row.b > row.a ? '#bef264' : '#636b84' }}>{row.b}</span>
            </div>
          ))}
          {/* Team labels */}
          <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr auto 1fr', padding: '6px 14px', background: '#161922' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#949cb4', textAlign: 'right' }}>{teamALabel}</span>
            <span style={{ fontSize: 10, color: '#252a38', padding: '0 10px' }}>·</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#949cb4' }}>{teamBLabel}</span>
          </div>
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', background: '#0f1117', borderRadius: 10, padding: 3, marginBottom: 14, border: '1px solid #252a38' }}>
          {(['timeline', 'insights'] as const).map(v => (
            <button key={v} onClick={() => setActiveView(v)} style={{
              flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeView === v ? '#252a38' : 'none',
              color: activeView === v ? '#e4e8f2' : '#636b84',
              fontSize: 12, fontWeight: 700, fontFamily: '"DM Sans"',
              transition: 'all 0.15s',
            }}>
              {v === 'timeline' ? 'Play by Play' : 'Coaching'}
            </button>
          ))}
        </div>

        {activeView === 'timeline' ? (
          <>
            {/* Set filter tabs */}
            {numSets > 1 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
                <button
                  onClick={() => setActiveSet('all')}
                  style={{
                    flexShrink: 0, padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    background: activeSet === 'all' ? '#bef264' : '#0f1117',
                    color: activeSet === 'all' ? '#08090d' : '#636b84',
                    fontSize: 11, fontWeight: 700, fontFamily: '"DM Sans"',
                  }}
                >
                  All Sets
                </button>
                {match.sets.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSet(i)}
                    style={{
                      flexShrink: 0, padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                      background: activeSet === i ? '#bef264' : '#0f1117',
                      color: activeSet === i ? '#08090d' : '#636b84',
                      fontSize: 11, fontWeight: 700, fontFamily: '"DM Sans"',
                    }}
                  >
                    Set {i + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Set summary for active set */}
            {activeSet !== 'all' && (
              <SetSummaryCard
                setIndex={activeSet}
                setScore={setScores[activeSet]}
                teamALabel={myTeamLabel}
                teamBLabel={oppTeamLabel}
              />
            )}

            {/* Timeline */}
            {visibleRallies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#636b84' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎾</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#949cb4', marginBottom: 4 }}>No Shot Data</div>
                <div style={{ fontSize: 12 }}>Shot tracking wasn't used in this match</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 12 }}>
                {/* Group by set if showing all */}
                {activeSet === 'all'
                  ? match.sets.map((_, setIdx) => {
                    const setRallies = match.rallies.filter(r => r.setIndex === setIdx)
                    if (setRallies.length === 0) return null
                    let runningIdx = match.rallies.filter(r => r.setIndex < setIdx).length
                    return (
                      <div key={setIdx}>
                        <div style={{
                          fontSize: 10, fontWeight: 700, color: '#636b84',
                          textTransform: 'uppercase', letterSpacing: '0.07em',
                          margin: setIdx > 0 ? '12px 0 6px' : '0 0 6px',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                          <span>Set {setIdx + 1}</span>
                          <span style={{ color: '#252a38', fontWeight: 400 }}>·</span>
                          <span style={{ fontFamily: '"IBM Plex Mono"' }}>
                            {match.sets[setIdx][0]}–{match.sets[setIdx][1]}
                          </span>
                          <span style={{ flex: 1, height: 1, background: '#252a38', marginLeft: 4 }} />
                          <span>{setRallies.length} shots</span>
                        </div>
                        {setRallies.map((r, i) => (
                          <div key={r.id} style={{ marginBottom: 5 }}>
                            <RallyRow
                              rally={r}
                              index={runningIdx + i}
                              teamANames={[match.teamA.player1, match.teamA.player2]}
                              teamBNames={[match.teamB.player1, match.teamB.player2]}
                            />
                          </div>
                        ))}
                      </div>
                    )
                  })
                  : visibleRallies.map((r, i) => (
                    <RallyRow
                      key={r.id}
                      rally={r}
                      index={i}
                      teamANames={[match.teamA.player1, match.teamA.player2]}
                      teamBNames={[match.teamB.player1, match.teamB.player2]}
                    />
                  ))
                }
              </div>
            )}
          </>
        ) : (
          <CoachingInsights rallies={match.rallies} />
        )}

        {/* Notes */}
        {match.notes && (
          <div style={{
            marginTop: 14, background: '#0f1117', border: '1px solid #252a38',
            borderRadius: 12, padding: '12px 14px',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
              Notes
            </div>
            <div style={{ fontSize: 13, color: '#949cb4', lineHeight: 1.5 }}>{match.notes}</div>
          </div>
        )}
      </div>
    </div>
  )
}
