import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { getCompletedMatches, clearAllData, getPref, getAllPractices, getPlayerRating, DEFAULT_ELO, exportAllData } from '../lib/db'
import { computeAchievements, getTier, getTierProgress, TIERS, RARITY_COLOR } from '../lib/achievements'
import type { Match, Language } from '../lib/types'
import type { AchievementResult } from '../lib/achievements'
import { useI18n } from '../contexts/I18nContext'

// ─── Tier badge ───────────────────────────────────────────────────────────────

function TierBadge({ elo }: { elo: number }) {
  const tier = getTier(elo)
  const progress = getTierProgress(elo)
  const next = TIERS.find(t => t.minElo > tier.minElo)

  return (
    <div style={{ width: '100%', marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18 }}>{tier.emoji}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: tier.color }}>{tier.name}</span>
        </div>
        {next && (
          <span style={{ fontSize: 11, color: '#636b84' }}>
            {next.minElo - elo} pts to {next.emoji} {next.name}
          </span>
        )}
      </div>
      <div style={{ height: 6, background: '#252a38', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: `linear-gradient(90deg, ${tier.color}88, ${tier.color})`,
          borderRadius: 3, transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  )
}

// ─── Achievement card ─────────────────────────────────────────────────────────

function AchievementCard({ a }: { a: AchievementResult }) {
  const rarityColor = RARITY_COLOR[a.rarity]
  return (
    <div style={{
      background: a.unlocked ? '#0f1117' : '#0a0c12',
      border: `1px solid ${a.unlocked ? rarityColor + '44' : '#1a1f2e'}`,
      borderRadius: 12, padding: '10px 8px', textAlign: 'center',
      opacity: a.unlocked ? 1 : 0.45,
      transition: 'all 0.2s',
    }}>
      <div style={{ fontSize: 22, marginBottom: 5, filter: a.unlocked ? 'none' : 'grayscale(1)' }}>
        {a.unlocked ? a.emoji : '🔒'}
      </div>
      <div style={{ fontSize: 10, fontWeight: 800, color: a.unlocked ? rarityColor : '#3a4055', lineHeight: 1.3, marginBottom: 2 }}>
        {a.title}
      </div>
      <div style={{ fontSize: 9, color: '#636b84', lineHeight: 1.3 }}>{a.desc}</div>
      {a.unlocked && (
        <div style={{
          marginTop: 5, fontSize: 8, fontWeight: 700, letterSpacing: '0.06em',
          color: rarityColor, textTransform: 'uppercase',
        }}>{a.rarity}</div>
      )}
    </div>
  )
}

// ─── Form guide (last 5 results) ─────────────────────────────────────────────

