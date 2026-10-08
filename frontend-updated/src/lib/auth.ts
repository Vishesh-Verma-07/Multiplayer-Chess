import { HTTPS_BACKEND_URL } from './config'

/**
 * Auth client for the existing chess backend. Endpoints, payloads, limits and the
 * token storage key mirror the production app so sessions stay compatible.
 */
export const API_URL = HTTPS_BACKEND_URL
export const TOKEN_KEY = 'chess_auth_token'

export interface AuthUser {
  id?: string
  username: string
  email?: string
}

interface AuthResponse {
  token: string
  user: AuthUser
}

export const LIMITS = { usernameMin: 3, usernameMax: 20, passwordMin: 8, passwordMax: 72 } as const

async function parse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({ error: 'Invalid response from server.' }))
  if (!res.ok) throw new Error(body.error ?? 'Request failed.')
  return body as T
}

async function post<T>(path: string, payload: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('Can’t reach the game server. Check your connection and try again.')
  }
  return parse<T>(res)
}

export const login = (identifier: string, password: string) => post<AuthResponse>('/api/auth/login', { identifier, password })
export const register = (username: string, email: string, password: string) =>
  post<AuthResponse>('/api/auth/register', { username, email, password })

export async function fetchMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
  const body = await parse<{ user: AuthUser }>(res)
  return body.user
}

export async function logout(token: string) {
  await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
}

export function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}
export function saveToken(t: string) {
  try {
    localStorage.setItem(TOKEN_KEY, t)
  } catch {
    /* storage blocked: session lasts only for this page */
  }
}
export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* noop */
  }
}

/** Where signed-in players go: the live game route. */
export const GAME_PATH = '/game'
