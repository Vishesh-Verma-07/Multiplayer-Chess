import type { PlayerColor } from "../components/game/types";

export type AuthMode = "login" | "register";

export type IncomingMessage = {
  type: string;
  payload?: {
    color?: PlayerColor;
    winner?: PlayerColor | null;
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
