import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import type { Match } from '../lib/types'
import { getLiveMatch, saveMatch, getPref, setPref } from '../lib/db'
import { DEFAULT_RULES } from '../lib/party'
import type { DrinkRule } from '../lib/party'

export interface Toast {
  id: string
  message: string
}

export type FabOption = 'live' | 'log' | 'tournament' | null

interface AppContextValue {
  liveMatch: Match | null
  setLiveMatch: (m: Match | null) => void
  refreshLiveMatch: () => Promise<void>
  toasts: Toast[]
  showToast: (message: string) => void
  myName: string
  setMyName: (name: string) => void
  newMatchOpen: boolean
  setNewMatchOpen: (open: boolean) => void
  fabMenuOpen: boolean
  setFabMenuOpen: (open: boolean) => void
  fabOption: FabOption
  setFabOption: (opt: FabOption) => void
  // Party
  partyMode: boolean
  setPartyMode: (on: boolean) => void
  partyRules: DrinkRule[]
  setPartyRules: (rules: DrinkRule[]) => void
  drinkCounts: Record<string, number>
  addDrinks: (player: string, sips: number) => void
  resetDrinks: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [liveMatch, setLiveMatchState] = useState<Match | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [myName, setMyNameState] = useState<string>('')
  const [newMatchOpen, setNewMatchOpen] = useState(false)
  const [fabMenuOpen, setFabMenuOpen] = useState(false)
  const [fabOption, setFabOption] = useState<FabOption>(null)
  const [partyMode, setPartyModeState] = useState(false)
  const [partyRules, setPartyRulesState] = useState<DrinkRule[]>(DEFAULT_RULES)
  const [drinkCounts, setDrinkCounts] = useState<Record<string, number>>({})
  const toastTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    getLiveMatch().then(m => setLiveMatchState(m ?? null))
    getPref('myName').then(n => { if (n) setMyNameState(n) })
    getPref('partyMode').then(v => { if (v === '1') setPartyModeState(true) })
    getPref('partyRules').then(v => {
      if (v) {
        try { setPartyRulesState(JSON.parse(v) as DrinkRule[]) } catch { /* use defaults */ }
      }
    })
  }, [])

  const refreshLiveMatch = useCallback(async () => {
    const m = await getLiveMatch()
    setLiveMatchState(m ?? null)
  }, [])

  const setLiveMatch = useCallback((m: Match | null) => {
    setLiveMatchState(m)
    if (m) saveMatch(m)
  }, [])

  const setMyName = useCallback((name: string) => {
    setMyNameState(name)
  }, [])

  const showToast = useCallback((message: string) => {
    const id = Date.now().toString() + Math.random()
    setToasts(prev => [...prev.slice(-2), { id, message }])
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
      toastTimers.current.delete(id)
    }, 1900)
    toastTimers.current.set(id, timer)
  }, [])

  const setPartyMode = useCallback((on: boolean) => {
    setPartyModeState(on)
    setPref('partyMode', on ? '1' : '0')
  }, [])

  const setPartyRules = useCallback((rules: DrinkRule[]) => {
    setPartyRulesState(rules)
    setPref('partyRules', JSON.stringify(rules))
  }, [])

  const addDrinks = useCallback((player: string, sips: number) => {
    setDrinkCounts(prev => ({ ...prev, [player]: (prev[player] ?? 0) + sips }))
  }, [])

  const resetDrinks = useCallback(() => setDrinkCounts({}), [])

  return (
    <AppContext.Provider value={{
      liveMatch, setLiveMatch, refreshLiveMatch,
      toasts, showToast,
      myName, setMyName,
      newMatchOpen, setNewMatchOpen,
      fabMenuOpen, setFabMenuOpen,
      fabOption, setFabOption,
      partyMode, setPartyMode,
      partyRules, setPartyRules,
      drinkCounts, addDrinks, resetDrinks,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
