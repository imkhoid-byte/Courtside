import type { Match, PlayerRating, EloEntry } from './types'
import { getPlayerRating, updatePlayerRating } from './db'

export const DEFAULT_ELO = 1000

export function getKFactor(matchCount: number): number {
  if (matchCount < 20) return 32
  if (matchCount < 50) return 24
  return 16
}

export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

/** Returns the ELO delta for the winning side (positive) */
export function calcEloChange(
  avgEloWinner: number,
  avgEloLoser: number,
  avgMatchCountWinner: number,
  numSets: number
): number {
  const k = getKFactor(avgMatchCountWinner)
  const kMult = numSets >= 3 ? 1.2 : 1.0
  const exp = expectedScore(avgEloWinner, avgEloLoser)
  return Math.round(k * kMult * (1 - exp))
}

/** Apply ELO changes to all 4 players after a match */
export async function applyMatchElo(match: Match): Promise<void> {
  if (!match.winner || match.status !== 'complete') return

  const [a1r, a2r, b1r, b2r] = await Promise.all([
    getPlayerRating(match.teamA.player1),
    getPlayerRating(match.teamA.player2),
    getPlayerRating(match.teamB.player1),
    getPlayerRating(match.teamB.player2),
  ])

  const avgA = (a1r.elo + a2r.elo) / 2
  const avgB = (b1r.elo + b2r.elo) / 2
  const avgMatchA = (a1r.matchCount + a2r.matchCount) / 2
  const avgMatchB = (b1r.matchCount + b2r.matchCount) / 2
  const numSets = match.sets.length

  const aWon = match.winner === 'A'
  const winnerAvgElo = aWon ? avgA : avgB
  const loserAvgElo = aWon ? avgB : avgA
  const winnerAvgCount = aWon ? avgMatchA : avgMatchB
  const loserAvgCount = aWon ? avgMatchB : avgMatchA

  const winChange = calcEloChange(winnerAvgElo, loserAvgElo, winnerAvgCount, numSets)
  const loseChange = -Math.round(calcEloChange(loserAvgElo, winnerAvgElo, loserAvgCount, numSets) * 0.8)

  const dateStr = match.endTime ?? match.startTime
  const entry = (r: PlayerRating, change: number, won: boolean): PlayerRating => {
    const newElo = Math.max(100, r.elo + change)
    const eloEntry: EloEntry = { elo: newElo, date: dateStr, matchId: match.id, change }
    return {
      ...r,
      elo: newElo,
      matchCount: r.matchCount + 1,
      winCount: r.winCount + (won ? 1 : 0),
      history: [...r.history.slice(-99), eloEntry],
    }
  }

  const winA = match.winner === 'A'
  await Promise.all([
    updatePlayerRating(entry(a1r, winA ? winChange : loseChange, winA)),
    updatePlayerRating(entry(a2r, winA ? winChange : loseChange, winA)),
    updatePlayerRating(entry(b1r, winA ? loseChange : winChange, !winA)),
    updatePlayerRating(entry(b2r, winA ? loseChange : winChange, !winA)),
  ])
}
