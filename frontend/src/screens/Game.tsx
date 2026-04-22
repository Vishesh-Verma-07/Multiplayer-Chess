import { Chess } from "chess.js";
import { useEffect, useMemo, useState } from "react";
import { ChessBoard } from "../components/ChessBoard";
import { useSocket } from "../hooks/useSocket";
import { GAME_OVER, INIT_GAME, INVALID_MOVE, MOVE } from "../messages";

type PlayerColor = "white" | "black";

type IncomingMessage = {
  type: string;
  payload?: {
    color?: PlayerColor;
    winner?: PlayerColor;
    message?: string;
    from?: string;
    to?: string;
    move?: {
      from: string;
      to: string;
      promotion?: "q" | "r" | "b" | "n";
    };
  };
};

const formatPlayerColor = (color: PlayerColor) =>
  color.charAt(0).toUpperCase() + color.slice(1);

const buildStatusText = (
  chess: Chess,
  gameStarted: boolean,
  gameOverWinner: PlayerColor | null,
) => {
  if (!gameStarted) {
    return "Click Start Match to enter matchmaking.";
  }

  if (gameOverWinner) {
    return `${formatPlayerColor(gameOverWinner)} wins the game.`;
  }

  if (chess.isCheckmate()) {
    return "Checkmate.";
  }

  if (chess.isDraw()) {
    return "Draw.";
  }

  if (chess.isCheck()) {
    return "Check.";
  }

  return `${chess.turn() === "w" ? "White" : "Black"} to move.`;
};

const buildGameNotification = (
  chess: Chess,
  gameStarted: boolean,
  gameOverWinner: PlayerColor | null,
) => {
  if (!gameStarted) {
    return null;
  }

  if (gameOverWinner || chess.isCheckmate()) {
    const winner = gameOverWinner
      ? formatPlayerColor(gameOverWinner)
      : chess.turn() === "w"
        ? "Black"
        : "White";

    return {
      message: `Checkmate! ${winner} wins the game.`,
      tone: "critical" as const,
    };
  }

  if (chess.isCheck()) {
    const kingUnderAttack = chess.turn() === "w" ? "White" : "Black";
    return {
      message: `Check on ${kingUnderAttack} king.`,
      tone: "warning" as const,
    };
  }

  return null;
};

export const Game = () => {
  const socket = useSocket();
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
          chess.reset();
          setBoard(chess.board());
          setPlayerColor(message.payload?.color ?? null);
          setGameStarted(true);
          setStartRequested(false);
          setGameOverWinner(null);
          setLastError(null);
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
  }, [socket, chess]);

  const moveHistory = useMemo(() => chess.history(), [board, chess]);

  const moveRows = useMemo(() => {
    const rows: Array<{ turn: number; white: string; black: string }> = [];

    for (let i = 0; i < moveHistory.length; i += 2) {
      rows.push({
        turn: i / 2 + 1,
        white: moveHistory[i],
        black: moveHistory[i + 1] ?? "",
      });
    }

    return rows;
  }, [moveHistory]);

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
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.15),transparent_44%),radial-gradient(circle_at_80%_70%,rgba(147,51,234,0.1),transparent_48%),linear-gradient(180deg,#0a0a0a_0%,#090909_100%)] px-4 py-12 text-zinc-100">
        <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-700/70 bg-black/70 p-8 text-center shadow-2xl shadow-black/70 backdrop-blur-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-200/90">
            Connection
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            Connecting to Chess Server
          </h1>
          <p className="mt-4 text-zinc-300">
            Please wait while we establish a live game session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.15),transparent_44%),radial-gradient(circle_at_80%_70%,rgba(147,51,234,0.1),transparent_48%),linear-gradient(180deg,#0a0a0a_0%,#090909_100%)] px-4 py-8 text-zinc-100 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-2xl border border-zinc-700/70 bg-black/70 px-5 py-5 shadow-2xl shadow-black/60 backdrop-blur-sm sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-amber-200/90">
                Live Match
              </p>
              <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
                Professional Chess Arena
              </h1>
              <p className="mt-2 text-sm text-zinc-300">{statusText}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setStartRequested(true);
                setLastError(null);
                socket.send(
                  JSON.stringify({
                    type: INIT_GAME,
                  }),
                );
              }}
              className="rounded-lg border border-amber-200/70 bg-amber-100/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-amber-100 transition hover:-translate-y-0.5 hover:bg-amber-100/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={startRequested}
            >
              {startButtonText}
            </button>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[minmax(320px,1fr)_340px]">
          <div className="rounded-2xl border border-zinc-700/70 bg-black/70 p-4 shadow-2xl shadow-black/60 backdrop-blur-sm sm:p-6">
            {gameNotification ? (
              <div
                className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
                  gameNotification.tone === "critical"
                    ? "border-rose-400/60 bg-rose-500/15 text-rose-100"
                    : "border-amber-300/60 bg-amber-500/15 text-amber-100"
                }`}
              >
                {gameNotification.message}
              </div>
            ) : null}

            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <article className="rounded-xl border border-zinc-700/70 bg-zinc-900/80 p-3">
                <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">
                  You Play
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-100">
                  {playerColor
                    ? formatPlayerColor(playerColor)
                    : "Awaiting Match"}
                </p>
              </article>
              <article className="rounded-xl border border-zinc-700/70 bg-zinc-900/80 p-3">
                <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">
                  Turn
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-100">
                  {chess.turn() === "w" ? "White" : "Black"}
                </p>
              </article>
              <article className="rounded-xl border border-zinc-700/70 bg-zinc-900/80 p-3">
                <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">
                  Moves
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-100">
                  {moveHistory.length}
                </p>
              </article>
            </div>

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
              />
            </div>
          </div>

          <aside className="rounded-2xl border border-zinc-700/70 bg-black/70 p-4 shadow-2xl shadow-black/60 backdrop-blur-sm sm:p-5">
            <h2 className="text-lg font-semibold">Move Tracker</h2>
            <p className="mt-1 text-sm text-zinc-300">
              Complete SAN history of the current match.
            </p>

            <div className="mt-4 overflow-hidden rounded-xl border border-zinc-700/70">
              <div className="grid grid-cols-[56px_1fr_1fr] bg-zinc-900/80 px-3 py-2 text-xs uppercase tracking-[0.2em] text-amber-100/90">
                <span>#</span>
                <span>White</span>
                <span>Black</span>
              </div>

              <div className="max-h-[460px] overflow-y-auto bg-black/55">
                {moveRows.length === 0 ? (
                  <p className="px-3 py-6 text-sm text-zinc-400">
                    No moves yet. Start the game to begin tracking.
                  </p>
                ) : (
                  moveRows.map((row) => (
                    <div
                      key={row.turn}
                      className="grid grid-cols-[56px_1fr_1fr] border-t border-zinc-800 px-3 py-2 text-sm text-zinc-100"
                    >
                      <span className="text-zinc-400">{row.turn}.</span>
                      <span className="font-medium">{row.white}</span>
                      <span className="font-medium text-zinc-300">
                        {row.black || "-"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
};
