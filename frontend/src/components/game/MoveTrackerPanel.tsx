import { CapturedPiecesPanel } from "./CapturedPiecesPanel";
import { GameStatCard } from "./GameStatCard";
import { CapturedPieces, MoveRow } from "./types";

type MoveTrackerPanelProps = {
  moveRows: MoveRow[];
  playerLabel: string;
  currentTurnLabel: string;
  moveCount: number;
  statusText: string;
  isMyTurn: boolean;
  capturedPieces: CapturedPieces;
};

export const MoveTrackerPanel = ({
  moveRows,
  playerLabel,
  currentTurnLabel,
  moveCount,
  statusText,
  isMyTurn,
  capturedPieces,
}: MoveTrackerPanelProps) => {
  return (
    <aside className="rounded-2xl border border-zinc-700/70 bg-black/70 p-3.5 shadow-2xl shadow-black/60 backdrop-blur-sm sm:p-4">
      <h2 className="text-lg font-semibold">Match Insights</h2>
      <p className="mt-1 text-sm text-zinc-300">
        Live status, captured pieces, and full SAN move history.
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2 xl:grid-cols-1 xl:gap-2">
        <GameStatCard label="You Play" value={playerLabel} />
        <GameStatCard label="Turn" value={currentTurnLabel} />
        <GameStatCard label="Moves" value={moveCount} />
      </div>

      <div className="mt-3 rounded-xl border border-zinc-700/70 bg-zinc-900/60 px-3 py-2.5">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
          Match Status
        </p>
        <p className="mt-1.5 text-sm text-zinc-200">{statusText}</p>
        <p
          className={`mt-1.5 inline-block rounded-full border px-2 py-1 text-xs font-medium ${
            isMyTurn
              ? "border-emerald-300/50 bg-emerald-500/15 text-emerald-100"
              : "border-zinc-600/70 bg-zinc-800/50 text-zinc-300"
          }`}
        >
          {isMyTurn ? "Your move" : "Waiting for opponent"}
        </p>
      </div>

      <div className="mt-3">
        <CapturedPiecesPanel capturedPieces={capturedPieces} />
      </div>

      <h3 className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100/90">
        Move Tracker
      </h3>
      <p className="mt-1 text-sm text-zinc-300">
        Complete SAN history of the current match.
      </p>

      <div className="mt-3 overflow-hidden rounded-xl border border-zinc-700/70">
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
  );
};
