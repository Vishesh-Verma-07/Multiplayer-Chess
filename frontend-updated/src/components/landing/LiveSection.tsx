'use client'

import { useRef } from 'react'
import { GAMES } from '../../lib/games'
import { useAutoplay } from '../../lib/hooks'
import { useGame } from '../../lib/useGame'
import { Board } from './Board'
import { LiveBadge, MoveList, PlayerBar, Reveal } from './parts'

const STEPS = ['Synchronized', 'Validated', 'Persisted']

export function LiveSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { running, reduced } = useAutoplay(ref)
  const game = useGame({ script: GAMES.live, startPly: reduced ? 9 : 2, running, intervalMs: 3200 })
  const last = game.history[game.history.length - 1] ?? '—'
  const lastWasWhite = game.ply % 2 === 1
  const moveNo = Math.ceil(game.ply / 2)
  const whiteToMove = game.turn === 'w'

  return (
    <section className="section live" id="live" aria-labelledby="live-title">
      <div className="wrap live__grid">
        <Reveal className="live__stage">
          <div ref={ref} className="live__card">
            <div className="live__card-top">
              <PlayerBar name="Black" side="Black" note="Opponent" seconds={461} active={!whiteToMove} running={running} />
              <LiveBadge />
            </div>
            <div className="live__boardrow">
              <Board game={game} label="Live chess board showing a Ruy Lopez game in progress" />
              <div className="live__side">
                <p className="live__side-h mono">Move history</p>
                <MoveList history={game.history} max={9} />
                <p className="live__conn mono">
                  <span className="dot live" /> Connected
                </p>
              </div>
            </div>
            <PlayerBar name="White" side="White" note="You" seconds={474} active={whiteToMove} running={running} />
          </div>
        </Reveal>

        <div className="live__copy">
          <Reveal>
            <p className="eyebrow">Chess that feels live</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 id="live-title" className="h2">
              Chess isn’t turn-based online. <em>It’s happening live.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="lede">Both boards update the instant a move is played. No refreshing, no polling, no waiting for the page to catch up.</p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="readout" aria-live="polite">
              <div className="readout__move">
                <span className="readout__n mono">{moveNo}{lastWasWhite ? '.' : '…'}</span>
                <span key={game.ply + '-' + game.epoch} className="readout__san">
                  {last}
                </span>
              </div>
              <ol key={'s' + game.ply + game.epoch} className="readout__steps">
                {STEPS.map((s, i) => (
                  <li key={s} style={{ animationDelay: `${0.25 + i * 0.45}s` }}>
                    <i /> {s}
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
