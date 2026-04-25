import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const FEATURES = [
  { label: 'Match History',         free: true,  pro: true  },
  { label: 'Basic Stats',           free: true,  pro: true  },
  { label: 'Live Scorekeeping',     free: true,  pro: true  },
  { label: 'Tournament Mode',       free: true,  pro: true  },
  { label: 'Shot-by-Shot Replay',   free: false, pro: true  },
  { label: 'AI Match Insights',     free: false, pro: true  },
  { label: 'Advanced Analytics',    free: false, pro: true  },
  { label: 'Achievements & Badges', free: false, pro: true  },
  { label: 'Player Tier / ELO',     free: false, pro: true  },
  { label: 'Coaching Drills',       free: false, pro: true  },
  { label: 'Unlimited Exports',     free: false, pro: true  },
  { label: 'Priority Support',      free: false, pro: true  },
]

const TESTIMONIALS = [
  { name: 'Carlos M.',  club: 'Madrid Padel Club',    text: 'The match insights completely changed how I prepare. Best padel app, period.' },
  { name: 'Sophia R.',  club: 'Barcelona Racquet Co.', text: 'My coaching clients love the drill timers and shot breakdown. Worth every penny.' },
  { name: 'David K.',   club: 'London Padel Centre',  text: 'Finally an app that takes the sport seriously. The ELO system keeps me motivated.' },
]

