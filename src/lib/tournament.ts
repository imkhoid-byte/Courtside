import type { Tournament, TournamentRound, TournamentCourt, TournamentFormat, PadelSurface } from './types'
import { nanoid } from 'nanoid'

/** All unordered pairs from an array */
function allPairs(players: string[]): [string, string][] {
  const pairs: [string, string][] = []
  for (let i = 0; i < players.length; i++)
    for (let j = i + 1; j < players.length; j++)
      pairs.push([players[i], players[j]])
  return pairs
}

/** Fisher-Yates shuffle (pure, returns new array) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function courtKey(c: TournamentCourt): string {
  return [...c.teamA, ...c.teamB].sort().join('|')
}

/** Build all possible courts (any pair vs any non-overlapping pair) */
function allPossibleCourts(players: string[]): TournamentCourt[] {
  const pairs = allPairs(players)
  const courts: TournamentCourt[] = []
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      const a = pairs[i], b = pairs[j]
      if (a.some(p => b.includes(p))) continue
      courts.push({ courtNum: 0, teamA: a, teamB: b, completed: false })
    }
  }
  return courts
}

/** Schedule americano rounds: every player plays with every other partner */
export function scheduleAmericano(
  players: string[],
  numRounds: number,
  courtsPerRound: number
): TournamentRound[] {
  const all = shuffle(allPossibleCourts(players))
  const usedKeys = new Set<string>()
  const rounds: TournamentRound[] = []

  for (let r = 0; r < numRounds; r++) {
    const roundCourts: TournamentCourt[] = []
    const usedInRound = new Set<string>()

    for (const court of all) {
      if (roundCourts.length >= courtsPerRound) break
      const key = courtKey(court)
      if (usedKeys.has(key)) continue
      const ps = [...court.teamA, ...court.teamB]
      if (ps.some(p => usedInRound.has(p))) continue

      roundCourts.push({ ...court, courtNum: roundCourts.length + 1 })
      ps.forEach(p => usedInRound.add(p))
      usedKeys.add(key)
    }

    if (roundCourts.length === 0) break // No more unique courts possible

    rounds.push({ roundNum: r + 1, courts: roundCourts, completed: false })
  }

  return rounds
}

/** Mexicano: dynamic pairing based on current standings */
export function scheduleMexicanoRound(
  roundNum: number,
  scores: Record<string, number>,
  players: string[],
  previousCourts: TournamentCourt[],
  courtsPerRound: number
): TournamentRound {
  // Sort players by current score descending
  const ranked = [...players].sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0))

  const usedPairings = new Set(previousCourts.map(courtKey))
  const courts: TournamentCourt[] = []
  const used = new Set<string>()

  // Pair rank[0]+rank[3] vs rank[1]+rank[2], rank[4]+rank[7] vs rank[5]+rank[6], etc.
  for (let i = 0; i < ranked.length - 3 && courts.length < courtsPerRound; i += 4) {
    const a: [string, string] = [ranked[i], ranked[i + 3]]
    const b: [string, string] = [ranked[i + 1], ranked[i + 2]]
    const court: TournamentCourt = { courtNum: courts.length + 1, teamA: a, teamB: b, completed: false }
    const key = courtKey(court)
    if (!usedPairings.has(key) && !a.some(p => used.has(p)) && !b.some(p => used.has(p))) {
      courts.push(court)
      ;[...a, ...b].forEach(p => used.add(p))
    } else {
      // Fallback: swap partners in the group
      const altA: [string, string] = [ranked[i], ranked[i + 1]]
      const altB: [string, string] = [ranked[i + 2], ranked[i + 3]]
      const altCourt: TournamentCourt = { courtNum: courts.length + 1, teamA: altA, teamB: altB, completed: false }
      courts.push(altCourt)
      ;[...altA, ...altB].forEach(p => used.add(p))
    }
  }

  return { roundNum, courts, completed: false }
}

