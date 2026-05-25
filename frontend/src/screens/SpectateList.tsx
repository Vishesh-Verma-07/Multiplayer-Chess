import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listActiveGames } from "../api/gamesClient";
import type { ActiveGameSummary } from "../api/gamesClient";
import "./SpectateList.css";

const formatOpponent = (white: string | null, black: string | null) => {
  const whiteName = white ?? "White";
  const blackName = black ?? "Black";
  return `${whiteName} vs ${blackName}`;
};

export const SpectateList = () => {
  const [games, setGames] = useState<ActiveGameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadGames = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await listActiveGames();
      setGames(result);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load active games.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadGames();
  }, []);

  return (
    <div className="spectate-page">
      <div className="spectate-hero">
        <div>
          <p className="spectate-eyebrow">Spectator Lounge</p>
          <h1 className="spectate-title">Live Matches</h1>
          <p className="spectate-description">
            Pick a match to watch in real time. No login required.
          </p>
        </div>
        <div className="spectate-actions">
          <button
            type="button"
            className="spectate-btn"
            onClick={loadGames}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <Link to="/" className="spectate-btn spectate-btn--ghost">
            Back Home
          </Link>
        </div>
      </div>

      {error ? <div className="spectate-error">{error}</div> : null}

      <div className="spectate-grid">
        {loading ? (
          <div className="spectate-empty">Loading active games...</div>
        ) : games.length === 0 ? (
          <div className="spectate-empty">No active games right now.</div>
        ) : (
          games.map((game) => (
            <button
              key={game.gameId}
              type="button"
              className="spectate-card"
              onClick={() =>
                navigate(`/spectate/${game.gameId}`, {
                  state: {
                    whiteUsername: game.whiteUsername,
                    blackUsername: game.blackUsername,
                  },
                })
              }
            >
              <div className="spectate-card-header">
                <span className="spectate-matchup">
                  {formatOpponent(game.whiteUsername, game.blackUsername)}
                </span>
                <span className="spectate-chip">Live</span>
              </div>
              <div className="spectate-meta">
                <span>Moves: {game.movesCount}</span>
                <span className="spectate-id">ID {game.gameId}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
