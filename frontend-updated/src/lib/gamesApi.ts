import { HTTPS_BACKEND_URL } from './config'

/** Shape returned by GET /api/games/active (https-backend, listActiveGames). */
export interface ActiveGameSummary {
  gameId: string
  whitePlayerId: string | null
  blackPlayerId: string | null
  whiteUsername: string | null
  blackUsername: string | null
  movesCount: number
  lastMoveAt: string | null
  startedAt: string | null
}

async function json<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({ error: 'Invalid JSON response.' }))
  if (!res.ok) throw new Error(body.error ?? 'Request failed.')
  return body as T
}

export async function listActiveGames(): Promise<ActiveGameSummary[]> {
  let res: Response
  try {
    res = await fetch(`${HTTPS_BACKEND_URL}/api/games/active`, { cache: 'no-store' })
  } catch {
    throw new Error('Can’t reach the game server. Check your connection and try again.')
  }
  const data = await json<{ games?: ActiveGameSummary[] }>(res)
  return data.games ?? []
}
