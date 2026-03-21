import { describe, it, expect } from 'vitest'
import { createPadelMatch, scorePoint, tiebreakServerIndex } from './padel'
import { isDeuce, isGoldenPoint, getAdvantage } from './padel'
import type { PadelState, TeamPlayer, ScoringMode } from './types'

// ─── Helpers ──────────────────────────────────────────────────────────────

const teamA = { player1: 'Alice', player2: 'Bob', side1: 'left' as const, side2: 'right' as const }
const teamB = { player1: 'Carlos', player2: 'Diana', side1: 'left' as const, side2: 'right' as const }

function newMatch(scoringMode: ScoringMode = 'advantage') {
  return createPadelMatch(teamA, teamB, 'Indoor', scoringMode, 'test')
}

function pts(state: PadelState, seq: TeamPlayer[]): PadelState {
  return seq.reduce((s, t) => scorePoint(s, t), state)
}

function winGame(state: PadelState, team: TeamPlayer): PadelState {
  return pts(state, [team, team, team, team])
}

function winSet(state: PadelState, team: TeamPlayer): PadelState {
  for (let i = 0; i < 6; i++) state = winGame(state, team)
  return state
}

function reach66(scoringMode: ScoringMode = 'advantage'): PadelState {
  let s = newMatch(scoringMode)
  for (let i = 0; i < 6; i++) {
    s = winGame(s, 'A')
    s = winGame(s, 'B')
  }
  return s
}

// ─── Standard scoring (same as tennis) ──────────────────────────────────────

describe('Standard scoring', () => {
  it('starts at 0-0', () => {
    const s = newMatch()
    expect(s.gameScore).toEqual({ a: 0, b: 0, isTiebreak: false })
    expect(s.currentSet).toEqual([0, 0])
  })

  it('team A wins a clean game (4 points)', () => {
    const s = winGame(newMatch(), 'A')
    expect(s.currentSet[0]).toBe(1)
    expect(s.gameScore).toEqual({ a: 0, b: 0, isTiebreak: false })
  })

  it('reaches deuce at 40-40 (3-3)', () => {
    const s = pts(newMatch(), ['A', 'B', 'A', 'B', 'A', 'B'])
    expect(s.gameScore).toEqual({ a: 3, b: 3, isTiebreak: false })
    expect(isDeuce(s.gameScore, 'advantage')).toBe(true)
  })

  it('advantage at 4-3 (not yet won)', () => {
    const s = pts(newMatch(), ['A', 'B', 'A', 'B', 'A', 'B', 'A']) // 4-3
    expect(s.gameScore).toEqual({ a: 4, b: 3, isTiebreak: false })
    expect(s.currentSet[0]).toBe(0) // game not won
    expect(getAdvantage(s.gameScore, 'advantage')).toBe('A')
  })

  it('back to deuce at 4-4', () => {
    const s = pts(newMatch(), ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B']) // 4-4
    expect(s.gameScore).toEqual({ a: 4, b: 4, isTiebreak: false })
  })

  it('team A wins from advantage (5-3 = 2 ahead)', () => {
    const s = pts(newMatch(), ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'A']) // 5-3
    expect(s.currentSet[0]).toBe(1)
    expect(s.gameScore.a).toBe(0)
  })

  it('7-5 set win', () => {
    let s = newMatch()
    for (let i = 0; i < 5; i++) s = winGame(s, 'A')
    for (let i = 0; i < 5; i++) s = winGame(s, 'B')
    s = winGame(s, 'A') // 6-5
    s = winGame(s, 'A') // 7-5
    expect(s.sets[0]).toEqual([7, 5])
  })

  it('tiebreak triggers at 6-6', () => {
    const s = reach66()
    expect(s.currentSet).toEqual([6, 6])
    expect(s.gameScore.isTiebreak).toBe(true)
  })

  it('tiebreak won at 7-0', () => {
    let s = reach66()
    s = pts(s, ['A', 'A', 'A', 'A', 'A', 'A', 'A'])
    expect(s.sets).toHaveLength(1)
    expect(s.sets[0]).toEqual([7, 6])
  })

  it('tiebreak needs 2-point margin: 7-6 not enough', () => {
    let s = reach66()
    s = pts(s, ['A', 'A', 'A', 'A', 'A', 'A', 'B', 'B', 'B', 'B', 'B', 'B']) // 6-6 tb
    expect(s.gameScore).toEqual({ a: 6, b: 6, isTiebreak: true })
    s = scorePoint(s, 'A') // 7-6 — not won
    expect(s.sets).toHaveLength(0)
    s = scorePoint(s, 'B') // 7-7
    s = scorePoint(s, 'A') // 8-7 — not won
    expect(s.sets).toHaveLength(0)
    s = scorePoint(s, 'A') // 9-7 — won
    expect(s.sets).toHaveLength(1)
    expect(s.sets[0]).toEqual([7, 6])
  })

  it('best of 3: first to 2 sets wins', () => {
    let s = newMatch()
    s = winSet(s, 'A')
    expect(s.status).toBe('playing')
    s = winSet(s, 'A')
    expect(s.status).toBe('complete')
    expect(s.winner).toBe('A')
  })

  it('best of 3: split sets goes to 3rd', () => {
    let s = newMatch()
    s = winSet(s, 'A')
    s = winSet(s, 'B')
    expect(s.status).toBe('playing')
    expect(s.sets).toHaveLength(2)
  })
})

