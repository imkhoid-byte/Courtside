import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, F } from '../lib/design'

const FEATURES = [
  { label: 'Match History',          free: true,  pro: true  },
  { label: 'Live Scorekeeping',      free: true,  pro: true  },
  { label: 'Tournament Mode',        free: true,  pro: true  },
  { label: 'Party + Drink Rules',    free: true,  pro: true  },
  { label: 'Basic Stats',            free: true,  pro: true  },
  { label: 'Shot-by-Shot Replay',    free: false, pro: true  },
  { label: 'AI Match Insights',      free: false, pro: true  },
  { label: 'Advanced Analytics',     free: false, pro: true  },
  { label: 'Achievements & Badges',  free: false, pro: true  },
  { label: 'Player ELO Rating',      free: false, pro: true  },
  { label: 'Coaching Drills',        free: false, pro: true  },
  { label: 'Unlimited Exports',      free: false, pro: true  },
  { label: 'Priority Support',       free: false, pro: true  },
]

const TESTIMONIALS = [
  { name: 'Carlos M.',  club: 'Madrid Padel Club',     text: 'The match insights completely changed how I prepare. Best padel app, period.' },
  { name: 'Sophia R.',  club: 'Barcelona Racquet Co.', text: 'My coaching clients love the drill timers and shot breakdown. Worth every penny.' },
  { name: 'David K.',   club: 'London Padel Centre',   text: 'Finally an app that takes the sport seriously. The ELO system keeps me motivated.' },
]

