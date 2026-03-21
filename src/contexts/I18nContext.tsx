import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Language } from '../lib/types'
import { createTranslator, type TranslationKey } from '../lib/i18n'
import { getPref, setPref } from '../lib/db'

interface I18nContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    getPref('language').then(saved => {
      if (saved === 'en' || saved === 'es') setLanguageState(saved)
      else {
        // Auto-detect from browser
        const browserLang = navigator.language.toLowerCase()
        if (browserLang.startsWith('es')) setLanguageState('es')
      }
    })
  }, [])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    setPref('language', lang)
  }, [])

  const t = useCallback((key: TranslationKey) => {
    return createTranslator(language)(key)
  }, [language])

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
