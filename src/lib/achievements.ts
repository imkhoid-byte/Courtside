import type { Match } from './types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AchievementCategory = 'milestone' | 'skill' | 'social' | 'streak'

export interface Achievement {
  id: string
  emoji: string
  title: string
  desc: string
  category: AchievementCategory
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface AchievementResult extends Achievement {
  unlocked: boolean
  unlockedAt?: string   // ISO date string
}

// ─── Definitions ─────────────────────────────────────────────────────────────

export const ACHIEVEMENTS: Achievement[] = [
  // Milestone
  { id: 'first_match',    emoji: '🎾', title: 'First Rally',      desc: 'Play your first match',                         category: 'milestone', rarity: 'common'    },
  { id: 'first_win',      emoji: '🏆', title: 'First Win',         desc: 'Win your first match',                          category: 'milestone', rarity: 'common'    },
  { id: 'matches_10',     emoji: '📅', title: 'Regular',           desc: 'Play 10 matches',                               category: 'milestone', rarity: 'common'    },
  { id: 'matches_25',     emoji: '🏅', title: 'Veteran',           desc: 'Play 25 matches',                               category: 'milestone', rarity: 'rare'      },
  { id: 'matches_50',     emoji: '💎', title: 'Centurion',         desc: 'Play 50 matches',                               category: 'milestone', rarity: 'epic'      },
  { id: 'wins_10',        emoji: '✅', title: 'Winner\'s Circle',  desc: 'Win 10 matches',                                category: 'milestone', rarity: 'rare'      },
  { id: 'wins_25',        emoji: '🌟', title: 'Champion',          desc: 'Win 25 matches',                                category: 'milestone', rarity: 'epic'      },
  // Skill
  { id: 'aces_5',         emoji: '🎯', title: 'Ace Hunter',        desc: 'Hit 5 aces in total',                           category: 'skill',     rarity: 'common'    },
  { id: 'aces_20',        emoji: '⚡', title: 'Ace Machine',       desc: 'Hit 20 aces in total',                          category: 'skill',     rarity: 'rare'      },
  { id: 'smashes_10',     emoji: '💥', title: 'Power Player',      desc: 'Hit 10 smashes in total',                       category: 'skill',     rarity: 'common'    },
  { id: 'smashes_30',     emoji: '🔨', title: 'Smash Bros',        desc: 'Hit 30 smashes in total',                       category: 'skill',     rarity: 'rare'      },
  { id: 'comeback',       emoji: '🔄', title: 'Comeback Kid',      desc: 'Win a match after losing the first set',        category: 'skill',     rarity: 'rare'      },
  { id: 'dominant',       emoji: '👑', title: 'Dominant',          desc: 'Win a match 6-0 in the first set',             category: 'skill',     rarity: 'epic'      },
  { id: 'win_rate_60',    emoji: '📈', title: 'On Fire',           desc: 'Achieve 60%+ win rate over 10+ matches',        category: 'skill',     rarity: 'rare'      },
  { id: 'win_rate_75',    emoji: '🔥', title: 'Unstoppable',       desc: 'Achieve 75%+ win rate over 10+ matches',        category: 'skill',     rarity: 'epic'      },
  // Streak
  { id: 'streak_3',       emoji: '🔥', title: 'Hat Trick',         desc: 'Win 3 matches in a row',                        category: 'streak',    rarity: 'common'    },
  { id: 'streak_5',       emoji: '🌶️', title: 'Hot Streak',        desc: 'Win 5 matches in a row',                        category: 'streak',    rarity: 'rare'      },
  { id: 'streak_10',      emoji: '🚀', title: 'Legendary Run',     desc: 'Win 10 matches in a row',                       category: 'streak',    rarity: 'legendary' },
  // Social
  { id: 'partners_3',     emoji: '🤝', title: 'Team Player',       desc: 'Play with 3 different partners',                category: 'social',    rarity: 'common'    },
  { id: 'partners_5',     emoji: '🫂', title: 'Social Butterfly',  desc: 'Play with 5 different partners',                category: 'social',    rarity: 'rare'      },
  { id: 'partners_10',    emoji: '🌐', title: 'Connector',         desc: 'Play with 10 different partners',               category: 'social',    rarity: 'epic'      },
  { id: 'venues_3',       emoji: '🗺️',  title: 'Court Explorer',    desc: 'Play at 3 different venues',                    category: 'social',    rarity: 'common'    },
  { id: 'venues_5',       emoji: '✈️',  title: 'Road Warrior',      desc: 'Play at 5 different venues',                    category: 'social',    rarity: 'rare'      },
]

// ─── Rarity colors ────────────────────────────────────────────────────────────

export const RARITY_COLOR: Record<Achievement['rarity'], string> = {
  common:    '#636b84',
  rare:      '#38bdf8',
  epic:      '#a78bfa',
  legendary: '#fbbf24',
}

// ─── Calculator ───────────────────────────────────────────────────────────────

export function computeAchievements(matches: Match[], myName: string): AchievementResult[] {
  const me = myName || ''
  const myMatches = matches.filter(m =>
    m.teamA.player1 === me || m.teamA.player2 === me ||
    m.teamB.player1 === me || m.teamB.player2 === me
  ).sort((a, b) => a.startTime.localeCompare(b.startTime))

  const getTeam = (m: Match) =>
    (m.teamA.player1 === me || m.teamA.player2 === me) ? 'A' : 'B'

  const wins = myMatches.filter(m => m.winner === getTeam(m))
  const winCount = wins.length
  const totalCount = myMatches.length

  // Streak computation
  let maxStreak = 0; let curStreak = 0; let lastWas = false
  for (const m of myMatches) {
    const won = m.winner === getTeam(m)
    if (won) { curStreak = lastWas ? curStreak + 1 : 1; maxStreak = Math.max(maxStreak, curStreak) }
    else curStreak = 0
    lastWas = won
  }

  // Stats aggregation
  let totalAces = 0; let totalSmashes = 0
  myMatches.forEach(m => {
    const t = getTeam(m)
    totalAces += m.stats[t].aces
    totalSmashes += m.stats[t].smashes
  })

  // Partners and venues
  const partners = new Set<string>()
  const venues = new Set<string>()
  myMatches.forEach(m => {
    const inA = getTeam(m) === 'A'
    const partner = inA
      ? (m.teamA.player1 === me ? m.teamA.player2 : m.teamA.player1)
      : (m.teamB.player1 === me ? m.teamB.player2 : m.teamB.player1)
    if (partner) partners.add(partner)
    if (m.venue) venues.add(m.venue)
  })

  // Comeback: won match but lost set 0
  const hasComeback = myMatches.some(m => {
    const t = getTeam(m)
    if (m.winner !== t) return false
    const s0 = m.sets[0]
    return s0 && (t === 'A' ? s0[0] < s0[1] : s0[1] < s0[0])
  })

  // Dominant: won any set 6-0
  const hasDominant = myMatches.some(m => {
    const t = getTeam(m)
    if (m.winner !== t) return false
    return m.sets.some(s => (t === 'A' ? s[0] === 6 && s[1] === 0 : s[1] === 6 && s[0] === 0))
  })

  const winRate = totalCount >= 10 ? (winCount / totalCount) * 100 : 0

  // Map ids to unlock status
  const unlockMap: Record<string, boolean> = {
    first_match:  totalCount >= 1,
    first_win:    winCount >= 1,
    matches_10:   totalCount >= 10,
    matches_25:   totalCount >= 25,
    matches_50:   totalCount >= 50,
    wins_10:      winCount >= 10,
    wins_25:      winCount >= 25,
    aces_5:       totalAces >= 5,
    aces_20:      totalAces >= 20,
    smashes_10:   totalSmashes >= 10,
    smashes_30:   totalSmashes >= 30,
    comeback:     hasComeback,
    dominant:     hasDominant,
    win_rate_60:  winRate >= 60,
    win_rate_75:  winRate >= 75,
    streak_3:     maxStreak >= 3,
    streak_5:     maxStreak >= 5,
    streak_10:    maxStreak >= 10,
    partners_3:   partners.size >= 3,
    partners_5:   partners.size >= 5,
    partners_10:  partners.size >= 10,
    venues_3:     venues.size >= 3,
    venues_5:     venues.size >= 5,
  }

  return ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: unlockMap[a.id] ?? false,
  })).sort((a, b) => {
    // Unlocked first, then by rarity (legendary → common)
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 }
    return rarityOrder[a.rarity] - rarityOrder[b.rarity]
  })
}

