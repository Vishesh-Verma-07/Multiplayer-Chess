'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { BRAND } from '../../lib/config'
import { listActiveGames, type ActiveGameSummary } from '../../lib/gamesApi'
import { Logo } from '../landing/Logo'
import './Spectate.css'

const ease = [0.22, 1, 0.36, 1] as const
const REFRESH_MS = 15000
/** A game with no move for this long is shown as idle rather than live. */
const IDLE_MS = 30 * 60 * 1000

type Sort = 'recent' | 'moves'

function ago(iso: string | null, now: number): string {
  if (!iso) return 'not started'
  const s = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000))
  if (s < 10) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 60) return `${d}d ago`
  return `${Math.floor(d / 30)}mo ago`
}

function isLive(g: ActiveGameSummary, now: number) {
  const t = g.lastMoveAt ?? g.startedAt
  return t ? now - new Date(t).getTime() < IDLE_MS : false
}

function initial(name: string | null, fallback: string) {
  return (name ?? fallback).trim().charAt(0).toUpperCase() || fallback.charAt(0)
}

function Player({ name, side }: { name: string | null; side: 'w' | 'b' }) {
  return (
    <span className="spc__player">
      <span className={`spc__avatar spc__avatar--${side}`} aria-hidden="true">
        {initial(name, side === 'w' ? 'W' : 'B')}
      </span>
      <span className="spc__pname">{name ?? (side === 'w' ? 'White' : 'Black')}</span>
      <span className="spc__side">{side === 'w' ? 'White' : 'Black'}</span>
    </span>
  )
}

function Card({ g, now, featured }: { g: ActiveGameSummary; now: number; featured?: boolean }) {
  const live = isLive(g, now)
  return (
    <Link href={`/spectate/${g.gameId}`} className={`spc ${featured ? 'spc--feat' : ''} ${live ? '' : 'is-idle'}`}>
      <span className="spc__top">
        <span className={`spc__badge ${live ? 'is-live' : ''}`}>
          <span className={`dot ${live ? 'live' : ''}`} />
          {live ? 'Live' : 'Idle'}
        </span>
        {featured && <span className="spc__star">Most active</span>}
        <span className="mono spc__time">{ago(g.lastMoveAt ?? g.startedAt, now)}</span>
      </span>
      <span className="spc__players">
        <Player name={g.whiteUsername} side="w" />
        <span className="spc__vs" aria-hidden="true">vs</span>
        <Player name={g.blackUsername} side="b" />
      </span>
      <span className="spc__foot">
        <span className="mono spc__moves">
          <b>{g.movesCount}</b> {g.movesCount === 1 ? 'move' : 'moves'}
        </span>
        <span className="spc__watch">
          Watch <span aria-hidden="true">→</span>
        </span>
      </span>
    </Link>
  )
}

export function SpectateList() {
  const [games, setGames] = useState<ActiveGameSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('recent')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setGames(await listActiveGames())
      setLoaded(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load active games.')
    } finally {
      setNow(Date.now())
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const t = window.setInterval(() => void load(), REFRESH_MS)
    return () => window.clearInterval(t)
  }, [load])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = games.filter(
      (g) => !q || `${g.whiteUsername ?? ''} ${g.blackUsername ?? ''}`.toLowerCase().includes(q),
    )
    const stamp = (g: ActiveGameSummary) => new Date(g.lastMoveAt ?? g.startedAt ?? 0).getTime()
    return list.sort((a, b) => (sort === 'moves' ? b.movesCount - a.movesCount || stamp(b) - stamp(a) : stamp(b) - stamp(a)))
  }, [games, query, sort])

  const liveCount = useMemo(() => games.filter((g) => isLive(g, now)).length, [games, now])
  const totalMoves = useMemo(() => games.reduce((n, g) => n + g.movesCount, 0), [games])
  const featured = !query && visible.length > 2 ? [...visible].sort((a, b) => b.movesCount - a.movesCount)[0] : null
  const rest = featured ? visible.filter((g) => g.gameId !== featured.gameId) : visible

  return (
    <div className="sp">
      <div className="auth__bg" aria-hidden="true">
        <div className="auth__grid" />
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

      <main className="wrap sp__main">
        <motion.section className="sp__hero" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
          <div className="sp__intro">
            <p className="eyebrow">Spectator lounge</p>
            <h1 className="h2 sp__title">
              Watch the board <em>breathe.</em>
            </h1>
            <p className="lede">Sit in on any match as it unfolds, move by move. No account, no clutter, just the game.</p>
          </div>
          <dl className="sp__stats">
            <div>
              <dt>Live now</dt>
              <dd>
                <span className={`dot ${liveCount ? 'live' : ''}`} /> {loaded ? liveCount : '–'}
              </dd>
            </div>
            <div>
              <dt>Open games</dt>
              <dd>{loaded ? games.length : '–'}</dd>
            </div>
            <div>
              <dt>Moves played</dt>
              <dd>{loaded ? totalMoves : '–'}</dd>
            </div>
          </dl>
        </motion.section>

        <div className="sp__tools">
          <label className="sp__search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <span className="sr-only">Search by player</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by player…" autoComplete="off" spellCheck={false} />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
                ✕
              </button>
            )}
          </label>
          <div className="sp__seg" role="group" aria-label="Sort games">
            <button type="button" className={sort === 'recent' ? 'is-on' : ''} aria-pressed={sort === 'recent'} onClick={() => setSort('recent')}>
              Recent
            </button>
            <button type="button" className={sort === 'moves' ? 'is-on' : ''} aria-pressed={sort === 'moves'} onClick={() => setSort('moves')}>
              Most moves
            </button>
          </div>
          <button type="button" className="btn btn-ghost btn-sm sp__refresh" onClick={() => void load()} disabled={loading}>
            <span className={loading ? 'sp__spin' : ''} aria-hidden="true">↻</span> {loading ? 'Updating' : 'Refresh'}
          </button>
        </div>

        {error && (
          <p className="notice notice--error sp__error" role="alert">
            <span aria-hidden="true">!</span> {error}
            <button type="button" onClick={() => void load()}>Retry</button>
          </p>
        )}

        {!loaded && !error ? (
          <ul className="sp__grid" aria-busy="true" aria-label="Loading games">
            {[0, 1, 2].map((i) => (
              <li key={i} className="spc spc--skel" />
            ))}
          </ul>
        ) : visible.length === 0 && !error ? (
          <div className="sp__empty">
            <span className="sp__empty-board" aria-hidden="true" />
            <h2>{query ? 'No matches for that name' : 'The boards are quiet'}</h2>
            <p>{query ? 'Try another player, or clear the search.' : 'No games are being played right now. Start one and others can watch you.'}</p>
            {query ? (
              <button className="btn btn-ghost" onClick={() => setQuery('')}>
                Clear search
              </button>
            ) : (
              <Link className="btn btn-primary" href="/game">
                Start a game <span className="arr" aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        ) : (
          <>
            {featured && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
                <Card g={featured} now={now} featured />
              </motion.div>
            )}
            <ul className="sp__grid">
              {rest.map((g, i) => (
                <motion.li key={g.gameId} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: Math.min(i, 8) * 0.05, ease }}>
                  <Card g={g} now={now} />
                </motion.li>
              ))}
            </ul>
          </>
        )}
        <p className="sp__hint mono">Auto-refreshes every {REFRESH_MS / 1000}s</p>
      </main>
    </div>
  )
}
