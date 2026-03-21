import { describe, it, expect } from 'vitest'
import { createMatch, scorePoint, tiebreakServer } from './tennis'
import type { TennisState, Player } from './types'

function scorePoints(state: TennisState, sequence: Player[]): TennisState {
  return sequence.reduce((s, p) => scorePoint(s, p), state)
}

function winGame(state: TennisState, player: Player): TennisState {
  // Score 4 points for player (clean win, no deuce)
  return scorePoints(state, [player, player, player, player])
}

// Win 6 games each in the same set by interleaving, reaching 6-6 tiebreak
function reachTiebreak(format: 3 | 5 = 3): TennisState {
  let s = createMatch('A', 'B', format, 'Hard', 'test', 1)
  // Alternate: p1 wins, p2 wins — 6 times each in the same set
  for (let i = 0; i < 6; i++) {
    s = winGame(s, 1)
    s = winGame(s, 2)
  }
  return s
}

function winSet(state: TennisState, player: Player, opponentGames = 0): TennisState {
  let s = state
  for (let i = 0; i < opponentGames; i++) {
    s = winGame(s, player === 1 ? 2 : 1)
  }
  for (let i = 0; i < 6; i++) {
    s = winGame(s, player)
  }
  return s
}

describe('Tennis Scoring Engine', () => {
  describe('Normal game progression', () => {
    it('starts at 0-0', () => {
      const s = createMatch('A', 'B', 3, 'Hard', 'test')
      expect(s.gameScore).toEqual({ p1: 0, p2: 0, isTiebreak: false })
      expect(s.currentSet).toEqual([0, 0])
    })

    it('scores 0→1→2→3→4 (win) for p1', () => {
      let s = createMatch('A', 'B', 3, 'Hard', 'test')
      s = scorePoint(s, 1)
      expect(s.gameScore.p1).toBe(1)
      s = scorePoint(s, 1)
      expect(s.gameScore.p1).toBe(2)
      s = scorePoint(s, 1)
      expect(s.gameScore.p1).toBe(3)
      s = scorePoint(s, 1)
      // Game won — reset to 0-0, set updated
      expect(s.gameScore).toEqual({ p1: 0, p2: 0, isTiebreak: false })
      expect(s.currentSet[0]).toBe(1)
    })

    it('p2 wins a game', () => {
      let s = createMatch('A', 'B', 3, 'Hard', 'test')
      s = scorePoints(s, [2, 2, 2, 2])
      expect(s.currentSet[1]).toBe(1)
      expect(s.currentSet[0]).toBe(0)
    })
  })

  describe('Deuce and Advantage', () => {
    it('reaches deuce at 40-40 (3-3 raw)', () => {
      let s = createMatch('A', 'B', 3, 'Hard', 'test')
      s = scorePoints(s, [1, 2, 1, 2, 1, 2]) // 3-3
      expect(s.gameScore).toEqual({ p1: 3, p2: 3, isTiebreak: false })
    })

    it('advantage to p1 at deuce (4-3, not yet won)', () => {
      let s = createMatch('A', 'B', 3, 'Hard', 'test')
      s = scorePoints(s, [1, 2, 1, 2, 1, 2, 1]) // 4-3 = ad p1
      expect(s.gameScore).toEqual({ p1: 4, p2: 3, isTiebreak: false })
      // Game should NOT be over yet
      expect(s.currentSet[0]).toBe(0)
    })

    it('back to deuce after advantage p1 (4-4)', () => {
      let s = createMatch('A', 'B', 3, 'Hard', 'test')
      s = scorePoints(s, [1, 2, 1, 2, 1, 2, 1, 2]) // 4-4 = deuce again
      expect(s.gameScore).toEqual({ p1: 4, p2: 4, isTiebreak: false })
    })

    it('p1 wins after deuce: needs 2-point lead', () => {
      let s = createMatch('A', 'B', 3, 'Hard', 'test')
      // Get to deuce (3-3), then p1 takes ad (4-3), then p1 wins (5-3 = 2 ahead)
      s = scorePoints(s, [1, 2, 1, 2, 1, 2, 1, 1]) // 5-3
      expect(s.gameScore).toEqual({ p1: 0, p2: 0, isTiebreak: false })
      expect(s.currentSet[0]).toBe(1)
    })

    it('long deuce sequence: p2 wins after multiple deuce cycles', () => {
      let s = createMatch('A', 'B', 3, 'Hard', 'test')
      // 3-3 deuce, then ad p1, deuce, ad p1, deuce, ad p2, p2 wins (2 ahead)
      s = scorePoints(s, [1, 2, 1, 2, 1, 2]) // 3-3 deuce
      s = scorePoints(s, [1, 2, 1, 2, 2, 2]) // 4-3, 4-4, 5-4, 5-5, 5-6, 5-7 → p2 wins (2 ahead)
      expect(s.currentSet[1]).toBe(1)
    })
  })

  describe('Set scoring', () => {
    it('p1 wins set 6-0', () => {
      let s = createMatch('A', 'B', 3, 'Hard', 'test')
      s = winSet(s, 1, 0)
      expect(s.sets).toHaveLength(1)
      expect(s.sets[0]).toEqual([6, 0])
    })

    it('p1 wins set 6-4', () => {
      let s = createMatch('A', 'B', 3, 'Hard', 'test')
      for (let i = 0; i < 4; i++) s = winGame(s, 2)
      for (let i = 0; i < 6; i++) s = winGame(s, 1)
      expect(s.sets[0]).toEqual([6, 4])
    })

    it('set is not won at 5-5', () => {
      let s = createMatch('A', 'B', 3, 'Hard', 'test')
      for (let i = 0; i < 5; i++) s = winGame(s, 1)
      for (let i = 0; i < 5; i++) s = winGame(s, 2)
      expect(s.sets).toHaveLength(0)
      expect(s.currentSet).toEqual([5, 5])
    })

    it('7-5 set win', () => {
      let s = createMatch('A', 'B', 3, 'Hard', 'test')
      for (let i = 0; i < 5; i++) s = winGame(s, 1)
      for (let i = 0; i < 5; i++) s = winGame(s, 2)
      s = winGame(s, 1) // 6-5
      s = winGame(s, 1) // 7-5 — p1 wins set
      expect(s.sets[0]).toEqual([7, 5])
    })

    it('triggers tiebreak at 6-6', () => {
      const s = reachTiebreak()
      expect(s.currentSet).toEqual([6, 6])
      expect(s.gameScore.isTiebreak).toBe(true)
    })
  })

  describe('Tiebreak', () => {
    it('tiebreak starts at 0-0 isTiebreak=true', () => {
      const s = reachTiebreak()
      expect(s.gameScore).toEqual({ p1: 0, p2: 0, isTiebreak: true })
    })

    it('tiebreak scores raw numbers (not 0/15/30/40)', () => {
      let s = reachTiebreak()
      s = scorePoint(s, 1)
      expect(s.gameScore.p1).toBe(1)
      s = scorePoint(s, 1)
      expect(s.gameScore.p1).toBe(2)
    })

    it('tiebreak won at 7-0', () => {
      let s = reachTiebreak()
      s = scorePoints(s, [1, 1, 1, 1, 1, 1, 1])
      expect(s.sets).toHaveLength(1)
      expect(s.sets[0]).toEqual([7, 6])
    })

    it('tiebreak needs 2-point margin: 7-6 is not over', () => {
      let s = reachTiebreak()
      // Get to 6-6 in tiebreak
      s = scorePoints(s, [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2]) // 6-6 tiebreak
      expect(s.gameScore).toEqual({ p1: 6, p2: 6, isTiebreak: true })
      s = scorePoint(s, 1) // 7-6 — NOT won (only 1 ahead)
      expect(s.sets).toHaveLength(0)
      expect(s.gameScore.p1).toBe(7)
      s = scorePoint(s, 2) // 7-7 — back to level
      expect(s.sets).toHaveLength(0)
      s = scorePoint(s, 1) // 8-7 — NOT won (only 1 ahead)
      expect(s.sets).toHaveLength(0)
      s = scorePoint(s, 1) // 9-7 — won (2 ahead)
      expect(s.sets).toHaveLength(1)
      expect(s.sets[0]).toEqual([7, 6])
    })

    it('tiebreak serve rotation matches expected pattern', () => {
      // totalPoints = total points played so far
      expect(tiebreakServer(1, 0)).toBe(1) // start: p1 serves
      expect(tiebreakServer(1, 1)).toBe(2) // after 1 point: p2 serves
      expect(tiebreakServer(1, 2)).toBe(2) // p2 serves 2nd consecutive
      expect(tiebreakServer(1, 3)).toBe(1) // p1 serves
      expect(tiebreakServer(1, 4)).toBe(1) // p1 serves 2nd consecutive
      expect(tiebreakServer(1, 5)).toBe(2) // p2 serves
      expect(tiebreakServer(1, 6)).toBe(2) // p2 serves 2nd consecutive
    })

    it('after tiebreak, OTHER player serves first next set', () => {
      let s = reachTiebreak()
      const tiebreakFirstServer = s.setFirstServer
      // P1 wins tiebreak 7-0
      s = scorePoints(s, [1, 1, 1, 1, 1, 1, 1])
      // After tiebreak set, the player who did NOT serve first in tiebreak serves the new set
      expect(s.server).not.toBe(tiebreakFirstServer)
      expect(s.setFirstServer).not.toBe(tiebreakFirstServer)
    })
  })

  describe('Match winning', () => {
    it('best of 3: first to 2 sets wins', () => {
      let s = createMatch('A', 'B', 3, 'Hard', 'test')
      s = winSet(s, 1)
      expect(s.status).toBe('playing')
      s = winSet(s, 1)
      expect(s.status).toBe('complete')
      expect(s.winner).toBe(1)
    })

    it('best of 3: 1-1 continues to decisive set', () => {
      let s = createMatch('A', 'B', 3, 'Hard', 'test')
      s = winSet(s, 1)
      s = winSet(s, 2)
      expect(s.status).toBe('playing')
      expect(s.sets).toHaveLength(2)
    })

    it('best of 5: first to 3 sets wins', () => {
      let s = createMatch('A', 'B', 5, 'Hard', 'test')
      s = winSet(s, 1)
      s = winSet(s, 1)
      expect(s.status).toBe('playing')
      s = winSet(s, 1)
      expect(s.status).toBe('complete')
      expect(s.winner).toBe(1)
    })

    it('1 set match: winning the set wins the match', () => {
      let s = createMatch('A', 'B', 1, 'Hard', 'test')
      s = winSet(s, 2)
      expect(s.status).toBe('complete')
      expect(s.winner).toBe(2)
    })

    it('5-set match goes to all 5 sets', () => {
      let s = createMatch('A', 'B', 5, 'Hard', 'test')
      s = winSet(s, 1)
      s = winSet(s, 2)
      s = winSet(s, 1)
      s = winSet(s, 2)
      expect(s.status).toBe('playing')
      s = winSet(s, 1)
      expect(s.status).toBe('complete')
      expect(s.winner).toBe(1)
      expect(s.sets).toHaveLength(5)
    })

    it('p2 wins 5-set thriller', () => {
      let s = createMatch('A', 'B', 5, 'Hard', 'test')
      s = winSet(s, 1)
      s = winSet(s, 2)
      s = winSet(s, 2)
      s = winSet(s, 1)
      s = winSet(s, 2)
      expect(s.status).toBe('complete')
      expect(s.winner).toBe(2)
    })
  })

  describe('Server rotation', () => {
    it('server alternates each game', () => {
      let s = createMatch('A', 'B', 3, 'Hard', 'test', 1)
      expect(s.server).toBe(1)
      s = winGame(s, 1)
      expect(s.server).toBe(2)
      s = winGame(s, 2)
      expect(s.server).toBe(1)
    })
  })
})
