'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { BRAND } from '../../lib/config'
import { clearToken, fetchMe, logout, readToken, type AuthUser } from '../../lib/auth'
import { Logo } from '../landing/Logo'
import { GameScreen } from './GameScreen'
import './Game.css'

/** Auth gate for /game: validates the stored session, then mounts the live screen. */
export function GamePage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)

  const toAuth = useCallback(() => router.replace('/auth'), [router])

  useEffect(() => {
    // Session lives in localStorage, so it can only be read after mount.
    const t = readToken()
    if (!t) return toAuth()
    setToken(t)
    let alive = true
    fetchMe(t)
      .then((u) => alive && setUser(u))
      .catch(() => {
        clearToken()
        toAuth()
      })
    return () => {
      alive = false
    }
  }, [toAuth])

  const signOut = useCallback(async () => {
    const t = readToken()
    clearToken()
    if (t) await logout(t)
    toAuth()
  }, [toAuth])

  if (!token || !user) {
    return (
      <div className="gate" role="status" aria-live="polite">
        <Logo size={36} />
        <p className="mono">Checking your session…</p>
        <span className="gate__bar" aria-hidden="true" />
        <span className="sr-only">{BRAND}</span>
      </div>
    )
  }
  return <GameScreen token={token} user={user} onSignOut={signOut} />
}
