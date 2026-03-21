import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { useScore } from '../contexts/ScoreContext'
import type { Match, MatchFormat, Surface } from '../lib/types'
import { createMatch } from '../lib/tennis'
import { saveMatch, getPref, setPref } from '../lib/db'
import { nanoid } from 'nanoid'

const FORMATS: { value: MatchFormat; label: string }[] = [
  { value: 3, label: 'Best of 3' },
  { value: 5, label: 'Best of 5' },
  { value: 1, label: '1 Set' },
]

const SURFACES: { value: Surface; label: string }[] = [
  { value: 'Hard', label: 'Hard' },
  { value: 'Clay', label: 'Clay' },
  { value: 'Grass', label: 'Grass' },
  { value: 'Indoor', label: 'Indoor' },
]

export function NewMatchModal() {
  const { newMatchOpen, setNewMatchOpen, playerName, setPlayerName } = useApp()
  const { startMatch } = useScore()
  const navigate = useNavigate()

  const [opponent, setOpponent] = useState('')
  const [format, setFormat] = useState<MatchFormat>(3)
  const [surface, setSurface] = useState<Surface>('Hard')

  useEffect(() => {
    if (newMatchOpen) {
      getPref('playerName').then(n => { if (n) setPlayerName(n) })
      getPref('lastOpponent').then(n => { if (n) setOpponent(n) })
    }
  }, [newMatchOpen, setPlayerName])

  const handleStart = async () => {
    const p1 = playerName.trim() || 'You'
    const p2 = opponent.trim() || 'Opponent'
    await setPref('playerName', p1)
    await setPref('lastOpponent', p2)
    setPlayerName(p1)

    const id = nanoid()
    const initial = createMatch(p1, p2, format, surface, id, 1)

    const match: Match = {
      id,
      p1,
      p2,
      format,
      surface,
      sets: [],
      winner: null,
      stats: [
        { aces: 0, doubleFaults: 0, winners: 0, unforcedErrors: 0 },
        { aces: 0, doubleFaults: 0, winners: 0, unforcedErrors: 0 },
      ],
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setNewMatchOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              zIndex: 100, backdropFilter: 'blur(4px)',
            }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#0f1117',
              borderTop: '1px solid #252a38',
              borderRadius: '20px 20px 0 0',
              zIndex: 101,
              paddingBottom: `calc(env(safe-area-inset-bottom) + 24px)`,
            }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 8 }}>
              <div style={{ width: 36, height: 4, background: '#252a38', borderRadius: 2 }} />
            </div>

            <div style={{ padding: '4px 20px 0' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#e4e8f2', marginBottom: 20 }}>
                New Match
              </h2>

              {/* Player Name */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#949cb4', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Your Name
                </label>
                <input
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  placeholder="Your name"
                  style={{
                    width: '100%', background: '#161922', border: '1px solid #252a38',
                    borderRadius: 10, padding: '12px 14px', color: '#e4e8f2',
                    fontSize: 16, fontFamily: '"DM Sans"', outline: 'none',
                  }}
                />
              </div>

              {/* Opponent */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#949cb4', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Opponent
                </label>
                <input
                  value={opponent}
                  onChange={e => setOpponent(e.target.value)}
                  placeholder="Opponent name"
                  style={{
                    width: '100%', background: '#161922', border: '1px solid #252a38',
                    borderRadius: 10, padding: '12px 14px', color: '#e4e8f2',
                    fontSize: 16, fontFamily: '"DM Sans"', outline: 'none',
                  }}
                />
              </div>

              {/* Format */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#949cb4', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Format
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {FORMATS.map(f => (
                    <button
                      key={f.value}
                      onClick={() => setFormat(f.value)}
                      style={{
                        flex: 1, padding: '10px 4px',
                        background: format === f.value ? '#bef264' : '#161922',
                        border: `1px solid ${format === f.value ? '#bef264' : '#252a38'}`,
                        borderRadius: 8, cursor: 'pointer',
                        color: format === f.value ? '#08090d' : '#949cb4',
                        fontSize: 13, fontWeight: 700, fontFamily: '"DM Sans"',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Surface */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#949cb4', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Surface
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {SURFACES.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setSurface(s.value)}
                      style={{
                        flex: 1, padding: '10px 4px',
                        background: surface === s.value ? '#bef264' : '#161922',
                        border: `1px solid ${surface === s.value ? '#bef264' : '#252a38'}`,
                        borderRadius: 8, cursor: 'pointer',
                        color: surface === s.value ? '#08090d' : '#949cb4',
                        fontSize: 13, fontWeight: 700, fontFamily: '"DM Sans"',
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start button */}
              <button
                onClick={handleStart}
                style={{
                  width: '100%', padding: '16px',
                  background: '#bef264', border: 'none',
                  borderRadius: 12, cursor: 'pointer',
                  color: '#08090d', fontSize: 16,
                  fontWeight: 800, fontFamily: '"DM Sans"',
                  letterSpacing: '-0.2px',
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
