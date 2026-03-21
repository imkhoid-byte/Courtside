import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import type { TennisState, Player, RallyEvent, MatchStats, Match } from '../lib/types'
import { scorePoint } from '../lib/tennis'
import { useApp } from './AppContext'
import { saveMatch } from '../lib/db'
import { nanoid } from 'nanoid'

const MAX_HISTORY = 50

interface ScoreContextValue {
  state: TennisState | null
  history: TennisState[]
  startMatch: (match: Match, state: TennisState) => void
  addPoint: (player: Player) => void
  undo: () => void
  addRally: (event: Omit<RallyEvent, 'id' | 'setIndex' | 'timestamp'>) => void
  currentMatch: Match | null
  endMatch: (winner?: 1 | 2) => void
  clearMatch: () => void
}

const ScoreContext = createContext<ScoreContextValue | null>(null)

export function ScoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TennisState | null>(null)
  const [history, setHistory] = useState<TennisState[]>([])
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null)
  const { setLiveMatch } = useApp()
  const matchRef = useRef<Match | null>(null)

  const startMatch = useCallback((match: Match, initial: TennisState) => {
    setState(initial)
    setHistory([])
    setCurrentMatch(match)
    matchRef.current = match
    setLiveMatch(match)
  }, [setLiveMatch])

  const addPoint = useCallback((player: Player) => {
    if (!state || !matchRef.current) return

    if (navigator.vibrate) navigator.vibrate(6)

    setHistory(prev => [...prev, state].slice(-MAX_HISTORY))

    const newState = scorePoint(state, player)
    setState(newState)

    const match = matchRef.current

    if (newState.status === 'complete') {
      // Auto-finalize match in DB
      const completedMatch: Match = {
        ...match,
        sets: [...newState.sets],
        winner: newState.winner,
        status: 'complete',
        endTime: new Date().toISOString(),
      }
      matchRef.current = completedMatch
      setCurrentMatch(completedMatch)
      saveMatch(completedMatch)
      setLiveMatch(null)
    } else {
      const updatedMatch: Match = { ...match, sets: [...newState.sets] }
      matchRef.current = updatedMatch
      setCurrentMatch(updatedMatch)
      setLiveMatch(updatedMatch)
    }
  }, [state, setLiveMatch])

  const undo = useCallback(() => {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setHistory(h => h.slice(0, -1))
    setState(prev)
  }, [history])

  const addRally = useCallback((event: Omit<RallyEvent, 'id' | 'setIndex' | 'timestamp'>) => {
    if (!state || !matchRef.current) return
    const rally: RallyEvent = {
      ...event,
      id: nanoid(),
      setIndex: state.sets.length,
      timestamp: Date.now(),
    }
    const match = matchRef.current
    const playerIdx = event.player - 1
    const stats: [MatchStats, MatchStats] = [
      { ...match.stats[0] },
      { ...match.stats[1] },
    ]
    if (event.type === 'ace') stats[playerIdx].aces++
    if (event.type === 'double_fault') stats[playerIdx].doubleFaults++
    if (event.type === 'winner') stats[playerIdx].winners++
    if (event.type === 'unforced_error') stats[playerIdx].unforcedErrors++

    const updatedMatch: Match = { ...match, rallies: [...match.rallies, rally], stats }
    matchRef.current = updatedMatch
    setCurrentMatch(updatedMatch)
    saveMatch(updatedMatch)
  }, [state])

  // Manual end (user clicks "End Match")
  const endMatch = useCallback((forcedWinner?: 1 | 2) => {
    if (!matchRef.current) return
    const winner = forcedWinner ?? state?.winner ?? 1
    const endedMatch: Match = {
      ...matchRef.current,
      winner,
      status: 'complete',
      endTime: new Date().toISOString(),
    }
    matchRef.current = endedMatch
    setCurrentMatch(endedMatch)
    saveMatch(endedMatch)
    setLiveMatch(null)
    setState(null)
    setHistory([])
  }, [state, setLiveMatch])

  // Clear state after viewing complete overlay
  const clearMatch = useCallback(() => {
    setState(null)
    setHistory([])
    setCurrentMatch(null)
    matchRef.current = null
  }, [])

  return (
    <ScoreContext.Provider value={{
      state, history, startMatch, addPoint, undo,
      addRally, currentMatch, endMatch, clearMatch,
    }}>
      {children}
    </ScoreContext.Provider>
  )
}

export function useScore() {
  const ctx = useContext(ScoreContext)
  if (!ctx) throw new Error('useScore must be used within ScoreProvider')
  return ctx
}
