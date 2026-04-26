import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./Auth.css";

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
    <div className="auth-page">
      <div className="auth-bg-gradient" />
      <div className="auth-container">
        <section className="auth-info-panel">
          <p className="auth-eyebrow">
            Authentication
          </p>
          <h1 className="auth-title">
            Enter The Matchroom
          </h1>
          <p className="auth-description">
            Create your player identity to unlock multiplayer games and secure
            websocket sessions.
          </p>
          <ul className="auth-features">
            <li>Secure JWT session tied to your account.</li>
            <li>Login with email or username.</li>
            <li>Fast onboarding and immediate game access.</li>
          </ul>
          <Link to="/" className="auth-back-link">
            Back To Home
          </Link>
        </section>

        <section className="auth-form-panel">
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab-btn ${mode === "login" ? "active" : ""}`}
              onClick={() => {
                setMode("login");
                setError(null);
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${mode === "register" ? "active" : ""}`}
              onClick={() => {
                setMode("register");
                setError(null);
              }}
            >
              Register
            </button>
          </div>

          <form onSubmit={onSubmit} className="auth-form">
            {mode === "register" ? (
              <>
                <label className="auth-input-group">
                  <span className="auth-label">
                    Username
                  </span>
                  <input
                    required
                    minLength={3}
                    maxLength={20}
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="auth-input"
                    placeholder="KnightRider"
                  />
                </label>
                <label className="auth-input-group">
                  <span className="auth-label">
                    Email
                  </span>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="auth-input"
                    placeholder="you@example.com"
                  />
                </label>
              </>
            ) : (
              <label className="auth-input-group">
                <span className="auth-label">
                  Email or Username
                </span>
                <input
                  required
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className="auth-input"
                  placeholder="you@example.com"
                />
              </label>
            )}

            <label className="auth-input-group">
              <span className="auth-label">
                Password
              </span>
              <input
                required
                type="password"
                minLength={8}
                maxLength={72}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="auth-input"
                placeholder="********"
              />
            </label>

            {error ? (
              <div className="auth-error">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="auth-submit-btn"
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
