'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { GAMES } from '../../lib/games'
import { useAutoplay } from '../../lib/hooks'
import { useGame } from '../../lib/useGame'
import { Board } from './Board'
import { MoveList, Reveal } from './parts'

type Phase = 'connected' | 'lost' | 'reconnecting' | 'resumed'

const PHASES: { id: Phase; label: string; detail: string; ms: number }[] = [
  { id: 'connected', label: 'Connected', detail: 'Playing live', ms: 3600 },
  { id: 'lost', label: 'Connection lost', detail: 'Your game is saved on the server', ms: 2000 },
  { id: 'reconnecting', label: 'Reconnecting…', detail: 'Restoring your seat', ms: 2000 },
  { id: 'resumed', label: 'Game resumed', detail: 'Right where you left off', ms: 2200 },
]

export function ReconnectDemo() {
  const ref = useRef<HTMLDivElement>(null)
  const { running, reduced } = useAutoplay(ref)
  const [idx, setIdx] = useState(0)
  const game = useGame({ script: GAMES.live, startPly: 13, running: false })
  const phase = PHASES[idx]

  useEffect(() => {
    if (!running) return
    const t = window.setTimeout(() => setIdx((n) => (n + 1) % PHASES.length), phase.ms)
    return () => window.clearTimeout(t)
  }, [running, idx, phase.ms])

  const trigger = useCallback(() => setIdx(1), [])
  const down = phase.id === 'lost' || phase.id === 'reconnecting'

  return (
    <section className="section reconnect" aria-labelledby="reconnect-title">
      <div className="wrap reconnect__grid">
        <div className="reconnect__copy">
          <Reveal>
            <p className="eyebrow">Reconnect &amp; resume</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 id="reconnect-title" className="h2">
              Your game doesn’t disappear <em>because your connection does.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="lede">Game state lives on the server. Drop off the network, close the tab, switch devices on the way home: come back and pick the game up from the same position.</p>
          </Reveal>
          <Reveal delay={0.24}>
            <button className="btn btn-ghost reconnect__btn" onClick={trigger} disabled={idx !== 0 && !reduced}>
              {idx === 0 ? 'Cut the connection' : 'Watch it recover…'}
            </button>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div ref={ref} className={`rc ${down ? 'is-down' : ''} rc--${phase.id}`}>
            <div className="rc__bar">
              <span className="rc__pill" role="status" aria-live="polite">
                <span className="dot" /> {phase.label}
              </span>
              <span className="rc__detail mono">{phase.detail}</span>
            </div>
            <div className="rc__body">
              <div className="rc__board">
                <Board game={game} explore={false} label="Chess board with the game paused at its saved position" />
                <div className="rc__veil" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M5 12.500a10 10 0 0114 0M8.500 16a5 5 0 017 0M12 19.500h.01" />
                    <path d="M3 3l18 18" className="rc__slash" />
                  </svg>
                </div>
              </div>
              <div className="rc__moves">
                <p className="mono rc__moves-h">Saved moves</p>
                <MoveList history={game.history} max={7} />
              </div>
            </div>
            <ol className="rc__steps" aria-label="Recovery steps">
              {PHASES.map((p, n) => (
                <li key={p.id} className={n < idx ? 'is-done' : n === idx ? 'is-now' : ''}>
                  <i />
                  <span className="mono">{p.label.replace('…', '')}</span>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
