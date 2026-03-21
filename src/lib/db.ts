import { openDB } from 'idb'
import type { IDBPDatabase } from 'idb'
import type { Match, Tournament, PlayerRating, Practice } from './types'

const DB_NAME = 'sidecourt'
const DB_VERSION = 2

export interface SideCourtDB {
  matches: {
    key: string
    value: Match
    indexes: { 'by-status': string; 'by-startTime': string }
  }
  prefs: {
    key: string
    value: string
  }
  players: {
    key: string
    value: { name: string; lastUsed: number; matchCount: number; winCount: number }
  }
  venues: {
    key: string
    value: { name: string; useCount: number; lastUsed: number }
  }
  tournaments: {
    key: string
    value: Tournament
    indexes: { 'by-status': string }
  }
  ratings: {
    key: string
    value: PlayerRating
  }
  practices: {
    key: string
    value: Practice
    indexes: { 'by-date': string }
  }
}

let dbPromise: Promise<IDBPDatabase<SideCourtDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<SideCourtDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // Version 1 stores
        if (oldVersion < 1) {
          const matchStore = db.createObjectStore('matches', { keyPath: 'id' })
          matchStore.createIndex('by-status', 'status')
          matchStore.createIndex('by-startTime', 'startTime')
          db.createObjectStore('prefs')
          db.createObjectStore('players', { keyPath: 'name' })
        }
        // Version 2 stores
        if (oldVersion < 2) {
          db.createObjectStore('venues', { keyPath: 'name' })
          const tourneyStore = db.createObjectStore('tournaments', { keyPath: 'id' })
          tourneyStore.createIndex('by-status', 'status')
          db.createObjectStore('ratings', { keyPath: 'name' })
          const practiceStore = db.createObjectStore('practices', { keyPath: 'id' })
          practiceStore.createIndex('by-date', 'date')
        }
      },
    })
  }
  return dbPromise
}

// ─── Match operations ─────────────────────────────────────────────────────────

export async function saveMatch(match: Match): Promise<void> {
  const db = await getDB()
  await db.put('matches', match)
}

export async function getMatch(id: string): Promise<Match | undefined> {
  const db = await getDB()
  return db.get('matches', id)
}

export async function getAllMatches(): Promise<Match[]> {
  const db = await getDB()
  const all = await db.getAll('matches')
  return all.sort((a, b) => b.startTime.localeCompare(a.startTime))
}

export async function getLiveMatch(): Promise<Match | undefined> {
  const db = await getDB()
  const tx = db.transaction('matches', 'readonly')
  const index = tx.store.index('by-status')
  return index.get('live')
}

export async function getCompletedMatches(): Promise<Match[]> {
  const db = await getDB()
  const all = await db.getAll('matches')
  return all
    .filter(m => m.status === 'complete')
    .sort((a, b) => b.startTime.localeCompare(a.startTime))
}

export async function clearAllData(): Promise<void> {
  const db = await getDB()
  await db.clear('matches')
  await db.clear('prefs')
  await db.clear('players')
  await db.clear('venues')
  await db.clear('tournaments')
  await db.clear('ratings')
  await db.clear('practices')
}

// ─── Prefs operations ─────────────────────────────────────────────────────────

export async function getPref(key: string): Promise<string | undefined> {
  const db = await getDB()
  return db.get('prefs', key)
}

export async function setPref(key: string, value: string): Promise<void> {
  const db = await getDB()
  await db.put('prefs', value, key)
}

// ─── Player name history ──────────────────────────────────────────────────────

export async function recordPlayerName(name: string, won?: boolean): Promise<void> {
  if (!name.trim()) return
  const db = await getDB()
  const existing = await db.get('players', name.trim())
  await db.put('players', {
    name: name.trim(),
    lastUsed: Date.now(),
    matchCount: (existing?.matchCount ?? 0) + 1,
    winCount: (existing?.winCount ?? 0) + (won ? 1 : 0),
  })
}

export interface PlayerSuggestion {
  name: string
  matchCount: number
  winCount: number
}

export async function getPlayerSuggestions(): Promise<PlayerSuggestion[]> {
  const db = await getDB()
  const all = await db.getAll('players')
  return all
    .sort((a, b) => b.matchCount - a.matchCount || b.lastUsed - a.lastUsed)
    .map(p => ({ name: p.name, matchCount: p.matchCount, winCount: p.winCount }))
    .slice(0, 30)
}

// Keep legacy export for compatibility
export async function getRecentPlayerNames(): Promise<string[]> {
  const suggestions = await getPlayerSuggestions()
  return suggestions.map(s => s.name)
}

// ─── Venue history ────────────────────────────────────────────────────────────

export async function recordVenue(name: string): Promise<void> {
  if (!name.trim()) return
  const db = await getDB()
  const existing = await db.get('venues', name.trim())
  await db.put('venues', {
    name: name.trim(),
    useCount: (existing?.useCount ?? 0) + 1,
    lastUsed: Date.now(),
  })
}

export async function getRecentVenues(): Promise<string[]> {
  const db = await getDB()
  const all = await db.getAll('venues')
  return all
    .sort((a, b) => b.useCount - a.useCount || b.lastUsed - a.lastUsed)
    .map(v => v.name)
    .slice(0, 15)
}

// ─── Tournament operations ────────────────────────────────────────────────────

export async function saveTournament(tournament: Tournament): Promise<void> {
  const db = await getDB()
  await db.put('tournaments', tournament)
}

export async function getTournament(id: string): Promise<Tournament | undefined> {
  const db = await getDB()
  return db.get('tournaments', id)
}

export async function getAllTournaments(): Promise<Tournament[]> {
  const db = await getDB()
  const all = await db.getAll('tournaments')
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

// ─── Player ratings (ELO) ─────────────────────────────────────────────────────

export const DEFAULT_ELO = 1000

export async function getPlayerRating(name: string): Promise<PlayerRating> {
  const db = await getDB()
  const existing = await db.get('ratings', name)
  return existing ?? { name, elo: DEFAULT_ELO, matchCount: 0, winCount: 0, history: [] }
}

export async function updatePlayerRating(rating: PlayerRating): Promise<void> {
  const db = await getDB()
  await db.put('ratings', rating)
}

export async function getAllPlayerRatings(): Promise<PlayerRating[]> {
  const db = await getDB()
  const all = await db.getAll('ratings')
  return all.sort((a, b) => b.elo - a.elo)
}

// ─── Practice operations ──────────────────────────────────────────────────────

export async function savePractice(practice: Practice): Promise<void> {
  const db = await getDB()
  await db.put('practices', practice)
}

export async function getAllPractices(): Promise<Practice[]> {
  const db = await getDB()
  const all = await db.getAll('practices')
  return all.sort((a, b) => b.date.localeCompare(a.date))
}

// ─── Recent teams (for quick-start cards) ────────────────────────────────────

export interface RecentTeam {
  player1: string
  player2: string
  opp1: string
  opp2: string
  lastPlayed: string
}

export async function getRecentTeams(): Promise<RecentTeam[]> {
  const matches = await getCompletedMatches()
  const seen = new Set<string>()
  const teams: RecentTeam[] = []
  for (const m of matches.slice(0, 50)) {
    const key = [m.teamA.player1, m.teamA.player2, m.teamB.player1, m.teamB.player2].join('|')
    if (!seen.has(key)) {
      seen.add(key)
      teams.push({
        player1: m.teamA.player1,
        player2: m.teamA.player2,
        opp1: m.teamB.player1,
        opp2: m.teamB.player2,
        lastPlayed: m.startTime,
      })
      if (teams.length >= 3) break
    }
  }
  return teams
}
