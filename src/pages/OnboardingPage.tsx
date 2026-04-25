import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Language } from '../lib/types'
import { setPref } from '../lib/db'
import { useApp } from '../contexts/AppContext'
import { useI18n } from '../contexts/I18nContext'
import { C, F } from '../lib/design'

interface OnboardingPageProps {
  onDone: () => void
}

export function OnboardingPage({ onDone }: OnboardingPageProps) {
  const [screen, setScreen] = useState(0)
  const [name, setName] = useState('')
  const [side, setSide] = useState<'left' | 'right'>('left')
  const [lang, setLang] = useState<Language>('en')
  const { setMyName } = useApp()
  const { setLanguage, t } = useI18n()

  const handleDone = async () => {
    await Promise.all([
      setPref('onboardingDone', '1'),
      setPref('defaultPosition', side),
      name.trim() ? setPref('myName', name.trim()) : Promise.resolve(),
      setPref('language', lang),
    ])
    if (name.trim()) setMyName(name.trim())
    setLanguage(lang)
    onDone()
  }

  const btnStyle: React.CSSProperties = {
    width: '100%', padding: '16px', borderRadius: 14, border: 'none',
    background: C.accent, color: '#fff',
    fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: F.sans,
    boxShadow: `0 4px 16px ${C.accentDim}`,
  }

  const screens = [
    // ── Screen 0: Welcome ────────────────────────────────────────────────
    <motion.div
      key="s0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.25 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 28px 40px', textAlign: 'center', height: '100%' }}
    >
      {/* Logo mark */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 240, damping: 18 }}
        style={{
          width: 96, height: 96, borderRadius: 26,
          background: 'linear-gradient(135deg, #7c3aed, #38bdf8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 28, boxShadow: '0 0 48px rgba(124,58,237,0.4), 0 0 80px rgba(56,189,248,0.2)',
        }}
      >
        <span style={{ fontFamily: F.mono, fontWeight: 800, fontSize: 34, color: '#fff' }}>PP</span>
      </motion.div>

      <h1 style={{ fontSize: 30, fontWeight: 900, color: C.text, margin: '0 0 10px', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
        {t('welcomeTitle')}
      </h1>
      <p style={{ fontSize: 16, color: C.text2, margin: '0 0 40px', lineHeight: 1.6, maxWidth: 280 }}>
        {t('welcomeTagline')}
      </p>

      {/* Language selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 36, width: '100%', maxWidth: 280 }}>
        {(['en', 'es'] as Language[]).map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            style={{
              flex: 1, padding: '11px 0', borderRadius: 12,
              border: `2px solid ${lang === l ? C.accent : C.border}`,
              background: lang === l ? C.accentDim : C.surface,
              color: lang === l ? C.accentLight : C.text2,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {l === 'en' ? '🇬🇧 English' : '🇪🇸 Español'}
          </button>
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: 320 }}>
        <button onClick={() => setScreen(1)} style={btnStyle}>
          {lang === 'es' ? 'Continuar →' : 'Get Started →'}
        </button>
      </div>
    </motion.div>,

    // ── Screen 1: How you'll track ────────────────────────────────────────
    <motion.div
      key="s1"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.22 }}
      style={{ padding: '44px 24px 40px', display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <h2 style={{ fontSize: 26, fontWeight: 900, color: C.text, margin: '0 0 6px', letterSpacing: '-0.3px' }}>
        {t('howTrack')}
      </h2>
      <p style={{ fontSize: 14, color: C.text2, margin: '0 0 24px' }}>
        {lang === 'es' ? 'Tres formas de usar la app' : 'Three ways to use the app'}
      </p>

      {[
        { emoji: '📝', title: t('postMatchTitle'),       desc: t('postMatchDesc'),       color: C.win },
        { emoji: '📱', title: t('liveScorekeeperTitle'), desc: t('liveScorekeeperDesc'), color: C.teamA },
        { emoji: '🎙️', title: t('voiceTitle'),           desc: t('voiceDesc'),           color: C.accentLight },
      ].map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 + 0.1 }}
          style={{
            display: 'flex', gap: 14, marginBottom: 12,
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 14, padding: '14px 16px',
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `${item.color}15`,
            border: `1px solid ${item.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>
            {item.emoji}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{item.title}</div>
            <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.45 }}>{item.desc}</div>
          </div>
        </motion.div>
      ))}

      <div style={{ flex: 1 }} />
      <button onClick={() => setScreen(2)} style={{ ...btnStyle, marginTop: 16 }}>
        {lang === 'es' ? 'Continuar →' : 'Continue →'}
      </button>
    </motion.div>,

    // ── Screen 2: Profile ─────────────────────────────────────────────────
    <motion.div
      key="s2"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.22 }}
      style={{ padding: '44px 24px 40px', display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <h2 style={{ fontSize: 26, fontWeight: 900, color: C.text, margin: '0 0 6px', letterSpacing: '-0.3px' }}>
        {t('setupProfile')}
      </h2>
      <p style={{ fontSize: 14, color: C.text2, margin: '0 0 28px' }}>
        {lang === 'es' ? 'Personaliza tu experiencia' : 'Personalise your experience'}
      </p>

      <label style={{
        fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase',
        letterSpacing: '0.1em', display: 'block', marginBottom: 8,
      }}>
        {t('name')}
      </label>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder={t('namePlaceholder')}
        style={{
          width: '100%', background: C.elevated,
          border: `1px solid ${C.border}`,
          borderRadius: 12, padding: '14px 16px', color: C.text,
          fontSize: 16, fontFamily: F.sans, outline: 'none',
          marginBottom: 24,
        }}
        autoFocus
      />

      <label style={{
        fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase',
        letterSpacing: '0.1em', display: 'block', marginBottom: 10,
      }}>
        {t('preferredSide')}
      </label>
      <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
        {(['left', 'right'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSide(s)}
            style={{
              flex: 1, padding: '14px', borderRadius: 12,
              border: `2px solid ${side === s ? C.accent : C.border}`,
              background: side === s ? C.accentDim : C.surface,
              color: side === s ? C.accentLight : C.text2,
              fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {s === 'left' ? `← ${t('left')}` : `${t('right')} →`}
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }} />
      <button onClick={handleDone} style={btnStyle}>
        {t('getStarted')} 🏓
      </button>
    </motion.div>,
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: C.bg, zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {/* Progress indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingTop: 14, flexShrink: 0 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: i === screen ? 24 : 6, height: 6, borderRadius: 3,
            background: i === screen ? C.accent : C.border,
            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          }} />
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <AnimatePresence mode="wait">
          {screens[screen]}
        </AnimatePresence>
      </div>
    </div>
  )
}
