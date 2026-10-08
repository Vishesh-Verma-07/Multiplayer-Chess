'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PieceSymbol, Square } from 'chess.js'
import { PieceGlyph, PIECE_NAMES } from '../../lib/pieces'
import type { useMatch } from '../../lib/useMatch'
import '../landing/Board.css'
import './PlayBoard.css'

type Match = ReturnType<typeof useMatch>

const FILES = 'abcdefgh'
const PROMOTIONS: PieceSymbol[] = ['q', 'r', 'b', 'n']

interface Props {
  match: Match
  className?: string
}

export function PlayBoard({ match, className = '' }: Props) {
  const { pieces, color, lastMove, inCheck, myTurn, phase } = match
  const flipped = color === 'black'
  const ref = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<Square | null>(null)
  const [drag, setDrag] = useState<{ id: string; from: Square; x: number; y: number } | null>(null)
  const [promo, setPromo] = useState<{ from: Square; to: Square } | null>(null)
  const [hover, setHover] = useState<Square | null>(null)

  const targets = useMemo(() => (selected ? match.legalTargets(selected) : []), [selected, match, pieces])

  // Any change of position invalidates a selection.
  useEffect(() => {
    setSelected(null)
    setPromo(null)
  }, [match.moves.length, match.epoch])

  const toXY = useCallback(
    (sq: Square) => {
      const f = FILES.indexOf(sq[0])
      const r = Number(sq[1])
      return flipped ? { x: 7 - f, y: r - 1 } : { x: f, y: 8 - r }
    },
    [flipped],
  )

  const squareAt = useCallback(
    (cx: number, cy: number): Square | null => {
      const el = ref.current
      if (!el) return null
      const b = el.getBoundingClientRect()
      const x = Math.floor(((cx - b.left) / b.width) * 8)
      const y = Math.floor(((cy - b.top) / b.height) * 8)
      if (x < 0 || x > 7 || y < 0 || y > 7) return null
      const file = flipped ? 7 - x : x
      const rank = flipped ? y + 1 : 8 - y
      return `${FILES[file]}${rank}` as Square
    },
    [flipped],
  )

  const attempt = useCallback(
    (from: Square, to: Square) => {
      const p = match.pieceAt(from)
      if (p?.type === 'p' && (to[1] === '8' || to[1] === '1')) {
        setPromo({ from, to })
        return
      }
      match.move(from, to)
      setSelected(null)
    },
    [match],
  )

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || promo) return
    const sq = squareAt(e.clientX, e.clientY)
    if (!sq) return
    if (selected && targets.includes(sq)) {
      attempt(selected, sq)
      return
    }
    const piece = match.pieceAt(sq)
    const mine = piece && ((piece.color === 'w' && color === 'white') || (piece.color === 'b' && color === 'black'))
    if (mine && myTurn) {
      setSelected(sq)
      const tracked = pieces.find((p) => p.square === sq)
      if (tracked) {
        ref.current?.setPointerCapture(e.pointerId)
        const b = ref.current!.getBoundingClientRect()
        setDrag({ id: tracked.id, from: sq, x: e.clientX - b.left, y: e.clientY - b.top })
      }
    } else setSelected(null)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const b = ref.current?.getBoundingClientRect()
    if (drag && b) setDrag({ ...drag, x: e.clientX - b.left, y: e.clientY - b.top })
    if (e.pointerType === 'mouse') setHover(squareAt(e.clientX, e.clientY))
  }

  const finishDrag = (e: React.PointerEvent) => {
    if (!drag) return
    const to = squareAt(e.clientX, e.clientY)
    const from = drag.from
    setDrag(null)
    if (to && to !== from && match.legalTargets(from).includes(to)) attempt(from, to)
  }

  const marks: { sq: Square; kind: string }[] = []
  if (lastMove) marks.push({ sq: lastMove.from, kind: 'from' }, { sq: lastMove.to, kind: 'to' })
  if (inCheck) {
    const king = pieces.find((p) => p.type === 'k' && p.color === (match.turn === 'white' ? 'w' : 'b'))
    if (king) marks.push({ sq: king.square, kind: 'check' })
  }
  if (selected) marks.push({ sq: selected, kind: 'sel' })

  const pos = (sq: Square) => {
    const { x, y } = toXY(sq)
    return { left: `${x * 12.5}%`, top: `${y * 12.5}%` }
  }

  const files = flipped ? [...FILES].reverse() : [...FILES]
  const ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]
  const interactive = phase === 'playing'

  return (
    <div className="pb">
    <div
      ref={ref}
      className={`board playboard ${interactive && myTurn ? 'is-my-turn' : ''} ${drag ? 'is-dragging' : ''} ${className}`}
      role="application"
      aria-label={`Chess board, you play ${color ?? 'white'}. Drag or tap a piece, then tap its destination.`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={() => setDrag(null)}
      onPointerLeave={() => setHover(null)}
    >
      <div className="board__squares" />
      {marks.map((m) => (
        <i key={m.kind + m.sq} className={`board__mark board__mark--${m.kind}`} style={pos(m.sq)} />
      ))}
      {hover && myTurn && !drag && (
        <i className="board__mark playboard__hover" style={pos(hover)} />
      )}
      {targets.map((sq) => (
        <i key={'t' + sq} className={`board__target ${match.pieceAt(sq) ? 'is-capture' : ''}`} style={pos(sq)} />
      ))}
      {pieces.map((p) => {
        const { x, y } = toXY(p.square)
        const dragging = drag?.id === p.id
        const size = ref.current?.getBoundingClientRect().width ?? 0
        const style = dragging
          ? { transform: `translate(${drag.x - size / 16}px, ${drag.y - size / 16}px)`, transition: 'none', zIndex: 5 }
          : { transform: `translate(${x * 100}%, ${y * 100}%)` }
        return (
          <div key={p.id} className={`board__piece ${dragging ? 'is-drag' : ''}`} style={style} data-name={`${p.color === 'w' ? 'white' : 'black'} ${PIECE_NAMES[p.type]}`}>
            <span className="board__piece-in" style={{ animationDelay: `${(Number(p.id.split('-')[1]?.charCodeAt(0) ?? 0) % 8) * 22}ms` }}>
              <PieceGlyph type={p.type} color={p.color} />
            </span>
          </div>
        )
      })}

      {promo && (
        <div className="playboard__promo" role="dialog" aria-label="Choose promotion piece" style={{ ...pos(promo.to), transform: toXY(promo.to).y > 3 ? 'translateY(-300%)' : undefined }}>
          {PROMOTIONS.map((t) => (
            <button
              key={t}
              type="button"
              aria-label={`Promote to ${PIECE_NAMES[t]}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                match.move(promo.from, promo.to, t)
                setPromo(null)
                setSelected(null)
              }}
            >
              <PieceGlyph type={t} color={color === 'black' ? 'b' : 'w'} />
            </button>
          ))}
        </div>
      )}

    </div>
      <div className="pb__ranks" aria-hidden="true">
        {ranks.map((r) => (
          <span key={r}>{r}</span>
        ))}
      </div>
      <div className="pb__files" aria-hidden="true">
        {files.map((f) => (
          <span key={f}>{f}</span>
        ))}
      </div>
    </div>
  )
}