// ─── Player level tiers ───────────────────────────────────────────────────────

export interface PlayerTier {
  name: string
  emoji: string
  color: string
  minElo: number
  maxElo: number
}

export const TIERS: PlayerTier[] = [
  { name: 'Bronze',   emoji: '🥉', color: '#cd7f32', minElo: 0,    maxElo: 949  },
  { name: 'Silver',   emoji: '🥈', color: '#9ca3af', minElo: 950,  maxElo: 1099 },
  { name: 'Gold',     emoji: '🥇', color: '#fbbf24', minElo: 1100, maxElo: 1249 },
  { name: 'Platinum', emoji: '💎', color: '#34d399', minElo: 1250, maxElo: 1399 },
  { name: 'Diamond',  emoji: '💠', color: '#38bdf8', minElo: 1400, maxElo: 9999 },
]

export function getTier(elo: number): PlayerTier {
  return TIERS.find(t => elo >= t.minElo && elo <= t.maxElo) ?? TIERS[0]
}

export function getTierProgress(elo: number): number {
  const tier = getTier(elo)
  if (tier.maxElo === 9999) return 100
  return Math.min(100, Math.round(((elo - tier.minElo) / (tier.maxElo - tier.minElo)) * 100))
}

// ─── Match insights (rule-based AI-style analysis) ────────────────────────────

