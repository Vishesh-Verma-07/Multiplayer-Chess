import { useNavigate } from "react-router-dom";
import AboutChess from "../components/AboutChess/AboutChess";
import Hero from "../components/heroSection/Hero";
import Footer from "../components/footer";
import { useAuth } from "../auth/AuthContext";
import "./Landing.css";

export const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Hero />
      <AboutChess />
      
      <section className="cta-section">
        <div className="cta-glow" />
        <div className="cta-content">
          <h2 className="cta-title">Ready To Play?</h2>
          <p className="cta-description">
            Join thousands of players online right now. Prove your strategic brilliance.
          </p>
          <div className="cta-btn-wrapper">
            <button
              className="btn-glass"
              type="button"
              onClick={() => navigate(isAuthenticated ? "/game" : "/auth")}
              style={{ backgroundColor: '#050505', color: '#fbbf24', borderColor: '#fbbf24' }}
            >
              Start A Match
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};
