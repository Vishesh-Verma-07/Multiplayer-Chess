import { useNavigate } from "react-router-dom";
import "./AboutChess.css";

const aboutPoints = [
  "Real-time multiplayer chess matches",
  "Clean board UI with smooth move feedback",
  "Quick room join and game start flow",
];

const AboutChess = () => {
  const navigate = useNavigate();

  return (
    <section className="about-chess-section relative overflow-hidden bg-[#060606] pb-14 text-zinc-100 md:pb-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(212,212,216,0.14),transparent_35%),radial-gradient(circle_at_88%_76%,rgba(113,113,122,0.12),transparent_38%)]" />

      <div className="relative grid min-h-[520px] w-full grid-cols-1 overflow-hidden bg-[linear-gradient(135deg,#141414_0%,#0c0c0c_48%,#1a1a1a_100%)] md:grid-cols-2">
        <div className="pointer-events-none absolute inset-x-0 top-[320px] h-px bg-gradient-to-r from-transparent via-zinc-500/40 to-transparent md:hidden" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-zinc-500/35 to-transparent md:block" />

        <div className="about-chess-image-panel group relative min-h-[320px] bg-zinc-950 md:min-h-[520px]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-90" />
          <div className="absolute inset-0 ring-1 ring-inset ring-zinc-300/10" />
          <div className="about-chess-king-wrap absolute left-1/2 top-[54%] h-[84%] w-[84%] -translate-x-1/2 -translate-y-1/2">
            <img
              src="/king.png"
              alt="Luxury chess king"
              className="about-chess-king h-full w-full object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,0.5)] transition duration-700 ease-out group-hover:scale-105"
            />
          </div>
        </div>

        <div className="about-chess-content flex items-center px-7 py-10 sm:px-10 md:px-12 lg:px-14">
          <div className="max-w-xl">
            <p className="about-chess-eyebrow text-xs font-semibold uppercase tracking-[0.42em] text-amber-200/90">
              Strategy. Focus. Precision.
            </p>

            <h2 className="about-chess-title mt-4 font-['Bebas_Neue',sans-serif] text-4xl leading-none tracking-[0.12em] text-zinc-100 sm:text-5xl lg:text-6xl">
              ABOUT CHESS
            </h2>

            <p className="about-chess-description mt-5 font-['Playfair_Display',serif] text-base leading-relaxed text-zinc-300 sm:text-lg">
              Chess is a game of timing, patience, and deep strategy. This
              platform is built to keep that experience elegant, fast, and
              competitive from the first move.
            </p>

            <div className="mt-8 border-t border-zinc-600/70 pt-6">
              <h3 className="font-['Bebas_Neue',sans-serif] text-3xl tracking-[0.14em] text-zinc-100 sm:text-4xl">
                WHY THIS WEBSITE
              </h3>

              <ul className="mt-4 grid gap-2.5 text-sm text-zinc-300 sm:text-base">
                {aboutPoints.map((point, index) => (
                  <li
                    key={point}
                    className="about-chess-item flex items-start gap-3 rounded-md border border-zinc-700/60 bg-zinc-900/40 px-3 py-2"
                    style={{ animationDelay: `${240 + index * 120}ms` }}
                  >
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-200/90" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <button
                onClick={() => navigate("/game")}
                type="button"
                className="rounded-md border border-amber-200/70 bg-amber-100/10 px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100 shadow-[0_8px_20px_rgba(251,191,36,0.14)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-100/20"
              >
                Play Online
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutChess;
