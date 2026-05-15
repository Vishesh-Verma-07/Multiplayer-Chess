import type { PlayerColor } from "../components/game/types";

export type AuthMode = "login" | "register";

export type IncomingMessage = {
  type: string;
  payload?: {
    color?: PlayerColor;
    winner?: PlayerColor | null;
    reason?: "checkmate" | "draw" | "resign";
    fromColor?: PlayerColor;
    fromUsername?: string;
    accepted?: boolean;
    byColor?: PlayerColor;
    offeredBy?: PlayerColor;
    message?: string;
    fen?: string;
    resumed?: boolean;
    from?: string;
    to?: string;
    move?: {
      from: string;
      to: string;
      promotion?: "q" | "r" | "b" | "n";
    };
  };
};
