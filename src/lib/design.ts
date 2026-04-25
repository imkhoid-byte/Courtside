// Design tokens — single source of truth for Padel Party

export const C = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  bg:       '#07070f',
  surface:  '#0d0d1e',
  elevated: '#131428',

  // ── Borders ──────────────────────────────────────────────────────────────
  border:       '#1e1e3c',
  borderStrong: '#2d2d52',

  // ── Primary — Violet ─────────────────────────────────────────────────────
  accent:      '#7c3aed',
  accentLight: '#a78bfa',
  accentDim:   'rgba(124,58,237,0.15)',
  accentGlow:  '0 0 22px rgba(124,58,237,0.35)',

  // ── Party — Pink ─────────────────────────────────────────────────────────
  party:    '#ec4899',
  partyDim: 'rgba(236,72,153,0.15)',

  // ── Text ─────────────────────────────────────────────────────────────────
  text:  '#eeeeff',
  text2: '#7878a8',
  text3: '#424262',

  // ── Teams ────────────────────────────────────────────────────────────────
  teamA:    '#38bdf8',
  teamADim: 'rgba(56,189,248,0.15)',
  teamB:    '#f97316',
  teamBDim: 'rgba(249,115,22,0.15)',

  // ── Semantic ─────────────────────────────────────────────────────────────
  win:     '#4ade80',
  winDim:  'rgba(74,222,128,0.12)',
  loss:    '#f87171',
  lossDim: 'rgba(248,113,113,0.12)',
  gold:    '#f59e0b',
  goldDim: 'rgba(245,158,11,0.12)',
} as const

export const R = {
  sm:   '8px',
  md:   '12px',
  lg:   '16px',
  xl:   '20px',
  '2xl':'24px',
  full: '9999px',
} as const

export const F = {
  mono: '"IBM Plex Mono", monospace',
  sans: '"DM Sans", system-ui, sans-serif',
} as const
