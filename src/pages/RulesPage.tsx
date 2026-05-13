import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Types ────────────────────────────────────────────────────────────────────

type Level = 'Beginner' | 'Intermediate'
type Tab = 'Scoring' | 'Rules' | 'Tips' | 'Drills' | 'Quiz'
type DrillCategory = 'All' | 'Warm-Up' | 'Net Play' | 'Wall Play' | 'Serve' | 'Fitness' | 'Tactics'

interface Drill {
  id: string
  emoji: string
  name: string
  category: Exclude<DrillCategory, 'All'>
  level: Level
  players: string
  durationMin: number
  description: string
  steps: string[]
  focus: string
}

// ─── Scoring Tab ──────────────────────────────────────────────────────────────

function ScoringTab({ level }: { level: Level }) {
  const points = ['0', '15', '30', '40', 'Game']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Points progression */}
      <div style={{ background: '#0d0d1e', border: '1px solid #252a38', borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#7878a8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
          Points Progression
        </div>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          {points.map((p, i) => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                background: i === points.length - 1 ? 'rgba(167,139,250,0.15)' : 'rgba(56,189,248,0.1)',
                border: `1px solid ${i === points.length - 1 ? 'rgba(167,139,250,0.4)' : 'rgba(56,189,248,0.25)'}`,
                borderRadius: 8, padding: '6px 12px',
                fontFamily: '"IBM Plex Mono"', fontWeight: 700,
                fontSize: 15, color: i === points.length - 1 ? '#a78bfa' : '#38bdf8',
              }}>{p}</div>
              {i < points.length - 1 && <span style={{ color: '#7878a8', fontSize: 14 }}>→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Deuce */}
      <div style={{ background: '#0d0d1e', border: '1px solid #252a38', borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#eeeeff', marginBottom: 6 }}>⚖️ Deuce</div>
        <div style={{ fontSize: 13, color: '#7878a8', lineHeight: 1.6 }}>
          When both players reach 40, it's <span style={{ color: '#a78bfa', fontWeight: 700 }}>Deuce</span>. Win 2 consecutive points to win the game.
        </div>
      </div>

      {/* Golden Point */}
      <div style={{ background: '#0d0d1e', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#a78bfa', marginBottom: 6 }}>✨ Golden Point</div>
        <div style={{ fontSize: 13, color: '#7878a8', lineHeight: 1.6 }}>
          Some matches use <span style={{ color: '#a78bfa', fontWeight: 700 }}>Golden Point</span> — at Deuce, the <span style={{ color: '#38bdf8' }}>RECEIVING</span> team chooses which side to receive from. Win that one point to win the game.
        </div>
      </div>

      {/* Games */}
      <div style={{ background: '#0d0d1e', border: '1px solid #252a38', borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#eeeeff', marginBottom: 6 }}>🎮 Games &amp; Sets</div>
        <div style={{ fontSize: 13, color: '#7878a8', lineHeight: 1.6 }}>
          First to <span style={{ color: '#a78bfa', fontWeight: 700 }}>6 games</span> wins the set. Must win by 2. At 6-6 → <span style={{ color: '#38bdf8', fontWeight: 700 }}>Tiebreak</span> (first to 7 points, win by 2).
        </div>
      </div>

      {/* Sets / Match */}
      <div style={{ background: '#0d0d1e', border: '1px solid #252a38', borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#eeeeff', marginBottom: 6 }}>🏆 Match Format</div>
        <div style={{ fontSize: 13, color: '#7878a8', lineHeight: 1.6 }}>
          <span style={{ color: '#a78bfa', fontWeight: 700 }}>Best of 3 sets</span> wins the match. Most recreational matches play best of 3.
        </div>
      </div>

      {/* Intermediate: Tiebreak details */}
      {level === 'Intermediate' && (
        <div style={{ background: '#0d0d1e', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(96,165,250,0.15)', color: '#60a5fa', borderRadius: 6, padding: '2px 7px', letterSpacing: '0.06em' }}>INTERMEDIATE</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#60a5fa' }}>Tiebreak Scoring</span>
          </div>
          <div style={{ fontSize: 13, color: '#7878a8', lineHeight: 1.7 }}>
            • Points count from <span style={{ color: '#eeeeff' }}>1, 2, 3…</span> (not 15, 30, 40)<br />
            • Serve alternates every <span style={{ color: '#eeeeff' }}>2 points</span> (first serve is 1 point)<br />
            • Switch ends after every <span style={{ color: '#eeeeff' }}>6 total points</span><br />
            • First to <span style={{ color: '#a78bfa', fontWeight: 700 }}>7 points</span>, must win by 2
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
      <line x1="10" y1="70" x2="210" y2="70" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4 2" />
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
      <text x="110" y="68" textAnchor="middle" fill="#a78bfa" fontSize="7" fontWeight="700">NET</text>
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
    <div style={{ background: '#0d0d1e', border: '1px solid #252a38', borderRadius: 14, overflow: 'hidden', marginBottom: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 20 }}>{emoji}</span>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#eeeeff' }}>{title}</span>
        <span style={{ fontSize: 16, color: '#7878a8', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 14px', fontSize: 13, color: '#7878a8', lineHeight: 1.7 }}>
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
          and each side has two <span style={{ color: '#eeeeff' }}>service boxes</span>.
        </div>
      </AccordionItem>

      <AccordionItem emoji="🎯" title="Serving">
        <div>
          • Serve must be hit <span style={{ color: '#a78bfa', fontWeight: 700 }}>underhand</span>, below hip height<br />
          • Ball must bounce in the <span style={{ color: '#eeeeff' }}>diagonal service box</span><br />
          • Server must stand behind the service line<br />
          • You get <span style={{ color: '#a78bfa', fontWeight: 700 }}>two attempts</span> (like tennis)<br />
          • Fault if the ball hits the fence <span style={{ color: '#f97316' }}>without bouncing</span> on the serve
        </div>
      </AccordionItem>

      <AccordionItem emoji="🧱" title="Wall Play">
        <div>
          • The ball can come off walls <span style={{ color: '#a78bfa', fontWeight: 700 }}>after bouncing</span> in the opponent's court<br />
          • You can play the ball off your own walls and send it back over the net<br />
          • A <span style={{ color: '#38bdf8' }}>let</span> is called if the ball hits the net post<br />
          • Walls are a strategic element — use them!
        </div>
      </AccordionItem>

      <AccordionItem emoji="🏆" title="Scoring a Point">
        <div>
          • Winner: opponent can't return the ball before it bounces twice<br />
          • Error: ball goes into the net or out of bounds <span style={{ color: '#f97316' }}>before bouncing</span><br />
          • Double bounce before the return = point lost<br />
          • Ball must land <span style={{ color: '#a78bfa' }}>inside</span> the court boundaries
        </div>
      </AccordionItem>

      <AccordionItem emoji="⚠️" title="Common Faults">
        <div>
          • Serve hit <span style={{ color: '#f97316' }}>above hip height</span><br />
          • Foot stepping into the court <span style={{ color: '#f97316' }}>during the serve</span><br />
          • Ball hits the fence <span style={{ color: '#f97316' }}>without bouncing</span> on serve<br />
          • Returning before the ball bounces (volley on serve return is allowed only if ball would go out)
        </div>
      </AccordionItem>

      {level === 'Intermediate' && (
        <div style={{ background: '#0d0d1e', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 14, padding: '14px 16px', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(96,165,250,0.15)', color: '#60a5fa', borderRadius: 6, padding: '2px 7px', letterSpacing: '0.06em' }}>INTERMEDIATE</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#60a5fa' }}>Specialty Shots</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#eeeeff', marginBottom: 3 }}>🏸 Bandeja</div>
              <div style={{ fontSize: 13, color: '#7878a8', lineHeight: 1.6 }}>
                A controlled overhead shot hit with slice. Keeps you at the net position instead of falling back. Used to neutralize lobs.
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#eeeeff', marginBottom: 3 }}>⚡ Vibora</div>
              <div style={{ fontSize: 13, color: '#7878a8', lineHeight: 1.6 }}>
                An aggressive overhead with topspin and side spin. More powerful than the bandeja, used to finish points from the net.
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#eeeeff', marginBottom: 3 }}>🔽 Bajada</div>
              <div style={{ fontSize: 13, color: '#7878a8', lineHeight: 1.6 }}>
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
      background: '#0d0d1e', border: '1px solid #252a38', borderRadius: 14,
      padding: '14px', display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ fontSize: 22 }}>{tip.emoji}</div>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#eeeeff' }}>{tip.title}</div>
      <div style={{ fontSize: 12, color: '#7878a8', lineHeight: 1.5 }}>{tip.desc}</div>
    </div>
  )
}

function TipsTab({ level }: { level: Level }) {
  const tips = level === 'Intermediate' ? [...beginnerTips, ...intermediateTips] : beginnerTips
  return (
    <div>
      {level === 'Intermediate' && (
        <div style={{ fontSize: 11, color: '#7878a8', marginBottom: 12 }}>
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
      <div style={{ background: '#0d0d1e', border: '1px solid #252a38', borderRadius: 16, padding: '28px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>
          {score === 5 ? '🏆' : score >= 3 ? '🌟' : '📚'}
        </div>
        <div style={{ fontFamily: '"IBM Plex Mono"', fontSize: 42, fontWeight: 800, color: '#a78bfa', marginBottom: 6 }}>
          {score}/5
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#eeeeff', marginBottom: 8 }}>{getMessage()}</div>
        <div style={{ fontSize: 13, color: '#7878a8', marginBottom: 24 }}>
          You answered {score} out of 5 questions correctly.
        </div>
        <button
          onClick={handleReset}
          style={{
            background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)',
            borderRadius: 10, padding: '12px 28px', color: '#a78bfa',
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
                ? (answers[i] === questions[i].correct ? '#34d399' : '#f97316')
                : i === currentQ ? '#a78bfa' : '#1e1e3c',
            }}
          />
        ))}
      </div>

      <div style={{ fontSize: 11, color: '#7878a8', marginBottom: 10, fontWeight: 600 }}>
        Question {currentQ + 1} of {questions.length}
      </div>

      <div style={{ background: '#0d0d1e', border: '1px solid #252a38', borderRadius: 14, padding: '16px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#eeeeff', lineHeight: 1.5, marginBottom: 16 }}>
          {q.q}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.options.map((opt, i) => {
            let borderColor = '#1e1e3c'
            let bgColor = 'transparent'
            let textColor = '#7878a8'

            if (hasAnswered) {
              if (i === q.correct) {
                borderColor = 'rgba(52,211,153,0.5)'
                bgColor = 'rgba(52,211,153,0.08)'
                textColor = '#34d399'
              } else if (i === chosen && chosen !== q.correct) {
                borderColor = 'rgba(251,113,133,0.5)'
                bgColor = 'rgba(251,113,133,0.08)'
                textColor = '#f97316'
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
                <span style={{ fontFamily: '"IBM Plex Mono"', color: '#7878a8', marginRight: 8 }}>
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
            borderRadius: 10, fontSize: 12, color: '#7878a8', lineHeight: 1.6,
          }}>
            <span style={{ fontWeight: 700, color: chosen === q.correct ? '#34d399' : '#f97316', marginRight: 6 }}>
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
            background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)',
            borderRadius: 10, padding: '14px', color: '#a78bfa',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {currentQ < questions.length - 1 ? 'Next Question →' : 'See Results'}
        </button>
      )}
    </div>
  )
}

// ─── Drills Data ─────────────────────────────────────────────────────────────

const ALL_DRILLS: Drill[] = [
  {
    id: 'd1', emoji: '🔄', name: 'Cross-Court Rally', category: 'Warm-Up', level: 'Beginner',
    players: '2 players', durationMin: 5,
    description: 'Warm up by keeping a cross-court rally going with your partner. Focus on consistency over power.',
    steps: [
      'Both players stand at the baseline on opposite sides',
      'Hit forehands cross-court to each other',
      'After 5 min, switch to backhands',
      'Count consecutive hits — beat your record each round',
    ],
    focus: 'Consistency · Footwork · Warm-up',
  },
  {
    id: 'd2', emoji: '🥅', name: 'Volley-Volley at Net', category: 'Warm-Up', level: 'Beginner',
    players: '2 players', durationMin: 3,
    description: 'Both players stand at the net and keep a soft volley exchange going without the ball touching the ground.',
    steps: [
      'Both players take position at the net (1m back)',
      'Start with a soft drop feed',
      'Volley back and forth — no bouncing allowed',
      'Mix forehand and backhand volleys',
    ],
    focus: 'Touch · Net control · Reactions',
  },
  {
    id: 'd3', emoji: '📦', name: 'Serve Box Target', category: 'Serve', level: 'Beginner',
    players: '1 player', durationMin: 10,
    description: 'Place a cone or racket cover in each corner of the service box. Hit 5 serves to each target.',
    steps: [
      'Place 2 targets in the service box diagonally opposite',
      'Serve underhand, aiming for each target alternately',
      'Track your hit rate — aim for 70%+',
      'Switch sides and repeat',
    ],
    focus: 'Serve accuracy · Placement · Consistency',
  },
  {
    id: 'd4', emoji: '🎯', name: '20 Second Serves', category: 'Serve', level: 'Intermediate',
    players: '1 player', durationMin: 10,
    description: 'Hit 20 second serves in a row without a double fault. Builds pressure-handling for crucial moments.',
    steps: [
      'Start each serve as if it\'s a second serve (first already faulted)',
      'Focus on controlled spin and placement, not power',
      'Count consecutive faults-free second serves',
      'Restart count from 0 if you fault — aim for 20 in a row',
    ],
    focus: 'Second serve · Mental pressure · Spin',
  },
  {
    id: 'd5', emoji: '🏹', name: 'Volley Accuracy Feed', category: 'Net Play', level: 'Beginner',
    players: '2 players', durationMin: 5,
    description: 'One player feeds from the baseline while the net player volleys to targets in the open court.',
    steps: [
      'Feeder stands at baseline with a basket of balls',
      'Net player takes position at the service box T',
      'Feeder sends medium-paced balls alternating sides',
      'Net player volleys cross-court and down-the-line alternately',
      'Switch roles after the basket is empty',
    ],
    focus: 'Volley placement · Net positioning · Direction',
  },
  {
    id: 'd6', emoji: '💥', name: 'Overhead Smash', category: 'Net Play', level: 'Intermediate',
    players: '2 players', durationMin: 5,
    description: 'Feeder lobs repeatedly while the net player practices smashes. Rotate between bandeja and vibora.',
    steps: [
      'Net player stands at the service line',
      'Feeder sends high lobs from the baseline',
      'Player smashes down the middle first, then to the sides',
      'Practice both bandeja (slice) and vibora (topspin) variations',
      'Switch after 15 attempts',
    ],
    focus: 'Smash technique · Bandeja · Overhead timing',
  },
  {
    id: 'd7', emoji: '🧱', name: 'Back Glass Control', category: 'Wall Play', level: 'Intermediate',
    players: '1–2 players', durationMin: 5,
    description: 'Hit the ball into the back glass and control the rebound. Builds the foundational wall-reading skill.',
    steps: [
      'Stand 2m in front of the back glass',
      'Hit a medium ball into the glass at waist height',
      'Let it bounce on the floor and come back to you',
      'Control it and repeat — don\'t let it bounce twice',
      'Progress to lower/higher contact points on the glass',
    ],
    focus: 'Wall reading · Depth perception · Control',
  },
  {
    id: 'd8', emoji: '📐', name: 'Side Glass Angles', category: 'Wall Play', level: 'Intermediate',
    players: '2 players', durationMin: 5,
    description: 'Practice hitting the side glass to create unreadable angles that force opponents out of position.',
    steps: [
      'Feeder stands at baseline, hitter at mid-court',
      'Feeder sends a cross-court ball',
      'Hitter redirects into the side glass at a sharp angle',
      'Both players observe the rebound trajectory',
      'Switch roles and repeat on both sides',
    ],
    focus: 'Angle creation · Side glass · Tactics',
  },
  {
    id: 'd9', emoji: '🏃', name: 'T-Position Reset', category: 'Fitness', level: 'Beginner',
    players: '2 players', durationMin: 5,
    description: 'After every shot, physically return to the T (center of service box) before the next ball arrives.',
    steps: [
      'Feeder sends balls to alternating corners',
      'After each shot, sprint back to the T marker',
      'Feeder waits 2–3 seconds before the next ball',
      'Progress to faster feeds as footwork improves',
    ],
    focus: 'Court coverage · Recovery · Positioning',
  },
  {
    id: 'd10', emoji: '💨', name: 'Lateral Shuffle', category: 'Fitness', level: 'Beginner',
    players: '1 player', durationMin: 3,
    description: 'Shuffle laterally across the baseline and back, 10 times, then do 5 forward sprints to the net and back.',
    steps: [
      'Start at one corner of the baseline',
      'Shuffle sideways to the other corner — no crossing feet',
      'Shuffle back — that\'s one rep',
      'Complete 10 reps, rest 30s, then 5 forward sprints to net and back',
    ],
    focus: 'Lateral speed · Agility · Explosiveness',
  },
  {
    id: 'd11', emoji: '🪂', name: 'Lob and Retreat', category: 'Tactics', level: 'Intermediate',
    players: '4 players', durationMin: 10,
    description: 'One team attacks from the net, the other defends from the back. Back team practices lobbing to push net players off.',
    steps: [
      'Team A at the net, Team B at the baseline',
      'Play out points — Team B can only lob or pass',
      'Team A must volley or smash everything',
      'Play to 7 points, then switch roles',
    ],
    focus: 'Lob depth · Defensive tactics · Net attack',
  },
  {
    id: 'd12', emoji: '⚡', name: 'Attack Together', category: 'Tactics', level: 'Intermediate',
    players: '4 players', durationMin: 10,
    description: 'Defense team practices transitioning from back to net together as a unit after a short ball or lob.',
    steps: [
      'Team A feeds from baseline, Team B defends from baseline',
      'On a short ball, both Team B players charge the net together',
      'Team A tries to pass or lob them back',
      'Point ends when Team B wins at net or Team A recovers',
      'Switch after 10 points',
    ],
    focus: 'Transition · Net attack · Partner sync',
  },
]

// ─── Drill Timer ──────────────────────────────────────────────────────────────

function DrillTimer({ drill, onClose }: { drill: Drill; onClose: () => void }) {
  const total = drill.durationMin * 60
  const [remaining, setRemaining] = useState(total)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          setRunning(false)
          setDone(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  const mins = String(Math.floor(remaining / 60)).padStart(2, '0')
  const secs = String(remaining % 60).padStart(2, '0')
  const pct = ((total - remaining) / total) * 100

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(8,9,13,0.96)', backdropFilter: 'blur(16px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>{drill.emoji}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#eeeeff', marginBottom: 4, textAlign: 'center' }}>{drill.name}</div>
      <div style={{ fontSize: 12, color: '#7878a8', marginBottom: 32 }}>{drill.focus}</div>

      {/* Circular progress ring */}
      <div style={{ position: 'relative', width: 160, height: 160, marginBottom: 28 }}>
        <svg viewBox="0 0 160 160" width={160} height={160} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={80} cy={80} r={68} fill="none" stroke="#1e2330" strokeWidth={10} />
          <circle
            cx={80} cy={80} r={68} fill="none"
            stroke={done ? '#34d399' : running ? '#a78bfa' : '#38bdf8'}
            strokeWidth={10}
            strokeDasharray={`${2 * Math.PI * 68}`}
            strokeDashoffset={`${2 * Math.PI * 68 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {done ? (
            <div style={{ fontSize: 40 }}>✅</div>
          ) : (
            <>
              <div style={{ fontFamily: '"IBM Plex Mono"', fontSize: 36, fontWeight: 800, color: '#eeeeff', letterSpacing: 2 }}>
                {mins}:{secs}
              </div>
              <div style={{ fontSize: 10, color: '#7878a8', marginTop: 2 }}>remaining</div>
            </>
          )}
        </div>
      </div>

      {done ? (
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#34d399', marginBottom: 6 }}>Drill Complete!</div>
          <div style={{ fontSize: 13, color: '#7878a8' }}>Great work — take a 60s rest before the next drill.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
          <button
            onClick={() => setRunning(r => !r)}
            style={{
              width: 64, height: 64, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: running ? '#f97316' : '#a78bfa', color: '#07070f',
              fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 20px ${running ? 'rgba(251,113,133,0.35)' : 'rgba(167,139,250,0.35)'}`,
            }}
          >{running ? '⏸' : '▶'}</button>
          <button
            onClick={() => { setRunning(false); setRemaining(total) }}
            style={{
              width: 44, height: 44, borderRadius: '50%', border: '1px solid #252a38',
              background: '#131428', cursor: 'pointer', color: '#7878a8', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
            }}
          >↺</button>
        </div>
      )}

      <button
        onClick={onClose}
        style={{
          padding: '12px 32px', borderRadius: 10,
          background: 'rgba(255,255,255,0.05)', border: '1px solid #252a38',
          color: '#7878a8', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}
      >Close Timer</button>
    </div>
  )
}

// ─── Drills Tab ───────────────────────────────────────────────────────────────

const CATEGORIES: DrillCategory[] = ['All', 'Warm-Up', 'Net Play', 'Wall Play', 'Serve', 'Fitness', 'Tactics']

const CAT_COLORS: Record<string, string> = {
  'Warm-Up': '#fbbf24', 'Net Play': '#34d399', 'Wall Play': '#38bdf8',
  'Serve': '#f97316', 'Fitness': '#f97316', 'Tactics': '#a78bfa',
}

function DrillCard({ drill, onStart }: { drill: Drill; onStart: (d: Drill) => void }) {
  const [expanded, setExpanded] = useState(false)
  const catColor = CAT_COLORS[drill.category] ?? '#a78bfa'
  return (
    <div style={{
      background: '#0d0d1e', border: '1px solid #252a38', borderRadius: 14,
      overflow: 'hidden', marginBottom: 10,
    }}>
      {/* Header row */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 26, flexShrink: 0 }}>{drill.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#eeeeff', marginBottom: 4 }}>{drill.name}</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: catColor,
              background: catColor + '18', border: `1px solid ${catColor}33`,
              borderRadius: 5, padding: '2px 7px',
            }}>{drill.category}</span>
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: drill.level === 'Beginner' ? '#a78bfa' : '#60a5fa',
              background: drill.level === 'Beginner' ? 'rgba(167,139,250,0.1)' : 'rgba(96,165,250,0.1)',
              borderRadius: 5, padding: '2px 7px',
            }}>{drill.level}</span>
            <span style={{ fontSize: 10, color: '#7878a8', padding: '2px 0' }}>
              {drill.players} · {drill.durationMin} min
            </span>
          </div>
        </div>
        <span style={{
          fontSize: 16, color: '#7878a8',
          transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0,
        }}>›</span>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #161922' }}>
          <p style={{ fontSize: 13, color: '#7878a8', lineHeight: 1.6, margin: '12px 0 10px' }}>
            {drill.description}
          </p>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7878a8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Steps</div>
          <ol style={{ margin: '0 0 12px', paddingLeft: 18 }}>
            {drill.steps.map((s, i) => (
              <li key={i} style={{ fontSize: 13, color: '#7878a8', lineHeight: 1.6, marginBottom: 4 }}>{s}</li>
            ))}
          </ol>
          <div style={{
            background: '#131428', borderRadius: 8, padding: '8px 12px', marginBottom: 14,
            fontSize: 11, color: '#7878a8',
          }}>
            <span style={{ fontWeight: 700, color: '#eeeeff' }}>Focus: </span>{drill.focus}
          </div>
          <button
            onClick={() => onStart(drill)}
            style={{
              width: '100%', padding: '13px', borderRadius: 10, cursor: 'pointer',
              background: catColor + '18', border: `1px solid ${catColor}44`,
              color: catColor, fontSize: 14, fontWeight: 700,
            } as React.CSSProperties}
          >
            ▶ Start {drill.durationMin}-min Timer
          </button>
        </div>
      )}
    </div>
  )
}

function DrillsTab({ level }: { level: Level }) {
  const [cat, setCat] = useState<DrillCategory>('All')
  const [activeDrill, setActiveDrill] = useState<Drill | null>(null)

  const visible = ALL_DRILLS.filter(d =>
    (cat === 'All' || d.category === cat) &&
    (level === 'Intermediate' || d.level === 'Beginner')
  )

  return (
    <div>
      {activeDrill && <DrillTimer drill={activeDrill} onClose={() => setActiveDrill(null)} />}

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 14, paddingBottom: 2 }}>
        {CATEGORIES.map(c => {
          const active = cat === c
          const color = c === 'All' ? '#a78bfa' : CAT_COLORS[c]
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              style={{
                flexShrink: 0, padding: '6px 13px', borderRadius: 20, cursor: 'pointer',
                background: active ? color + '20' : '#0d0d1e',
                color: active ? color : '#7878a8',
                border: active ? `1px solid ${color}55` : '1px solid #252a38',
                fontSize: 12, fontWeight: 700, fontFamily: '"DM Sans"',
              }}
            >{c}</button>
          )
        })}
      </div>

      {/* Count */}
      <div style={{ fontSize: 11, color: '#7878a8', marginBottom: 10 }}>
        {visible.length} drill{visible.length !== 1 ? 's' : ''}
        {level === 'Beginner' && <span> · Switch to Intermediate to unlock all drills</span>}
      </div>

      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#7878a8' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎾</div>
          <div style={{ fontSize: 14 }}>No drills in this category yet</div>
        </div>
      ) : (
        visible.map(d => <DrillCard key={d.id} drill={d} onStart={setActiveDrill} />)
      )}
    </div>
  )
}

// ─── Main RulesPage ───────────────────────────────────────────────────────────

export function RulesPage() {
  const navigate = useNavigate()
  const [level, setLevel] = useState<Level>('Beginner')
  const [tab, setTab] = useState<Tab>('Scoring')

  const tabs: Tab[] = ['Scoring', 'Rules', 'Tips', 'Drills', 'Quiz']

  return (
    <div style={{ background: '#07070f', minHeight: '100vh', paddingBottom: 40 }}>
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
            justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#eeeeff',
            flexShrink: 0,
          }}
        >
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#eeeeff' }}>Padel Rules</div>
          <div style={{ fontSize: 11, color: '#7878a8' }}>Learn &amp; master the game</div>
        </div>
        {/* Level selector */}
        <div style={{
          display: 'flex', background: '#0d0d1e', border: '1px solid #252a38',
          borderRadius: 10, overflow: 'hidden', flexShrink: 0,
        }}>
          {(['Beginner', 'Intermediate'] as Level[]).map(l => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              style={{
                padding: '6px 10px', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                background: level === l ? (l === 'Beginner' ? 'rgba(167,139,250,0.15)' : 'rgba(96,165,250,0.15)') : 'transparent',
                color: level === l ? (l === 'Beginner' ? '#a78bfa' : '#60a5fa') : '#7878a8',
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
        background: '#07070f', padding: '0 16px',
        position: 'sticky', top: 61, zIndex: 40,
      }}>
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '13px 4px', background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid #a78bfa' : '2px solid transparent',
              color: tab === t ? '#a78bfa' : '#7878a8',
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
        {tab === 'Drills' && <DrillsTab level={level} />}
        {tab === 'Quiz' && <QuizTab />}
      </div>
    </div>
  )
}
