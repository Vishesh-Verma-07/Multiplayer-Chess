type GameStatCardProps = {
  label: string;
  value: string | number;
};

export const GameStatCard = ({ label, value }: GameStatCardProps) => {
  return (
    <article className="rounded-lg border border-zinc-700/70 bg-zinc-900/80 px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold leading-tight text-zinc-100">
        {value}
      </p>
    </article>
  );
};
