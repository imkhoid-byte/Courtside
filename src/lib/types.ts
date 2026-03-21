export type PadelSurface = 'Indoor' | 'Outdoor' | 'Covered'
export type MatchStatus = 'live' | 'complete' | 'abandoned'
export type ScoringMode = 'advantage' | 'golden_point'
export type CourtSide = 'left' | 'right'
export type TeamId = 'A' | 'B'

export interface Team {
  player1: string
  player2: string
  side1: CourtSide
  side2: CourtSide
}

export interface RallyEvent {
  id: string
  type: 'ace' | 'double_fault' | 'winner' | 'unforced_error' | 'forced_error'
  shot:
    | 'forehand'
    | 'backhand'
    | 'serve'
    | 'volley'
    | 'smash'
    | 'lob'
    | 'bajada'
    | 'vibora'
    | 'bandeja'
    | 'wall_shot'
    | 'chiquita'
  player: string   // player name
  team: TeamId
  setIndex: number
  timestamp: number
}

export interface MatchStats {
  aces: number
  doubleFaults: number
  winners: number
  unforcedErrors: number
  smashes: number
  lobs: number
  wallShots: number
  bajadas: number
  viboras: number
}

function emptyStats(): MatchStats {
  return { aces: 0, doubleFaults: 0, winners: 0, unforcedErrors: 0, smashes: 0, lobs: 0, wallShots: 0, bajadas: 0, viboras: 0 }
}

export { emptyStats }

export interface Match {
  id: string
  teamA: Team
  teamB: Team
  surface: PadelSurface
  scoringMode: ScoringMode
  venue?: string
  sets: [number, number][]
  winner: TeamId | null
  server: 1 | 2 | 3 | 4       // index into serverOrder
  serverOrder: [string, string, string, string]
  stats: { A: MatchStats; B: MatchStats }
  rallies: RallyEvent[]
  startTime: string
  endTime?: string
  status: MatchStatus
}

// Padel game state (scoring engine)
export type TeamPlayer = 'A' | 'B'   // A = team A, B = team B

export interface GameScore {
  a: number   // raw points team A
  b: number   // raw points team B
  isTiebreak: boolean
}

export interface PadelState {
  teamA: Team
  teamB: Team
  surface: PadelSurface
  scoringMode: ScoringMode
  venue?: string

  sets: [number, number][]
  currentSet: [number, number]
  gameScore: GameScore

  // Serve rotation: 4 players cycle in fixed order
  serverOrder: [string, string, string, string]
  serverIndex: number       // 0-3 into serverOrder
  setFirstServerIndex: number

  status: 'playing' | 'complete'
  winner: TeamId | null
  matchId: string
}

// Helper to get all 4 player names in order (A1, B1, A2, B2 per padel convention)
export function getDefaultServerOrder(teamA: Team, teamB: Team): [string, string, string, string] {
  return [teamA.player1, teamB.player1, teamA.player2, teamB.player2]
}
