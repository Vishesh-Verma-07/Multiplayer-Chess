'use client'

import Link from 'next/link'
import { PLAY_URL } from '../../lib/config'
import { GAMES } from '../../lib/games'
import { useGame } from '../../lib/useGame'
import { Board } from './Board'
import { Arrow, Reveal } from './parts'

export function FinalCTA() {
  const game = useGame({ script: GAMES.hero, startPly: 9, running: false })
  return (
    <section className="cta" aria-labelledby="cta-title">
      <div className="cta__board" aria-hidden="true">
        <Board game={game} explore={false} label="" />
      </div>
      <div className="wrap cta__inner">
        <Reveal>
          <h2 id="cta-title" className="cta__title">
            Your next move <em>is waiting.</em>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="lede cta__lede">Start a game, challenge someone, and play without the friction.</p>
        </Reveal>
        <Reveal delay={0.2}>
          <Link className="btn btn-primary cta__btn" href={PLAY_URL}>
            Play Chess <Arrow />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
