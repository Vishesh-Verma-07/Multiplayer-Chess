'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BRAND } from '../../lib/config'
import { listActiveGames, type ActiveGameSummary } from '../../lib/gamesApi'
import { buildMoveRows } from '../../lib/moveRows'
import { useSpectate } from '../../lib/useSpectate'
import { Board } from '../landing/Board'
import { Logo } from '../landing/Logo'
import { LiveBadge } from '../landing/parts'
import './Spectate.css'
import '../game/Game.css'

export function SpectateGame({ gameId }: { gameId: string }) {
  const { view, moves, link, over } = useSpectate(gameId)
  const [info, setInfo] = useState<ActiveGameSummary | null>(null)

  useEffect(() => {
    let alive = true
    // Player names come from the active-games list; the by-id endpoint only returns ids.
    listActiveGames()
      .then((list) => alive && setInfo(list.find((g) => g.gameId === gameId) ?? null))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [gameId])

  const white = info?.whiteUsername ?? 'White'
  const black = info?.blackUsername ?? 'Black'
  const whiteToMove = view.turn === 'w'
  const rows = buildMoveRows(moves)

  let headline = whiteToMove ? `${white} to move` : `${black} to move`
  let sub = 'You’re watching. Moves appear as they’re played.'
  if (over) {
    headline = over.winner ? `${over.winner === 'white' ? white : black} wins` : 'Draw'
    sub = over.reason === 'resign' ? 'Won by resignation.' : over.reason === 'checkmate' ? 'Checkmate.' : over.reason === 'draw' ? 'Drawn game.' : 'Match finished.'
  } else if (link === 'closed') {
    headline = 'Match not available'
    sub = 'This game has ended or doesn’t exist.'
  } else if (link !== 'live') {
    headline = link === 'reconnecting' ? 'Reconnecting…' : 'Connecting…'
  }

  return (
    <div className="sp sp--game">
      <div className="auth__bg" aria-hidden="true">
        <div className="auth__grid" />
      </div>
      <header className="auth__top wrap">
        <Link href="/" className="nav__brand" aria-label={`${BRAND} home`}>
          <Logo />
          <span>{BRAND}</span>
        </Link>
        <Link href="/spectate" className="auth__back">
          <span aria-hidden="true">←</span> Back to lobby
        </Link>
      </header>

      <main className="wrap spg">
        <section className="spg__stage" aria-label="Live match">
          <div className="spg__plate">
            <span className={`spg__p ${whiteToMove && !over ? 'is-active' : ''}`}>
              <i className="pbar__chip pbar__chip--w" /> {white}
            </span>
            <span className="mono spg__vs">vs</span>
            <span className={`spg__p ${!whiteToMove && !over ? 'is-active' : ''}`}>
              {black} <i className="pbar__chip pbar__chip--b" />
            </span>
          </div>
          <Board game={view} explore={false} label={`Live board: ${white} versus ${black}`} />
        </section>

        <aside className="spg__side">
          <div className="card status">
            {over ? <p className="eyebrow">Match over</p> : <LiveBadge label="Live match" />}
            <h1 className="status__headline" aria-live="polite">
              {headline}
            </h1>
            <p className="status__sub">{sub}</p>
            <p className="spg__viewonly mono">View only · spectator</p>
          </div>
          <div className="card moves spg__moves">
            <div className="moves__title">
              <h2>Moves</h2>
              <span className="mono">{moves.length} ply</span>
            </div>
            <div className="moves__body">
              {rows.length === 0 ? (
                <div className="moves__empty">
                  <p>{link === 'live' ? 'Moves played before you joined aren’t shown. New moves appear here.' : 'No moves yet.'}</p>
                </div>
              ) : (
                rows.map((r) => (
                  <div key={r.n} className="moves__row">
                    <span className="movelist__n mono">{r.n}</span>
                    <span className="mv">{r.w}</span>
                    <span className="mv">{r.b}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}