const VALUE_PROPS = [
  { icon: '🧠', title: 'AI-Powered Insights',  desc: 'After every match, get personalised analysis on your strengths and what to work on next.' },
  { icon: '📊', title: 'Advanced Analytics',   desc: 'ELO progression, surface splits, partner chemistry, and long-term trend charts.' },
  { icon: '🎯', title: 'Coaching Drills',      desc: '12+ professional drills with timers, categorised by skill level and focus area.' },
  { icon: '🏅', title: 'Achievements & ELO',   desc: '23 unlockable badges and a live ELO rating that reflects your real skill level.' },
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
    <div style={{ fontFamily: F.sans, background: C.bg, minHeight: '100%', paddingBottom: 96 }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      `}</style>

      {/* Back bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
        background: `${C.bg}f8`, backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <button onClick={() => navigate(-1)} style={{
          width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`,
          background: C.surface, cursor: 'pointer', color: C.text2,
          fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>‹</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Padel Party Pro</div>
          <div style={{ fontSize: 11, color: C.text2 }}>Unlock your full potential</div>
        </div>
      </div>

      <div style={{ padding: '20px 16px 0' }}>

        {/* Hero */}
        <div style={{
          background: `linear-gradient(135deg, ${C.accentDim}, ${C.partyDim})`,
          border: `1px solid ${C.accentLight}33`,
          borderRadius: 20, padding: '28px 20px 24px', marginBottom: 20, textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${C.accentDim} 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ fontSize: 52, marginBottom: 8, animation: 'float 3s ease-in-out infinite' }}>🏆</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: C.text, marginBottom: 6, letterSpacing: '-0.4px' }}>
            Go{' '}
            <span style={{
              background: `linear-gradient(90deg, ${C.accentLight}, ${C.party}, ${C.teamA}, ${C.accentLight})`,
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'shimmer 3s linear infinite',
            }}>Pro</span>
          </div>
          <div style={{ fontSize: 14, color: C.text2, maxWidth: 280, margin: '0 auto', lineHeight: 1.55 }}>
            Advanced analytics, AI insights, and coaching tools for serious padel players
          </div>
        </div>

        {/* Billing toggle */}
        <div style={{
          display: 'flex', background: C.surface, borderRadius: 12, padding: 4,
          border: `1px solid ${C.border}`, marginBottom: 16,
        }}>
          {(['monthly', 'annual'] as const).map(p => (
            <button key={p} onClick={() => setPlan(p)} style={{
              flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: plan === p ? C.elevated : 'none',
              color: plan === p ? C.text : C.text2,
              fontSize: 13, fontWeight: 700, fontFamily: F.sans,
              transition: 'all 0.15s', position: 'relative',
            }}>
              {p === 'annual' ? 'Annual' : 'Monthly'}
              {p === 'annual' && (
                <span style={{
                  position: 'absolute', top: -8, right: 8,
                  background: C.party, color: '#fff', fontSize: 9, fontWeight: 900,
                  padding: '2px 6px', borderRadius: 99,
                }}>SAVE {saving}%</span>
              )}
            </button>
          ))}
        </div>

        {/* Price card */}
        <div style={{
          background: `linear-gradient(135deg, ${C.accentDim}, rgba(236,72,153,0.06))`,
          border: `1px solid ${C.accentLight}40`,
          borderRadius: 16, padding: '20px', marginBottom: 20, textAlign: 'center',
        }}>
          <div style={{ fontSize: 42, fontWeight: 900, color: C.accentLight, fontFamily: '"IBM Plex Mono", monospace' }}>
            ${price}
            <span style={{ fontSize: 16, color: C.text2, fontFamily: F.sans, fontWeight: 600 }}>/mo</span>
          </div>
          {plan === 'annual' && (
            <div style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>
              Billed as ${annualTotal}/year · Cancel anytime
            </div>
          )}
          {plan === 'monthly' && (
            <div style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>
              Switch to annual and save ${((7.99 - 4.99) * 12).toFixed(2)}/year
            </div>
          )}
        </div>

        {/* CTA / Waitlist */}
        {submitted ? (
          <div style={{
            background: C.winDim, border: `1px solid ${C.win}40`,
            borderRadius: 14, padding: '20px', marginBottom: 20, textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.win, marginBottom: 4 }}>You're on the list!</div>
            <div style={{ fontSize: 13, color: C.text2 }}>We'll notify you when Pro launches with an exclusive early-bird discount.</div>
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
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
                padding: '14px 16px', color: C.text, fontSize: 14, fontFamily: F.sans,
                outline: 'none', marginBottom: 10,
              }}
            />
            <button
              onClick={handleSubmit}
              style={{
                width: '100%', padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${C.accent}, ${C.party})`,
                color: '#fff', fontSize: 15, fontWeight: 900, fontFamily: F.sans,
                boxShadow: `0 4px 24px ${C.party}40`,
              }}
            >
              Join the Waitlist — Free
            </button>
            <div style={{ fontSize: 11, color: C.text2, textAlign: 'center', marginTop: 8 }}>
              No credit card required · Early birds get 30% off at launch
            </div>
          </div>
        )}

        {/* Feature comparison */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
            What's included
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px 64px', padding: '10px 14px', background: C.elevated, borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Feature</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.text2, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Free</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.accentLight, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pro</span>
            </div>
            {FEATURES.map((f, i) => (
              <div key={f.label} style={{
                display: 'grid', gridTemplateColumns: '1fr 64px 64px',
                padding: '10px 14px',
                borderBottom: i < FEATURES.length - 1 ? `1px solid ${C.bg}` : 'none',
                background: f.pro && !f.free ? `${C.accentDim}` : 'none',
              }}>
                <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{f.label}</span>
                <span style={{ textAlign: 'center', fontSize: 14, color: f.free ? C.win : C.text3 }}>{f.free ? '✓' : '—'}</span>
                <span style={{ textAlign: 'center', fontSize: 14, color: C.accentLight }}>✓</span>
              </div>
            ))}
          </div>
        </div>

        {/* Value props */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
            Why players love Pro
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {VALUE_PROPS.map(v => (
              <div key={v.title} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px', display: 'flex', gap: 12 }}>
                <div style={{ fontSize: 24, flexShrink: 0 }}>{v.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>{v.title}</div>
                  <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.5 }}>{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
            Trusted by players
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px' }}>
                <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.6, marginBottom: 10, fontStyle: 'italic' }}>"{t.text}"</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{t.name}</div>
                <div style={{ fontSize: 11, color: C.text2 }}>{t.club}</div>
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
              background: `linear-gradient(135deg, ${C.accent}, ${C.party})`,
              color: '#fff', fontSize: 15, fontWeight: 900, fontFamily: F.sans,
              boxShadow: `0 4px 24px ${C.party}40`, marginBottom: 8,
            }}
          >
            Join the Waitlist — Free
          </button>
        )}
        <div style={{ fontSize: 11, color: C.text2, textAlign: 'center', paddingBottom: 8 }}>
          Launching 2026 · No credit card required
        </div>
      </div>
    </div>
  )
}
