import { PieceSymbol } from "chess.js";
import type { CapturedPiecesPanelProps, CapturedPiecesRowProps } from "./types";

const pieceNameBySymbol: Record<PieceSymbol, string> = {
  k: "king",
  q: "queen",
  r: "rook",
  b: "bishop",
  n: "knight",
  p: "pawn",
};

const CapturedPiecesRow = ({
  title,
  capturedPieces,
  capturedSidePrefix,
  capturedSideName,
}: CapturedPiecesRowProps) => {
  return (
    <article className="rounded-lg border border-zinc-700/70 bg-black/30 px-3 py-2">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
        {title}
      </p>
      {capturedPieces.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">None yet</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {capturedPieces.map((piece, index) => (
            <img
              key={`${title}-${piece}-${index}`}
              src={`/${capturedSidePrefix}${piece}.png`}
              alt={`captured ${capturedSideName} ${pieceNameBySymbol[piece]}`}
              className="h-7 w-7"
              draggable={false}
            />
          ))}
        </div>
      )}
    </article>
  );
};

export const CapturedPiecesPanel = ({
  capturedPieces,
}: CapturedPiecesPanelProps) => {
  return (
    <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-3">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100/90">
        Captured Pieces
      </h3>
      <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
        <CapturedPiecesRow
          title="White Captures"
          capturedPieces={capturedPieces.whiteCaptures}
          capturedSidePrefix="b"
          capturedSideName="black"
        />
        <CapturedPiecesRow
          title="Black Captures"
          capturedPieces={capturedPieces.blackCaptures}
          capturedSidePrefix="w"
          capturedSideName="white"
        />
      </div>
    </div>
  );
};
