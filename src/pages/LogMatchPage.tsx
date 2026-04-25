import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import type { Match, PadelSurface, ScoringMode, Weather, TeamId } from '../lib/types'
import { emptyStats } from '../lib/types'
import {
  saveMatch, recordPlayerName, recordVenue, getPlayerSuggestions,
  getRecentVenues, getRecentTeams,
} from '../lib/db'
import type { PlayerSuggestion, RecentTeam } from '../lib/db'
import { setPref } from '../lib/db'
import { applyMatchElo } from '../lib/elo'
import { useApp } from '../contexts/AppContext'
import { useI18n } from '../contexts/I18nContext'

// ─── Autocomplete input ───────────────────────────────────────────────────────

function AutoInput({
  value, onChange, placeholder, suggestions, showStats = false,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  suggestions: PlayerSuggestion[]
  showStats?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [localSuggestions, setLocalSuggestions] = useState<PlayerSuggestion[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!value.trim()) {
      setLocalSuggestions(suggestions.slice(0, 6))
    } else {
      const q = value.toLowerCase()
      setLocalSuggestions(
        suggestions.filter(s => s.name.toLowerCase().includes(q)).slice(0, 6)
      )
    }
  }, [value, suggestions])

  const pick = (name: string) => {
    onChange(name)
    setOpen(false)
    if (navigator.vibrate) navigator.vibrate(8)
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        style={{
          width: '100%', background: '#161922', border: '1px solid #252a38',
          borderRadius: 10, padding: '11px 14px', color: '#e4e8f2',
          fontSize: 15, fontFamily: '"DM Sans"', outline: 'none', boxSizing: 'border-box',
        }}
      />
      {open && localSuggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: '#161922', border: '1px solid #252a38', borderRadius: 10,
          marginTop: 4, overflow: 'hidden',
        }}>
          {localSuggestions.map(s => (
            <button
              key={s.name}
              onMouseDown={() => pick(s.name)}
              style={{
                width: '100%', background: 'none', border: 'none',
                padding: '10px 14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid #1a1f2e',
              }}
            >
              <span style={{ color: '#e4e8f2', fontSize: 14, fontFamily: '"DM Sans"' }}>{s.name}</span>
              {showStats && s.matchCount > 0 && (
                <span style={{ color: '#636b84', fontSize: 11 }}>
                  {s.matchCount}M · {s.matchCount > 0 ? Math.round((s.winCount / s.matchCount) * 100) : 0}%
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function VenueInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const [venues, setVenues] = useState<string[]>([])

  useEffect(() => { getRecentVenues().then(setVenues) }, [])

  const filtered = venues.filter(v => !value || v.toLowerCase().includes(value.toLowerCase()))

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        style={{
          width: '100%', background: '#161922', border: '1px solid #252a38',
          borderRadius: 10, padding: '11px 14px', color: '#e4e8f2',
          fontSize: 15, fontFamily: '"DM Sans"', outline: 'none', boxSizing: 'border-box',
        }}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: '#161922', border: '1px solid #252a38', borderRadius: 10,
          marginTop: 4, overflow: 'hidden',
        }}>
          {filtered.slice(0, 5).map(v => (
            <button
              key={v}
              onMouseDown={() => { onChange(v); setOpen(false) }}
              style={{
                width: '100%', background: 'none', border: 'none',
                padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
                borderBottom: '1px solid #1a1f2e', color: '#e4e8f2',
                fontSize: 14, fontFamily: '"DM Sans"',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Set score input ──────────────────────────────────────────────────────────

function SetInput({ label, scoreA, scoreB, onChangeA, onChangeB }: {
  label: string
  scoreA: number; scoreB: number
  onChangeA: (n: number) => void; onChangeB: (n: number) => void
}) {
  const numStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, background: '#161922', border: `1px solid ${active ? '#bef264' : '#252a38'}`,
    borderRadius: 10, height: 48, display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', userSelect: 'none',
    fontSize: 22, fontFamily: '"IBM Plex Mono"', fontWeight: 700,
    color: active ? '#bef264' : '#e4e8f2',
  })

  const cycleA = () => { onChangeA((scoreA + 1) % 8); if (navigator.vibrate) navigator.vibrate(6) }
  const cycleB = () => { onChangeB((scoreB + 1) % 8); if (navigator.vibrate) navigator.vibrate(6) }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: '#636b84', fontWeight: 600, width: 38, textAlign: 'right' }}>{label}</span>
      <div
        onClick={cycleA}
        style={numStyle(scoreA > 0)}
      >
        {scoreA}
      </div>
      <span style={{ fontSize: 18, color: '#636b84', fontWeight: 300 }}>–</span>
      <div
        onClick={cycleB}
        style={numStyle(scoreB > 0)}
      >
        {scoreB}
      </div>
    </div>
  )
}

// ─── Toggle group ─────────────────────────────────────────────────────────────

function ToggleGroup<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            flex: 1, padding: '9px 4px', borderRadius: 9, border: 'none',
            background: value === opt.value ? '#bef264' : '#161922',
            color: value === opt.value ? '#08090d' : '#636b84',
            fontSize: 13, fontWeight: 700, fontFamily: '"DM Sans"', cursor: 'pointer',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: '#636b84',
      textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8,
    }}>
      {children}
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#0f1117', border: '1px solid #252a38', borderRadius: 14,
      padding: '14px 16px', marginBottom: 12, ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Determine winner from set scores ────────────────────────────────────────

function determineWinner(
  sets1: number[], sets2: number[]
): { winner: TeamId; finalSets: [number, number][] } | null {
  // sets1[i] = set i score for team A, sets2[i] = set i score for team B
  let winsA = 0, winsB = 0
  const finalSets: [number, number][] = []

  for (let i = 0; i < sets1.length; i++) {
    const a = sets1[i], b = sets2[i]
    if (a === 0 && b === 0) continue // empty set
    finalSets.push([a, b])
    if (a > b) winsA++
    else if (b > a) winsB++
  }

  if (finalSets.length === 0) return null
  if (winsA > winsB) return { winner: 'A', finalSets }
  if (winsB > winsA) return { winner: 'B', finalSets }
  return null // tied — invalid
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function LogMatchPage() {
  const navigate = useNavigate()
  const { myName, setMyName, showToast } = useApp()
  const { t } = useI18n()

  const [suggestions, setSuggestions] = useState<PlayerSuggestion[]>([])
  const [recentTeams, setRecentTeams] = useState<RecentTeam[]>([])

  // Team fields
  const [me, setMe] = useState(myName || '')
  const [partner, setPartner] = useState('')
  const [opp1, setOpp1] = useState('')
  const [opp2, setOpp2] = useState('')

  // Set scores [teamA, teamB] per set
  const [set1A, setSet1A] = useState(0)
  const [set1B, setSet1B] = useState(0)
  const [set2A, setSet2A] = useState(0)
  const [set2B, setSet2B] = useState(0)
  const [set3A, setSet3A] = useState(0)
  const [set3B, setSet3B] = useState(0)

  // Match options
  const [surface, setSurface] = useState<PadelSurface>('Indoor')
  const [scoring, setScoring] = useState<ScoringMode>('golden_point')
  const [venue, setVenue] = useState('')
  const [weather, setWeather] = useState<Weather | ''>('')
  const [notes, setNotes] = useState('')
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getPlayerSuggestions().then(setSuggestions)
    getRecentTeams().then(setRecentTeams)
  }, [])

  // Determine if set 3 should show (1-1 in sets)
  const set1Done = set1A !== set1B && (set1A > 0 || set1B > 0)
  const set2Done = set2A !== set2B && (set2A > 0 || set2B > 0)
  const sets1Won = set1Done ? (set1A > set1B ? 1 : 0) + (set2Done ? (set2A > set2B ? 1 : 0) : 0) : 0
  const sets2Won = set1Done ? (set1B > set1A ? 1 : 0) + (set2Done ? (set2B > set2A ? 1 : 0) : 0) : 0
  const showSet3 = set1Done && set2Done && sets1Won === 1 && sets2Won === 1

  const applyRecentTeam = useCallback((team: RecentTeam) => {
    setMe(team.player1)
    setPartner(team.player2)
    setOpp1(team.opp1)
    setOpp2(team.opp2)
    if (navigator.vibrate) navigator.vibrate(10)
  }, [])

  const handleSave = async () => {
    if (!me.trim() || !partner.trim() || !opp1.trim() || !opp2.trim()) {
      showToast('Enter all 4 player names')
      return
    }

    const result = determineWinner(
      [set1A, set2A, showSet3 ? set3A : 0],
      [set1B, set2B, showSet3 ? set3B : 0]
    )

    if (!result) {
      showToast('Enter valid set scores')
      return
    }

    setSaving(true)

    const now = new Date()
    const dateBase = new Date(matchDate)
    dateBase.setHours(now.getHours(), now.getMinutes(), 0, 0)
    const startTime = dateBase.toISOString()
    const endTime = startTime

    const match: Match = {
      id: nanoid(),
      teamA: { player1: me.trim(), player2: partner.trim(), side1: 'left', side2: 'right' },
      teamB: { player1: opp1.trim(), player2: opp2.trim(), side1: 'left', side2: 'right' },
      surface,
      scoringMode: scoring,
      venue: venue.trim() || undefined,
      sets: result.finalSets,
      winner: result.winner,
      server: 1,
      serverOrder: [me.trim(), opp1.trim(), partner.trim(), opp2.trim()],
      stats: { A: emptyStats(), B: emptyStats() },
      rallies: [],
      startTime,
      endTime,
      status: 'complete',
      notes: notes.trim() || undefined,
      weather: weather || undefined,
    }

    await saveMatch(match)

    // Record names + venue for autocomplete
    const wonA = result.winner === 'A'
    await Promise.all([
      recordPlayerName(me.trim(), wonA),
      recordPlayerName(partner.trim(), wonA),
      recordPlayerName(opp1.trim(), !wonA),
      recordPlayerName(opp2.trim(), !wonA),
      venue.trim() ? recordVenue(venue.trim()) : Promise.resolve(),
    ])

    // Save name preference
    if (me.trim()) {
      setMyName(me.trim())
      await setPref('myName', me.trim())
    }

    // Apply ELO
    await applyMatchElo(match)

    showToast(t('matchSaved'))
    navigate('/')
  }

  const surfaceOptions: { value: PadelSurface; label: string }[] = [
    { value: 'Indoor', label: t('indoor') },
    { value: 'Outdoor', label: t('outdoor') },
    { value: 'Covered', label: t('covered') },
  ]

  const scoringOptions: { value: ScoringMode; label: string }[] = [
    { value: 'golden_point', label: t('goldenPoint') },
    { value: 'advantage', label: t('advantage') },
  ]

  const weatherOptions: { value: Weather; label: string }[] = [
    { value: 'sunny', label: t('sunny') },
    { value: 'cloudy', label: t('cloudy') },
    { value: 'rainy', label: t('rainy') },
    { value: 'windy', label: t('windy') },
    { value: 'night', label: t('night') },
  ]

  return (
    <div style={{ padding: '16px 16px 100px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => navigate('/')}
          style={{
            width: 36, height: 36, borderRadius: '50%', background: '#161922',
            border: '1px solid #252a38', cursor: 'pointer', color: '#e4e8f2',
            fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#e4e8f2', margin: 0 }}>
          {t('logAMatch')}
        </h1>
      </div>

      {/* Recent Teams */}
      {recentTeams.length > 0 && (
        <Card>
          <Label>{t('recentTeams')}</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentTeams.map((team, i) => (
              <button
                key={i}
                onClick={() => applyRecentTeam(team)}
                style={{
                  background: '#161922', border: '1px solid #252a38', borderRadius: 10,
                  padding: '10px 12px', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e4e8f2' }}>
                  {team.player1} & {team.player2}
                </div>
                <div style={{ fontSize: 11, color: '#636b84', marginTop: 2 }}>
                  vs {team.opp1} & {team.opp2}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Your Team */}
      <Card>
        <Label>{t('yourTeam')}</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AutoInput
            value={me} onChange={setMe}
            placeholder={t('yourName')}
            suggestions={suggestions} showStats
          />
          <AutoInput
            value={partner} onChange={setPartner}
            placeholder={t('partner')}
            suggestions={suggestions} showStats
          />
        </div>
      </Card>

      {/* Opponents */}
      <Card>
        <Label>{t('opponents')}</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AutoInput
            value={opp1} onChange={setOpp1}
            placeholder={t('opponent1')}
            suggestions={suggestions} showStats
          />
          <AutoInput
            value={opp2} onChange={setOpp2}
            placeholder={t('opponent2')}
            suggestions={suggestions} showStats
          />
        </div>
      </Card>

      {/* Set Scores */}
      <Card>
        <Label>{t('setScores')}</Label>
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', marginBottom: 8 }}>
            <div style={{ width: 38 }} />
            <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#636b84', fontWeight: 700 }}>
              {me || 'Us'}
            </div>
            <div style={{ width: 24 }} />
            <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#636b84', fontWeight: 700 }}>
              {opp1 || 'Them'}
            </div>
          </div>
          <SetInput label="S1" scoreA={set1A} scoreB={set1B} onChangeA={setSet1A} onChangeB={setSet1B} />
          <SetInput label="S2" scoreA={set2A} scoreB={set2B} onChangeA={setSet2A} onChangeB={setSet2B} />
          {showSet3 && (
            <SetInput label="S3" scoreA={set3A} scoreB={set3B} onChangeA={setSet3A} onChangeB={setSet3B} />
          )}
        </div>
        <div style={{ fontSize: 11, color: '#636b84', marginTop: 4 }}>
          Tap a number to cycle 0–7 · Set 3 appears if tied 1–1
        </div>
      </Card>

      {/* Surface */}
      <Card>
        <Label>{t('surface')}</Label>
        <ToggleGroup options={surfaceOptions} value={surface} onChange={setSurface} />
      </Card>

      {/* Scoring */}
      <Card>
        <Label>{t('scoring')}</Label>
        <ToggleGroup options={scoringOptions} value={scoring} onChange={setScoring} />
      </Card>

      {/* Venue */}
      <Card>
        <Label>{t('venue')}</Label>
        <VenueInput value={venue} onChange={setVenue} placeholder={t('venuePlaceholder')} />
      </Card>

      {/* Date */}
      <Card>
        <Label>{t('date')}</Label>
        <input
          type="date"
          value={matchDate}
          max={new Date().toISOString().split('T')[0]}
          onChange={e => setMatchDate(e.target.value)}
          style={{
            width: '100%', background: '#161922', border: '1px solid #252a38',
            borderRadius: 10, padding: '11px 14px', color: '#e4e8f2',
            fontSize: 15, fontFamily: '"DM Sans"', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </Card>

      {/* Weather (outdoor only) */}
      {surface !== 'Indoor' && (
        <Card>
          <Label>{t('weather')}</Label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {weatherOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setWeather(weather === opt.value ? '' : opt.value)}
                style={{
                  padding: '7px 12px', borderRadius: 8, border: 'none',
                  background: weather === opt.value ? '#bef264' : '#161922',
                  color: weather === opt.value ? '#08090d' : '#636b84',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <Label>{t('notes')}</Label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder={t('notesPlaceholder')}
          rows={3}
          style={{
            width: '100%', background: '#161922', border: '1px solid #252a38',
            borderRadius: 10, padding: '11px 14px', color: '#e4e8f2',
            fontSize: 14, fontFamily: '"DM Sans"', outline: 'none', resize: 'none',
            boxSizing: 'border-box', lineHeight: 1.5,
          }}
        />
      </Card>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%', padding: '16px', borderRadius: 14, border: 'none',
          background: saving ? '#4a5568' : '#bef264',
          color: '#08090d', fontSize: 16, fontWeight: 800,
          cursor: saving ? 'default' : 'pointer', fontFamily: '"DM Sans"',
          marginTop: 4,
        }}
      >
        {saving ? t('saving') : t('saveMatch')}
      </button>
    </div>
  )
}
