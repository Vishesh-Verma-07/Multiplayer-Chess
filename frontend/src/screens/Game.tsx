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
import { GAME_OVER, INIT_GAME, INVALID_MOVE, MOVE } from "../messages";

type IncomingMessage = {
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
  const [lastError, setLastError] = useState<string | null>(null);

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
          setGameStarted(true);
          setStartRequested(false);
          break;
        }

        default:
          break;
      }
    };
  }, [socket, chess, playMoveSound]);

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

  const statusText = buildStatusText(chess, gameStarted, gameOverWinner);
  const gameNotification = buildGameNotification(
    chess,
    gameStarted,
    gameOverWinner,
  );
  const startButtonText = startRequested
    ? "Searching Opponent..."
    : gameStarted && !gameOverWinner
      ? "Start a New Game"
      : "Start Match";

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
            socket.send(
              JSON.stringify({
                type: INIT_GAME,
              }),
            );
          }}
        />

        <section className="grid gap-6 xl:grid-cols-[minmax(320px,1fr)_340px]">
          <div className="rounded-2xl border border-zinc-700/70 bg-black/70 p-4 shadow-2xl shadow-black/60 backdrop-blur-sm sm:p-6">
            <GameNotificationBanner gameNotification={gameNotification} />

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
