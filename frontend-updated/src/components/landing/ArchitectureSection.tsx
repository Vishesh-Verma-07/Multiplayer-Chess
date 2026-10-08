'use client'

import { useEffect, useRef, useState } from 'react'
import { useAutoplay } from '../../lib/hooks'
import { Reveal } from './parts'

type Tone = 'ok' | 'bad' | 'idle'
interface Beat {
  /** Packet position along the flow, 0 = client, 0.5 = server, 1 = opponent. */
  p: number
  packet: string
  tone: Tone
  client: string
  server: string
  opponent: string
  active: 0 | 1 | 2
}

const BEATS: Beat[] = [
  { p: 0, packet: 'e2→e4', tone: 'ok', client: 'Move sent', server: 'Listening', opponent: 'Waiting', active: 0 },
  { p: 0.5, packet: 'e2→e4', tone: 'ok', client: 'Move sent', server: 'Validating move', opponent: 'Waiting', active: 1 },
  { p: 0.5, packet: '✓ legal', tone: 'ok', client: 'Connected', server: 'Move accepted', opponent: 'Waiting', active: 1 },
  { p: 1, packet: 'e2→e4', tone: 'ok', client: 'Connected', server: 'Listening', opponent: 'Move received', active: 2 },
  { p: 0, packet: 'e7→e1', tone: 'bad', client: 'Move sent', server: 'Listening', opponent: 'Waiting', active: 0 },
  { p: 0.5, packet: 'e7→e1', tone: 'bad', client: 'Move sent', server: 'Validating move', opponent: 'Waiting', active: 1 },
  { p: 0.5, packet: '✕ illegal', tone: 'bad', client: 'Move sent', server: 'Move rejected', opponent: 'Never sees it', active: 1 },
  { p: 0, packet: '✕ rejected', tone: 'bad', client: 'Board restored', server: 'Listening', opponent: 'Waiting', active: 0 },
]

const NODES = [
  { key: 'client', title: 'Client', sub: 'Your browser' },
  { key: 'server', title: 'Game server', sub: 'Source of truth' },
  { key: 'opponent', title: 'Opponent', sub: 'Their browser' },
] as const

export function ArchitectureSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { running, reduced } = useAutoplay(ref)
  const [i, setI] = useState(reduced ? 3 : 0)

  useEffect(() => {
    if (!running) return
    const t = window.setTimeout(() => setI((n) => (n + 1) % BEATS.length), BEATS[i].tone === 'bad' && i === 4 ? 1000 : 1500)
    return () => window.clearTimeout(t)
  }, [running, i])

  const b = BEATS[i]
  const status = [b.client, b.server, b.opponent]

  return (
    <section className="section arch" id="how" aria-labelledby="arch-title">
      <div className="wrap">
        <div className="arch__head">
          <Reveal>
            <p className="eyebrow">How it works</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 id="arch-title" className="h2">
              Every move has <em>one source of truth.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="lede">The client never decides what’s legal. Each move travels over a WebSocket to the game server, which validates it against the real rules of chess before anyone else sees it.</p>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div ref={ref} className="flow" role="group" aria-label="Move flow: client to game server to opponent">
            <div className="flow__track" aria-hidden="true">
              <span className="flow__line" />
              <span className={`flow__packet flow__packet--${b.tone}`} style={{ ['--p' as string]: b.p }}>
                {b.packet}
              </span>
            </div>
            {NODES.map((n, idx) => (
              <div key={n.key} className={`node ${b.active === idx ? 'is-active' : ''} node--${b.active === idx ? b.tone : 'idle'}`}>
                <div className="node__head">
                  <p className="node__title">{n.title}</p>
                  <p className="node__sub mono">{n.sub}</p>
                </div>
                <p className="node__status mono" aria-live={idx === 1 ? 'polite' : 'off'}>
                  <span className="dot" /> {status[idx]}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <ul className="arch__notes">
          <li><span className="mono">01</span> Moves are checked against full chess rules server-side.</li>
          <li><span className="mono">02</span> An illegal move is rejected and never reaches your opponent.</li>
          <li><span className="mono">03</span> Both players always see the same position.</li>
        </ul>
      </div>
    </section>
  )
}
