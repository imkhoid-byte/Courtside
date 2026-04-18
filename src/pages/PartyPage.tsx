import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { getRandomChallenge } from '../lib/party'
import type { Challenge, DrinkRule } from '../lib/party'

const PARTY_PINK = '#f472b6'
const PARTY_PURPLE = '#a855f7'
const PARTY_GRADIENT = `linear-gradient(135deg, ${PARTY_PINK}, ${PARTY_PURPLE})`

// ─── Drink counter card ────────────────────────────────────────────────────────

function DrinkCounter() {
  const { drinkCounts, addDrinks, resetDrinks } = useApp()
  const entries = Object.entries(drinkCounts).sort((a, b) => b[1] - a[1])

  if (entries.length === 0) {
    return (
      <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Drink Scoreboard</div>
        <div style={{ fontSize: 13, color: '#636b84', textAlign: 'center', padding: '12px 0' }}>
          Drink events will appear here during a match 🍺
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #252a38', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Drink Scoreboard</div>
        <button
          onClick={resetDrinks}
          style={{ fontSize: 10, color: PARTY_PINK, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
        >
          Reset
        </button>
      </div>
      {entries.map(([player, sips], i) => (
        <div key={player} style={{
          padding: '11px 14px', borderBottom: i < entries.length - 1 ? '1px solid #161922' : 'none',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: `${PARTY_PINK}18`, border: `1px solid ${PARTY_PINK}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: PARTY_PINK }}>{player[0]?.toUpperCase()}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e4e8f2' }}>{player}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => addDrinks(player, 1)}
              style={{ width: 26, height: 26, borderRadius: '50%', border: `1px solid ${PARTY_PINK}44`, background: 'none', color: PARTY_PINK, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >+</button>
            <div style={{ textAlign: 'center', minWidth: 40 }}>
              <div style={{ fontFamily: '"IBM Plex Mono"', fontSize: 18, fontWeight: 800, color: PARTY_PINK }}>{sips}</div>
              <div style={{ fontSize: 9, color: '#636b84' }}>sips</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Rule card ─────────────────────────────────────────────────────────────────

function RuleCard({ rule, onChange }: { rule: DrinkRule; onChange: (r: DrinkRule) => void }) {
  return (
    <div style={{
      background: rule.enabled ? `rgba(244,114,182,0.04)` : '#0f1117',
      border: `1px solid ${rule.enabled ? `${PARTY_PINK}33` : '#252a38'}`,
      borderRadius: 12, padding: '12px 14px',
      transition: 'all 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{rule.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: rule.enabled ? '#e4e8f2' : '#636b84', marginBottom: 2 }}>{rule.label}</div>
          <div style={{ fontSize: 11, color: '#636b84', lineHeight: 1.4 }}>{rule.description}</div>
          {rule.enabled && !rule.isFinish && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <span style={{ fontSize: 10, color: '#636b84' }}>Sips:</span>
              {[1, 2, 3].map(n => (
                <button
                  key={n}
                  onClick={() => onChange({ ...rule, sips: n })}
                  style={{
                    width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: rule.sips === n ? PARTY_PINK : '#252a38',
                    color: rule.sips === n ? '#08090d' : '#636b84',
                    fontSize: 11, fontWeight: 800,
                  }}
                >{n}</button>
              ))}
            </div>
          )}
          {rule.enabled && rule.isFinish && (
            <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(244,114,182,0.1)', borderRadius: 4, padding: '2px 8px' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: PARTY_PINK }}>FINISH DRINK</span>
            </div>
          )}
        </div>
        {/* Toggle */}
        <button
          onClick={() => onChange({ ...rule, enabled: !rule.enabled })}
          style={{
            width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', flexShrink: 0,
            background: rule.enabled ? PARTY_GRADIENT : '#252a38',
            position: 'relative', transition: 'background 0.2s',
          }}
        >
          <div style={{
            position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%',
            background: '#fff',
            left: rule.enabled ? 20 : 2,
            transition: 'left 0.2s',
          }} />
        </button>
      </div>
    </div>
  )
}

// ─── Challenge spinner ─────────────────────────────────────────────────────────

function ChallengeSpinner() {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [spinning, setSpinning] = useState(false)

  const spin = () => {
    if (spinning) return
    setSpinning(true)
    setChallenge(null)
    setTimeout(() => {
      setChallenge(getRandomChallenge())
      setSpinning(false)
      if (navigator.vibrate) navigator.vibrate([30, 50, 30])
    }, 600)
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Random Challenge</div>
      <button
        onClick={spin}
        style={{
          width: '100%', padding: '16px', borderRadius: 14, border: 'none', cursor: spinning ? 'default' : 'pointer',
          background: spinning ? '#161922' : PARTY_GRADIENT,
          color: spinning ? '#636b84' : '#fff',
          fontSize: 15, fontWeight: 800, fontFamily: '"DM Sans"',
          boxShadow: spinning ? 'none' : `0 4px 20px ${PARTY_PINK}44`,
          transition: 'all 0.2s', marginBottom: 10,
        }}
      >
        {spinning ? '🎲 Spinning…' : '🎲 Spin for a Challenge!'}
      </button>

      {challenge && !spinning && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(244,114,182,0.08), rgba(168,85,247,0.08))',
          border: `1px solid ${PARTY_PINK}44`,
          borderRadius: 14, padding: '16px',
          animation: 'partySlideIn 0.3s ease-out',
        }}>
          <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 8 }}>{challenge.emoji}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e4e8f2', textAlign: 'center', lineHeight: 1.5 }}>{challenge.text}</div>
          <div style={{
            marginTop: 10, textAlign: 'center',
            background: '#161922', borderRadius: 6, padding: '3px 0',
            display: 'inline-block', width: '100%',
          }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: PARTY_PURPLE, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {challenge.category}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Party mode toggle hero ────────────────────────────────────────────────────

function PartyModeHero() {
  const { partyMode, setPartyMode } = useApp()

  return (
    <div
      onClick={() => { setPartyMode(!partyMode); if (navigator.vibrate) navigator.vibrate(partyMode ? 10 : [10, 50, 20]) }}
      style={{
        background: partyMode
          ? 'linear-gradient(135deg, rgba(244,114,182,0.12), rgba(168,85,247,0.08))'
          : '#0f1117',
        border: `2px solid ${partyMode ? PARTY_PINK : '#252a38'}`,
        borderRadius: 18, padding: '20px', marginBottom: 16,
        cursor: 'pointer', transition: 'all 0.25s',
        boxShadow: partyMode ? `0 0 28px ${PARTY_PINK}22` : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, flexShrink: 0,
          background: partyMode ? PARTY_GRADIENT : '#161922',
          border: partyMode ? 'none' : `1px solid #252a38`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, transition: 'all 0.25s',
          boxShadow: partyMode ? `0 4px 16px ${PARTY_PINK}44` : 'none',
        }}>🎉</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: partyMode ? '#e4e8f2' : '#636b84', marginBottom: 3 }}>
            Party Mode
          </div>
          <div style={{ fontSize: 12, color: partyMode ? PARTY_PINK : '#636b84' }}>
            {partyMode ? 'Active — drink rules fire during match' : 'Tap to activate drink rules'}
          </div>
        </div>
        {/* Toggle switch */}
        <div style={{
          width: 52, height: 28, borderRadius: 14, flexShrink: 0,
          background: partyMode ? PARTY_GRADIENT : '#252a38',
          position: 'relative', transition: 'background 0.2s',
        }}>
          <div style={{
            position: 'absolute', top: 3, width: 22, height: 22, borderRadius: '50%', background: '#fff',
            left: partyMode ? 27 : 3, transition: 'left 0.2s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }} />
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function PartyPage() {
  const navigate = useNavigate()
  const { partyMode, partyRules, setPartyRules } = useApp()
  const [showRules, setShowRules] = useState(true)

  // Reset challenge when leaving
  useEffect(() => {}, [])

  const updateRule = (updated: DrinkRule) => {
    setPartyRules(partyRules.map(r => r.id === updated.id ? updated : r))
  }

  const activeCount = partyRules.filter(r => r.enabled).length

  return (
    <div style={{ fontFamily: '"DM Sans"' }}>
      <style>{`
        @keyframes partySlideIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes partyPulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
      `}</style>

      {/* Hero header */}
      <div style={{
        padding: '20px 16px 0',
        background: partyMode
          ? 'linear-gradient(180deg, rgba(244,114,182,0.06) 0%, transparent 100%)'
          : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#e4e8f2', marginBottom: 2 }}>
              Party Mode 🎉
            </div>
            <div style={{ fontSize: 12, color: '#636b84' }}>
              {partyMode ? (
                <span style={{ color: PARTY_PINK, animation: 'partyPulse 2s infinite' }}>
                  ● Active · {activeCount} rule{activeCount !== 1 ? 's' : ''} on
                </span>
              ) : 'Add drinking game rules to your padel match'}
            </div>
          </div>
        </div>

        {/* Age warning */}
        <div style={{
          background: 'rgba(99,107,132,0.08)', border: '1px solid #252a38',
          borderRadius: 10, padding: '8px 12px', marginBottom: 16,
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <span style={{ fontSize: 14 }}>🔞</span>
          <span style={{ fontSize: 11, color: '#636b84' }}>
            18+ only. Play responsibly. Never drink and drive. Know your limits.
          </span>
        </div>

        {/* Party mode toggle */}
        <PartyModeHero />

        {/* Drink scoreboard */}
        <DrinkCounter />

        {/* Challenge spinner */}
        <ChallengeSpinner />

        {/* Rules section */}
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setShowRules(s => !s)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 10px',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Drink Rules ({activeCount}/{partyRules.length} active)
            </div>
            <span style={{ fontSize: 12, color: '#636b84' }}>{showRules ? '▲' : '▼'}</span>
          </button>
          {showRules && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {partyRules.map(rule => (
                <RuleCard key={rule.id} rule={rule} onChange={updateRule} />
              ))}
            </div>
          )}
        </div>

        {/* Match History link */}
        <div
          onClick={() => navigate('/history')}
          style={{
            background: '#0f1117', border: '1px solid #252a38',
            borderRadius: 14, padding: '14px 16px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 22, flexShrink: 0 }}>📋</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e4e8f2' }}>Match History</div>
            <div style={{ fontSize: 12, color: '#636b84' }}>View all your completed matches</div>
          </div>
          <span style={{ fontSize: 18, color: '#636b84' }}>›</span>
        </div>

        {/* Party tips */}
        <div style={{
          background: 'rgba(99,107,132,0.05)', border: '1px solid #252a38',
          borderRadius: 14, padding: '14px 16px', marginBottom: 96,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            Party Tips
          </div>
          {[
            { emoji: '💧', tip: 'Alternate with water to stay hydrated on court' },
            { emoji: '🍕', tip: 'Eat something before playing — padel is a real workout' },
            { emoji: '🚗', tip: 'Organise safe transport home before the match starts' },
            { emoji: '🛑', tip: 'Anyone can call "water break" at any time — no questions asked' },
          ].map(t => (
            <div key={t.emoji} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{t.emoji}</span>
              <span style={{ fontSize: 12, color: '#636b84', lineHeight: 1.5 }}>{t.tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
