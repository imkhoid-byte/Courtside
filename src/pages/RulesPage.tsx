import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Types ────────────────────────────────────────────────────────────────────

type Level = 'Beginner' | 'Intermediate'
type Tab = 'Scoring' | 'Rules' | 'Tips' | 'Quiz'

// ─── Scoring Tab ──────────────────────────────────────────────────────────────

function ScoringTab({ level }: { level: Level }) {
  const points = ['0', '15', '30', '40', 'Game']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Points progression */}
      <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
          Points Progression
        </div>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          {points.map((p, i) => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                background: i === points.length - 1 ? 'rgba(190,242,100,0.15)' : 'rgba(56,189,248,0.1)',
                border: `1px solid ${i === points.length - 1 ? 'rgba(190,242,100,0.4)' : 'rgba(56,189,248,0.25)'}`,
                borderRadius: 8, padding: '6px 12px',
                fontFamily: '"IBM Plex Mono"', fontWeight: 700,
                fontSize: 15, color: i === points.length - 1 ? '#bef264' : '#38bdf8',
              }}>{p}</div>
              {i < points.length - 1 && <span style={{ color: '#636b84', fontSize: 14 }}>→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Deuce */}
      <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#e4e8f2', marginBottom: 6 }}>⚖️ Deuce</div>
        <div style={{ fontSize: 13, color: '#949cb4', lineHeight: 1.6 }}>
          When both players reach 40, it's <span style={{ color: '#bef264', fontWeight: 700 }}>Deuce</span>. Win 2 consecutive points to win the game.
        </div>
      </div>

      {/* Golden Point */}
      <div style={{ background: '#0f1117', border: '1px solid rgba(190,242,100,0.2)', borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#bef264', marginBottom: 6 }}>✨ Golden Point</div>
        <div style={{ fontSize: 13, color: '#949cb4', lineHeight: 1.6 }}>
          Some matches use <span style={{ color: '#bef264', fontWeight: 700 }}>Golden Point</span> — at Deuce, the <span style={{ color: '#38bdf8' }}>RECEIVING</span> team chooses which side to receive from. Win that one point to win the game.
        </div>
      </div>

      {/* Games */}
      <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#e4e8f2', marginBottom: 6 }}>🎮 Games &amp; Sets</div>
        <div style={{ fontSize: 13, color: '#949cb4', lineHeight: 1.6 }}>
          First to <span style={{ color: '#bef264', fontWeight: 700 }}>6 games</span> wins the set. Must win by 2. At 6-6 → <span style={{ color: '#38bdf8', fontWeight: 700 }}>Tiebreak</span> (first to 7 points, win by 2).
        </div>
      </div>

      {/* Sets / Match */}
      <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#e4e8f2', marginBottom: 6 }}>🏆 Match Format</div>
        <div style={{ fontSize: 13, color: '#949cb4', lineHeight: 1.6 }}>
          <span style={{ color: '#bef264', fontWeight: 700 }}>Best of 3 sets</span> wins the match. Most recreational matches play best of 3.
        </div>
      </div>

      {/* Intermediate: Tiebreak details */}
      {level === 'Intermediate' && (
        <div style={{ background: '#0f1117', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(96,165,250,0.15)', color: '#60a5fa', borderRadius: 6, padding: '2px 7px', letterSpacing: '0.06em' }}>INTERMEDIATE</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#60a5fa' }}>Tiebreak Scoring</span>
          </div>
          <div style={{ fontSize: 13, color: '#949cb4', lineHeight: 1.7 }}>
            • Points count from <span style={{ color: '#e4e8f2' }}>1, 2, 3…</span> (not 15, 30, 40)<br />
            • Serve alternates every <span style={{ color: '#e4e8f2' }}>2 points</span> (first serve is 1 point)<br />
            • Switch ends after every <span style={{ color: '#e4e8f2' }}>6 total points</span><br />
            • First to <span style={{ color: '#bef264', fontWeight: 700 }}>7 points</span>, must win by 2
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Court SVG ────────────────────────────────────────────────────────────────

function CourtDiagram() {
  return (
    <svg viewBox="0 0 220 140" width="100%" style={{ maxWidth: 320, display: 'block', margin: '0 auto' }}>
      {/* Court background */}
      <rect x="10" y="10" width="200" height="120" rx="4" fill="#0d1a10" stroke="#2a4a2e" strokeWidth="1.5" />
      {/* Net */}
      <line x1="10" y1="70" x2="210" y2="70" stroke="#bef264" strokeWidth="1.5" strokeDasharray="4 2" />
      {/* Service boxes */}
      <line x1="110" y1="10" x2="110" y2="70" stroke="#2a4a2e" strokeWidth="1" />
      <line x1="110" y1="70" x2="110" y2="130" stroke="#2a4a2e" strokeWidth="1" />
      <line x1="10" y1="40" x2="210" y2="40" stroke="#2a4a2e" strokeWidth="1" />
      <line x1="10" y1="100" x2="210" y2="100" stroke="#2a4a2e" strokeWidth="1" />
      {/* Glass walls */}
      <rect x="10" y="10" width="200" height="4" rx="2" fill="#38bdf8" opacity="0.4" />
      <rect x="10" y="126" width="200" height="4" rx="2" fill="#38bdf8" opacity="0.4" />
      <rect x="10" y="10" width="4" height="120" rx="2" fill="#38bdf8" opacity="0.4" />
      <rect x="206" y="10" width="4" height="120" rx="2" fill="#38bdf8" opacity="0.4" />
      {/* Labels */}
      <text x="110" y="68" textAnchor="middle" fill="#bef264" fontSize="7" fontWeight="700">NET</text>
      <text x="40" y="26" textAnchor="middle" fill="#38bdf8" fontSize="6">Glass Wall</text>
      <text x="60" y="55" textAnchor="middle" fill="#949cb4" fontSize="6">Service Box</text>
      <text x="160" y="55" textAnchor="middle" fill="#949cb4" fontSize="6">Service Box</text>
      <text x="60" y="116" textAnchor="middle" fill="#949cb4" fontSize="6">Baseline</text>
      <text x="160" y="116" textAnchor="middle" fill="#949cb4" fontSize="6">Baseline</text>
    </svg>
  )
}

// ─── Rules Tab ────────────────────────────────────────────────────────────────

function AccordionItem({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, overflow: 'hidden', marginBottom: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 20 }}>{emoji}</span>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#e4e8f2' }}>{title}</span>
        <span style={{ fontSize: 16, color: '#636b84', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 14px', fontSize: 13, color: '#949cb4', lineHeight: 1.7 }}>
          {children}
        </div>
      )}
    </div>
  )
}

function RulesTab({ level }: { level: Level }) {
  return (
    <div>
      <AccordionItem emoji="🏟️" title="The Court">
        <CourtDiagram />
        <div style={{ marginTop: 10 }}>
          The padel court is enclosed by <span style={{ color: '#38bdf8' }}>glass walls</span> and metal fencing.
          It is roughly half the size of a tennis court. The net divides the court in half,
          and each side has two <span style={{ color: '#e4e8f2' }}>service boxes</span>.
        </div>
      </AccordionItem>

      <AccordionItem emoji="🎯" title="Serving">
        <div>
          • Serve must be hit <span style={{ color: '#bef264', fontWeight: 700 }}>underhand</span>, below hip height<br />
          • Ball must bounce in the <span style={{ color: '#e4e8f2' }}>diagonal service box</span><br />
          • Server must stand behind the service line<br />
          • You get <span style={{ color: '#bef264', fontWeight: 700 }}>two attempts</span> (like tennis)<br />
          • Fault if the ball hits the fence <span style={{ color: '#fb7185' }}>without bouncing</span> on the serve
        </div>
      </AccordionItem>

      <AccordionItem emoji="🧱" title="Wall Play">
        <div>
          • The ball can come off walls <span style={{ color: '#bef264', fontWeight: 700 }}>after bouncing</span> in the opponent's court<br />
          • You can play the ball off your own walls and send it back over the net<br />
          • A <span style={{ color: '#38bdf8' }}>let</span> is called if the ball hits the net post<br />
          • Walls are a strategic element — use them!
        </div>
      </AccordionItem>

      <AccordionItem emoji="🏆" title="Scoring a Point">
        <div>
          • Winner: opponent can't return the ball before it bounces twice<br />
          • Error: ball goes into the net or out of bounds <span style={{ color: '#fb7185' }}>before bouncing</span><br />
          • Double bounce before the return = point lost<br />
          • Ball must land <span style={{ color: '#bef264' }}>inside</span> the court boundaries
        </div>
      </AccordionItem>

      <AccordionItem emoji="⚠️" title="Common Faults">
        <div>
          • Serve hit <span style={{ color: '#fb7185' }}>above hip height</span><br />
          • Foot stepping into the court <span style={{ color: '#fb7185' }}>during the serve</span><br />
          • Ball hits the fence <span style={{ color: '#fb7185' }}>without bouncing</span> on serve<br />
          • Returning before the ball bounces (volley on serve return is allowed only if ball would go out)
        </div>
      </AccordionItem>

      {level === 'Intermediate' && (
        <div style={{ background: '#0f1117', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 14, padding: '14px 16px', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(96,165,250,0.15)', color: '#60a5fa', borderRadius: 6, padding: '2px 7px', letterSpacing: '0.06em' }}>INTERMEDIATE</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#60a5fa' }}>Specialty Shots</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#e4e8f2', marginBottom: 3 }}>🏸 Bandeja</div>
              <div style={{ fontSize: 13, color: '#949cb4', lineHeight: 1.6 }}>
                A controlled overhead shot hit with slice. Keeps you at the net position instead of falling back. Used to neutralize lobs.
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#e4e8f2', marginBottom: 3 }}>⚡ Vibora</div>
              <div style={{ fontSize: 13, color: '#949cb4', lineHeight: 1.6 }}>
                An aggressive overhead with topspin and side spin. More powerful than the bandeja, used to finish points from the net.
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#e4e8f2', marginBottom: 3 }}>🔽 Bajada</div>
              <div style={{ fontSize: 13, color: '#949cb4', lineHeight: 1.6 }}>
                Playing the ball off the back glass down low and sending it back over the net. A defensive move turned offensive.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tips Tab ─────────────────────────────────────────────────────────────────

interface TipData { emoji: string; title: string; desc: string }

const beginnerTips: TipData[] = [
  { emoji: '🥅', title: 'Stay Close to the Net', desc: 'Volleying is your best weapon. Control the net, control the match.' },
  { emoji: '📢', title: 'Communicate', desc: 'Call for balls — say "yours" or "mine" loudly and early.' },
  { emoji: '🧱', title: 'Use the Walls', desc: 'Walls are your friend, not the enemy. Let the glass work for you.' },
  { emoji: '🎯', title: 'Serve Underhand', desc: 'Keep it consistent, not powerful. Placement beats power on serve.' },
  { emoji: '↗️', title: 'Hit Cross-Court', desc: 'Safer angle, harder to return. Reduces your risk of errors.' },
]

const intermediateTips: TipData[] = [
  { emoji: '🪂', title: 'The Lob is Powerful', desc: 'Push opponents off the net with high lobs to reset the point.' },
  { emoji: '✨', title: 'Golden Point Strategy', desc: 'As receiver, pick the stronger returner\'s side to maximize your chance.' },
  { emoji: '🏸', title: 'Master the Bandeja', desc: 'Controlled overhead keeps you at the net. Practice the slice motion.' },
  { emoji: '📐', title: 'Wall Shot Angles', desc: 'Learn to hit into the side glass for tricky bounces opponents can\'t read.' },
  { emoji: '🤝', title: 'Shift Together', desc: 'Move as a unit with your partner. If one goes left, the other covers center.' },
]

function TipCard({ tip }: { tip: TipData }) {
  return (
    <div style={{
      background: '#0f1117', border: '1px solid #252a38', borderRadius: 14,
      padding: '14px', display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ fontSize: 22 }}>{tip.emoji}</div>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#e4e8f2' }}>{tip.title}</div>
      <div style={{ fontSize: 12, color: '#636b84', lineHeight: 1.5 }}>{tip.desc}</div>
    </div>
  )
}

function TipsTab({ level }: { level: Level }) {
  const tips = level === 'Intermediate' ? [...beginnerTips, ...intermediateTips] : beginnerTips
  return (
    <div>
      {level === 'Intermediate' && (
        <div style={{ fontSize: 11, color: '#636b84', marginBottom: 12 }}>
          Showing all beginner + intermediate tips
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {tips.map((tip) => (
          <TipCard key={tip.title} tip={tip} />
        ))}
      </div>
    </div>
  )
}

// ─── Quiz Tab ─────────────────────────────────────────────────────────────────

interface Question {
  q: string
  options: string[]
  correct: number
  explanation: string
}

const questions: Question[] = [
  {
    q: 'What is the score called when both players have won 3 points?',
    options: ['30-30', 'Deuce', '40-40', 'Advantage'],
    correct: 1,
    explanation: '"Deuce" is the term for when both players reach 40 (3 points each). A player must then win 2 consecutive points.',
  },
  {
    q: 'When can the ball touch the walls?',
    options: ['Never', 'Any time during a rally', 'Only after it bounces in the opponent\'s court', 'Only on the serve'],
    correct: 2,
    explanation: 'The ball can legally touch the walls after it has first bounced in the opponent\'s court. Wall play is a key part of padel strategy.',
  },
  {
    q: 'How must the serve be hit in padel?',
    options: ['Overhand, like tennis', 'Underhand, below the hip', 'Any way you like', 'With a jump'],
    correct: 1,
    explanation: 'The serve must be hit underhand, with the ball at or below hip height. Overhand serves are not allowed in padel.',
  },
  {
    q: 'What happens after the first serve fault?',
    options: ['Point is lost', 'You get a second serve', 'Let is called', 'Switch server'],
    correct: 1,
    explanation: 'Just like tennis, padel gives you two serve attempts. If the first serve is a fault, you get a second serve.',
  },
  {
    q: 'In a tiebreak, who wins?',
    options: ['First to 6 points', 'First to 7 points, win by 2', 'First to 10 points', 'First to 5 points'],
    correct: 1,
    explanation: 'A tiebreak is won by the first player/team to reach 7 points, but they must win by at least 2 points.',
  },
]

function QuizTab() {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const handleAnswer = (optionIndex: number) => {
    if (answers[currentQ] !== undefined) return
    setAnswers(prev => ({ ...prev, [currentQ]: optionIndex }))
  }

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1)
    } else {
      setSubmitted(true)
    }
  }

  const handleReset = () => {
    setCurrentQ(0)
    setAnswers({})
    setSubmitted(false)
  }

  if (submitted) {
    const score = questions.filter((q, i) => answers[i] === q.correct).length
    const getMessage = () => {
      if (score === 5) return "Padel Pro! 🏆"
      if (score === 4) return "Almost Perfect! 🌟"
      if (score === 3) return "Getting There! 💪"
      return "Keep Learning! 📚"
    }
    return (
      <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 16, padding: '28px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>
          {score === 5 ? '🏆' : score >= 3 ? '🌟' : '📚'}
        </div>
        <div style={{ fontFamily: '"IBM Plex Mono"', fontSize: 42, fontWeight: 800, color: '#bef264', marginBottom: 6 }}>
          {score}/5
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#e4e8f2', marginBottom: 8 }}>{getMessage()}</div>
        <div style={{ fontSize: 13, color: '#636b84', marginBottom: 24 }}>
          You answered {score} out of 5 questions correctly.
        </div>
        <button
          onClick={handleReset}
          style={{
            background: 'rgba(190,242,100,0.12)', border: '1px solid rgba(190,242,100,0.3)',
            borderRadius: 10, padding: '12px 28px', color: '#bef264',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </div>
    )
  }

  const q = questions[currentQ]
  const chosen = answers[currentQ]
  const hasAnswered = chosen !== undefined

  return (
    <div>
      {/* Progress */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {questions.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i < currentQ
                ? (answers[i] === questions[i].correct ? '#34d399' : '#fb7185')
                : i === currentQ ? '#bef264' : '#252a38',
            }}
          />
        ))}
      </div>

      <div style={{ fontSize: 11, color: '#636b84', marginBottom: 10, fontWeight: 600 }}>
        Question {currentQ + 1} of {questions.length}
      </div>

      <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, padding: '16px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#e4e8f2', lineHeight: 1.5, marginBottom: 16 }}>
          {q.q}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.options.map((opt, i) => {
            let borderColor = '#252a38'
            let bgColor = 'transparent'
            let textColor = '#949cb4'

            if (hasAnswered) {
              if (i === q.correct) {
                borderColor = 'rgba(52,211,153,0.5)'
                bgColor = 'rgba(52,211,153,0.08)'
                textColor = '#34d399'
              } else if (i === chosen && chosen !== q.correct) {
                borderColor = 'rgba(251,113,133,0.5)'
                bgColor = 'rgba(251,113,133,0.08)'
                textColor = '#fb7185'
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                style={{
                  background: bgColor, border: `1px solid ${borderColor}`,
                  borderRadius: 10, padding: '12px 14px', textAlign: 'left',
                  color: textColor, fontSize: 13, fontWeight: 600, cursor: hasAnswered ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontFamily: '"IBM Plex Mono"', color: '#636b84', marginRight: 8 }}>
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
                {hasAnswered && i === q.correct && <span style={{ marginLeft: 8 }}>✓</span>}
                {hasAnswered && i === chosen && chosen !== q.correct && <span style={{ marginLeft: 8 }}>✗</span>}
              </button>
            )
          })}
        </div>

        {hasAnswered && (
          <div style={{
            marginTop: 12, padding: '10px 12px',
            background: chosen === q.correct ? 'rgba(52,211,153,0.06)' : 'rgba(251,113,133,0.06)',
            border: `1px solid ${chosen === q.correct ? 'rgba(52,211,153,0.2)' : 'rgba(251,113,133,0.2)'}`,
            borderRadius: 10, fontSize: 12, color: '#949cb4', lineHeight: 1.6,
          }}>
            <span style={{ fontWeight: 700, color: chosen === q.correct ? '#34d399' : '#fb7185', marginRight: 6 }}>
              {chosen === q.correct ? '✓ Correct!' : '✗ Incorrect.'}
            </span>
            {q.explanation}
          </div>
        )}
      </div>

      {hasAnswered && (
        <button
          onClick={handleNext}
          style={{
            marginTop: 12, width: '100%',
            background: 'rgba(190,242,100,0.12)', border: '1px solid rgba(190,242,100,0.3)',
            borderRadius: 10, padding: '14px', color: '#bef264',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {currentQ < questions.length - 1 ? 'Next Question →' : 'See Results'}
        </button>
      )}
    </div>
  )
}

// ─── Main RulesPage ───────────────────────────────────────────────────────────

export function RulesPage() {
  const navigate = useNavigate()
  const [level, setLevel] = useState<Level>('Beginner')
  const [tab, setTab] = useState<Tab>('Scoring')

  const tabs: Tab[] = ['Scoring', 'Rules', 'Tips', 'Quiz']

  return (
    <div style={{ background: '#08090d', minHeight: '100vh', paddingBottom: 40 }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(8,9,13,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #252a38', padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid #252a38',
            borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#e4e8f2',
            flexShrink: 0,
          }}
        >
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#e4e8f2' }}>Padel Rules</div>
          <div style={{ fontSize: 11, color: '#636b84' }}>Learn &amp; master the game</div>
        </div>
        {/* Level selector */}
        <div style={{
          display: 'flex', background: '#0f1117', border: '1px solid #252a38',
          borderRadius: 10, overflow: 'hidden', flexShrink: 0,
        }}>
          {(['Beginner', 'Intermediate'] as Level[]).map(l => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              style={{
                padding: '6px 10px', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                background: level === l ? (l === 'Beginner' ? 'rgba(190,242,100,0.15)' : 'rgba(96,165,250,0.15)') : 'transparent',
                color: level === l ? (l === 'Beginner' ? '#bef264' : '#60a5fa') : '#636b84',
                transition: 'all 0.15s',
              }}
            >
              {l === 'Beginner' ? '🌱' : '⚡'} {l}
            </button>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid #252a38',
        background: '#08090d', padding: '0 16px',
        position: 'sticky', top: 61, zIndex: 40,
      }}>
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '13px 4px', background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid #bef264' : '2px solid transparent',
              color: tab === t ? '#bef264' : '#636b84',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              transition: 'color 0.15s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: '16px 16px 0' }}>
        {tab === 'Scoring' && <ScoringTab level={level} />}
        {tab === 'Rules' && <RulesTab level={level} />}
        {tab === 'Tips' && <TipsTab level={level} />}
        {tab === 'Quiz' && <QuizTab />}
      </div>
    </div>
  )
}