/** Create a new tournament */
export function createTournament(params: {
  name: string
  format: TournamentFormat
  players: string[]
  numRounds: number
  courtsPerRound: number
  goldenPoint: boolean
  surface: PadelSurface
  venue?: string
}): Tournament {
  const { name, format, players, numRounds, courtsPerRound, goldenPoint, surface, venue } = params

  const rounds = format === 'americano'
    ? scheduleAmericano(players, numRounds, courtsPerRound)
    : scheduleAmericano(players, 1, courtsPerRound) // Mexicano: schedule only first round upfront

  const scores: Record<string, number> = {}
  players.forEach(p => { scores[p] = 0 })

  return {
    id: nanoid(),
    name: name || `${format.charAt(0).toUpperCase() + format.slice(1)} ${new Date().toLocaleDateString()}`,
    format,
    players,
    rounds,
    scores,
    status: 'active',
    createdAt: new Date().toISOString(),
    goldenPoint,
    surface,
    venue,
  }
}

/** Calculate the recommended number of rounds for Americano */
export function recommendedRounds(playerCount: number): number {
  // Each player should play as many rounds as possible
  const pairsPerPlayer = playerCount - 1
  return Math.min(pairsPerPlayer, 7) // Cap at 7 rounds for practicality
}

/** Update scores after a court result */
export function applyCourtResult(
  tournament: Tournament,
  roundNum: number,
  courtNum: number,
  scoreA: number,
  scoreB: number
): Tournament {
  const rounds = tournament.rounds.map(round => {
    if (round.roundNum !== roundNum) return round
    const courts = round.courts.map(court => {
      if (court.courtNum !== courtNum) return court
      return { ...court, scoreA, scoreB, completed: true }
    })
    const completed = courts.every(c => c.completed)
    return { ...round, courts, completed }
  })

  // Update aggregate scores
  const scores = { ...tournament.scores }
  const round = rounds.find(r => r.roundNum === roundNum)
  const court = round?.courts.find(c => c.courtNum === courtNum)
  if (court) {
    const sA = scoreA
    const sB = scoreB
    court.teamA.forEach(p => { scores[p] = (scores[p] ?? 0) + sA })
    court.teamB.forEach(p => { scores[p] = (scores[p] ?? 0) + sB })
  }

  // For mexicano: generate next round if current is complete and more rounds needed
  let newRounds = rounds
  if (
    tournament.format === 'mexicano' &&
    rounds[rounds.length - 1]?.completed &&
    tournament.status === 'active'
  ) {
    const nextRoundNum = rounds.length + 1
    if (nextRoundNum <= recommendedRounds(tournament.players.length)) {
      const allPrevCourts = rounds.flatMap(r => r.courts)
      const nextRound = scheduleMexicanoRound(
        nextRoundNum, scores, tournament.players, allPrevCourts,
        Math.floor(tournament.players.length / 4)
      )
      newRounds = [...rounds, nextRound]
    }
  }

  const allComplete = newRounds.every(r => r.completed)

  return {
    ...tournament,
    rounds: newRounds,
    scores,
    status: allComplete ? 'complete' : 'active',
    completedAt: allComplete ? new Date().toISOString() : undefined,
  }
}

/** Get ranked standings */
export function getRankings(tournament: Tournament): { player: string; score: number; rank: number }[] {
  const entries = Object.entries(tournament.scores)
    .sort(([, a], [, b]) => b - a)
    .map(([player, score], i) => ({ player, score, rank: i + 1 }))
  return entries
}

/** Format tournament result for sharing */
export function formatTournamentShare(tournament: Tournament): string {
  const rankings = getRankings(tournament)
  const top3 = rankings.slice(0, 3)
  const medals = ['🥇', '🥈', '🥉']

  const lines = [
    `🏆 SideCourt ${tournament.format.charAt(0).toUpperCase() + tournament.format.slice(1)} Tournament`,
    tournament.name && `📋 ${tournament.name}`,
    `━━━━━━━━━━━━━━━━━`,
    ...top3.map((r, i) => `${medals[i]} ${r.player}: ${r.score} pts`),
    `━━━━━━━━━━━━━━━━━`,
    `${tournament.players.length} players · ${tournament.rounds.length} rounds`,
    `sidecourt.app`,
  ].filter(Boolean)

  return lines.join('\n')
}
