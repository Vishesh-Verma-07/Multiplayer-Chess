import type { GameHeaderProps } from "./types";

export const GameHeader = ({
  statusText,
  startButtonText,
  startRequested,
  onStartMatch,
  onOfferDraw,
  onResign,
  canOfferDraw,
  canResign,
  drawOfferSent,
}: GameHeaderProps) => {
  return (
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
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOfferDraw}
            className="rounded-lg border border-emerald-300/60 bg-emerald-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-100 transition hover:-translate-y-0.5 hover:bg-emerald-300/20 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canOfferDraw}
          >
            {drawOfferSent ? "Draw Offered" : "Offer Draw"}
          </button>
          <button
            type="button"
            onClick={onResign}
            className="rounded-lg border border-rose-300/60 bg-rose-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-rose-100 transition hover:-translate-y-0.5 hover:bg-rose-300/20 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canResign}
          >
            Resign
          </button>
          <button
            type="button"
            onClick={onStartMatch}
            className="rounded-lg border border-amber-200/70 bg-amber-100/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-amber-100 transition hover:-translate-y-0.5 hover:bg-amber-100/20 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={startRequested}
          >
            {startButtonText}
          </button>
        </div>
      </div>
    </header>
  );
};
