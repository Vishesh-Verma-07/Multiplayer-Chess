import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

type AuthMode = "login" | "register";

export const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from ?? "/game";
  }, [location.state]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "register") {
        await register(username, email, password);
      } else {
        await login(identifier, password);
      }

      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to complete authentication request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,rgba(14,165,233,0.2),transparent_38%),radial-gradient(circle_at_80%_75%,rgba(245,158,11,0.2),transparent_44%),linear-gradient(160deg,#020617_0%,#111827_100%)] px-4 py-10 text-zinc-100 sm:px-6">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_420px]">
        <section className="rounded-2xl border border-sky-200/20 bg-slate-900/40 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.35em] text-sky-200/80">
            Authentication
          </p>
          <h1 className="mt-4 font-['Bebas_Neue',sans-serif] text-5xl tracking-[0.08em] text-sky-50 sm:text-6xl">
            Enter The Matchroom
          </h1>
          <p className="mt-4 max-w-xl text-zinc-300">
            Create your player identity to unlock multiplayer games and secure
            websocket sessions.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-zinc-200">
            <li>Secure JWT session tied to your account.</li>
            <li>Login with email or username.</li>
            <li>Fast onboarding and immediate game access.</li>
          </ul>
          <Link
            to="/"
            className="mt-8 inline-flex rounded-md border border-zinc-500/60 px-5 py-2 text-sm font-semibold tracking-wide text-zinc-100 transition hover:border-zinc-300 hover:text-white"
          >
            Back To Home
          </Link>
        </section>

        <section className="rounded-2xl border border-zinc-600/60 bg-black/65 p-6 shadow-2xl shadow-black/60 backdrop-blur-md sm:p-8">
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg bg-zinc-800/70 p-1">
            <button
              type="button"
              className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-sky-400 text-slate-950"
                  : "text-zinc-200 hover:bg-zinc-700"
              }`}
              onClick={() => {
                setMode("login");
                setError(null);
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                mode === "register"
                  ? "bg-amber-300 text-slate-950"
                  : "text-zinc-200 hover:bg-zinc-700"
              }`}
              onClick={() => {
                setMode("register");
                setError(null);
              }}
            >
              Register
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "register" ? (
              <>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-zinc-200">
                    Username
                  </span>
                  <input
                    required
                    minLength={3}
                    maxLength={20}
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none ring-0 transition focus:border-sky-300"
                    placeholder="KnightRider"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-zinc-200">
                    Email
                  </span>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none ring-0 transition focus:border-sky-300"
                    placeholder="you@example.com"
                  />
                </label>
              </>
            ) : (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-zinc-200">
                  Email or Username
                </span>
                <input
                  required
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none ring-0 transition focus:border-sky-300"
                  placeholder="you@example.com"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-200">
                Password
              </span>
              <input
                required
                type="password"
                minLength={8}
                maxLength={72}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none ring-0 transition focus:border-sky-300"
                placeholder="********"
              />
            </label>

            {error ? (
              <div className="rounded-md border border-rose-400/60 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-sky-300 px-4 py-2.5 text-sm font-bold uppercase tracking-[0.16em] text-slate-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Please wait..."
                : mode === "register"
                  ? "Create Account"
                  : "Sign In"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
