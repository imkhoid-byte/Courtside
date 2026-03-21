import type { TennisState, Player, MatchFormat, Surface, GameScore } from './types'

// Display helpers
export function displayPoints(rawPoints: number, isTiebreak: boolean): string {
  if (isTiebreak) return String(rawPoints)
  const map: Record<number, string> = { 0: '0', 1: '15', 2: '30', 3: '40' }
  return map[rawPoints] ?? '40'
}

export function getAdvantage(gs: GameScore): Player | null {
  if (gs.isTiebreak) return null
  if (gs.p1 < 3 || gs.p2 < 3) return null
  if (gs.p1 === gs.p2) return null
  return gs.p1 > gs.p2 ? 1 : 2
}

export function isDeuce(gs: GameScore): boolean {
  return !gs.isTiebreak && gs.p1 >= 3 && gs.p2 >= 3 && gs.p1 === gs.p2
}

// In deuce/ad territory (both at 40 or beyond)?
function isDeuceTerritory(gs: GameScore): boolean {
  return !gs.isTiebreak && gs.p1 >= 3 && gs.p2 >= 3
}

function isGameWon(gs: GameScore): Player | null {
  if (gs.isTiebreak) {
    const { p1, p2 } = gs
    if ((p1 >= 7 || p2 >= 7) && Math.abs(p1 - p2) >= 2) {
      return p1 > p2 ? 1 : 2
    }
    return null
  }
  const { p1, p2 } = gs
  // Once both reach 40 (3 raw points), need 2-point lead
  if (isDeuceTerritory(gs)) {
    if (p1 - p2 >= 2) return 1
    if (p2 - p1 >= 2) return 2
    return null
  }
  // Normal win: 4 points (past 40)
  if (p1 >= 4) return 1
  if (p2 >= 4) return 2
  return null
}

function isSetWon(games: [number, number]): Player | null {
  const [g1, g2] = games
  // Normal 6-x win (need at least 2 ahead)
  if (g1 >= 6 && g2 <= g1 - 2) return 1
  if (g2 >= 6 && g1 <= g2 - 2) return 2
  // 7-5 (ran away after 5-5)
  if (g1 === 7 && g2 === 5) return 1
  if (g2 === 7 && g1 === 5) return 2
  // Tiebreak win (7-6)
  if (g1 === 7 && g2 === 6) return 1
  if (g2 === 7 && g1 === 6) return 2
  return null
}

function needsTiebreak(games: [number, number]): boolean {
  return games[0] === 6 && games[1] === 6
}

function isMatchWon(completedSets: [number, number][], format: MatchFormat): Player | null {
  const setsToWin = Math.ceil(format / 2)
  let p1Sets = 0, p2Sets = 0
  for (const [s1, s2] of completedSets) {
    if (s1 > s2) p1Sets++
    else p2Sets++
  }
  if (p1Sets >= setsToWin) return 1
  if (p2Sets >= setsToWin) return 2
  return null
}

// Tiebreak serve rotation:
// firstServer serves point 0 (totalPoints=0 means next point to be served)
// After 1st point, other serves 2; then first serves 2; alternates every 2
export function tiebreakServer(firstServer: Player, totalPoints: number): Player {
  if (totalPoints === 0) return firstServer
  const other: Player = firstServer === 1 ? 2 : 1
  const block = Math.ceil(totalPoints / 2)
  return block % 2 === 0 ? firstServer : other
}

export function createMatch(
  p1: string,
  p2: string,
  format: MatchFormat,
  surface: Surface,
  matchId: string,
  firstServer: Player = 1,
): TennisState {
  return {
    p1,
    p2,
    format,
    surface,
    sets: [],
    currentSet: [0, 0],
    gameScore: { p1: 0, p2: 0, isTiebreak: false },
    server: firstServer,
    firstServer,
    setFirstServer: firstServer,
    status: 'playing',
    winner: null,
    matchId,
  }
}

export function scorePoint(state: TennisState, player: Player): TennisState {
  if (state.status === 'complete') return state

  const gs: GameScore = {
    ...state.gameScore,
    p1: player === 1 ? state.gameScore.p1 + 1 : state.gameScore.p1,
    p2: player === 2 ? state.gameScore.p2 + 1 : state.gameScore.p2,
  }

  const gameWinner = isGameWon(gs)

  if (gameWinner === null) {
    // Game still in progress — update server for tiebreak
    let server = state.server
    if (gs.isTiebreak) {
      server = tiebreakServer(state.setFirstServer, gs.p1 + gs.p2)
    }
    return { ...state, gameScore: gs, server }
  }

  // Game won — update set score
  const currentSet: [number, number] = [
    state.currentSet[0] + (gameWinner === 1 ? 1 : 0),
    state.currentSet[1] + (gameWinner === 2 ? 1 : 0),
  ]

  const other: Player = state.server === 1 ? 2 : 1

  // Check if set is won
  const setWinner = isSetWon(currentSet)

  if (setWinner === null) {
    // Set continues — check for tiebreak
    const isTb = needsTiebreak(currentSet)
    // In tiebreak, the player who would serve the next (13th) game serves first tiebreak point
    // That's 'other' (server just changed after the game)
    const newSetFirstServer: Player = isTb ? other : state.setFirstServer
    return {
      ...state,
      currentSet,
      gameScore: { p1: 0, p2: 0, isTiebreak: isTb },
      server: other,
      setFirstServer: newSetFirstServer,
    }
  }

  // Set won — add to completed sets
  const completedSets: [number, number][] = [...state.sets, currentSet]

  // Check match win
  const matchWinner = isMatchWon(completedSets, state.format)

  if (matchWinner !== null) {
    return {
      ...state,
      sets: completedSets,
      currentSet: [0, 0],
      gameScore: { p1: 0, p2: 0, isTiebreak: false },
      server: other,
      setFirstServer: other,
      status: 'complete',
      winner: matchWinner,
    }
  }

  // New set — after tiebreak, the player who DIDN'T serve first in the tiebreak serves first
  let newSetFirstServer: Player
  if (state.gameScore.isTiebreak) {
    // The tiebreak first server was state.setFirstServer
    // The other player starts the new set
    newSetFirstServer = state.setFirstServer === 1 ? 2 : 1
  } else {
    newSetFirstServer = other
  }

  return {
    ...state,
    sets: completedSets,
    currentSet: [0, 0],
    gameScore: { p1: 0, p2: 0, isTiebreak: false },
    server: newSetFirstServer,
    setFirstServer: newSetFirstServer,
    status: 'playing',
    winner: null,
  }
}
