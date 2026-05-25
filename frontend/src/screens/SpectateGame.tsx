import { Chess, Move } from "chess.js";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ChessBoard } from "../components/ChessBoard";
import { GameNotificationBanner } from "../components/game/GameNotificationBanner";
import { MoveTrackerPanel } from "../components/game/MoveTrackerPanel";
import {
  buildCapturedPieces,
  buildGameNotification,
  buildMoveRows,
  buildStatusText,
  formatPlayerColor,
} from "../components/game/gameHelpers";
import type { PlayerColor } from "../components/game/types";
import { useSpectatorSocket } from "../hooks/useSpectatorSocket";
import { GAME_OVER, INIT_GAME, MOVE } from "../messages";
import type { IncomingMessage } from "./types";
import "./SpectateGame.css";

export const SpectateGame = () => {
  const { gameId } = useParams();
  const socket = useSpectatorSocket(gameId ?? null);
  const { state } = useLocation();
  const matchState = state as { whiteUsername?: string; blackUsername?: string } | null;

  const [chess] = useState(() => new Chess());
  const [board, setBoard] = useState(chess.board());
  const [playerColor, setPlayerColor] = useState<PlayerColor | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOverWinner, setGameOverWinner] = useState<PlayerColor | null>(null);
  const [gameOverReason, setGameOverReason] = useState<
    "checkmate" | "draw" | "resign" | null
  >(null);
  const [lastStatus, setLastStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.onmessage = (event) => {
      const message: IncomingMessage = JSON.parse(event.data);

      switch (message.type) {
        case INIT_GAME: {
          const fen = message.payload?.fen;

          if (fen) {
            chess.load(fen);
          } else {
            chess.reset();
          }

          setBoard(chess.board());
          setPlayerColor(message.payload?.color ?? null);
          setGameStarted(true);
          setGameOverWinner(null);
          setGameOverReason(null);
          setLastStatus("Connected to live match.");
          break;
        }

        case MOVE: {
          const payloadMove = message.payload?.move;
          if (!payloadMove?.from || !payloadMove?.to) {
            break;
          }

          const executedMove = chess.move(payloadMove);
          if (executedMove) {
            setBoard(chess.board());
            setLastStatus(null);
          }
          break;
        }

        case GAME_OVER: {
          setGameOverWinner(message.payload?.winner ?? null);
          setGameOverReason(message.payload?.reason ?? null);
          setGameStarted(true);
          setLastStatus("Match finished.");
          break;
        }

        default:
          break;
      }
    };
  }, [socket, chess]);

  const moveHistory = useMemo(() => chess.history(), [board, chess]);
  const verboseMoveHistory = useMemo(
    () => chess.history({ verbose: true }) as Move[],
    [board, chess],
  );

  const capturedPieces = useMemo(
    () => buildCapturedPieces(verboseMoveHistory),
    [verboseMoveHistory],
  );

  const moveRows = useMemo(() => buildMoveRows(moveHistory), [moveHistory]);

  const statusText = buildStatusText(
    chess,
    gameStarted,
    gameOverWinner,
    gameOverReason,
  );
  const gameNotification = buildGameNotification(
    chess,
    gameStarted,
    gameOverWinner,
    gameOverReason,
  );

  const matchupLabel = matchState
    ? `${matchState.whiteUsername ?? "White"} vs ${matchState.blackUsername ?? "Black"}`
    : "Live Match";

  if (!gameId) {
    return (
      <div className="spectate-game">
        <header className="spectate-header">
          <div>
            <p className="spectate-eyebrow">Spectator Mode</p>
            <h1 className="spectate-title">Missing match</h1>
            <p className="spectate-subtitle">No match id provided.</p>
          </div>
          <div className="spectate-header-actions">
            <Link to="/spectate" className="spectate-btn">
              Back to Lobby
            </Link>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="spectate-game">
      <header className="spectate-header">
        <div>
          <p className="spectate-eyebrow">Spectator Mode</p>
          <h1 className="spectate-title">{matchupLabel}</h1>
          <p className="spectate-subtitle">{statusText}</p>
        </div>
        <div className="spectate-header-actions">
          <Link to="/spectate" className="spectate-btn">
            Back to Lobby
          </Link>
        </div>
      </header>

      {lastStatus ? <div className="spectate-banner">{lastStatus}</div> : null}

      <section className="spectate-grid">
        <div className="spectate-board">
          <GameNotificationBanner gameNotification={gameNotification} />
          <div className="spectate-board-inner">
            <ChessBoard
              setBoard={setBoard}
              chess={chess}
              board={board}
              canMove={false}
              onIllegalMove={() => undefined}
              orientation={playerColor ?? "white"}
            />
          </div>
        </div>

        <MoveTrackerPanel
          moveRows={moveRows}
          playerLabel={
            playerColor ? formatPlayerColor(playerColor) : "Spectator"
          }
          currentTurnLabel={chess.turn() === "w" ? "White" : "Black"}
          moveCount={moveHistory.length}
          statusText={statusText}
          isMyTurn={false}
          capturedPieces={capturedPieces}
        />
      </section>
    </div>
  );
};