function FormGuide({ matches, myName }: { matches: Match[]; myName: string }) {
  const last5 = matches.slice(0, 5)
  if (last5.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 8 }}>
      <span style={{ fontSize: 10, color: '#636b84', marginRight: 2 }}>Form</span>
      {last5.map(m => {
        const inA = m.teamA.player1 === myName || m.teamA.player2 === myName
        const won = m.winner === (inA ? 'A' : 'B')
        return (
          <div key={m.id} style={{
            width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: won ? 'rgba(52,211,153,0.15)' : 'rgba(251,113,133,0.15)',
            border: `1.5px solid ${won ? '#34d399' : '#fb7185'}`,
            fontSize: 10, fontWeight: 800, color: won ? '#34d399' : '#fb7185',
          }}>{won ? 'W' : 'L'}</div>
        )
      })}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const { myName } = useApp()
  const { t, language, setLanguage } = useI18n()
  const navigate = useNavigate()
  const [matches, setMatches] = useState<Match[]>([])
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [defaultScoring, setDefaultScoring] = useState('Golden Point')
  const [defaultPosition, setDefaultPosition] = useState('Right')
  const [myElo, setMyElo] = useState(DEFAULT_ELO)
  const [peakElo, setPeakElo] = useState(DEFAULT_ELO)
  const [practiceHours, setPracticeHours] = useState(0)
  const [achievements, setAchievements] = useState<AchievementResult[]>([])
  const [achTab, setAchTab] = useState<'all' | 'unlocked'>('all')
  const [exporting, setExporting] = useState(false)
  const [exportDone, setExportDone] = useState(false)

  useEffect(() => {
    getCompletedMatches().then(m => {
      setMatches(m)
      if (myName) setAchievements(computeAchievements(m, myName))
    })
    getPref('defaultScoring').then(v => { if (v) setDefaultScoring(v === 'golden_point' ? 'Golden Point' : 'Advantage') })
    getPref('defaultPosition').then(v => { if (v) setDefaultPosition(v === 'left' ? 'Left' : 'Right') })
    getAllPractices().then(p => setPracticeHours(Math.round(p.reduce((s, x) => s + x.duration, 0) / 60)))
    if (myName) getPlayerRating(myName).then(r => {
      setMyElo(r.elo)
      const peak = r.history.reduce((best, h) => Math.max(best, h.elo), r.elo)
      setPeakElo(peak)
    })
  }, [myName])

  const me = myName || 'You'
  const firstLetter = me[0]?.toUpperCase() || '?'
  const tier = getTier(myElo)

  const myMatches = matches.filter(m =>
    m.teamA.player1 === me || m.teamA.player2 === me ||
    m.teamB.player1 === me || m.teamB.player2 === me
  )
  const getTeam = (m: Match) => (m.teamA.player1 === me || m.teamA.player2 === me) ? 'A' : 'B'
  const wins = myMatches.filter(m => m.winner === getTeam(m)).length
  const losses = myMatches.length - wins
  const winPct = myMatches.length ? Math.round((wins / myMatches.length) * 100) : 0

  // Current streak
  let curStreak = 0; let streakIsWin = true
  for (const m of myMatches) {
    const won = m.winner === getTeam(m)
    if (curStreak === 0) { streakIsWin = won; curStreak = 1 }
    else if (won === streakIsWin) curStreak++
    else break
  }

  const partnerCount: Record<string, number> = {}
  myMatches.forEach(m => {
    const inA = getTeam(m) === 'A'
    const partner = inA ? (m.teamA.player1 === me ? m.teamA.player2 : m.teamA.player1)
      : (m.teamB.player1 === me ? m.teamB.player2 : m.teamB.player1)
    if (partner) partnerCount[partner] = (partnerCount[partner] || 0) + 1
  })
  const favPartner = Object.entries(partnerCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
  const uniquePartners = Object.keys(partnerCount).length

  const venueCounts: Record<string, number> = {}
  myMatches.forEach(m => { if (m.venue) venueCounts[m.venue] = (venueCounts[m.venue] || 0) + 1 })
  const favVenue = Object.entries(venueCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  const unlockedCount = achievements.filter(a => a.unlocked).length

  const handleExport = async () => {
    setExporting(true)
    const json = await exportAllData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sidecourt-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
    setExportDone(true)
    setTimeout(() => setExportDone(false), 3000)
  }

  const handleShare = async () => {
    const text = `🏓 ${me} | ${wins}W–${losses}L · ${winPct}% win rate | ELO ${myElo} ${tier.emoji} ${tier.name} | ${unlockedCount} achievements`
    if (navigator.share) {
      navigator.share({ text }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(text)
    }
  }

  const handleReset = async () => {
    await clearAllData()
    setMatches([])
    setResetDone(true)
    setShowResetConfirm(false)
  }

  const displayedAchievements = achTab === 'unlocked'
    ? achievements.filter(a => a.unlocked)
    : achievements

  return (
    <div style={{ padding: '16px 16px 96px', fontFamily: '"DM Sans"' }}>

      {/* ── Hero card ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f1117 0%, #111827 100%)',
        border: '1px solid #252a38', borderRadius: 20, padding: '20px 20px 16px',
        marginBottom: 16, position: 'relative', overflow: 'hidden',
      }}>
        {/* Tier glow */}
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 140, height: 140,
          borderRadius: '50%', background: tier.color + '10', filter: 'blur(30px)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: `linear-gradient(135deg, ${tier.color}, ${tier.color}88)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${tier.color}55`,
            }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#08090d' }}>{firstLetter}</span>
            </div>
            <div style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 22, height: 22, borderRadius: '50%',
              background: '#0f1117', border: `1.5px solid ${tier.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
            }}>{tier.emoji}</div>
          </div>

          {/* Name + ELO */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#e4e8f2', marginBottom: 2 }}>{me}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: '"IBM Plex Mono"', fontSize: 16, fontWeight: 800, color: tier.color }}>{myElo}</span>
              <span style={{ fontSize: 11, color: '#636b84' }}>ELO</span>
              {peakElo > myElo && (
                <span style={{ fontSize: 10, color: '#636b84', background: '#161922', borderRadius: 5, padding: '2px 6px' }}>
                  Peak {peakElo}
                </span>
              )}
            </div>
            <FormGuide matches={myMatches} myName={me} />
          </div>

          {/* Share button */}
          <button onClick={handleShare} style={{
            width: 34, height: 34, borderRadius: 8, border: '1px solid #252a38',
            background: '#161922', cursor: 'pointer', color: '#636b84', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>↗</button>
        </div>

        {/* Tier progress */}
        <TierBadge elo={myElo} />

        {/* Stats row */}
        <div style={{ display: 'flex', marginTop: 16, paddingTop: 14, borderTop: '1px solid #1e2330' }}>
          {[
            { label: 'Matches', value: String(myMatches.length) },
            { label: 'Wins', value: String(wins) },
            { label: 'Win %', value: `${winPct}%` },
            { label: curStreak >= 2 ? (streakIsWin ? '🔥 Streak' : '💪 Streak') : 'Partners', value: curStreak >= 2 ? String(curStreak) : String(uniquePartners) },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 3 ? '1px solid #1e2330' : 'none' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#e4e8f2', fontFamily: '"IBM Plex Mono"' }}>{s.value}</div>
              <div style={{ fontSize: 9, color: '#636b84', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Achievements ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Achievements
            </span>
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: '#bef264' }}>
              {unlockedCount}/{achievements.length}
            </span>
          </div>
          <div style={{ display: 'flex', background: '#0f1117', border: '1px solid #252a38', borderRadius: 8, overflow: 'hidden' }}>
            {(['all', 'unlocked'] as const).map(tab => (
              <button key={tab} onClick={() => setAchTab(tab)} style={{
                padding: '5px 10px', border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700,
                background: achTab === tab ? '#252a38' : 'transparent',
                color: achTab === tab ? '#e4e8f2' : '#636b84',
              }}>{tab === 'all' ? 'All' : 'Earned'}</button>
            ))}
          </div>
        </div>

        {displayedAchievements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#636b84', fontSize: 13 }}>
            Play matches to earn achievements!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {displayedAchievements.map(a => <AchievementCard key={a.id} a={a} />)}
          </div>
        )}
      </div>

      {/* ── Career highlights ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Career</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Favourite Partner', value: favPartner, color: '#bef264' },
            { label: 'Favourite Venue', value: favVenue, color: '#38bdf8' },
            { label: 'Peak ELO', value: String(peakElo), color: '#fbbf24' },
            { label: 'Practice Hours', value: practiceHours > 0 ? `${practiceHours}h` : '—', color: '#a78bfa' },
          ].map(c => (
            <div key={c.label} style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: '#636b84', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: c.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pro upgrade banner ── */}
      <div
        onClick={() => navigate('/pro')}
        style={{
          background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(167,139,250,0.06))',
          border: '1px solid rgba(251,191,36,0.25)',
          borderRadius: 16, padding: '16px', marginBottom: 16, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg, #fbbf24, #a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>⚡</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fbbf24', marginBottom: 2 }}>Padel Party Pro</div>
          <div style={{ fontSize: 12, color: '#636b84' }}>Advanced analytics, insights & more</div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#fbbf24', textAlign: 'right', flexShrink: 0 }}>
          <div>$7.99</div>
          <div style={{ fontSize: 10, color: '#636b84', fontWeight: 400 }}>/month</div>
        </div>
      </div>

      {/* ── Data & settings ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Data</div>
        <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, overflow: 'hidden' }}>
          <button onClick={handleExport} disabled={exporting} style={{
            width: '100%', padding: '14px 16px', background: 'none', border: 'none',
            borderBottom: '1px solid #161922', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>📤</span>
              <span style={{ fontSize: 14, color: '#e4e8f2', fontWeight: 500 }}>Export Data</span>
            </div>
            <span style={{ fontSize: 12, color: exportDone ? '#34d399' : '#636b84' }}>
              {exporting ? 'Exporting…' : exportDone ? 'Downloaded ✓' : 'Backup JSON'}
            </span>
          </button>
          <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>📊</span>
              <span style={{ fontSize: 14, color: '#e4e8f2', fontWeight: 500 }}>{myMatches.length} matches stored</span>
            </div>
            <span style={{ fontSize: 12, color: '#636b84' }}>IndexedDB</span>
          </div>
        </div>
      </div>

      {/* ── Language ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>{t('language')}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['en', 'es'] as Language[]).map(lang => (
            <button key={lang} onClick={() => setLanguage(lang)} style={{
              flex: 1, padding: '12px', borderRadius: 12,
              border: `2px solid ${language === lang ? '#bef264' : '#252a38'}`,
              background: language === lang ? 'rgba(190,242,100,0.08)' : '#0f1117',
              color: language === lang ? '#bef264' : '#636b84',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>
              {lang === 'en' ? '🇬🇧 English' : '🇪🇸 Español'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Settings ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Defaults</div>
        <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, overflow: 'hidden' }}>
          {[
            { label: 'Scoring', value: defaultScoring },
            { label: 'Position', value: defaultPosition },
          ].map((row, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px', borderBottom: i === 0 ? '1px solid #252a38' : 'none',
            }}>
              <span style={{ fontSize: 14, color: '#e4e8f2', fontWeight: 500 }}>{row.label}</span>
              <span style={{ fontSize: 14, color: '#636b84' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Danger zone ── */}
      <button onClick={() => setShowResetConfirm(true)} style={{
        width: '100%', padding: '14px',
        background: 'rgba(251,113,133,0.06)', border: '1px solid rgba(251,113,133,0.2)',
        borderRadius: 12, cursor: 'pointer', color: '#fb7185', fontSize: 14, fontWeight: 700,
      }}>{t('resetData')}</button>
      {resetDone && <div style={{ textAlign: 'center', padding: 12, color: '#34d399', fontSize: 14 }}>All data cleared.</div>}

      <AnimatePresence>
        {showResetConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 150, backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', background: '#0f1117', border: '1px solid #252a38', borderRadius: 20, padding: 24, zIndex: 151, width: '85%', maxWidth: 340 }}>
              <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#e4e8f2', marginBottom: 8, textAlign: 'center' }}>{t('resetData')}</div>
              <div style={{ fontSize: 13, color: '#636b84', marginBottom: 20, textAlign: 'center' }}>{t('resetConfirm')}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowResetConfirm(false)}
                  style={{ flex: 1, padding: '12px', background: '#161922', border: '1px solid #252a38', borderRadius: 10, cursor: 'pointer', color: '#949cb4', fontSize: 14, fontWeight: 600 }}>
                  {t('cancel')}
                </button>
                <button onClick={handleReset}
                  style={{ flex: 1, padding: '12px', background: '#fb7185', border: 'none', borderRadius: 10, cursor: 'pointer', color: '#08090d', fontSize: 14, fontWeight: 800 }}>
                  Reset
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
