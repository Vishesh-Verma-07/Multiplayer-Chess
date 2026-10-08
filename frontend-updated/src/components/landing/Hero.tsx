'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion } from 'motion/react'
import { PLAY_URL } from '../../lib/config'
import { GAMES } from '../../lib/games'
import { useAutoplay } from '../../lib/hooks'
import { useGame } from '../../lib/useGame'
import { Board } from './Board'
import { Arrow, LiveBadge, MoveList, PlayerBar } from './parts'
import './Hero.css'

const ease = [0.22, 1, 0.36, 1] as const

export function Hero() {
  const stage = useRef<HTMLDivElement>(null)
  const { running, reduced } = useAutoplay(stage)
  const game = useGame({ script: GAMES.hero, startPly: reduced ? 12 : 6, running, intervalMs: 2600 })
  const whiteToMove = game.turn === 'w'

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <HeroBackdrop />
      <div className="hero__inner wrap">
        <div className="hero__copy">
          <motion.p className="eyebrow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease }}>
            Real-time multiplayer chess
          </motion.p>
          <h1 id="hero-title" className="h1 hero__title">
            <span className="line">
              <motion.span initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 0.9, delay: 0.2, ease }}>
                Think ahead.
              </motion.span>
            </span>
            <span className="line">
              <motion.span initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 0.9, delay: 0.32, ease }}>
                Play in <em>real time.</em>
              </motion.span>
            </span>
          </h1>
          <motion.p className="lede hero__lede" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5, ease }}>
            Challenge a real opponent and watch every move land the instant it’s played. Lose your connection? Your game is still there when you come back.
          </motion.p>
          <motion.div className="hero__cta" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.62, ease }}>
            <Link className="btn btn-primary" href={PLAY_URL}>
              Play Now <Arrow />
            </Link>
            <a className="btn btn-ghost" href="#how">
              See how it works
            </a>
          </motion.div>
          <motion.p className="hero__hint mono" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 1 }}>
            <span className="hero__hint-key">tip</span> Tap any piece on the board to see its legal moves.
          </motion.p>
        </div>

        <motion.div
          ref={stage}
          className="hero__stage"
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.35, ease }}
        >
          <div className="hero__board-frame">
            <div className="hero__top">
              <PlayerBar name="Opponent" side="Black" seconds={537} active={!whiteToMove} running={running} />
              <LiveBadge />
            </div>
            <Board game={game} tilt label="Live chess board showing an Open Sicilian game in progress" />
            <div className="hero__bottom">
              <PlayerBar name="You" side="White" seconds={522} active={whiteToMove} running={running} />
            </div>
          </div>

          <aside className="hero__moves" aria-label="Game panel">
            <div className="hero__moves-head">
              <span className="mono">Moves</span>
              <span className="hero__conn">
                <span className="dot" /> Connected
              </span>
            </div>
            <MoveList history={game.history} max={5} />
            <div className="hero__turn mono" aria-live="polite">
              {whiteToMove ? 'White to move' : 'Black to move'}
            </div>
          </aside>
        </motion.div>
      </div>

      <div className="hero__scroll mono" aria-hidden="true">
        <span />
        scroll
      </div>
    </section>
  )
}

function HeroBackdrop() {
  return (
    <div className="hero__bg" aria-hidden="true">
      <div className="hero__grid" />
      <div className="hero__light" />
      <div className="hero__ghost">
        <span>e4</span>
        <span>c5</span>
        <span>Nf3</span>
      </div>
      {Array.from({ length: 14 }, (_, i) => (
        <i key={i} className="hero__dust" style={{ ['--i' as string]: i }} />
      ))}
      <div className="hero__grain" />
    </div>
  )
}
