import { useCallback, useEffect, useRef, useState } from 'react'
import { WS_URL, type ClientMessage, type ServerMessage } from './protocol'

export type LinkState = 'connecting' | 'open' | 'reconnecting'

const RETRY_MS = 1500

/**
 * Keeps one authenticated WebSocket alive, retrying every 1.5s like the original client.
 * The server resumes an active match on reconnect by replaying `init_game`.
 */
export function useGameSocket(token: string | null, onMessage: (m: ServerMessage) => void) {
  const [link, setLink] = useState<LinkState>('connecting')
  const sockRef = useRef<WebSocket | null>(null)
  const handler = useRef(onMessage)
  useEffect(() => {
    handler.current = onMessage
  })

  useEffect(() => {
    if (!token) return
    let alive = true
    let retry: number | undefined
    let everOpened = false

    const connect = () => {
      if (!alive) return
      const url = new URL(WS_URL)
      url.searchParams.set('token', token)
      const ws = new WebSocket(url.toString())
      ws.onopen = () => {
        if (!alive) return ws.close()
        everOpened = true
        sockRef.current = ws
        setLink('open')
      }
      ws.onmessage = (ev) => {
        try {
          handler.current(JSON.parse(ev.data) as ServerMessage)
        } catch {
          /* ignore malformed frames */
        }
      }
      ws.onclose = () => {
        if (sockRef.current === ws) sockRef.current = null
        if (!alive) return
        setLink(everOpened ? 'reconnecting' : 'connecting')
        retry = window.setTimeout(connect, RETRY_MS)
      }
      ws.onerror = () => ws.close()
    }
    connect()
    return () => {
      alive = false
      window.clearTimeout(retry)
      sockRef.current?.close()
      sockRef.current = null
    }
  }, [token])

  const send = useCallback((m: ClientMessage) => {
    const ws = sockRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return false
    ws.send(JSON.stringify(m))
    return true
  }, [])

  return { link, send }
}
