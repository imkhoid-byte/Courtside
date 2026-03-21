export type Surface = 'Hard' | 'Clay' | 'Grass' | 'Indoor'
export type MatchFormat = 1 | 3 | 5
export type MatchStatus = 'live' | 'complete' | 'abandoned'

export interface RallyEvent {
  id: string
  type: 'ace' | 'double_fault' | 'winner' | 'unforced_error'
  shot: 'forehand' | 'backhand' | 'serve' | 'volley' | 'overhead' | 'drop_shot'
  player: 1 | 2
  setIndex: number
  timestamp: number
}

export interface MatchStats {
  aces: number
  doubleFaults: number
  winners: number
  unforcedErrors: number
}

export interface Match {
  id: string
  p1: string
  p2: string
  format: MatchFormat
  surface: Surface
  sets: [number, number][]
  winner: 1 | 2 | null
  stats: [MatchStats, MatchStats]
  rallies: RallyEvent[]
  startTime: string
  endTime?: string
  status: MatchStatus
}

// Tennis game state
export type TennisPoints = 0 | 15 | 30 | 40
export type Player = 1 | 2

export interface GameScore {
  p1: number // raw points (0,1,2,3,4+)
  p2: number
  isTiebreak: boolean
}

export interface TennisState {
  // Match info
  p1: string
  p2: string
  format: MatchFormat
  surface: Surface

  // Score
  sets: [number, number][]        // completed set scores
  currentSet: [number, number]    // current set games
  gameScore: GameScore

  // Server
  server: Player                  // current server
  firstServer: Player             // who served first in match
  setFirstServer: Player          // who serves first in current set

  // Status
  status: 'playing' | 'complete'
  winner: Player | null

  // Match ID (for linking to DB)
  matchId: string
}
