import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Language } from '../lib/types'
import { setPref } from '../lib/db'
import { useApp } from '../contexts/AppContext'
import { useI18n } from '../contexts/I18nContext'

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

  const screens = [
    // Screen 0: Welcome
    <motion.div
      key="s0"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.22 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 32px 40px', textAlign: 'center', height: '100%' }}
    >
      {/* Logo animation */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
        style={{
          width: 88, height: 88, borderRadius: 24, background: 'linear-gradient(135deg, #bef264, #86efac)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 32, boxShadow: '0 0 40px rgba(190,242,100,0.3)',
        }}
      >
        <span style={{ fontFamily: '"IBM Plex Mono"', fontWeight: 800, fontSize: 32, color: '#08090d' }}>SC</span>
      </motion.div>

      <h1 style={{ fontSize: 28, fontWeight: 900, color: '#e4e8f2', margin: '0 0 12px', lineHeight: 1.2 }}>
        {t('welcomeTitle')}
      </h1>
      <p style={{ fontSize: 16, color: '#636b84', margin: '0 0 48px', lineHeight: 1.5 }}>
        {t('welcomeTagline')}
      </p>

      {/* Language toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
        {(['en', 'es'] as Language[]).map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            style={{
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: lang === l ? '#bef264' : '#161922',
              color: lang === l ? '#08090d' : '#636b84',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {l === 'en' ? '🇬🇧 English' : '🇪🇸 Español'}
          </button>
        ))}
      </div>

      <button
        onClick={() => setScreen(1)}
        style={{
          width: '100%', padding: '16px', borderRadius: 14, border: 'none',
          background: '#bef264', color: '#08090d',
          fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: '"DM Sans"',
        }}
      >
        {lang === 'es' ? 'Continuar →' : 'Continue →'}
      </button>
    </motion.div>,

    // Screen 1: How do you track?
    <motion.div
      key="s1"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.22 }}
      style={{ padding: '48px 24px 40px', display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <h2 style={{ fontSize: 24, fontWeight: 900, color: '#e4e8f2', margin: '0 0 24px', lineHeight: 1.2 }}>
        {t('howTrack')}
      </h2>

      {[
        {
          emoji: '📝',
          title: t('postMatchTitle'),
          desc: t('postMatchDesc'),
          color: '#bef264',
        },
        {
          emoji: '📱',
          title: t('liveScorekeeperTitle'),
          desc: t('liveScorekeeperDesc'),
          color: '#38bdf8',
        },
        {
          emoji: '🎙️',
          title: t('voiceTitle'),
          desc: t('voiceDesc'),
          color: '#a78bfa',
        },
      ].map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          style={{
            display: 'flex', gap: 14, marginBottom: 16,
            background: '#0f1117', border: '1px solid #252a38',
            borderRadius: 14, padding: '14px 16px',
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `${item.color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>
            {item.emoji}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e4e8f2', marginBottom: 4 }}>{item.title}</div>
            <div style={{ fontSize: 13, color: '#636b84', lineHeight: 1.4 }}>{item.desc}</div>
          </div>
        </motion.div>
      ))}

      <div style={{ flex: 1 }} />
      <button
        onClick={() => setScreen(2)}
        style={{
          width: '100%', padding: '16px', borderRadius: 14, border: 'none',
          background: '#bef264', color: '#08090d',
          fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: '"DM Sans"',
          marginTop: 24,
        }}
      >
        {lang === 'es' ? 'Continuar →' : 'Continue →'}
      </button>
    </motion.div>,

    // Screen 2: Profile setup
    <motion.div
      key="s2"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.22 }}
      style={{ padding: '48px 24px 40px', display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <h2 style={{ fontSize: 24, fontWeight: 900, color: '#e4e8f2', margin: '0 0 8px' }}>
        {t('setupProfile')}
      </h2>
      <p style={{ fontSize: 14, color: '#636b84', margin: '0 0 28px' }}>
        {lang === 'es' ? 'Personaliza tu experiencia' : 'Personalise your experience'}
      </p>

      <label style={{ fontSize: 11, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>
        {t('name')}
      </label>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder={t('namePlaceholder')}
        style={{
          width: '100%', background: '#161922', border: '1px solid #252a38',
          borderRadius: 10, padding: '13px 14px', color: '#e4e8f2',
          fontSize: 16, fontFamily: '"DM Sans"', outline: 'none',
          marginBottom: 24, boxSizing: 'border-box',
        }}
        autoFocus
      />

      <label style={{ fontSize: 11, fontWeight: 700, color: '#636b84', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>
        {t('preferredSide')}
      </label>
      <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
        {(['left', 'right'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSide(s)}
            style={{
              flex: 1, padding: '14px', borderRadius: 12, border: `2px solid ${side === s ? '#bef264' : '#252a38'}`,
              background: side === s ? 'rgba(190,242,100,0.08)' : '#0f1117',
              color: side === s ? '#bef264' : '#636b84',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {s === 'left' ? `← ${t('left')}` : `${t('right')} →`}
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }} />
      <button
        onClick={handleDone}
        style={{
          width: '100%', padding: '16px', borderRadius: 14, border: 'none',
          background: '#bef264', color: '#08090d',
          fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: '"DM Sans"',
        }}
      >
        {t('getStarted')} 🏓
      </button>
    </motion.div>,
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#08090d', zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {/* Progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, paddingTop: 16, flexShrink: 0 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: i === screen ? 20 : 6, height: 6, borderRadius: 3,
            background: i === screen ? '#bef264' : '#252a38',
            transition: 'all 0.25s',
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
