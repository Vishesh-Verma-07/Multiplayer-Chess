'use client'

import type { ReactNode } from 'react'
import { Reveal } from './parts'

interface Feature {
  n: string
  title: string
  body: string
  visual: ReactNode
}

const FEATURES: Feature[] = [
  {
    n: '01',
    title: 'Real-time gameplay',
    body: 'Moves appear instantly for both players.',
    visual: (
      <div className="fv fv-sync" aria-hidden="true">
        <span className="fv-sync__a" />
        <span className="fv-sync__line"><i>e4</i></span>
        <span className="fv-sync__b" />
      </div>
    ),
  },
  {
    n: '02',
    title: 'Server-authoritative chess',
    body: 'Every move is validated before it reaches the opponent.',
    visual: (
      <div className="fv fv-auth" aria-hidden="true">
        <span className="fv-auth__tag fv-auth__tag--bad">Ke1→e3 ✕</span>
        <span className="fv-auth__tag fv-auth__tag--ok">Nf3 ✓</span>
      </div>
    ),
  },
  {
    n: '03',
    title: 'Reconnect & resume',
    body: 'Disconnect unexpectedly? Continue from where you left off.',
    visual: (
      <div className="fv fv-wifi" aria-hidden="true">
        <i /><i /><i /><i />
      </div>
    ),
  },
  {
    n: '04',
    title: 'Matchmaking',
    body: 'Get into a game without unnecessary friction.',
    visual: (
      <div className="fv fv-match" aria-hidden="true">
        <span /><span /><b />
      </div>
    ),
  },
  {
    n: '05',
    title: 'Spectator mode',
    body: 'Watch live games as they happen.',
    visual: (
      <div className="fv fv-eye" aria-hidden="true">
        <svg viewBox="0 0 48 24" width="64" height="32" fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M2 12S10 2 24 2s22 10 22 10-8 10-22 10S2 12 2 12z" />
          <circle cx="24" cy="12" r="5" className="fv-eye__iris" />
        </svg>
      </div>
    ),
  },
  {
    n: '06',
    title: 'Draw offers',
    body: 'Communicate and respond without leaving the board.',
    visual: (
      <div className="fv fv-draw" aria-hidden="true">
        <span className="fv-draw__offer">½ offered</span>
        <span className="fv-draw__btn">Accept</span>
      </div>
    ),
  },
]

export function Features() {
  return (
    <section className="section features" id="features" aria-labelledby="features-title">
      <div className="wrap">
        <div className="features__head">
          <Reveal>
            <p className="eyebrow">Features</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 id="features-title" className="h2">
              Six things, <em>done properly.</em>
            </h2>
          </Reveal>
        </div>
        <ul className="fgrid">
          {FEATURES.map((f, i) => (
            <li key={f.n} className="fcard">
              <Reveal delay={(i % 3) * 0.07} className="fcard__in">
                <div className="fcard__vis">{f.visual}</div>
                <div className="fcard__txt">
                  <span className="fcard__n mono">{f.n}</span>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