export function ProPage() {
  const navigate = useNavigate()
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual')
  const [submitted, setSubmitted] = useState(false)
  const [email, setEmail] = useState('')

  const price = plan === 'annual' ? '4.99' : '7.99'
  const annualTotal = (4.99 * 12).toFixed(2)
  const saving = Math.round(((7.99 - 4.99) / 7.99) * 100)

  const handleSubmit = () => {
    if (!email.includes('@')) return
    setSubmitted(true)
  }

  return (
    <div style={{ fontFamily: '"DM Sans"', background: '#07070f', minHeight: '100%', paddingBottom: 96 }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      `}</style>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
        background: 'rgba(8,9,13,0.97)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #1e2330',
      }}>
        <button onClick={() => navigate(-1)} style={{
          width: 32, height: 32, borderRadius: 8, border: '1px solid #252a38',
          background: '#0d0d1e', cursor: 'pointer', color: '#7878a8',
          fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>‹</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#eeeeff' }}>Courtside Pro</div>
          <div style={{ fontSize: 11, color: '#7878a8' }}>Unlock your full potential</div>
        </div>
      </div>

      <div style={{ padding: '20px 16px 0' }}>

        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #0f1a0e 0%, #0b1520 100%)',
          border: '1px solid rgba(167,139,250,0.2)',
          borderRadius: 20, padding: '28px 20px 24px', marginBottom: 20, textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ fontSize: 52, marginBottom: 8, animation: 'float 3s ease-in-out infinite' }}>🏆</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#eeeeff', marginBottom: 6 }}>
            Go{' '}
            <span style={{
              background: 'linear-gradient(90deg, #bef264, #34d399, #38bdf8, #bef264)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'shimmer 3s linear infinite',
            }}>Pro</span>
          </div>
          <div style={{ fontSize: 14, color: '#7878a8', maxWidth: 280, margin: '0 auto' }}>
            Advanced analytics, AI insights, and coaching tools for serious padel players
          </div>
        </div>

        {/* Billing toggle */}
        <div style={{
          display: 'flex', background: '#0d0d1e', borderRadius: 12, padding: 4,
          border: '1px solid #252a38', marginBottom: 16,
        }}>
          {(['monthly', 'annual'] as const).map(p => (
            <button key={p} onClick={() => setPlan(p)} style={{
              flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: plan === p ? '#1e1e3c' : 'none',
              color: plan === p ? '#eeeeff' : '#7878a8',
              fontSize: 13, fontWeight: 700, fontFamily: '"DM Sans"',
              transition: 'all 0.15s', position: 'relative',
            }}>
              {p === 'annual' ? 'Annual' : 'Monthly'}
              {p === 'annual' && (
                <span style={{
                  position: 'absolute', top: -8, right: 8,
                  background: '#a78bfa', color: '#07070f', fontSize: 9, fontWeight: 900,
                  padding: '2px 6px', borderRadius: 99,
                }}>SAVE {saving}%</span>
              )}
            </button>
          ))}
        </div>

        {/* Price card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(52,211,153,0.04))',
          border: '1px solid rgba(167,139,250,0.25)',
          borderRadius: 16, padding: '20px', marginBottom: 20, textAlign: 'center',
        }}>
          <div style={{ fontSize: 42, fontWeight: 900, color: '#a78bfa', fontFamily: '"IBM Plex Mono"' }}>
            ${price}
            <span style={{ fontSize: 16, color: '#7878a8', fontFamily: '"DM Sans"', fontWeight: 600 }}>
              /{plan === 'annual' ? 'mo' : 'mo'}
            </span>
          </div>
          {plan === 'annual' && (
            <div style={{ fontSize: 12, color: '#7878a8', marginTop: 4 }}>
              Billed as ${annualTotal}/year · Cancel anytime
            </div>
          )}
          {plan === 'monthly' && (
            <div style={{ fontSize: 12, color: '#7878a8', marginTop: 4 }}>
              Switch to annual and save ${((7.99 - 4.99) * 12).toFixed(2)}/year
            </div>
          )}
        </div>

        {/* CTA / Waitlist */}
        {submitted ? (
          <div style={{
            background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)',
            borderRadius: 14, padding: '20px', marginBottom: 20, textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#34d399', marginBottom: 4 }}>You're on the list!</div>
            <div style={{ fontSize: 13, color: '#7878a8' }}>We'll notify you when Pro launches with an exclusive early-bird discount.</div>
          </div>
        ) : (
          <div style={{ marginBottom: 20 }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email for early access"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#0d0d1e', border: '1px solid #252a38', borderRadius: 12,
                padding: '14px 16px', color: '#eeeeff', fontSize: 14, fontFamily: '"DM Sans"',
                outline: 'none', marginBottom: 10,
              }}
            />
            <button
              onClick={handleSubmit}
              style={{
                width: '100%', padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #bef264, #86efac)',
                color: '#07070f', fontSize: 15, fontWeight: 900, fontFamily: '"DM Sans"',
                boxShadow: '0 4px 24px rgba(167,139,250,0.3)',
              }}
            >
              Join the Waitlist — Free
            </button>
            <div style={{ fontSize: 11, color: '#7878a8', textAlign: 'center', marginTop: 8 }}>
              No credit card required · Early birds get 30% off at launch
            </div>
          </div>
        )}

        {/* Feature comparison */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7878a8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
            What's included
          </div>
          <div style={{ background: '#0d0d1e', border: '1px solid #252a38', borderRadius: 14, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px 64px', padding: '10px 14px', background: '#131428', borderBottom: '1px solid #252a38' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#7878a8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Feature</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#7878a8', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Free</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pro</span>
            </div>
            {FEATURES.map((f, i) => (
              <div key={f.label} style={{
                display: 'grid', gridTemplateColumns: '1fr 64px 64px',
                padding: '10px 14px',
                borderBottom: i < FEATURES.length - 1 ? '1px solid #161922' : 'none',
                background: f.pro && !f.free ? 'rgba(167,139,250,0.02)' : 'none',
              }}>
                <span style={{ fontSize: 13, color: '#eeeeff', fontWeight: 500 }}>{f.label}</span>
                <span style={{ textAlign: 'center', fontSize: 14 }}>{f.free ? '✓' : <span style={{ color: '#1e1e3c' }}>—</span>}</span>
                <span style={{ textAlign: 'center', fontSize: 14, color: '#a78bfa' }}>✓</span>
              </div>
            ))}
          </div>
        </div>

        {/* Why Pro — value props */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7878a8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
            Why players love Pro
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '🧠', title: 'AI-Powered Insights', desc: 'After every match, get personalised analysis on your strengths and what to work on next.' },
              { icon: '📊', title: 'Advanced Analytics', desc: 'Deep stats: ELO progression, surface splits, partner chemistry, and long-term trend charts.' },
              { icon: '🎯', title: 'Coaching Drills', desc: '12+ professional drills with countdown timers, categorised by skill level and focus area.' },
              { icon: '🏅', title: 'Achievements & ELO', desc: '23 unlockable badges and a live ELO rating that reflects your true skill level on court.' },
            ].map(v => (
              <div key={v.title} style={{ background: '#0d0d1e', border: '1px solid #252a38', borderRadius: 12, padding: '14px', display: 'flex', gap: 12 }}>
                <div style={{ fontSize: 24, flexShrink: 0 }}>{v.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#eeeeff', marginBottom: 3 }}>{v.title}</div>
                  <div style={{ fontSize: 12, color: '#7878a8', lineHeight: 1.5 }}>{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7878a8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
            Trusted by players
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ background: '#0d0d1e', border: '1px solid #252a38', borderRadius: 12, padding: '14px' }}>
                <div style={{ fontSize: 12, color: '#7878a8', lineHeight: 1.6, marginBottom: 10 }}>"{t.text}"</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#eeeeff' }}>{t.name}</div>
                <div style={{ fontSize: 11, color: '#7878a8' }}>{t.club}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        {!submitted && (
          <button
            onClick={handleSubmit}
            style={{
              width: '100%', padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #bef264, #86efac)',
              color: '#07070f', fontSize: 15, fontWeight: 900, fontFamily: '"DM Sans"',
              boxShadow: '0 4px 24px rgba(167,139,250,0.3)', marginBottom: 8,
            }}
          >
            Join the Waitlist — Free
          </button>
        )}
        <div style={{ fontSize: 11, color: '#7878a8', textAlign: 'center', paddingBottom: 8 }}>
          Launching 2025 · No credit card required
        </div>
      </div>
    </div>
  )
}
