import { openDB } from 'idb'
import type { IDBPDatabase } from 'idb'
import type { Match } from './types'

const DB_NAME = 'courtside'
const DB_VERSION = 1

export interface CourtSideDB {
  matches: {
    key: string
    value: Match
    indexes: { 'by-status': string; 'by-startTime': string }
  }
  prefs: {
    key: string
    value: string
  }
}

let dbPromise: Promise<IDBPDatabase<CourtSideDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<CourtSideDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const matchStore = db.createObjectStore('matches', { keyPath: 'id' })
        matchStore.createIndex('by-status', 'status')
        matchStore.createIndex('by-startTime', 'startTime')

        db.createObjectStore('prefs')
      },
    })
  }
  return dbPromise
}

// Match operations
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
  const index = db.transaction('matches').store.index('by-status')
  const live = await index.get('live')
  return live
}

export async function getCompletedMatches(): Promise<Match[]> {
  const db = await getDB()
  const all = await db.getAll('matches')
  return all
    .filter(m => m.status === 'complete')
    .sort((a, b) => b.startTime.localeCompare(a.startTime))
}

export async function deleteAllMatches(): Promise<void> {
  const db = await getDB()
  await db.clear('matches')
}

// Prefs operations
export async function getPref(key: string): Promise<string | undefined> {
  const db = await getDB()
  return db.get('prefs', key)
}

export async function setPref(key: string, value: string): Promise<void> {
  const db = await getDB()
  await db.put('prefs', value, key)
}

export async function clearAllData(): Promise<void> {
  const db = await getDB()
  await db.clear('matches')
  await db.clear('prefs')
}
