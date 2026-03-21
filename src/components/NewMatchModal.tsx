import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { useScore } from '../contexts/ScoreContext'
import type { Match, PadelSurface, ScoringMode, CourtSide } from '../lib/types'
import { emptyStats, getDefaultServerOrder } from '../lib/types'
import { createPadelMatch } from '../lib/padel'
import { saveMatch, getPref, setPref, recordPlayerName, getRecentPlayerNames } from '../lib/db'
import { nanoid } from 'nanoid'

const SURFACES: { value: PadelSurface; label: string }[] = [
  { value: 'Indoor', label: 'Indoor' },
  { value: 'Outdoor', label: 'Outdoor' },
  { value: 'Covered', label: 'Covered' },
]

const SCORING_MODES: { value: ScoringMode; label: string; sub: string }[] = [
  { value: 'golden_point', label: 'Golden Point', sub: 'No ad, sudden death' },
  { value: 'advantage', label: 'Advantage', sub: 'Standard scoring' },
]

function PlayerInput({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  suggestions: string[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const filtered = suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s !== value)

  return (
    <div style={{ position: 'relative' }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#949cb4', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder ?? label}
        style={{
          width: '100%', background: '#161922', border: '1px solid #252a38',
          borderRadius: 10, padding: '11px 14px', color: '#e4e8f2',
          fontSize: 15, fontFamily: '"DM Sans"', outline: 'none',
        }}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
          background: '#161922', border: '1px solid #252a38', borderRadius: 8,
          marginTop: 2, maxHeight: 120, overflowY: 'auto',
          boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
        }}>
          {filtered.slice(0, 5).map(s => (
            <button
              key={s}
              onMouseDown={() => { onChange(s); setOpen(false) }}
              style={{
                width: '100%', padding: '9px 14px', background: 'none',
                border: 'none', cursor: 'pointer', color: '#e4e8f2',
                fontSize: 14, textAlign: 'left', fontFamily: '"DM Sans"',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ToggleGroup<T extends string>({
  label, options, value, onChange,
}: {
  label: string
  options: { value: T; label: string; sub?: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#949cb4', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {options.map(opt => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              style={{
                flex: 1, padding: opt.sub ? '8px 6px' : '11px 6px',
                background: active ? '#bef264' : '#161922',
                border: `1px solid ${active ? '#bef264' : '#252a38'}`,
                borderRadius: 8, cursor: 'pointer',
                color: active ? '#08090d' : '#636b84',
                fontSize: 12, fontWeight: 700, fontFamily: '"DM Sans"',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              }}
            >
              <span>{opt.label}</span>
              {opt.sub && <span style={{ fontSize: 9, fontWeight: 500, opacity: 0.7 }}>{opt.sub}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function NewMatchModal() {
  const { newMatchOpen, setNewMatchOpen, myName, setMyName } = useApp()
  const { startMatch } = useScore()
  const navigate = useNavigate()

  const [partner, setPartner] = useState('')
  const [opp1, setOpp1] = useState('')
  const [opp2, setOpp2] = useState('')
  const [surface, setSurface] = useState<PadelSurface>('Indoor')
  const [scoringMode, setScoringMode] = useState<ScoringMode>('golden_point')
  const [myPosition, setMyPosition] = useState<CourtSide>('right')
  const [venue, setVenue] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (!newMatchOpen) return
    getPref('myName').then(n => { if (n && !myName) setMyName(n) })
    getPref('defaultSurface').then(v => { if (v) setSurface(v as PadelSurface) })
    getPref('defaultScoring').then(v => { if (v) setScoringMode(v as ScoringMode) })
    getPref('defaultPosition').then(v => { if (v) setMyPosition(v as CourtSide) })
    getRecentPlayerNames().then(names => setSuggestions(names))
  }, [newMatchOpen, myName, setMyName])

  const handleStart = async () => {
    const me = myName.trim() || 'You'
    const p = partner.trim() || 'Partner'
    const o1 = opp1.trim() || 'Opp 1'
    const o2 = opp2.trim() || 'Opp 2'

    await setPref('myName', me)
    await setPref('defaultSurface', surface)
    await setPref('defaultScoring', scoringMode)
    await setPref('defaultPosition', myPosition)
    setMyName(me)

    for (const name of [me, p, o1, o2]) await recordPlayerName(name)

    const teamA = {
      player1: me,
      player2: p,
      side1: myPosition,
      side2: myPosition === 'left' ? 'right' as const : 'left' as const,
    }
    const teamB = { player1: o1, player2: o2, side1: 'left' as const, side2: 'right' as const }

    const id = nanoid()
    const initial = createPadelMatch(teamA, teamB, surface, scoringMode, id, venue || undefined)
    const serverOrder = getDefaultServerOrder(teamA, teamB)

    const match: Match = {
      id,
      teamA,
      teamB,
      surface,
      scoringMode,
      venue: venue || undefined,
      sets: [],
      winner: null,
      server: 1,
      serverOrder,
      stats: { A: emptyStats(), B: emptyStats() },
      rallies: [],
      startTime: new Date().toISOString(),
      status: 'live',
    }

    await saveMatch(match)
    startMatch(match, initial)
    setNewMatchOpen(false)
    navigate('/score')
  }

  return (
    <AnimatePresence>
      {newMatchOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setNewMatchOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 100, backdropFilter: 'blur(5px)' }}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              background: '#0f1117', borderTop: '1px solid #252a38',
              borderRadius: '20px 20px 0 0', zIndex: 101,
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
              maxHeight: '92dvh', overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 8 }}>
              <div style={{ width: 36, height: 4, background: '#252a38', borderRadius: 2 }} />
            </div>

            <div style={{ padding: '4px 20px 0' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#e4e8f2', marginBottom: 18 }}>New Match</h2>

              {/* Team A */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Your Team
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <PlayerInput label="Your Name" value={myName} onChange={setMyName} suggestions={suggestions} placeholder="Your name" />
                  <PlayerInput label="Your Partner" value={partner} onChange={setPartner} suggestions={suggestions} placeholder="Partner name" />
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#949cb4', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Position</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['left', 'right'] as CourtSide[]).map(pos => (
                      <button key={pos} onClick={() => setMyPosition(pos)} style={{
                        flex: 1, padding: '10px',
                        background: myPosition === pos ? '#38bdf8' : '#161922',
                        border: `1px solid ${myPosition === pos ? '#38bdf8' : '#252a38'}`,
                        borderRadius: 8, cursor: 'pointer',
                        color: myPosition === pos ? '#08090d' : '#636b84',
                        fontSize: 13, fontWeight: 700, textTransform: 'capitalize',
                      }}>
                        {pos} Side
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid #252a38', margin: '14px 0' }} />

              {/* Team B */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#fb7185', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Opponents
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <PlayerInput label="Opponent 1" value={opp1} onChange={setOpp1} suggestions={suggestions} placeholder="Opponent 1" />
                  <PlayerInput label="Opponent 2" value={opp2} onChange={setOpp2} suggestions={suggestions} placeholder="Opponent 2" />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #252a38', margin: '14px 0' }} />

              {/* Venue */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#949cb4', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Venue (optional)
                </label>
                <input
                  value={venue}
                  onChange={e => setVenue(e.target.value)}
                  placeholder="Club name or court"
                  style={{
                    width: '100%', background: '#161922', border: '1px solid #252a38',
                    borderRadius: 10, padding: '11px 14px', color: '#e4e8f2',
                    fontSize: 15, fontFamily: '"DM Sans"', outline: 'none',
                  }}
                />
              </div>

              <ToggleGroup label="Surface" options={SURFACES} value={surface} onChange={setSurface} />
              <ToggleGroup label="Scoring" options={SCORING_MODES} value={scoringMode} onChange={setScoringMode} />

              <button
                onClick={handleStart}
                style={{
                  width: '100%', padding: '16px',
                  background: '#bef264', border: 'none',
                  borderRadius: 12, cursor: 'pointer',
                  color: '#08090d', fontSize: 16,
                  fontWeight: 800, fontFamily: '"DM Sans"',
                  marginTop: 4,
                }}
              >
                Start Match →
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
