import { Chess, type Move } from 'chess.js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { WS_BACKEND_URL } from './config'
import type { ServerMessage, Side } from './protocol'
import { applyMoveToPieces, initialPieces, type GameView, type LastMove, type TrackedPiece } from './useGame'

const RETRY_MS = 1500

/** Spectator endpoint lives next to the player endpoint: /api/ws -> /api/ws/spectate?gameId=… */
export function spectatorUrl(gameId: string) {
  const url = new URL(WS_BACKEND_URL)
  url.pathname = url.pathname.endsWith('/api/ws') ? url.pathname.replace(/\/api\/ws\/?$/, '/api/ws/spectate') : '/api/ws/spectate'
  url.searchParams.set('gameId', gameId)
  return url.toString()
}

export interface SpectateState {
  link: 'connecting' | 'live' | 'reconnecting' | 'closed'
  over: { winner: Side | null; reason: string | null } | null
}

/** Read-only view of a live match. Same wire protocol as players, but nobody can move. */
export function useSpectate(gameId: string) {
  const chessRef = useRef(new Chess())
  const [epoch, setEpoch] = useState(0)
  const [pieces, setPieces] = useState<TrackedPiece[]>(() => initialPieces(new Chess(), 0))
  const [moves, setMoves] = useState<Move[]>([])
  const [lastMove, setLast] = useState<LastMove | null>(null)
  const [link, setLink] = useState<SpectateState['link']>('connecting')
  const [over, setOver] = useState<SpectateState['over']>(null)
  const [turn, setTurn] = useState<'w' | 'b'>('w')
  const [check, setCheck] = useState<GameView['check']>(null)

  const sync = useCallback((pcs: TrackedPiece[]) => {
    const c = chessRef.current
    setTurn(c.turn())
    setCheck(c.inCheck() ? (pcs.find((p) => p.type === 'k' && p.color === c.turn())?.square ?? null) : null)
  }, [])

  const onMessage = useCallback(
    (msg: ServerMessage) => {
      if (msg.type === 'init_game') {
        const chess = new Chess()
        if (msg.payload?.fen) chess.load(msg.payload.fen)
        chessRef.current = chess
        const next = epochRef.current + 1
        epochRef.current = next
        const pcs = initialPieces(chess, next)
        setEpoch(next)
        setPieces(pcs)
        sync(pcs)
        setMoves([])
        setLast(null)
        setOver(null)
        setLink('live')
      } else if (msg.type === 'move') {
        const mv = msg.payload?.move
        if (!mv?.from || !mv?.to) return
        let m: Move
        try {
          m = chessRef.current.move({ from: mv.from, to: mv.to, ...(mv.promotion ? { promotion: mv.promotion } : {}) })
        } catch {
          return
        }
        setPieces((cur) => {
          const next = applyMoveToPieces(cur, m)
          sync(next)
          return next
        })
        setMoves((cur) => [...cur, m])
        setLast({ from: m.from, to: m.to })
      } else if (msg.type === 'game_over') {
        setOver({ winner: msg.payload?.winner ?? null, reason: msg.payload?.reason ?? null })
      }
    },
    [sync],
  )

  const epochRef = useRef(0)
  const handler = useRef(onMessage)
  useEffect(() => {
    handler.current = onMessage
  })

  useEffect(() => {
    let alive = true
    let retry: number | undefined
    let ws: WebSocket | null = null
    let everOpened = false
    const connect = () => {
      if (!alive) return
      ws = new WebSocket(spectatorUrl(gameId))
      ws.onopen = () => {
        everOpened = true
      }
      ws.onmessage = (ev) => {
        try {
          handler.current(JSON.parse(ev.data) as ServerMessage)
        } catch {
          /* ignore malformed frames */
        }
      }
      ws.onclose = (ev) => {
        if (!alive) return
        // 1008 = policy violation: unknown game id or the game has ended. Don't hammer the server.
        if (ev.code === 1008) return setLink('closed')
        setLink(everOpened ? 'reconnecting' : 'connecting')
        retry = window.setTimeout(connect, RETRY_MS)
      }
      ws.onerror = () => ws?.close()
    }
    connect()
    return () => {
      alive = false
      window.clearTimeout(retry)
      ws?.close()
    }
  }, [gameId])

  const view: GameView = {
    pieces,
    ply: moves.length,
    history: moves.map((m) => m.san),
    lastMove,
    turn: turn === 'w' ? 'w' : 'b',
    epoch,
    check,
    legalTargets: () => [],
  }
  return { view, moves, link, over }
}
