import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "./Hero.css";

const Hero = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <section className="hero-section">
      <div className="hero-bg" />
      <div className="hero-overlay" />
      <div className="hero-gradient-orb" />

      <div className="hero-content container">
        <span className="hero-eyebrow">Circle to Square</span>

        <h1 className="hero-title">Master The Board</h1>

        <p className="hero-description">
          Play elegant chess battles with smooth gameplay, real-time moves, and
          a board that feels premium from the first click.
        </p>

        <div className="hero-actions">
          <button
            className="btn-glass"
            type="button"
            onClick={() => navigate(isAuthenticated ? "/game" : "/auth")}
          >
            Play Now
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
