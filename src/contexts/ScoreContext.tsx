import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import type { PadelState, Match, RallyEvent, TeamPlayer, TeamId } from '../lib/types'
import { scorePoint } from '../lib/padel'
import { useApp } from './AppContext'
import { saveMatch } from '../lib/db'
import { nanoid } from 'nanoid'

const MAX_HISTORY = 50

interface ScoreContextValue {
  state: PadelState | null
  history: PadelState[]
  startMatch: (match: Match, state: PadelState) => void
  addPoint: (team: TeamPlayer) => void
  undo: () => void
  addRally: (event: Omit<RallyEvent, 'id' | 'setIndex' | 'timestamp'>) => void
  currentMatch: Match | null
  endMatch: (winner?: TeamId) => void
  clearMatch: () => void
}

const ScoreContext = createContext<ScoreContextValue | null>(null)

export function ScoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PadelState | null>(null)
  const [history, setHistory] = useState<PadelState[]>([])
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null)
  const { setLiveMatch } = useApp()
  const matchRef = useRef<Match | null>(null)

  const startMatch = useCallback((match: Match, initial: PadelState) => {
    setState(initial)
    setHistory([])
    setCurrentMatch(match)
    matchRef.current = match
    setLiveMatch(match)
  }, [setLiveMatch])

  const addPoint = useCallback((team: TeamPlayer) => {
    if (!state || !matchRef.current) return
    if (navigator.vibrate) navigator.vibrate(6)
    setHistory(prev => [...prev, state].slice(-MAX_HISTORY))

    const newState = scorePoint(state, team)
    setState(newState)

    const match = matchRef.current

    if (newState.status === 'complete') {
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
      const updated: Match = { ...match, sets: [...newState.sets] }
      matchRef.current = updated
      setCurrentMatch(updated)
      setLiveMatch(updated)
    }
  }, [state, setLiveMatch])

  const undo = useCallback(() => {
    if (history.length === 0) return
    setState(history[history.length - 1])
    setHistory(h => h.slice(0, -1))
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
    const statsA = { ...match.stats.A }
    const statsB = { ...match.stats.B }
    const target = event.team === 'A' ? statsA : statsB

    if (event.type === 'ace') target.aces++
    if (event.type === 'double_fault') target.doubleFaults++
    if (event.type === 'winner') target.winners++
    if (event.type === 'unforced_error') target.unforcedErrors++
    if (event.shot === 'smash') target.smashes++
    if (event.shot === 'lob') target.lobs++
    if (event.shot === 'wall_shot') target.wallShots++
    if (event.shot === 'bajada') target.bajadas++
    if (event.shot === 'vibora') target.viboras++

    const updated: Match = {
      ...match,
      rallies: [...match.rallies, rally],
      stats: { A: statsA, B: statsB },
    }
    matchRef.current = updated
    setCurrentMatch(updated)
    saveMatch(updated)
  }, [state])

  const endMatch = useCallback((forcedWinner?: TeamId) => {
    if (!matchRef.current) return
    const winner = forcedWinner ?? state?.winner ?? 'A'
    const ended: Match = {
      ...matchRef.current,
      winner,
      status: 'complete',
      endTime: new Date().toISOString(),
    }
    matchRef.current = ended
    setCurrentMatch(ended)
    saveMatch(ended)
    setLiveMatch(null)
    setState(null)
    setHistory([])
  }, [state, setLiveMatch])

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