// ─── Golden point mode ───────────────────────────────────────────────────────

describe('Golden point mode', () => {
  it('at deuce (3-3), isGoldenPoint returns true', () => {
    const s = pts(newMatch('golden_point'), ['A', 'B', 'A', 'B', 'A', 'B'])
    expect(isGoldenPoint(s.gameScore, 'golden_point')).toBe(true)
    expect(isDeuce(s.gameScore, 'golden_point')).toBe(false)
    expect(getAdvantage(s.gameScore, 'golden_point')).toBeNull()
  })

  it('golden point: next point after deuce wins immediately', () => {
    let s = pts(newMatch('golden_point'), ['A', 'B', 'A', 'B', 'A', 'B']) // 3-3
    s = scorePoint(s, 'A') // 4-3 — A wins the game immediately (no advantage)
    expect(s.currentSet[0]).toBe(1)
    expect(s.gameScore.a).toBe(0)
  })

  it('golden point: B wins at deuce', () => {
    let s = pts(newMatch('golden_point'), ['A', 'B', 'A', 'B', 'A', 'B']) // 3-3
    s = scorePoint(s, 'B')
    expect(s.currentSet[1]).toBe(1)
  })

  it('golden point: normal game still works before deuce', () => {
    const s = winGame(newMatch('golden_point'), 'A')
    expect(s.currentSet[0]).toBe(1)
  })

  it('golden point: set and match work correctly', () => {
    let s = newMatch('golden_point')
    s = winSet(s, 'A')
    s = winSet(s, 'A')
    expect(s.status).toBe('complete')
    expect(s.winner).toBe('A')
  })

  it('golden point: no advantage state exists', () => {
    const s = pts(newMatch('golden_point'), ['A', 'B', 'A', 'B', 'A', 'B', 'A']) // 4-3
    // This would be advantage in standard, but in golden point it wins immediately
    // so score resets
    expect(s.currentSet[0]).toBe(1)
    expect(s.gameScore.a).toBe(0)
  })
})

// ─── 4-player serve rotation ────────────────────────────────────────────────

describe('4-player serve rotation', () => {
  it('server order defaults to A1, B1, A2, B2', () => {
    const s = newMatch()
    expect(s.serverOrder).toEqual(['Alice', 'Carlos', 'Bob', 'Diana'])
  })

  it('serverIndex starts at 0', () => {
    const s = newMatch()
    expect(s.serverIndex).toBe(0)
  })

  it('server advances after each game', () => {
    let s = newMatch()
    expect(s.serverIndex).toBe(0) // Alice serves
    s = winGame(s, 'A')
    expect(s.serverIndex).toBe(1) // Carlos serves
    s = winGame(s, 'B')
    expect(s.serverIndex).toBe(2) // Bob serves
    s = winGame(s, 'A')
    expect(s.serverIndex).toBe(3) // Diana serves
    s = winGame(s, 'B')
    expect(s.serverIndex).toBe(0) // Back to Alice
  })

  it('tiebreak server rotation: first server at totalPoints=0', () => {
    expect(tiebreakServerIndex(0, 0)).toBe(0)
    expect(tiebreakServerIndex(0, 1)).toBe(1) // next player
    expect(tiebreakServerIndex(0, 2)).toBe(1) // same player (serve 2)
    expect(tiebreakServerIndex(0, 3)).toBe(2)
    expect(tiebreakServerIndex(0, 4)).toBe(2)
    expect(tiebreakServerIndex(0, 5)).toBe(3)
    expect(tiebreakServerIndex(0, 6)).toBe(3)
    expect(tiebreakServerIndex(0, 7)).toBe(0) // wraps
  })

  it('after tiebreak set, next set server advances rotation', () => {
    let s = reach66()
    const tbServerIndex = s.serverIndex
    // A wins tiebreak
    s = pts(s, ['A', 'A', 'A', 'A', 'A', 'A', 'A'])
    // New set server should have advanced
    expect(s.serverIndex).not.toBe(tbServerIndex)
  })
})
