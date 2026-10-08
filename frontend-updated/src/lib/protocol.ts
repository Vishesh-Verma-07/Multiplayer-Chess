/** Wire protocol of the existing game server (see backend/src/routes/wsRoutes.ts). */
import { WS_BACKEND_URL } from './config'

export const WS_URL = WS_BACKEND_URL

export type Side = 'white' | 'black'

export interface MovePayload {
  from: string
  to: string
  promotion?: string
}

export type ServerMessage =
  | { type: 'init_game'; payload?: { fen?: string; color?: Side; resumed?: boolean } }
  | { type: 'move'; payload?: { move?: MovePayload; from?: string; to?: string } }
  | { type: 'invalid_move'; payload?: { message?: string } }
  | { type: 'game_over'; payload?: { winner?: Side | null; reason?: string } }
  | { type: 'draw_request'; payload?: { fromUsername?: string; fromColor?: Side } }
  | { type: 'draw_response'; payload?: { accepted?: boolean; fromColor?: Side } }

export type ClientMessage =
  | { type: 'init_game' }
  | { type: 'move'; payload: { move: MovePayload } }
  | { type: 'resign' }
  | { type: 'draw_request' }
  | { type: 'draw_response'; payload: { accepted: boolean } }
