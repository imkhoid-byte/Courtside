import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import type { Match } from '../lib/types'
import { getLiveMatch, saveMatch, getPref } from '../lib/db'

export interface Toast {
  id: string
  message: string
}

interface AppContextValue {
  liveMatch: Match | null
  setLiveMatch: (m: Match | null) => void
  refreshLiveMatch: () => Promise<void>
  toasts: Toast[]
  showToast: (message: string) => void
  playerName: string
  setPlayerName: (name: string) => void
  newMatchOpen: boolean
  setNewMatchOpen: (open: boolean) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [liveMatch, setLiveMatchState] = useState<Match | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [playerName, setPlayerNameState] = useState<string>('')
  const [newMatchOpen, setNewMatchOpen] = useState(false)
  const toastTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    getLiveMatch().then(m => setLiveMatchState(m ?? null))
    getPref('playerName').then(n => { if (n) setPlayerNameState(n) })
  }, [])

  const refreshLiveMatch = useCallback(async () => {
    const m = await getLiveMatch()
    setLiveMatchState(m ?? null)
  }, [])

  const setLiveMatch = useCallback((m: Match | null) => {
    setLiveMatchState(m)
    if (m) saveMatch(m)
  }, [])

  const setPlayerName = useCallback((name: string) => {
    setPlayerNameState(name)
  }, [])

  const showToast = useCallback((message: string) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev.slice(-2), { id, message }])
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
      toastTimers.current.delete(id)
    }, 1800)
    toastTimers.current.set(id, timer)
  }, [])

  return (
    <AppContext.Provider value={{
      liveMatch, setLiveMatch, refreshLiveMatch,
      toasts, showToast,
      playerName, setPlayerName,
      newMatchOpen, setNewMatchOpen,
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
