import { openDB } from 'idb'
import type { IDBPDatabase } from 'idb'
import type { Match } from './types'

const DB_NAME = 'sidecourt'
const DB_VERSION = 1

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
  // Recent player names for autocomplete
  players: {
    key: string
    value: { name: string; lastUsed: number }
  }
}

let dbPromise: Promise<IDBPDatabase<SideCourtDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<SideCourtDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const matchStore = db.createObjectStore('matches', { keyPath: 'id' })
        matchStore.createIndex('by-status', 'status')
        matchStore.createIndex('by-startTime', 'startTime')
        db.createObjectStore('prefs')
        db.createObjectStore('players', { keyPath: 'name' })
      },
    })
  }
  return dbPromise
}

// ─── Match operations ────────────────────────────────────────────────────────

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
}

// ─── Prefs operations ────────────────────────────────────────────────────────

export async function getPref(key: string): Promise<string | undefined> {
  const db = await getDB()
  return db.get('prefs', key)
}

export async function setPref(key: string, value: string): Promise<void> {
  const db = await getDB()
  await db.put('prefs', value, key)
}

// ─── Player name history (for autocomplete) ──────────────────────────────────

export async function recordPlayerName(name: string): Promise<void> {
  if (!name.trim()) return
  const db = await getDB()
  await db.put('players', { name: name.trim(), lastUsed: Date.now() })
}

export async function getRecentPlayerNames(): Promise<string[]> {
  const db = await getDB()
  const all = await db.getAll('players')
  return all
    .sort((a, b) => b.lastUsed - a.lastUsed)
    .map(p => p.name)
    .slice(0, 20)
}
