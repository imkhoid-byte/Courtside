// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DrinkRule {
  id: string
  label: string
  description: string
  emoji: string
  sips: number
  isFinish: boolean
  enabled: boolean
}

export interface DrinkEvent {
  players: string[]
  sips: number
  reason: string
  emoji: string
  isFinish?: boolean
}

export interface Challenge {
  id: string
  emoji: string
  text: string
  category: 'skill' | 'social' | 'dare' | 'rule'
}

// ─── Default drink rules ───────────────────────────────────────────────────────

export const DEFAULT_RULES: DrinkRule[] = [
  {
    id: 'double_fault',
    label: 'Double Fault',
    description: 'Serve fault twice in a row — hitter takes 2 sips',
    emoji: '❌',
    sips: 2, isFinish: false, enabled: true,
  },
  {
    id: 'ace',
    label: 'Ace!',
    description: 'Unreturnable serve — each opponent takes 1 sip',
    emoji: '🔥',
    sips: 1, isFinish: false, enabled: true,
  },
  {
    id: 'unforced_error',
    label: 'Unforced Error',
    description: 'Miss an easy ball — 1 sip for the guilty player',
    emoji: '😬',
    sips: 1, isFinish: false, enabled: true,
  },
  {
    id: 'smash_winner',
    label: 'Smash Winner',
    description: 'Crushed overhead — each opponent takes 1 sip',
    emoji: '💥',
    sips: 1, isFinish: false, enabled: true,
  },
  {
    id: 'lob_winner',
    label: 'Lob Winner',
    description: 'Got lobbed? Embarrassing. 2 sips each opponent',
    emoji: '🪶',
    sips: 2, isFinish: false, enabled: true,
  },
  {
    id: 'lose_game',
    label: 'Lose a Game',
    description: 'Game goes to the other team — losing team 1 sip each',
    emoji: '😔',
    sips: 1, isFinish: false, enabled: true,
  },
  {
    id: 'lose_set',
    label: 'Lose a Set',
    description: 'Lose a full set — finish your drink!',
    emoji: '💀',
    sips: 0, isFinish: true, enabled: true,
  },
  {
    id: 'wall_shot',
    label: 'Wall Shot Winner',
    description: 'Magic off the glass — each opponent takes 1 sip',
    emoji: '🧱',
    sips: 1, isFinish: false, enabled: false,
  },
  {
    id: 'bagel_set',
    label: '6-0 Bagel',
    description: 'Lose a set 6-0 — finish your drink (loser team)',
    emoji: '🍩',
    sips: 0, isFinish: true, enabled: false,
  },
  {
    id: 'vibora_winner',
    label: 'Víbora Winner',
    description: 'Snake shot winner — opponents take 2 sips',
    emoji: '🌀',
    sips: 2, isFinish: false, enabled: false,
  },
]

// ─── Party challenges ──────────────────────────────────────────────────────────

export const CHALLENGES: Challenge[] = [
  { id: 'c01', emoji: '🏓', category: 'skill',   text: 'Serve with your non-dominant hand for the next game' },
  { id: 'c02', emoji: '🤫', category: 'social',  text: 'Complete silence until the next point is over — no grunts, no yelling' },
  { id: 'c03', emoji: '🕺', category: 'dare',    text: 'Everyone does a little dance before the next serve' },
  { id: 'c04', emoji: '🦩', category: 'dare',    text: 'Next serve must be hit standing on one leg only' },
  { id: 'c05', emoji: '🔁', category: 'rule',    text: 'Switch partners for the next two games then switch back' },
  { id: 'c06', emoji: '🎰', category: 'rule',    text: 'If the next point goes to deuce, everyone drinks' },
  { id: 'c07', emoji: '🎤', category: 'dare',    text: 'Losing team sings 10 seconds of a song chosen by the winners after this game' },
  { id: 'c08', emoji: '🫲', category: 'skill',   text: 'Play the next game backhand shots only — forehand = lose the point' },
  { id: 'c09', emoji: '🙈', category: 'dare',    text: 'Server must close their eyes before the toss, then open them to serve' },
  { id: 'c10', emoji: '💬', category: 'rule',    text: 'Announce your shot type BEFORE you hit it — wrong call = 1 sip' },
  { id: 'c11', emoji: '👏', category: 'social',  text: 'Cheer loudly for every single point, regardless of who wins it' },
  { id: 'c12', emoji: '🎯', category: 'rule',    text: 'First player to ace this set wins 3 sips to hand out as they please' },
  { id: 'c13', emoji: '🤝', category: 'social',  text: 'All 4 players must meet in the middle and high-five after every rally' },
  { id: 'c14', emoji: '🌀', category: 'dare',    text: 'Everyone spins around once before the next rally starts' },
  { id: 'c15', emoji: '📸', category: 'social',  text: 'Loser of the next game must post the score on their stories right now' },
  { id: 'c16', emoji: '🐢', category: 'dare',    text: 'Both teams move in slow motion until someone scores the next point' },
  { id: 'c17', emoji: '🤸', category: 'skill',   text: 'Every smash must include a visible jump — no jump = invalid, replay point' },
  { id: 'c18', emoji: '🪩', category: 'dare',    text: 'Disco point: whoever scores next gets to pick one person to finish their drink' },
  { id: 'c19', emoji: '🫣', category: 'dare',    text: 'Every player must look away when the ball is served then react' },
  { id: 'c20', emoji: '🥊', category: 'skill',   text: 'Volleys only next game — any baseline shot = give away the point' },
]

let _lastChallengeIdx = -1
export function getRandomChallenge(): Challenge {
  let idx: number
  do { idx = Math.floor(Math.random() * CHALLENGES.length) }
  while (idx === _lastChallengeIdx && CHALLENGES.length > 1)
  _lastChallengeIdx = idx
  return CHALLENGES[idx]
}
