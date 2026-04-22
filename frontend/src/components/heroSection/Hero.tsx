const Hero = () => {
  return (
    <section
      className="relative min-h-screen w-full overflow-hidden text-white"
      style={{
        backgroundImage: "url('/heroImage.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/45 to-black/75" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.15),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(147,51,234,0.12),transparent_50%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.45em] text-amber-200/90 md:text-sm">
          Circle to Square
        </p>

        <h1 className="font-['Bebas_Neue',sans-serif] text-5xl leading-none tracking-[0.06em] sm:text-7xl md:text-8xl">
          Master The Board
        </h1>

        <p className="mt-4 max-w-2xl font-['Playfair_Display',serif] text-base text-zinc-100/90 sm:text-lg md:text-xl">
          Play elegant chess battles with smooth gameplay, real-time moves, and
          a board that feels premium from the first click.
        </p>

        <div className="mt-10 flex items-center gap-4">
          <button
            className="rounded-md border border-amber-200/70 bg-amber-100/10 px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-100/20"
            type="button"
          >
            Play Now
          </button>
        </div>
      </div>
    </section>
  )
}

export default Hero