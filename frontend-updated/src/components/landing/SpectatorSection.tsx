'use client'

import { useRef } from 'react'
import { GAMES } from '../../lib/games'
import { useAutoplay } from '../../lib/hooks'
import { useGame } from '../../lib/useGame'
import { Board } from './Board'
import { Clock, LiveBadge, MoveList, Reveal } from './parts'

export function SpectatorSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { running, reduced } = useAutoplay(ref)
  const game = useGame({ script: GAMES.spectate, startPly: reduced ? 10 : 7, running, intervalMs: 2800 })
  const w = game.turn === 'w'

  return (
    <section className="section spectate" id="spectate" aria-labelledby="spectate-title">
      <div className="wrap spectate__grid">
        <div className="spectate__copy">
          <Reveal>
            <p className="eyebrow">Spectator mode</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 id="spectate-title" className="h2">
              Don’t just play. <em>Watch the game unfold.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="lede">Take a seat on the sidelines of any live match. Every move arrives as it’s played, with no way to touch the board.</p>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div ref={ref} className="cast">
            <div className="cast__head">
              <LiveBadge label="Live match" />
              <span className="cast__eye mono">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M2 12s3.500-7 10-7 10 7 10 7-3.500 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="2.500" />
                </svg>
                You’re watching · view only
              </span>
            </div>
            <div className="cast__players">
              <div className={`cast__p ${w ? 'is-active' : ''}`}>
                <span className="pbar__chip pbar__chip--w" aria-hidden="true" />
                <div>
                  <p>White</p>
                  <Clock seconds={541} active={w} running={running} />
                </div>
              </div>
              <span className="cast__vs mono">vs</span>
              <div className={`cast__p cast__p--r ${!w ? 'is-active' : ''}`}>
                <div>
                  <p>Black</p>
                  <Clock seconds={529} active={!w} running={running} />
                </div>
                <span className="pbar__chip pbar__chip--b" aria-hidden="true" />
              </div>
            </div>
            <div className="cast__main">
              <Board game={game} explore={false} label="Live chess board of a game being spectated" />
              <div className="cast__moves">
                <p className="mono rc__moves-h">Moves</p>
                <MoveList history={game.history} max={10} />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
