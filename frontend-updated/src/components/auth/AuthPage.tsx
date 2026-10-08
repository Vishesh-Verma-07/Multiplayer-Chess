'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BRAND } from '../../lib/config'
import { GAMES } from '../../lib/games'
import { useGame } from '../../lib/useGame'
import {
  LIMITS,
  clearToken,
  fetchMe,
  GAME_PATH,
  login,
  logout,
  readToken,
  register,
  saveToken,
  type AuthUser,
} from '../../lib/auth'
import { Board } from '../landing/Board'
import { Logo } from '../landing/Logo'
import './AuthPage.css'

type Mode = 'login' | 'register'
const ease = [0.22, 1, 0.36, 1] as const

const POINTS = [
  'Sign in with your email or username, whichever you remember.',
  'Create an account in seconds and play your first game right away.',
]

export function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [identifier, setIdentifier] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existing, setExisting] = useState<AuthUser | null>(null)
  const [checking, setChecking] = useState(true)
  const errRef = useRef<HTMLParagraphElement>(null)
  const uid = useId()

  const game = useGame({ script: GAMES.hero, startPly: 11, running: false })

  // Someone with a live session doesn't need the form.
  useEffect(() => {
    // Client-only: URL query and stored session aren't available during server rendering.
    if (new URLSearchParams(window.location.search).get('mode') === 'register') setMode('register')
    const token = readToken()
    if (!token) {
      setChecking(false)
      return
    }
    let alive = true
    fetchMe(token)
      .then((u) => alive && setExisting(u))
      .catch(() => clearToken())
      .finally(() => alive && setChecking(false))
    return () => {
      alive = false
    }
  }, [])

  const switchMode = (m: Mode) => {
    setMode(m)
    setError(null)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = mode === 'register' ? await register(username.trim(), email.trim(), password) : await login(identifier.trim(), password)
      saveToken(res.token)
      router.replace(GAME_PATH)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete authentication request.')
      setBusy(false)
      requestAnimationFrame(() => errRef.current?.focus())
    }
  }

  const signOut = async () => {
    const t = readToken()
    clearToken()
    setExisting(null)
    if (t) await logout(t)
  }

  const isReg = mode === 'register'

  return (
    <div className="auth">
      <div className="auth__bg" aria-hidden="true">
        <div className="auth__grid" />
        <div className="auth__board">
          <Board game={game} explore={false} label="" />
        </div>
      </div>

      <header className="auth__top wrap">
        <Link href="/" className="nav__brand" aria-label={`${BRAND} home`}>
          <Logo />
          <span>{BRAND}</span>
        </Link>
        <Link href="/" className="auth__back">
          <span aria-hidden="true">←</span> Back to home
        </Link>
      </header>

      <main className="auth__main wrap">
        <motion.section className="auth__info" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease }}>
          <p className="eyebrow">Authentication</p>
          <h1 className="auth__title">
            Enter the <em>matchroom.</em>
          </h1>
          <p className="lede">Create your player identity to unlock multiplayer games and secure websocket sessions.</p>
          <ul className="auth__points">
            {POINTS.map((p, i) => (
              <li key={p}>
                <span className="mono">0{i + 1}</span>
                {p}
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section
          className="auth__card"
          aria-label="Account"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.12, ease }}
        >
          {checking ? (
            <p className="auth__checking mono" role="status">
              <span className="dot live" /> Checking your session…
            </p>
          ) : existing ? (
            <div className="auth__welcome">
              <p className="eyebrow">Signed in</p>
              <h2>
                Welcome back, <em>{existing.username}.</em>
              </h2>
              <Link className="btn btn-primary" href={GAME_PATH}>
                Continue to game <span className="arr" aria-hidden="true">→</span>
              </Link>
              <button className="auth__link" onClick={signOut}>
                Not you? Sign out
              </button>
            </div>
          ) : (
            <>
              <div className="auth__tabs" role="tablist" aria-label="Sign in or create an account">
                {(['login', 'register'] as const).map((m) => (
                  <button
                    key={m}
                    role="tab"
                    id={`${uid}-${m}`}
                    aria-selected={mode === m}
                    aria-controls={`${uid}-panel`}
                    className={mode === m ? 'is-on' : ''}
                    onClick={() => switchMode(m)}
                    type="button"
                  >
                    {mode === m && <motion.span layoutId="auth-tab" className="auth__tab-bg" transition={{ type: 'spring', stiffness: 520, damping: 40 }} />}
                    <span>{m === 'login' ? 'Login' : 'Register'}</span>
                  </button>
                ))}
              </div>

              <form id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-${mode}`} className="auth__form" onSubmit={onSubmit} noValidate={false}>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={mode}
                    className="auth__fields"
                    initial={{ opacity: 0, x: isReg ? 18 : -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isReg ? -18 : 18 }}
                    transition={{ duration: 0.28, ease }}
                  >
                    {isReg ? (
                      <>
                        <Field label="Username" hint={`${LIMITS.usernameMin}–${LIMITS.usernameMax} characters`}>
                          <input
                            required
                            minLength={LIMITS.usernameMin}
                            maxLength={LIMITS.usernameMax}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="KnightRider"
                            autoComplete="username"
                            autoCapitalize="none"
                            spellCheck={false}
                          />
                        </Field>
                        <Field label="Email">
                          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                        </Field>
                      </>
                    ) : (
                      <Field label="Email or username">
                        <input
                          required
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="you@example.com"
                          autoComplete="username"
                          autoCapitalize="none"
                          spellCheck={false}
                        />
                      </Field>
                    )}
                    <Field label="Password" hint={isReg ? `${LIMITS.passwordMin}–${LIMITS.passwordMax} characters` : undefined}>
                      <div className="auth__pw">
                        <input
                          required
                          type={show ? 'text' : 'password'}
                          minLength={LIMITS.passwordMin}
                          maxLength={LIMITS.passwordMax}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          autoComplete={isReg ? 'new-password' : 'current-password'}
                        />
                        <button type="button" className="auth__eye" aria-pressed={show} aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((s) => !s)}>
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M2 12s3.500-7 10-7 10 7 10 7-3.500 7-10 7S2 12 2 12z" />
                            <circle cx="12" cy="12" r="3" />
                            {show && <path d="M3 3l18 18" />}
                          </svg>
                        </button>
                      </div>
                    </Field>
                  </motion.div>
                </AnimatePresence>

                <AnimatePresence initial={false}>
                  {error && (
                    <motion.p
                      ref={errRef}
                      tabIndex={-1}
                      role="alert"
                      className="auth__error"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <span aria-hidden="true">!</span> {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button className="btn btn-primary auth__submit" type="submit" disabled={busy}>
                  {busy ? (
                    <>
                      <span className="auth__spin" aria-hidden="true" /> Please wait…
                    </>
                  ) : (
                    <>
                      {isReg ? 'Create account' : 'Sign in'} <span className="arr" aria-hidden="true">→</span>
                    </>
                  )}
                </button>

                <p className="auth__switch">
                  {isReg ? 'Already have an account?' : 'New here?'}{' '}
                  <button type="button" className="auth__link" onClick={() => switchMode(isReg ? 'login' : 'register')}>
                    {isReg ? 'Login' : 'Create an account'}
                  </button>
                </p>
              </form>
            </>
          )}
        </motion.section>
      </main>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="field__row">
        <span className="field__label">{label}</span>
        {hint && <span className="field__hint mono">{hint}</span>}
      </span>
      {children}
    </label>
  )
}
