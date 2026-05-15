import { Chess, Move } from "chess.js";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ChessBoard } from "../components/ChessBoard";
import { ConnectionState } from "../components/game/ConnectionState";
import { GameHeader } from "../components/game/GameHeader";
import { GameNotificationBanner } from "../components/game/GameNotificationBanner";
import { MoveTrackerPanel } from "../components/game/MoveTrackerPanel";
import {
  buildCapturedPieces,
  buildGameNotification,
  buildMoveRows,
  buildStatusText,
  formatPlayerColor,
} from "../components/game/gameHelpers";
import { PlayerColor } from "../components/game/types";
import { useMoveSound } from "../hooks/useMoveSound";
import { useSocket } from "../hooks/useSocket";
import {
  DRAW_REQUEST,
  DRAW_RESPONSE,
  GAME_OVER,
  INIT_GAME,
  INVALID_MOVE,
  MOVE,
  RESIGN,
} from "../messages";
import type { IncomingMessage } from "./types";

export const Game = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const socket = useSocket(token);
  const { playMoveSound } = useMoveSound();
  const [chess] = useState(() => new Chess());
  const [board, setBoard] = useState(chess.board());
  const [playerColor, setPlayerColor] = useState<PlayerColor | null>(null);
  const [startRequested, setStartRequested] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOverWinner, setGameOverWinner] = useState<PlayerColor | null>(
    null,
  );
  const [gameOverReason, setGameOverReason] = useState<
    "checkmate" | "draw" | "resign" | null
  >(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [drawOfferSent, setDrawOfferSent] = useState(false);
  const [drawOfferReceived, setDrawOfferReceived] = useState<{
    fromColor: PlayerColor;
    fromUsername: string;
  } | null>(null);
  const [drawStatusMessage, setDrawStatusMessage] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.onmessage = (event) => {
      const message: IncomingMessage = JSON.parse(event.data);

      switch (message.type) {
        case INIT_GAME: {
          const fen = message.payload?.fen;
          const resumed = Boolean(message.payload?.resumed);

          if (fen) {
            chess.load(fen);
          } else {
            chess.reset();
          }

          setBoard(chess.board());
          setPlayerColor(message.payload?.color ?? null);
          setGameStarted(true);
          setStartRequested(false);
          setGameOverWinner(null);
          setGameOverReason(null);
          setDrawOfferSent(false);
          setDrawOfferReceived(null);
          setDrawStatusMessage(null);
          setLastError(resumed ? "Reconnected to active match." : null);
          break;
        }

        case MOVE: {
          const payloadMove = message.payload?.move;
          const fallbackFrom = message.payload?.from;
          const fallbackTo = message.payload?.to;
          const from = payloadMove?.from ?? fallbackFrom;
          const to = payloadMove?.to ?? fallbackTo;

          if (!from || !to) {
            break;
          }

          const executedMove = chess.move({
            from,
            to,
            ...(payloadMove?.promotion
              ? { promotion: payloadMove.promotion }
              : {}),
          });
          if (executedMove) {
            setBoard(chess.board());
            setLastError(null);
            playMoveSound();
          }
          break;
        }

        case INVALID_MOVE: {
          setLastError(message.payload?.message ?? "Invalid move.");
          setBoard(chess.board());
          break;
        }

        case GAME_OVER: {
          setGameOverWinner(message.payload?.winner ?? null);
          setGameOverReason(message.payload?.reason ?? null);
          setGameStarted(true);
          setStartRequested(false);
          setDrawOfferSent(false);
          setDrawOfferReceived(null);
          if (message.payload?.reason === "resign") {
            if (playerColor && message.payload?.winner) {
              setDrawStatusMessage(
                message.payload.winner === playerColor
                  ? "Opponent resigned."
                  : "You resigned.",
              );
            } else {
              setDrawStatusMessage("Match ended by resignation.");
            }
          }
          break;
        }

        case DRAW_REQUEST: {
          if (message.payload?.fromUsername && message.payload?.fromColor) {
            setDrawOfferReceived({
              fromUsername: message.payload.fromUsername,
              fromColor: message.payload.fromColor,
            });
            setDrawOfferSent(false);
            setDrawStatusMessage(null);
            setLastError(null);
          }
          break;
        }

        case DRAW_RESPONSE: {
          if (message.payload?.accepted === false) {
            setDrawOfferSent(false);
            if (playerColor && message.payload?.offeredBy) {
              const isOfferer = playerColor === message.payload.offeredBy;
              setDrawStatusMessage(
                isOfferer
                  ? "Opponent declined your draw offer."
                  : "You declined the draw offer.",
              );
            } else {
              setDrawStatusMessage("Draw offer declined.");
            }
          }
          break;
        }

        default:
          break;
      }
    };
  }, [socket, chess, playMoveSound, playerColor]);

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

  const isMyTurn = playerColor
    ? (playerColor === "white" && chess.turn() === "w") ||
      (playerColor === "black" && chess.turn() === "b")
    : false;

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
  const startButtonText = startRequested
    ? "Searching Opponent..."
    : gameStarted && !gameOverWinner
      ? "Start a New Game"
      : "Start Match";

  const isGameOver = Boolean(gameOverWinner || gameOverReason);
  const canOfferDraw =
    Boolean(socket) && gameStarted && !isGameOver && !drawOfferSent && !drawOfferReceived;
  const canResign = Boolean(socket) && gameStarted && !isGameOver;

  if (!socket) {
    return <ConnectionState />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.15),transparent_44%),radial-gradient(circle_at_80%_70%,rgba(147,51,234,0.1),transparent_48%),linear-gradient(180deg,#0a0a0a_0%,#090909_100%)] px-4 py-8 text-zinc-100 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-700/70 bg-black/60 px-4 py-3 text-sm text-zinc-200">
          <p>
            Signed in as{" "}
            <span className="font-semibold text-amber-200">
              {user?.username}
            </span>
          </p>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate("/auth", { replace: true });
            }}
            className="rounded-md border border-zinc-500 px-3 py-1.5 uppercase tracking-[0.12em] transition hover:border-zinc-300 hover:text-white"
          >
            Logout
          </button>
        </div>

        <GameHeader
          statusText={statusText}
          startButtonText={startButtonText}
          startRequested={startRequested}
          onStartMatch={() => {
            setStartRequested(true);
            setLastError(null);
            setDrawOfferSent(false);
            setDrawOfferReceived(null);
            setDrawStatusMessage(null);
            socket.send(
              JSON.stringify({
                type: INIT_GAME,
              }),
            );
          }}
          onOfferDraw={() => {
            if (!canOfferDraw) {
              return;
            }

            setDrawOfferSent(true);
            setDrawStatusMessage("Draw offer sent.");
            setLastError(null);
            socket.send(
              JSON.stringify({
                type: DRAW_REQUEST,
              }),
            );
          }}
          onResign={() => {
            if (!canResign) {
              return;
            }

            setLastError(null);
            setDrawOfferSent(false);
            setDrawOfferReceived(null);
            setDrawStatusMessage(null);
            socket.send(
              JSON.stringify({
                type: RESIGN,
              }),
            );
          }}
          canOfferDraw={canOfferDraw}
          canResign={canResign}
          drawOfferSent={drawOfferSent}
        />

        <section className="grid gap-6 xl:grid-cols-[minmax(320px,1fr)_340px]">
          <div className="rounded-2xl border border-zinc-700/70 bg-black/70 p-4 shadow-2xl shadow-black/60 backdrop-blur-sm sm:p-6">
            <GameNotificationBanner gameNotification={gameNotification} />

            {drawStatusMessage ? (
              <div className="mb-4 rounded-lg border border-emerald-300/40 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
                {drawStatusMessage}
              </div>
            ) : null}

            {drawOfferReceived ? (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300/60 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                <span>
                  {drawOfferReceived.fromUsername} offered a draw.
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-emerald-200/70 bg-emerald-200/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-100 transition hover:bg-emerald-200/20"
                    onClick={() => {
                      setDrawOfferReceived(null);
                      setDrawStatusMessage(null);
                      socket.send(
                        JSON.stringify({
                          type: DRAW_RESPONSE,
                          payload: { accepted: true },
                        }),
                      );
                    }}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-rose-200/70 bg-rose-200/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-rose-100 transition hover:bg-rose-200/20"
                    onClick={() => {
                      setDrawOfferReceived(null);
                      setDrawStatusMessage("You declined the draw offer.");
                      socket.send(
                        JSON.stringify({
                          type: DRAW_RESPONSE,
                          payload: { accepted: false },
                        }),
                      );
                    }}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ) : null}

            {lastError ? (
              <div className="mb-4 rounded-lg border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {lastError}
              </div>
            ) : null}

            <div className="flex justify-center">
              <ChessBoard
                setBoard={setBoard}
                chess={chess}
                socket={socket}
                board={board}
                canMove={gameStarted && !gameOverWinner && isMyTurn}
                onIllegalMove={(message) => setLastError(message)}
                orientation={playerColor ?? "white"}
                onMoveExecuted={playMoveSound}
              />
            </div>
          </div>

          <MoveTrackerPanel
            moveRows={moveRows}
            playerLabel={
              playerColor ? formatPlayerColor(playerColor) : "Awaiting Match"
            }
            currentTurnLabel={chess.turn() === "w" ? "White" : "Black"}
            moveCount={moveHistory.length}
            statusText={statusText}
            isMyTurn={gameStarted && !gameOverWinner && isMyTurn}
            capturedPieces={capturedPieces}
          />
        </section>
      </div>
    </div>
  );
};