export interface MatchInsight {
  icon: string
  text: string
  sentiment: 'positive' | 'neutral' | 'negative'
}

export function generateMatchInsights(match: Match, myName: string): MatchInsight[] {
  const me = myName || ''
  const team = (match.teamA.player1 === me || match.teamA.player2 === me) ? 'A' : 'B'
  const s = match.stats[team]
  const opp = team === 'A' ? match.stats.B : match.stats.A
  const won = match.winner === team
  const numSets = match.sets.length
  const insights: MatchInsight[] = []

  // Serving
  if (s.aces >= 3)
    insights.push({ icon: '🎯', text: `${s.aces} aces — dominant serving today`, sentiment: 'positive' })
  else if (s.doubleFaults >= 3)
    insights.push({ icon: '⚠️', text: `${s.doubleFaults} double faults — work on serve consistency`, sentiment: 'negative' })

  // Offense
  if (s.winners >= 5)
    insights.push({ icon: '🏆', text: `${s.winners} winners — attacking game paid off`, sentiment: 'positive' })
  if (s.smashes >= 4)
    insights.push({ icon: '💥', text: `${s.smashes} smashes — strong net presence`, sentiment: 'positive' })

  // Errors
  if (s.unforcedErrors >= 6)
    insights.push({ icon: '❌', text: `${s.unforcedErrors} unforced errors — stay patient`, sentiment: 'negative' })
  else if (s.unforcedErrors <= 2 && match.rallies.length > 0)
    insights.push({ icon: '🧠', text: 'Clean game — only ${s.unforcedErrors} unforced errors', sentiment: 'positive' })

  // Vs opponent
  if (s.winners > opp.winners)
    insights.push({ icon: '⚡', text: `Outgunned opponents ${s.winners}-${opp.winners} on winners`, sentiment: 'positive' })
  if (s.unforcedErrors < opp.unforcedErrors && opp.unforcedErrors >= 4)
    insights.push({ icon: '🛡️', text: `More consistent than opponents (${s.unforcedErrors} vs ${opp.unforcedErrors} UE)`, sentiment: 'positive' })

  // Match length
  if (numSets === 3 && won)
    insights.push({ icon: '💪', text: '3-set battle — mental strength showed today', sentiment: 'positive' })
  if (numSets === 3 && !won)
    insights.push({ icon: '📈', text: 'Went the distance — match fitness is there', sentiment: 'neutral' })

  // Comeback
  if (won && match.sets.length >= 2) {
    const s0 = match.sets[0]
    const lostFirst = team === 'A' ? s0[0] < s0[1] : s0[1] < s0[0]
    if (lostFirst) insights.push({ icon: '🔄', text: 'Comeback win after losing Set 1 — resilience!', sentiment: 'positive' })
  }

  // Default
  if (insights.length === 0) {
    insights.push({ icon: won ? '✅' : '📊', text: won ? 'Solid win — keep building momentum' : 'Tough match — every loss is a lesson', sentiment: won ? 'positive' : 'neutral' })
  }

  return insights.slice(0, 4)
}
