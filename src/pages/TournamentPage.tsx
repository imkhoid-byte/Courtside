import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Tournament, PadelSurface, TournamentFormat } from '../lib/types'
import {
  saveTournament, getAllTournaments,
} from '../lib/db'
import { createTournament, applyCourtResult, getRankings, formatTournamentShare, recommendedRounds } from '../lib/tournament'
import { useI18n } from '../contexts/I18nContext'
import { useApp } from '../contexts/AppContext'
import { C, F } from '../lib/design'

// ─── Setup screen ─────────────────────────────────────────────────────────────

function TournamentSetup({ onStart }: { onStart: (t: Tournament) => void }) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [format, setFormat] = useState<TournamentFormat>('americano')
  const [players, setPlayers] = useState<string[]>(['', '', '', ''])
  const [surface, setSurface] = useState<PadelSurface>('Indoor')
  const [goldenPoint, setGoldenPoint] = useState(true)
  const [venue, setVenue] = useState('')
  const [customRounds, setCustomRounds] = useState<number | null>(null)
  const [numCourts, setNumCourts] = useState(1)

  const addPlayer = () => setPlayers(p => [...p, ''])
  const removePlayer = (i: number) => setPlayers(p => p.filter((_, idx) => idx !== i))
  const updatePlayer = (i: number, v: string) => setPlayers(p => p.map((x, idx) => idx === i ? v : x))

  const validPlayers = players.filter(p => p.trim())
  const numRounds = customRounds ?? recommendedRounds(validPlayers.length)

  const handleStart = () => {
    if (validPlayers.length < 4) return
    const tourney = createTournament({
      name,
      format,
      players: validPlayers,
      numRounds,
      courtsPerRound: numCourts,
      goldenPoint,
      surface,
      venue: venue || undefined,
    })
    onStart(tourney)
  }

  const toggle = (opts: string[], val: string, set: (v: string) => void) =>
    <div style={{ display: 'flex', gap: 6 }}>
      {opts.map(o => (
        <button key={o} onClick={() => set(o)} style={{
          flex: 1, padding: '9px 4px', borderRadius: 9, border: 'none',
          background: val === o ? '#a78bfa' : '#131428',
          color: val === o ? '#07070f' : '#7878a8',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>{o}</button>
      ))}
    </div>

  return (
    <div style={{ padding: '16px 16px 100px', overflowY: 'auto' }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#eeeeff', marginBottom: 20 }}>{t('newTournament')}</h2>

      {/* Format */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#7878a8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Format</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {(['americano', 'mexicano'] as TournamentFormat[]).map(f => (
            <button key={f} onClick={() => setFormat(f)} style={{
              flex: 1, padding: '14px', borderRadius: 12,
              border: `2px solid ${format === f ? '#a78bfa' : '#1e1e3c'}`,
              background: format === f ? 'rgba(167,139,250,0.08)' : '#0d0d1e',
              color: format === f ? '#a78bfa' : '#7878a8',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>
              <div>{f === 'americano' ? t('americano') : t('mexicano')}</div>
              <div style={{ fontSize: 10, marginTop: 3, opacity: 0.7 }}>
                {f === 'americano' ? 'Fixed schedule' : 'Dynamic pairings'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tournament name */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#7878a8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
          {t('tournamentName')}
        </div>
        <input
          value={name} onChange={e => setName(e.target.value)}
          placeholder={format === 'americano' ? 'Saturday Americano' : 'Club Mexicano'}
          style={{
            width: '100%', background: '#131428', border: '1px solid #252a38',
            borderRadius: 10, padding: '11px 14px', color: '#eeeeff',
            fontSize: 15, fontFamily: '"DM Sans"', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Players */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#7878a8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
          {t('players')} ({validPlayers.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {players.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              <input
                value={p}
                onChange={e => updatePlayer(i, e.target.value)}
                placeholder={`Player ${i + 1}`}
                style={{
                  flex: 1, background: '#131428', border: '1px solid #252a38',
                  borderRadius: 10, padding: '11px 14px', color: '#eeeeff',
                  fontSize: 15, fontFamily: '"DM Sans"', outline: 'none',
                }}
              />
              {players.length > 4 && (
                <button
                  onClick={() => removePlayer(i)}
                  style={{
                    width: 44, borderRadius: 10, border: '1px solid #252a38',
                    background: '#131428', color: '#f97316', cursor: 'pointer', fontSize: 18,
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        {players.length < 16 && (
          <button
            onClick={addPlayer}
            style={{
              width: '100%', marginTop: 8, padding: '10px', borderRadius: 10,
              border: '1px dashed #252a38', background: 'transparent',
              color: '#7878a8', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}
          >
            + {t('addPlayer')}
          </button>
        )}
      </div>

      {/* Rounds + Courts */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#7878a8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            {t('rounds')} (auto: {numRounds})
          </div>
          <input
            type="number" min={1} max={15}
            value={customRounds ?? ''}
            onChange={e => setCustomRounds(e.target.value ? Number(e.target.value) : null)}
            placeholder={String(numRounds)}
            style={{
              width: '100%', background: '#131428', border: '1px solid #252a38',
              borderRadius: 10, padding: '11px 14px', color: '#eeeeff',
              fontSize: 15, fontFamily: '"IBM Plex Mono"', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#7878a8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            {t('courts')}
          </div>
          <input
            type="number" min={1} max={8}
            value={numCourts}
            onChange={e => setNumCourts(Math.max(1, Number(e.target.value)))}
            style={{
              width: '100%', background: '#131428', border: '1px solid #252a38',
              borderRadius: 10, padding: '11px 14px', color: '#eeeeff',
              fontSize: 15, fontFamily: '"IBM Plex Mono"', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Surface */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#7878a8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Surface</div>
        {toggle(['Indoor', 'Outdoor', 'Covered'], surface, v => setSurface(v as PadelSurface))}
      </div>

      {/* Golden point */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#7878a8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Scoring</div>
        {toggle(['Golden Point', 'Advantage'], goldenPoint ? 'Golden Point' : 'Advantage', v => setGoldenPoint(v === 'Golden Point'))}
      </div>

      {/* Venue */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#7878a8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Venue (optional)</div>
        <input
          value={venue} onChange={e => setVenue(e.target.value)}
          placeholder="Club / Court name"
          style={{
            width: '100%', background: '#131428', border: '1px solid #252a38',
            borderRadius: 10, padding: '11px 14px', color: '#eeeeff',
            fontSize: 15, fontFamily: '"DM Sans"', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      <button
        onClick={handleStart}
        disabled={validPlayers.length < 4}
        style={{
          width: '100%', padding: '16px', borderRadius: 14, border: 'none',
          background: validPlayers.length >= 4 ? '#a78bfa' : '#1e1e3c',
          color: validPlayers.length >= 4 ? '#07070f' : '#7878a8',
          fontSize: 16, fontWeight: 800, cursor: validPlayers.length >= 4 ? 'pointer' : 'default',
        }}
      >
        {t('startTournament')} 🏆
      </button>
    </div>
  )
}

// ─── Score entry dialog ───────────────────────────────────────────────────────

function ScoreEntry({
  court, onSave, onClose,
}: {
  court: { teamA: [string, string]; teamB: [string, string]; courtNum: number }
  onSave: (a: number, b: number) => void
  onClose: () => void
}) {
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)

  const ScoreControl = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <button
        onClick={() => { if (value > 0) { onChange(value - 1); if (navigator.vibrate) navigator.vibrate(4) } }}
        style={{
          width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`,
          background: C.elevated, color: C.text2, fontSize: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: value === 0 ? 0.3 : 1,
        }}
      >–</button>
      <div style={{
        minWidth: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: F.mono, fontSize: 30, fontWeight: 700,
        color: value > 0 ? C.accentLight : C.text,
      }}>{value}</div>
      <button
        onClick={() => { onChange(value + 1); if (navigator.vibrate) navigator.vibrate(4) }}
        style={{
          width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`,
          background: C.elevated, color: C.text2, fontSize: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >+</button>
    </div>
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', background: C.surface, borderRadius: '20px 20px 0 0',
          padding: '20px 20px calc(env(safe-area-inset-bottom) + 20px)',
          border: `1px solid ${C.border}`, borderBottom: 'none',
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: C.border, margin: '0 auto 18px' }} />

        <div style={{ fontSize: 12, fontWeight: 700, color: C.text2, marginBottom: 16, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Court {court.courtNum} · Enter Score
        </div>

        {/* Team labels */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.teamA }}>{court.teamA[0]}</div>
            <div style={{ fontSize: 11, color: C.text2 }}>{court.teamA[1]}</div>
          </div>
          <div style={{ fontSize: 13, color: C.text3, width: 32, textAlign: 'center' }}>vs</div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.teamB }}>{court.teamB[0]}</div>
            <div style={{ fontSize: 11, color: C.text2 }}>{court.teamB[1]}</div>
          </div>
        </div>

        {/* Score controls */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <ScoreControl value={scoreA} onChange={setScoreA} />
          <div style={{ color: C.text3, fontSize: 20, width: 24, textAlign: 'center' }}>–</div>
          <ScoreControl value={scoreB} onChange={setScoreB} />
        </div>

        <button
          onClick={() => onSave(scoreA, scoreB)}
          style={{
            width: '100%', padding: '15px', borderRadius: 14, border: 'none',
            background: C.accent, color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
            boxShadow: `0 4px 16px ${C.accentDim}`,
          }}
        >
          Save Score
        </button>
      </motion.div>
    </div>
  )
}

// ─── Tournament detail ────────────────────────────────────────────────────────

function TournamentDetail({
  tournament, onUpdate,
}: {
  tournament: Tournament
  onUpdate: (t: Tournament) => void
}) {
  const { t } = useI18n()
  const { showToast } = useApp()
  const [tab, setTab] = useState<'schedule' | 'standings'>('schedule')
  const [editing, setEditing] = useState<{ roundNum: number; courtNum: number } | null>(null)

  const handleScore = async (scoreA: number, scoreB: number) => {
    if (!editing) return
    const updated = applyCourtResult(tournament, editing.roundNum, editing.courtNum, scoreA, scoreB)
    await saveTournament(updated)
    onUpdate(updated)
    setEditing(null)
    if (navigator.vibrate) navigator.vibrate(10)
  }

  const handleShare = async () => {
    const text = formatTournamentShare(tournament)
    if (navigator.share) {
      await navigator.share({ text, title: tournament.name || 'Padel Party Tournament' })
    } else {
      await navigator.clipboard.writeText(text)
      showToast(t('copied'))
    }
  }

  const rankings = getRankings(tournament)
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #252a38', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#eeeeff' }}>
            {tournament.name}
          </div>
          <div style={{ fontSize: 11, color: '#7878a8', marginTop: 2 }}>
            {tournament.format.charAt(0).toUpperCase() + tournament.format.slice(1)} · {tournament.players.length} players
            {tournament.status === 'complete' && ' · 🏆 Complete'}
          </div>
        </div>
        <button
          onClick={handleShare}
          style={{
            padding: '8px 14px', borderRadius: 9, border: '1px solid #252a38',
            background: '#131428', color: '#eeeeff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}
        >
          Share
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #252a38', flexShrink: 0 }}>
        {(['schedule', 'standings'] as const).map(tabKey => (
          <button key={tabKey} onClick={() => setTab(tabKey)} style={{
            flex: 1, padding: '11px', background: 'none', border: 'none',
            borderBottom: tab === tabKey ? '2px solid #a78bfa' : '2px solid transparent',
            color: tab === tabKey ? '#a78bfa' : '#7878a8',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: -1,
          }}>
            {tabKey === 'schedule' ? t('schedule') : t('leaderboard')}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 80px' }}>
        {tab === 'schedule' && tournament.rounds.map(round => (
          <div key={round.roundNum} style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: round.completed ? '#34d399' : '#7878a8',
              textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {t('roundOf')} {round.roundNum}
              {round.completed && <span style={{ color: '#34d399' }}>✓</span>}
            </div>
            {round.courts.map(court => (
              <div
                key={court.courtNum}
                onClick={() => !court.completed && setEditing({ roundNum: round.roundNum, courtNum: court.courtNum })}
                style={{
                  background: '#0d0d1e', border: `1px solid ${court.completed ? '#1e1e3c' : '#1e3a2e'}`,
                  borderRadius: 12, padding: '12px 14px', marginBottom: 8,
                  cursor: court.completed ? 'default' : 'pointer',
                }}
              >
                <div style={{ fontSize: 11, color: '#7878a8', marginBottom: 8 }}>Court {court.courtNum}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#eeeeff' }}>{court.teamA[0]}</div>
                    <div style={{ fontSize: 12, color: '#7878a8' }}>{court.teamA[1]}</div>
                  </div>
                  {court.completed ? (
                    <div style={{ fontFamily: '"IBM Plex Mono"', fontSize: 18, fontWeight: 700, color: '#a78bfa' }}>
                      {court.scoreA} – {court.scoreB}
                    </div>
                  ) : (
                    <div style={{
                      padding: '6px 12px', borderRadius: 8, background: '#1e3a2e',
                      color: '#34d399', fontSize: 12, fontWeight: 700,
                    }}>
                      + Score
                    </div>
                  )}
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#eeeeff' }}>{court.teamB[0]}</div>
                    <div style={{ fontSize: 12, color: '#7878a8' }}>{court.teamB[1]}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {tab === 'standings' && (
          <div>
            {tournament.status === 'complete' && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(167,139,250,0.05))',
                border: '1px solid rgba(251,191,36,0.25)',
                borderRadius: 14, padding: 16, marginBottom: 16, textAlign: 'center',
              }}>
                <div style={{ fontSize: 32, marginBottom: 4 }}>🏆</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fbbf24' }}>
                  {rankings[0]?.player}
                </div>
                <div style={{ fontSize: 13, color: '#7878a8', marginTop: 4 }}>
                  {rankings[0]?.score} pts · Tournament Winner
                </div>
              </div>
            )}
            {rankings.map((r, i) => (
              <div key={r.player} style={{
                background: '#0d0d1e', border: '1px solid #252a38', borderRadius: 12,
                padding: '12px 14px', marginBottom: 8,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: i < 3 ? 20 : 14, width: 28, textAlign: 'center' }}>
                  {i < 3 ? medals[i] : `#${r.rank}`}
                </span>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#eeeeff' }}>{r.player}</span>
                <span style={{ fontFamily: '"IBM Plex Mono"', fontSize: 18, fontWeight: 700, color: '#a78bfa' }}>
                  {r.score}
                </span>
                <span style={{ fontSize: 11, color: '#7878a8' }}>pts</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {editing && (
          <ScoreEntry
            court={
              tournament.rounds
                .find(r => r.roundNum === editing.roundNum)!
                .courts.find(c => c.courtNum === editing.courtNum)!
            }
            onSave={handleScore}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Tournament list ──────────────────────────────────────────────────────────

function TournamentList({ onSelect, onNew }: {
  onSelect: (t: Tournament) => void
  onNew: () => void
}) {
  const { t } = useI18n()
  const [tournaments, setTournaments] = useState<Tournament[]>([])

  useEffect(() => { getAllTournaments().then(setTournaments) }, [])

  return (
    <div style={{ padding: '16px 16px 100px', fontFamily: F.sans }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 23, fontWeight: 900, color: C.text, marginBottom: 3, letterSpacing: '-0.3px' }}>Tournaments</div>
        <div style={{ fontSize: 13, color: C.text2, marginBottom: 14 }}>Americano & Mexicano format</div>
        <button
          onClick={onNew}
          style={{
            width: '100%', padding: '13px', borderRadius: 12, border: 'none',
            background: `linear-gradient(135deg, ${C.accent}, ${C.party})`,
            color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
            boxShadow: `0 4px 16px ${C.party}30`,
          }}
        >
          🏆 {t('newTournament')}
        </button>
      </div>

      {tournaments.length === 0 ? (
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 16, padding: '48px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>No tournaments yet</div>
          <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.5 }}>
            Americano: fixed partner schedule<br />Mexicano: dynamic pairings based on standings
          </div>
        </div>
      ) : (
        tournaments.map(tour => {
          const rankings = getRankings(tour)
          return (
            <div
              key={tour.id}
              onClick={() => onSelect(tour)}
              style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
                padding: '14px 16px', marginBottom: 10, cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#eeeeff' }}>{tour.name}</div>
                  <div style={{ fontSize: 11, color: '#7878a8', marginTop: 2 }}>
                    {tour.format} · {tour.players.length} players · {tour.rounds.length} rounds
                  </div>
                </div>
                <div style={{
                  padding: '4px 10px', borderRadius: 6, height: 'fit-content',
                  background: tour.status === 'complete' ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)',
                  color: tour.status === 'complete' ? '#34d399' : '#fbbf24',
                  fontSize: 10, fontWeight: 700,
                }}>
                  {tour.status === 'complete' ? 'Done' : 'Active'}
                </div>
              </div>
              {rankings[0] && (
                <div style={{ fontSize: 12, color: '#7878a8' }}>
                  🥇 {rankings[0].player}: {rankings[0].score} pts
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

// ─── Main tournament page ─────────────────────────────────────────────────────

type View = 'list' | 'setup' | 'detail'

export function TournamentPage() {
  const [view, setView] = useState<View>('list')
  const [selected, setSelected] = useState<Tournament | null>(null)

  const handleStart = async (t: Tournament) => {
    await saveTournament(t)
    setSelected(t)
    setView('detail')
  }

  const handleSelect = (t: Tournament) => {
    setSelected(t)
    setView('detail')
  }

  const handleUpdate = (t: Tournament) => {
    setSelected(t)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {(view === 'setup' || view === 'detail') && (
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setView('list')}
            style={{
              width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`,
              background: C.surface, color: C.text2,
              cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >‹</button>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
            {view === 'setup' ? 'New Tournament' : 'Tournament'}
          </span>
        </div>
      )}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {view === 'list' && <TournamentList onSelect={handleSelect} onNew={() => setView('setup')} />}
        {view === 'setup' && <TournamentSetup onStart={handleStart} />}
        {view === 'detail' && selected && (
          <TournamentDetail tournament={selected} onUpdate={handleUpdate} />
        )}
      </div>
    </div>
  )
}
