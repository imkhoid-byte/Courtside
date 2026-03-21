export type PadelSurface = 'Indoor' | 'Outdoor' | 'Covered'
export type MatchStatus = 'live' | 'complete' | 'abandoned'
export type ScoringMode = 'advantage' | 'golden_point'
export type CourtSide = 'left' | 'right'
export type TeamId = 'A' | 'B'
export type Language = 'en' | 'es'
export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'windy' | 'night'

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
  player: string
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
  server: 1 | 2 | 3 | 4
  serverOrder: [string, string, string, string]
  stats: { A: MatchStats; B: MatchStats }
  rallies: RallyEvent[]
  startTime: string
  endTime?: string
  status: MatchStatus
  // Extended fields
  notes?: string
  duration?: number          // minutes
  weather?: Weather
  scorekeeperMode?: boolean
}

export type TeamPlayer = 'A' | 'B'

export interface GameScore {
  a: number
  b: number
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
  serverOrder: [string, string, string, string]
  serverIndex: number
  setFirstServerIndex: number
  status: 'playing' | 'complete'
  winner: TeamId | null
  matchId: string
  scorekeeperMode?: boolean
}

export function getDefaultServerOrder(teamA: Team, teamB: Team): [string, string, string, string] {
  return [teamA.player1, teamB.player1, teamA.player2, teamB.player2]
}

// ─── Tournament ────────────────────────────────────────────────────────────────

export type TournamentFormat = 'americano' | 'mexicano'

export interface TournamentCourt {
  courtNum: number
  teamA: [string, string]
  teamB: [string, string]
  scoreA?: number
  scoreB?: number
  completed: boolean
}

export interface TournamentRound {
  roundNum: number
  courts: TournamentCourt[]
  completed: boolean
}

export interface Tournament {
  id: string
  name: string
  format: TournamentFormat
  players: string[]
  rounds: TournamentRound[]
  scores: Record<string, number>
  status: 'active' | 'complete'
  createdAt: string
  completedAt?: string
  goldenPoint: boolean
  surface: PadelSurface
  venue?: string
}

// ─── Player Rating (ELO) ──────────────────────────────────────────────────────

export interface EloEntry {
  elo: number
  date: string
  matchId: string
  change: number
}

export interface PlayerRating {
  name: string
  elo: number
  matchCount: number
  winCount: number
  history: EloEntry[]
}

// ─── Practice ─────────────────────────────────────────────────────────────────

export interface Practice {
  id: string
  duration: number          // minutes
  shots: Partial<Record<RallyEvent['shot'], number>>
  notes?: string
  date: string              // ISO date
}
