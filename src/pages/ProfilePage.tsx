import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../contexts/AppContext'
import { getCompletedMatches, clearAllData, getPref, getAllPractices, getPlayerRating, DEFAULT_ELO } from '../lib/db'
import type { Match, Language } from '../lib/types'
import { useI18n } from '../contexts/I18nContext'

export function ProfilePage() {
  const { myName } = useApp()
  const { t, language, setLanguage } = useI18n()
  const [matches, setMatches] = useState<Match[]>([])
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [defaultScoring, setDefaultScoring] = useState('Golden Point')
  const [defaultPosition, setDefaultPosition] = useState('Right')
  const [myElo, setMyElo] = useState(DEFAULT_ELO)
  const [practiceHours, setPracticeHours] = useState(0)

  useEffect(() => {
    getCompletedMatches().then(setMatches)
    getPref('defaultScoring').then(v => { if (v) setDefaultScoring(v === 'golden_point' ? 'Golden Point' : 'Advantage') })
    getPref('defaultPosition').then(v => { if (v) setDefaultPosition(v === 'left' ? 'Left Side' : 'Right Side') })
    getAllPractices().then(p => setPracticeHours(Math.round(p.reduce((s, x) => s + x.duration, 0) / 60)))
    if (myName) getPlayerRating(myName).then(r => setMyElo(r.elo))
  }, [myName])

  const me = myName || 'You'
  const firstLetter = me[0]?.toUpperCase() || '?'

  const myMatches = matches.filter(m =>
    m.teamA.player1 === me || m.teamA.player2 === me ||
    m.teamB.player1 === me || m.teamB.player2 === me
  )
  const wins = myMatches.filter(m => {
    const inA = m.teamA.player1 === me || m.teamA.player2 === me
    return m.winner === (inA ? 'A' : 'B')
  }).length
  const winPct = myMatches.length ? Math.round((wins / myMatches.length) * 100) : 0

  const partnerCount: Record<string, number> = {}
  myMatches.forEach(m => {
    const inA = m.teamA.player1 === me || m.teamA.player2 === me
    const partner = inA
      ? (m.teamA.player1 === me ? m.teamA.player2 : m.teamA.player1)
      : (m.teamB.player1 === me ? m.teamB.player2 : m.teamB.player1)
    partnerCount[partner] = (partnerCount[partner] || 0) + 1
  })
  const favPartner = Object.entries(partnerCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
  const uniquePartners = Object.keys(partnerCount).length

  const venueCounts: Record<string, number> = {}
  myMatches.forEach(m => { if (m.venue) venueCounts[m.venue] = (venueCounts[m.venue] || 0) + 1 })
  const favVenue = Object.entries(venueCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  const handleReset = async () => {
    await clearAllData()
    setMatches([])
    setResetDone(true)
    setShowResetConfirm(false)
  }

  const eloColor = myElo >= 1200 ? '#fbbf24' : myElo >= 1100 ? '#34d399' : myElo >= 1000 ? '#bef264' : '#636b84'

  return (
    <div style={{ padding: '16px 16px 80px' }}>
      {/* Hero */}
      <div style={{
        background: '#0f1117', border: '1px solid #252a38', borderRadius: 14,
        padding: 24, marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, #bef264, #34d399)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
        }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: '#08090d', fontFamily: '"DM Sans"' }}>{firstLetter}</span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#e4e8f2', marginBottom: 2 }}>{me}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontFamily: '"IBM Plex Mono"', fontSize: 18, fontWeight: 800, color: eloColor }}>{myElo}</span>
          <span style={{ fontSize: 11, color: '#636b84' }}>ELO</span>
        </div>
        <div style={{ fontSize: 12, color: '#636b84' }}>
          {myElo >= 1200 ? '⭐ Advanced' : myElo >= 1100 ? '💪 Intermediate' : myElo >= 1000 ? '🎾 Developing' : '🌱 Beginner'}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 0, marginTop: 18, width: '100%', borderTop: '1px solid #252a38', paddingTop: 14 }}>
          {[
            { label: t('totalMatches'), value: String(myMatches.length) },
            { label: t('wins'), value: String(wins) },
            { label: t('winRatePct'), value: `${winPct}%` },
            { label: 'Partners', value: String(uniquePartners) },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center',
              borderRight: i < 3 ? '1px solid #252a38' : 'none',
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#e4e8f2', fontFamily: '"IBM Plex Mono"' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#636b84', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Extra stats */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, background: '#0f1117', border: '1px solid #252a38', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: 10, color: '#636b84', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{t('favoritePartner')}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#bef264' }}>{favPartner}</div>
        </div>
        <div style={{ flex: 1, background: '#0f1117', border: '1px solid #252a38', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: 10, color: '#636b84', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{t('favoriteVenue')}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#38bdf8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{favVenue}</div>
        </div>
      </div>

      {practiceHours > 0 && (
        <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: '#636b84', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{t('practiceHours')}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#a78bfa' }}>{practiceHours}h</div>
        </div>
      )}

      {/* Language */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
          {t('language')}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['en', 'es'] as Language[]).map(lang => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              style={{
                flex: 1, padding: '12px', borderRadius: 12,
                border: `2px solid ${language === lang ? '#bef264' : '#252a38'}`,
                background: language === lang ? 'rgba(190,242,100,0.08)' : '#0f1117',
                color: language === lang ? '#bef264' : '#636b84',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {lang === 'en' ? '🇬🇧 English' : '🇪🇸 Español'}
            </button>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Defaults</div>
        <div style={{ background: '#0f1117', border: '1px solid #252a38', borderRadius: 14, overflow: 'hidden' }}>
          {[
            { label: 'Scoring', value: defaultScoring },
            { label: 'Position', value: defaultPosition },
          ].map((row, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px',
              borderBottom: i === 0 ? '1px solid #252a38' : 'none',
            }}>
              <span style={{ fontSize: 14, color: '#e4e8f2', fontWeight: 500 }}>{row.label}</span>
              <span style={{ fontSize: 14, color: '#636b84' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => setShowResetConfirm(true)}
        style={{
          width: '100%', padding: '14px',
          background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.25)',
          borderRadius: 12, cursor: 'pointer',
          color: '#fb7185', fontSize: 14, fontWeight: 700, fontFamily: '"DM Sans"',
        }}
      >
        {t('resetData')}
      </button>

      {resetDone && <div style={{ textAlign: 'center', padding: 12, color: '#34d399', fontSize: 14 }}>All data cleared.</div>}

      <AnimatePresence>
        {showResetConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 150, backdropFilter: 'blur(4px)' }} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', background: '#0f1117', border: '1px solid #252a38', borderRadius: 16, padding: 24, zIndex: 151, width: '82%', maxWidth: 320 }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: '#e4e8f2', marginBottom: 8 }}>{t('resetData')}</div>
              <div style={{ fontSize: 13, color: '#636b84', marginBottom: 20 }}>{t('resetConfirm')}</div>
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
