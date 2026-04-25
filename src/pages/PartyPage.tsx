import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { getRandomChallenge } from '../lib/party'
import type { Challenge, DrinkRule } from '../lib/party'
import { C, F } from '../lib/design'

// ─── Drink counter ────────────────────────────────────────────────────────────

function DrinkCounter() {
  const { drinkCounts, addDrinks, resetDrinks } = useApp()
  const entries = Object.entries(drinkCounts).sort((a, b) => b[1] - a[1])

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>🍺 Drink Scoreboard</div>
        {entries.length > 0 && (
          <button onClick={resetDrinks} style={{ fontSize: 11, color: C.party, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
            Reset
          </button>
        )}
      </div>
      {entries.length === 0 ? (
        <div style={{ padding: '16px', textAlign: 'center', color: C.text3, fontSize: 13 }}>
          Drink events appear here during a match
        </div>
      ) : entries.map(([player, sips], i) => (
        <div key={player} style={{
          padding: '12px 16px', borderBottom: i < entries.length - 1 ? `1px solid ${C.border}` : 'none',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: C.partyDim, border: `1px solid ${C.party}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 900, color: C.party,
          }}>
            {player[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: C.text }}>{player}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => addDrinks(player, 1)}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                border: `1px solid ${C.party}44`, background: 'none',
                color: C.party, cursor: 'pointer', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >+</button>
            <div style={{ textAlign: 'right', minWidth: 38 }}>
              <div style={{ fontFamily: F.mono, fontSize: 20, fontWeight: 800, color: C.party }}>{sips}</div>
              <div style={{ fontSize: 9, color: C.text3 }}>sips</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Rule card ────────────────────────────────────────────────────────────────

function RuleCard({ rule, onChange }: { rule: DrinkRule; onChange: (r: DrinkRule) => void }) {
  return (
    <div style={{
      background: rule.enabled ? C.partyDim : C.surface,
      border: `1px solid ${rule.enabled ? `${C.party}35` : C.border}`,
      borderRadius: 14, padding: '13px 14px',
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{rule.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: rule.enabled ? C.text : C.text2, marginBottom: 3 }}>{rule.label}</div>
          <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.45 }}>{rule.description}</div>
          {rule.enabled && !rule.isFinish && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <span style={{ fontSize: 10, color: C.text3 }}>Sips:</span>
              {[1, 2, 3].map(n => (
                <button key={n} onClick={() => onChange({ ...rule, sips: n })} style={{
                  width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: rule.sips === n ? C.party : C.elevated,
                  color: rule.sips === n ? '#fff' : C.text3,
                  fontSize: 12, fontWeight: 800,
                }}>{n}</button>
              ))}
            </div>
          )}
          {rule.enabled && rule.isFinish && (
            <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, background: C.partyDim, borderRadius: 5, padding: '2px 8px' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.party, letterSpacing: '0.05em' }}>FINISH DRINK</span>
            </div>
          )}
        </div>
        {/* Toggle */}
        <button
          onClick={() => onChange({ ...rule, enabled: !rule.enabled })}
          style={{
            width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', flexShrink: 0,
            background: rule.enabled ? C.party : C.elevated,
            position: 'relative', transition: 'background 0.2s',
          }}
        >
          <div style={{
            position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%',
            background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
            left: rule.enabled ? 21 : 3, transition: 'left 0.2s',
          }} />
        </button>
      </div>
    </div>
  )
}

// ─── Challenge spinner ────────────────────────────────────────────────────────

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
      <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
        Random Challenge
      </div>
      <button
        onClick={spin}
        style={{
          width: '100%', padding: '16px', borderRadius: 14, border: 'none',
          cursor: spinning ? 'default' : 'pointer',
          background: spinning
            ? C.elevated
            : `linear-gradient(135deg, ${C.accent}, ${C.party})`,
          color: spinning ? C.text2 : '#fff',
          fontSize: 15, fontWeight: 800, fontFamily: F.sans,
          boxShadow: spinning ? 'none' : `0 4px 20px rgba(236,72,153,0.3)`,
          transition: 'all 0.2s', marginBottom: challenge ? 10 : 0,
        }}
      >
        {spinning ? '🎲 Spinning…' : '🎲 Spin for a Challenge!'}
      </button>

      {challenge && !spinning && (
        <div
          className="fade-up"
          style={{
            background: `linear-gradient(135deg, ${C.accentDim}, ${C.partyDim})`,
            border: `1px solid ${C.party}40`,
            borderRadius: 14, padding: '18px 16px',
          }}
        >
          <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>{challenge.emoji}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, textAlign: 'center', lineHeight: 1.5 }}>
            {challenge.text}
          </div>
          <div style={{ marginTop: 10, textAlign: 'center' }}>
            <span style={{
              fontSize: 9, fontWeight: 700, color: C.party,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              background: C.elevated, borderRadius: 5, padding: '3px 8px',
            }}>{challenge.category}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Party mode toggle ────────────────────────────────────────────────────────

function PartyModeToggle() {
  const { partyMode, setPartyMode } = useApp()

  return (
    <div
      onClick={() => {
        setPartyMode(!partyMode)
        if (navigator.vibrate) navigator.vibrate(partyMode ? 10 : [10, 50, 20])
      }}
      style={{
        background: partyMode
          ? `linear-gradient(135deg, ${C.partyDim}, ${C.accentDim})`
          : C.surface,
        border: `2px solid ${partyMode ? C.party : C.border}`,
        borderRadius: 18, padding: '18px 16px', marginBottom: 16,
        cursor: 'pointer', transition: 'all 0.25s',
        boxShadow: partyMode ? `0 0 32px ${C.party}20` : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 54, height: 54, borderRadius: 15, flexShrink: 0,
          background: partyMode ? `linear-gradient(135deg, ${C.accent}, ${C.party})` : C.elevated,
          border: partyMode ? 'none' : `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, transition: 'all 0.25s',
          boxShadow: partyMode ? `0 4px 20px ${C.party}40` : 'none',
        }}>🎉</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: partyMode ? C.text : C.text2, marginBottom: 4 }}>
            Party Mode
          </div>
          <div style={{ fontSize: 12, color: partyMode ? C.party : C.text3 }}>
            {partyMode ? 'Active — drink rules fire during match' : 'Activate to enable drink rules'}
          </div>
        </div>
        {/* Toggle switch */}
        <div style={{
          width: 52, height: 28, borderRadius: 14, flexShrink: 0,
          background: partyMode ? C.party : C.elevated,
          border: `1px solid ${partyMode ? C.party : C.border}`,
          position: 'relative', transition: 'all 0.2s',
        }}>
          <div style={{
            position: 'absolute', top: 3, width: 22, height: 22, borderRadius: '50%',
            background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
            left: partyMode ? 27 : 3, transition: 'left 0.2s',
          }} />
        </div>
      </div>
    </div>
  )
}

// ─── Party Page ───────────────────────────────────────────────────────────────

export function PartyPage() {
  const navigate = useNavigate()
  const { partyMode, partyRules, setPartyRules } = useApp()
  const [showRules, setShowRules] = useState(true)

  const updateRule = (updated: DrinkRule) => {
    setPartyRules(partyRules.map(r => r.id === updated.id ? updated : r))
  }

  const activeCount = partyRules.filter(r => r.enabled).length

  return (
    <div style={{ fontFamily: F.sans }}>
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 16px 0',
        background: partyMode
          ? `linear-gradient(180deg, ${C.partyDim} 0%, transparent 100%)`
          : 'none',
      }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 23, fontWeight: 900, color: C.text, marginBottom: 3, letterSpacing: '-0.3px' }}>
            Party Mode 🎉
          </div>
          <div style={{ fontSize: 13, color: C.text2 }}>
            {partyMode ? (
              <span style={{ color: C.party }}>
                ● Active · {activeCount} rule{activeCount !== 1 ? 's' : ''} enabled
              </span>
            ) : 'Add drink rules to your padel game'}
          </div>
        </div>

        {/* Age warning */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: '9px 12px', marginBottom: 14,
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <span style={{ fontSize: 14 }}>🔞</span>
          <span style={{ fontSize: 11, color: C.text3 }}>
            18+ only. Play responsibly. Never drink and drive. Know your limits.
          </span>
        </div>

        {/* Party mode toggle */}
        <PartyModeToggle />

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
            <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Drink Rules ({activeCount}/{partyRules.length} on)
            </div>
            <span style={{ fontSize: 12, color: C.text3 }}>{showRules ? '▲' : '▼'}</span>
          </button>
          {showRules && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {partyRules.map(rule => (
                <RuleCard key={rule.id} rule={rule} onChange={updateRule} />
              ))}
            </div>
          )}
        </div>

        {/* History link */}
        <div
          onClick={() => navigate('/history')}
          style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 14, padding: '14px 16px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 22, flexShrink: 0 }}>📋</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Match History</div>
            <div style={{ fontSize: 12, color: C.text2 }}>View all your completed matches</div>
          </div>
          <span style={{ fontSize: 16, color: C.text3 }}>›</span>
        </div>

        {/* Safety tips */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: '14px 16px', marginBottom: 96,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            Safety First
          </div>
          {[
            { emoji: '💧', tip: 'Alternate with water to stay hydrated on court' },
            { emoji: '🍕', tip: 'Eat something before playing — padel is a real workout' },
            { emoji: '🚗', tip: 'Arrange safe transport home before the game starts' },
            { emoji: '🛑', tip: 'Anyone can call a break at any time — no questions asked' },
          ].map(item => (
            <div key={item.emoji} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{item.emoji}</span>
              <span style={{ fontSize: 12, color: C.text2, lineHeight: 1.5 }}>{item.tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
