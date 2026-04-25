import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { getCompletedMatches, clearAllData, getPref, getAllPractices, getPlayerRating, DEFAULT_ELO, exportAllData } from '../lib/db'
import { computeAchievements, getTier, getTierProgress, TIERS, RARITY_COLOR } from '../lib/achievements'
import type { Match, Language } from '../lib/types'
import type { AchievementResult } from '../lib/achievements'
import { useI18n } from '../contexts/I18nContext'
import { C, F } from '../lib/design'

// ─── Achievement card ─────────────────────────────────────────────────────────

function AchievementCard({ a }: { a: AchievementResult }) {
  const rarityColor = RARITY_COLOR[a.rarity]
  return (
    <div style={{
      background: a.unlocked ? C.surface : C.bg,
      border: `1px solid ${a.unlocked ? rarityColor + '44' : C.border}`,
      borderRadius: 12, padding: '10px 8px', textAlign: 'center',
      opacity: a.unlocked ? 1 : 0.4,
    }}>
      <div style={{ fontSize: 22, marginBottom: 5, filter: a.unlocked ? 'none' : 'grayscale(1)' }}>
        {a.unlocked ? a.emoji : '🔒'}
      </div>
      <div style={{ fontSize: 10, fontWeight: 800, color: a.unlocked ? rarityColor : C.text3, lineHeight: 1.3, marginBottom: 2 }}>
        {a.title}
      </div>
      <div style={{ fontSize: 9, color: C.text3, lineHeight: 1.3 }}>{a.desc}</div>
      {a.unlocked && (
        <div style={{ marginTop: 5, fontSize: 8, fontWeight: 700, color: rarityColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {a.rarity}
        </div>
      )}
    </div>
  )
}

// ─── Form dots ────────────────────────────────────────────────────────────────

function FormDots({ matches, myName }: { matches: Match[]; myName: string }) {
  const last5 = matches.slice(0, 5)
  if (last5.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 6 }}>
      {last5.map(m => {
        const inA = m.teamA.player1 === myName || m.teamA.player2 === myName
        const won = m.winner === (inA ? 'A' : 'B')
        return (
          <div key={m.id} style={{
            width: 20, height: 20, borderRadius: '50%',
            background: won ? C.winDim : C.lossDim,
            border: `1.5px solid ${won ? C.win + '60' : C.loss + '60'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 800, color: won ? C.win : C.loss,
          }}>{won ? 'W' : 'L'}</div>
        )
      })}
    </div>
  )
}

// ─── Tier progress ────────────────────────────────────────────────────────────

function TierProgress({ elo }: { elo: number }) {
  const tier = getTier(elo)
  const progress = getTierProgress(elo)
  const next = TIERS.find(t => t.minElo > tier.minElo)

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>{tier.emoji}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: tier.color }}>{tier.name}</span>
        </div>
        {next && (
          <span style={{ fontSize: 11, color: C.text3 }}>
            {next.minElo - elo}pts → {next.emoji} {next.name}
          </span>
        )}
      </div>
      <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: `linear-gradient(90deg, ${tier.color}80, ${tier.color})`,
          borderRadius: 3, transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  )
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

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
    a.download = `padelparty-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
    setExportDone(true)
    setTimeout(() => setExportDone(false), 3000)
  }

  const handleShare = async () => {
    const text = `🏓 ${me} | ${wins}W–${losses}L · ${winPct}% win rate | ELO ${myElo} ${tier.emoji} ${tier.name} | ${unlockedCount} achievements | #PadelParty`
    if (navigator.share) navigator.share({ text }).catch(() => {})
    else navigator.clipboard?.writeText(text)
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

  const SectionLabel = ({ children }: { children: string }) => (
    <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
      {children}
    </div>
  )

  return (
    <div style={{ padding: '16px 16px 96px', fontFamily: F.sans }}>

      {/* ── Hero card ─────────────────────────────────────────────────────── */}
      <div style={{
        background: C.surface, border: `1px solid ${tier.color}33`,
        borderRadius: 20, padding: '20px', marginBottom: 16,
        position: 'relative', overflow: 'hidden',
        boxShadow: `0 0 40px ${tier.color}0a`,
      }}>
        {/* Tier ambient glow */}
        <div style={{
          position: 'absolute', top: -30, right: -30, width: 120, height: 120,
          borderRadius: '50%', background: tier.color + '15', filter: 'blur(28px)',
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
              <span style={{ fontSize: 26, fontWeight: 800, color: C.bg }}>{firstLetter}</span>
            </div>
            <div style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 22, height: 22, borderRadius: '50%',
              background: C.surface, border: `1.5px solid ${tier.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
            }}>{tier.emoji}</div>
          </div>

          {/* Name + ELO */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 21, fontWeight: 800, color: C.text, marginBottom: 2, letterSpacing: '-0.3px' }}>{me}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 800, color: tier.color }}>{myElo}</span>
              <span style={{ fontSize: 11, color: C.text3 }}>ELO</span>
              {peakElo > myElo && (
                <span style={{ fontSize: 9, color: C.text3, background: C.elevated, borderRadius: 4, padding: '2px 5px' }}>
                  Peak {peakElo}
                </span>
              )}
            </div>
            <FormDots matches={myMatches} myName={me} />
          </div>

          {/* Share */}
          <button onClick={handleShare} style={{
            width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.border}`,
            background: C.elevated, cursor: 'pointer', color: C.text2, fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>↗</button>
        </div>

        {/* Tier progress */}
        <TierProgress elo={myElo} />

        {/* Stats row */}
        <div style={{ display: 'flex', marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
          {[
            { label: 'Matches', value: String(myMatches.length) },
            { label: 'Wins',    value: String(wins) },
            { label: 'Win %',   value: `${winPct}%` },
            { label: curStreak >= 2 ? (streakIsWin ? '🔥 Streak' : '💪 Streak') : 'Partners',
              value: curStreak >= 2 ? String(curStreak) : String(uniquePartners) },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 3 ? `1px solid ${C.border}` : 'none' }}>
              <div style={{ fontFamily: F.mono, fontSize: 17, fontWeight: 800, color: C.text }}>{s.value}</div>
              <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Achievements ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SectionLabel>Achievements</SectionLabel>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.accentLight, marginBottom: 10 }}>
              {unlockedCount}/{achievements.length}
            </span>
          </div>
          <div style={{ display: 'flex', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
            {(['all', 'unlocked'] as const).map(tab => (
              <button key={tab} onClick={() => setAchTab(tab)} style={{
                padding: '5px 10px', border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700,
                background: achTab === tab ? C.elevated : 'transparent',
                color: achTab === tab ? C.text : C.text3,
              }}>{tab === 'all' ? 'All' : 'Earned'}</button>
            ))}
          </div>
        </div>

        {displayedAchievements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: C.text2, fontSize: 13, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14 }}>
            Play matches to earn achievements 🏆
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {displayedAchievements.map(a => <AchievementCard key={a.id} a={a} />)}
          </div>
        )}
      </div>

      {/* ── Career highlights ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <SectionLabel>Career</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Favourite Partner', value: favPartner,            color: C.win },
            { label: 'Favourite Venue',   value: favVenue,              color: C.teamA },
            { label: 'Peak ELO',          value: String(peakElo),       color: C.gold },
            { label: 'Practice Hours',    value: practiceHours > 0 ? `${practiceHours}h` : '—', color: C.accentLight },
          ].map(c => (
            <div key={c.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: C.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{c.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: c.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pro upgrade banner ────────────────────────────────────────────── */}
      <div
        onClick={() => navigate('/pro')}
        style={{
          background: `linear-gradient(135deg, ${C.goldDim}, ${C.accentDim})`,
          border: `1px solid ${C.gold}40`,
          borderRadius: 16, padding: '16px', marginBottom: 16, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `linear-gradient(135deg, ${C.gold}, ${C.accentLight})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>⚡</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.gold, marginBottom: 2 }}>Padel Party Pro</div>
          <div style={{ fontSize: 12, color: C.text2 }}>Advanced analytics, insights & more</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.gold }}>$7.99</div>
          <div style={{ fontSize: 10, color: C.text3 }}>/month</div>
        </div>
      </div>

      {/* ── Language ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <SectionLabel>{t('language')}</SectionLabel>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['en', 'es'] as Language[]).map(lang => (
            <button key={lang} onClick={() => setLanguage(lang)} style={{
              flex: 1, padding: '12px', borderRadius: 12,
              border: `2px solid ${language === lang ? C.accent : C.border}`,
              background: language === lang ? C.accentDim : C.surface,
              color: language === lang ? C.accentLight : C.text2,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>
              {lang === 'en' ? '🇬🇧 English' : '🇪🇸 Español'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Settings ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <SectionLabel>Defaults</SectionLabel>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
          {[
            { label: 'Scoring',   value: defaultScoring },
            { label: 'Position',  value: defaultPosition },
          ].map((row, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px', borderBottom: i === 0 ? `1px solid ${C.border}` : 'none',
            }}>
              <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{row.label}</span>
              <span style={{ fontSize: 14, color: C.text2 }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Data ──────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <SectionLabel>Data</SectionLabel>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <button onClick={handleExport} disabled={exporting} style={{
            width: '100%', padding: '14px 16px', background: 'none', border: 'none',
            borderBottom: `1px solid ${C.border}`, cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>📤</span>
              <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>Export Data</span>
            </div>
            <span style={{ fontSize: 12, color: exportDone ? C.win : C.text2 }}>
              {exporting ? 'Exporting…' : exportDone ? 'Downloaded ✓' : 'Backup JSON'}
            </span>
          </button>
          <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>📊</span>
              <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{myMatches.length} matches stored</span>
            </div>
            <span style={{ fontSize: 12, color: C.text3 }}>Local</span>
          </div>
        </div>
      </div>

      {/* ── Danger zone ───────────────────────────────────────────────────── */}
      <button onClick={() => setShowResetConfirm(true)} style={{
        width: '100%', padding: '14px',
        background: C.lossDim, border: `1px solid ${C.loss}30`,
        borderRadius: 12, cursor: 'pointer', color: C.loss, fontSize: 14, fontWeight: 700,
      }}>{t('resetData')}</button>
      {resetDone && (
        <div style={{ textAlign: 'center', padding: 12, color: C.win, fontSize: 14 }}>All data cleared.</div>
      )}

      {/* ── Reset confirm modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showResetConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 150, backdropFilter: 'blur(6px)' }} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{
                position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
                background: C.elevated, border: `1px solid ${C.borderStrong}`,
                borderRadius: 20, padding: 24, zIndex: 151, width: '85%', maxWidth: 340,
                boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
              }}
            >
              <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 8, textAlign: 'center' }}>{t('resetData')}</div>
              <div style={{ fontSize: 13, color: C.text2, marginBottom: 20, textAlign: 'center' }}>{t('resetConfirm')}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowResetConfirm(false)} style={{
                  flex: 1, padding: '12px', background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 10, cursor: 'pointer', color: C.text2, fontSize: 14, fontWeight: 600,
                }}>{t('cancel')}</button>
                <button onClick={handleReset} style={{
                  flex: 1, padding: '12px', background: C.loss, border: 'none',
                  borderRadius: 10, cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 800,
                }}>Reset</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
