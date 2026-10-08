import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface TrackedPiece {
  id: string
  type: PieceSymbol
  color: Color
  square: Square
}

export interface LastMove {
  from: Square
  to: Square
}

export interface GameView {
  pieces: TrackedPiece[]
  ply: number
  history: string[]
  lastMove: LastMove | null
  turn: Color
  epoch: number
  check: Square | null
  legalTargets: (sq: Square) => Square[]
}


/** Moves tracked pieces for a move chess.js just made, so each piece keeps its identity. */
export function applyMoveToPieces(pieces: TrackedPiece[], m: Move): TrackedPiece[] {
  const kept = pieces.filter((p) => {
    if (m.isEnPassant()) return p.square !== ((m.to[0] + m.from[1]) as Square)
    return p.square !== m.to || p.color === m.color
  })
  return kept.map((p) => {
    if (p.square === m.from && p.color === m.color) return { ...p, square: m.to, type: m.promotion ?? p.type }
    if (m.isKingsideCastle() || m.isQueensideCastle()) {
      const rank = m.from[1]
      const rookFrom = (m.isKingsideCastle() ? 'h' : 'a') + rank
      const rookTo = (m.isKingsideCastle() ? 'f' : 'd') + rank
      if (p.square === rookFrom && p.type === 'r' && p.color === m.color) return { ...p, square: rookTo as Square }
    }
    return p
  })
}

export function initialPieces(chess: Chess, epoch: number): TrackedPiece[] {
  const out: TrackedPiece[] = []
  chess.board().forEach((row) =>
    row.forEach((cell) => {
      if (cell) out.push({ id: `${epoch}-${cell.square}`, type: cell.type, color: cell.color, square: cell.square })
    }),
  )
  return out
}

function status(chess: Chess, pieces: TrackedPiece[]): { turn: Color; check: Square | null } {
  const turn = chess.turn()
  const king = chess.inCheck() ? pieces.find((p) => p.type === 'k' && p.color === turn) : undefined
  return { turn, check: king?.square ?? null }
}

interface Options {
  script: readonly string[]
  /** Plies already played when the component mounts. */
  startPly?: number
  /** Whether the game should advance. */
  running: boolean
  intervalMs?: number
  /** Pause at the end of the script before restarting. */
  endPauseMs?: number
}

/**
 * Plays a scripted game through chess.js. Piece identities are tracked so moves
 * animate as transforms instead of re-mounting. Every move is validated by chess.js.
 */
export function useGame({ script, startPly = 0, running, intervalMs = 2400, endPauseMs = 4200 }: Options): GameView {
  const chessRef = useRef<Chess | null>(null)
  const [state, setState] = useState(() => {
    const chess = new Chess()
    const history: string[] = []
    let last: LastMove | null = null
    for (let i = 0; i < startPly; i++) {
      const m = chess.move(script[i])
      history.push(m.san)
      last = { from: m.from, to: m.to }
    }
    chessRef.current = chess
    const pieces = initialPieces(chess, 0)
    return { epoch: 0, pieces, history, lastMove: last, ...status(chess, pieces) }
  })

  const stateRef = useRef(state)
  stateRef.current = state

  const step = useCallback(() => {
    const chess = chessRef.current!
    const cur = stateRef.current
    if (cur.history.length >= script.length) {
      const fresh = new Chess()
      chessRef.current = fresh
      const epoch = cur.epoch + 1
      const pieces = initialPieces(fresh, epoch)
      setState({ epoch, pieces, history: [], lastMove: null, ...status(fresh, pieces) })
      return
    }
    const m = chess.move(script[cur.history.length])
    const pieces = applyMoveToPieces(cur.pieces, m)
    setState({ ...cur, pieces, history: [...cur.history, m.san], lastMove: { from: m.from, to: m.to }, ...status(chess, pieces) })
  }, [script])

  useEffect(() => {
    if (!running) return
    const atEnd = state.history.length >= script.length
    const t = window.setTimeout(step, atEnd ? endPauseMs : intervalMs)
    return () => window.clearTimeout(t)
  }, [running, state, step, script.length, intervalMs, endPauseMs])

  const legalTargets = useCallback(
    (sq: Square) => {
      const chess = chessRef.current!
      const piece = chess.get(sq)
      if (!piece) return []
      // Preview moves for either side by flipping the turn in a throwaway position.
      let source = chess
      if (piece.color !== chess.turn()) {
        const f = chess.fen().split(' ')
        f[1] = piece.color
        f[3] = '-'
        source = new Chess(f.join(' '), { skipValidation: true })
      }
      return source.moves({ square: sq, verbose: true }).map((m) => m.to)
    },
    [],
  )
  return {
    pieces: state.pieces,
    ply: state.history.length,
    history: state.history,
    lastMove: state.lastMove,
    turn: state.turn,
    epoch: state.epoch,
    check: state.check,
    legalTargets,
  }
}
