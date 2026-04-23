import { Chess, Color, Move, PieceSymbol, Square } from "chess.js";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { MOVE } from "../messages";

type ChessBoardProps = {
  setBoard: Dispatch<
    SetStateAction<
      ({
        square: Square;
        type: PieceSymbol;
        color: Color;
      } | null)[][]
    >
  >;
  chess: Chess;
  board: ({
    square: Square;
    type: PieceSymbol;
    color: Color;
  } | null)[][];
  socket: WebSocket;
  canMove: boolean;
  onIllegalMove: (message: string) => void;
  orientation?: "white" | "black";
  onMoveExecuted?: () => void;
};

export const ChessBoard = ({
  chess,
  board,
  socket,
  setBoard,
  canMove,
  onIllegalMove,
  orientation = "white",
  onMoveExecuted,
}: ChessBoardProps) => {
  const [from, setFrom] = useState<Square | null>(null);

  const legalTargets = useMemo(() => {
    if (!from) {
      return [] as Square[];
    }

    const verboseMoves = chess.moves({ square: from, verbose: true }) as Move[];
    return verboseMoves.map((move) => move.to as Square);
  }, [chess, from, board]);

  const handleSquareClick = (squareRepresentation: Square) => {
    if (!canMove) {
      onIllegalMove("Wait for your turn.");
      return;
    }

    if (!from) {
      const selectedPiece = chess.get(squareRepresentation);
      if (!selectedPiece || selectedPiece.color !== chess.turn()) {
        onIllegalMove("Select one of your own pieces.");
        return;
      }
      setFrom(squareRepresentation);
      onIllegalMove("");
      return;
    }

    if (from === squareRepresentation) {
      setFrom(null);
      return;
    }

    if (!legalTargets.includes(squareRepresentation)) {
      onIllegalMove("That piece cannot move to this square.");
      return;
    }

    const piece = chess.get(from);
    const promotion =
      piece?.type === "p" &&
      ((piece.color === "w" && squareRepresentation[1] === "8") ||
        (piece.color === "b" && squareRepresentation[1] === "1"))
        ? "q"
        : undefined;

    const movePayload = {
      from,
      to: squareRepresentation,
      ...(promotion ? { promotion } : {}),
    };

    const result = chess.move(movePayload);

    if (!result) {
      onIllegalMove("Illegal move.");
      return;
    }

    socket.send(
      JSON.stringify({
        type: MOVE,
        payload: {
          move: movePayload,
        },
      }),
    );

    setBoard(chess.board());
    setFrom(null);
    onIllegalMove("");
    onMoveExecuted?.();
  };

  return (
    <div className="w-full max-w-[560px]">
      <div className="rounded-2xl border border-amber-200/30 bg-black/45 p-3 shadow-xl shadow-black/70">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex">
            {Array.from({ length: 8 }, (_, j) => {
              const boardRow = orientation === "white" ? i : 7 - i;
              const boardCol = orientation === "white" ? j : 7 - j;
              const square = board[boardRow][boardCol];
              const squareRepresentation =
                `${String.fromCharCode(97 + boardCol)}${8 - boardRow}` as Square;
              const isSelected = from === squareRepresentation;
              const isTarget = legalTargets.includes(squareRepresentation);
              const isDark = (i + j) % 2 === 0;

              return (
                <button
                  type="button"
                  onClick={() => handleSquareClick(squareRepresentation)}
                  key={j}
                  className={`relative h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 ${
                    isDark ? "bg-[#6f4e2b]" : "bg-[#f3e4c6]"
                  } ${isSelected ? "ring-2 ring-amber-300 ring-inset" : ""}`}
                >
                  {isTarget ? (
                    <span className="pointer-events-none absolute inset-0 m-auto h-3 w-3 rounded-full bg-amber-500/85" />
                  ) : null}

                  {i === 7 ? (
                    <span className="pointer-events-none absolute bottom-1 right-1 text-[10px] font-semibold text-zinc-800/80">
                      {squareRepresentation[0]}
                    </span>
                  ) : null}

                  {j === 0 ? (
                    <span className="pointer-events-none absolute left-1 top-1 text-[10px] font-semibold text-zinc-800/80">
                      {squareRepresentation[1]}
                    </span>
                  ) : null}

                  <div className="flex h-full w-full items-center justify-center">
                    {square ? (
                      <img
                        className="h-10 w-10 select-none sm:h-12 sm:w-12 md:h-14 md:w-14"
                        draggable={false}
                        src={`/${square.color === "b" ? `b${square.type}` : `w${square.type}`}.png`}
                        alt={`${square.color}-${square.type}`}
                      />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
