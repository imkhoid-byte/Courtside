import type { PadelState, GameScore, TeamId, TeamPlayer, Team, PadelSurface, ScoringMode } from './types'
import { getDefaultServerOrder } from './types'

// ─── Display helpers ────────────────────────────────────────────────────────

export function displayPoints(raw: number, isTiebreak: boolean): string {
  if (isTiebreak) return String(raw)
  const map: Record<number, string> = { 0: '0', 1: '15', 2: '30', 3: '40' }
  return map[raw] ?? '40'
}

export function isDeuce(gs: GameScore, scoringMode: ScoringMode): boolean {
  if (gs.isTiebreak) return false
  if (scoringMode === 'golden_point') return false  // golden point has no "deuce" state
  return gs.a >= 3 && gs.b >= 3 && gs.a === gs.b
}

export function isGoldenPoint(gs: GameScore, scoringMode: ScoringMode): boolean {
  // Golden point fires when BOTH teams reach 40 (3 raw points) — it's deuce-but-sudden-death
  return scoringMode === 'golden_point' && !gs.isTiebreak && gs.a >= 3 && gs.b >= 3 && gs.a === gs.b
}

export function getAdvantage(gs: GameScore, scoringMode: ScoringMode): TeamPlayer | null {
  if (gs.isTiebreak || scoringMode === 'golden_point') return null
  if (gs.a < 3 || gs.b < 3) return null
  if (gs.a === gs.b) return null
  return gs.a > gs.b ? 'A' : 'B'
}

// ─── Internal scoring helpers ───────────────────────────────────────────────

function isGameWon(gs: GameScore, scoringMode: ScoringMode): TeamPlayer | null {
  if (gs.isTiebreak) {
    const { a, b } = gs
    if ((a >= 7 || b >= 7) && Math.abs(a - b) >= 2) return a > b ? 'A' : 'B'
    return null
  }

  const { a, b } = gs

  if (scoringMode === 'golden_point') {
    // At 3-3 (deuce), next point wins immediately — no advantage
    if (a >= 3 && b >= 3) {
      if (a !== b) return a > b ? 'A' : 'B'
      return null  // still tied at exactly 3-3, need one more
    }
    if (a >= 4) return 'A'
    if (b >= 4) return 'B'
    return null
  }

  // Standard advantage scoring
  if (a >= 3 && b >= 3) {
    if (a - b >= 2) return 'A'
    if (b - a >= 2) return 'B'
    return null
  }
  if (a >= 4) return 'A'
  if (b >= 4) return 'B'
  return null
}

function isSetWon(games: [number, number]): TeamPlayer | null {
  const [ga, gb] = games
  if (ga >= 6 && gb <= ga - 2) return 'A'
  if (gb >= 6 && ga <= gb - 2) return 'B'
  if (ga === 7 && gb === 5) return 'A'
  if (gb === 7 && ga === 5) return 'B'
  if (ga === 7 && gb === 6) return 'A'
  if (gb === 7 && ga === 6) return 'B'
  return null
}

function needsTiebreak(games: [number, number]): boolean {
  return games[0] === 6 && games[1] === 6
}

function isMatchWon(completedSets: [number, number][]): TeamPlayer | null {
  // Padel is always best of 3
  let aSets = 0, bSets = 0
  for (const [sa, sb] of completedSets) {
    if (sa > sb) aSets++
    else bSets++
  }
  if (aSets >= 2) return 'A'
  if (bSets >= 2) return 'B'
  return null
}

// ─── 4-player serve rotation ────────────────────────────────────────────────
// In tiebreak, same 4-player rotation: first server serves pt 0, then every 2 pts

export function tiebreakServerIndex(firstIndex: number, totalPoints: number): number {
  if (totalPoints === 0) return firstIndex
  const block = Math.ceil(totalPoints / 2)
  return (firstIndex + block) % 4
}

// ─── Factory ────────────────────────────────────────────────────────────────

export function createPadelMatch(
  teamA: Team,
  teamB: Team,
  surface: PadelSurface,
  scoringMode: ScoringMode,
  matchId: string,
  venue?: string,
  firstServerIndex: 0 | 1 | 2 | 3 = 0,
): PadelState {
  const serverOrder = getDefaultServerOrder(teamA, teamB)
  return {
    teamA,
    teamB,
    surface,
    scoringMode,
    venue,
    sets: [],
    currentSet: [0, 0],
    gameScore: { a: 0, b: 0, isTiebreak: false },
    serverOrder,
    serverIndex: firstServerIndex,
    setFirstServerIndex: firstServerIndex,
    status: 'playing',
    winner: null,
    matchId,
  }
}

// ─── Core scoring function ───────────────────────────────────────────────────

export function scorePoint(state: PadelState, team: TeamPlayer): PadelState {
  if (state.status === 'complete') return state

  const gs: GameScore = {
    ...state.gameScore,
    a: team === 'A' ? state.gameScore.a + 1 : state.gameScore.a,
    b: team === 'B' ? state.gameScore.b + 1 : state.gameScore.b,
  }

  const gameWinner = isGameWon(gs, state.scoringMode)

  if (gameWinner === null) {
    // Game in progress — update server for tiebreak
    let serverIndex = state.serverIndex
    if (gs.isTiebreak) {
      serverIndex = tiebreakServerIndex(state.setFirstServerIndex, gs.a + gs.b)
    }
    return { ...state, gameScore: gs, serverIndex }
  }

  // Game won — update set
  const currentSet: [number, number] = [
    state.currentSet[0] + (gameWinner === 'A' ? 1 : 0),
    state.currentSet[1] + (gameWinner === 'B' ? 1 : 0),
  ]

  const nextServerIndex = (state.serverIndex + 1) % 4

  const setWinner = isSetWon(currentSet)

  if (setWinner === null) {
    const isTb = needsTiebreak(currentSet)
    const newSetFirstServerIndex = isTb ? nextServerIndex : state.setFirstServerIndex
    return {
      ...state,
      currentSet,
      gameScore: { a: 0, b: 0, isTiebreak: isTb },
      serverIndex: nextServerIndex,
      setFirstServerIndex: newSetFirstServerIndex,
    }
  }

  // Set won
  const completedSets: [number, number][] = [...state.sets, currentSet]
  const matchWinner = isMatchWon(completedSets)

  if (matchWinner !== null) {
    return {
      ...state,
      sets: completedSets,
      currentSet: [0, 0],
      gameScore: { a: 0, b: 0, isTiebreak: false },
      serverIndex: nextServerIndex,
      setFirstServerIndex: nextServerIndex,
      status: 'complete',
      winner: matchWinner as TeamId,
    }
  }

  // New set
  let newSetFirstServerIndex: number
  if (state.gameScore.isTiebreak) {
    newSetFirstServerIndex = (state.setFirstServerIndex + 1) % 4
  } else {
    newSetFirstServerIndex = nextServerIndex
  }

  return {
    ...state,
    sets: completedSets,
    currentSet: [0, 0],
    gameScore: { a: 0, b: 0, isTiebreak: false },
    serverIndex: newSetFirstServerIndex,
    setFirstServerIndex: newSetFirstServerIndex,
    status: 'playing',
    winner: null,
  }
}
