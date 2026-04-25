export const ConnectionState = () => {
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
};
