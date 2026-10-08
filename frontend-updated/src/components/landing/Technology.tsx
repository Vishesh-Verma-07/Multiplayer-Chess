'use client'

import { Reveal } from './parts'

const STACK = [
  { k: 'Real-time', v: 'WebSockets' },
  { k: 'Game logic', v: 'chess.js' },
  { k: 'Server', v: 'Node.js · Express' },
  { k: 'Persistence', v: 'PostgreSQL + Prisma' },
  { k: 'Auth', v: 'JWT' },
  { k: 'Interface', v: 'React · TypeScript' },
]

export function Technology() {
  return (
    <section className="section tech" id="technology" aria-labelledby="tech-title">
      <div className="wrap tech__grid">
        <div>
          <Reveal>
            <p className="eyebrow">Technology</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 id="tech-title" className="h2">
              Built for <em>real-time play.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="lede">No page reloads and no polling. A small, deliberate stack where each piece does one job.</p>
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          <dl className="spec">
            {STACK.map((s) => (
              <div key={s.k} className="spec__row">
                <dt className="mono">{s.k}</dt>
                <dd>{s.v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  )
}
