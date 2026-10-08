/** Placeholder product name: change here and in index.html. */
export const BRAND = 'Tempo'
/** The live game (requires sign-in). All "Play" CTAs lead here. */
export const PLAY_URL = '/game'

export const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#how', label: 'How it works' },
  { href: '/#technology', label: 'Technology' },
  { href: '/spectate', label: 'Spectate' },
] as const

/** Minimum time the "searching for opponent" state is shown before a match starts. */
export const MATCH_WAIT_MS = 3000

/** Backend endpoints. Defaults match the repo's docker-compose / .env.example. */
export const HTTPS_BACKEND_URL = process.env.NEXT_PUBLIC_HTTPS_BACKEND_URL ?? 'http://localhost:8000'
export const WS_BACKEND_URL = process.env.NEXT_PUBLIC_WEBSOCKET_BACKEND_URL ?? 'ws://localhost:8080/api/ws'
