import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "./AboutChess.css";

const aboutPoints = [
  "Real-time multiplayer chess matches",
  "Clean board UI with smooth move feedback",
  "Quick room join and game start flow",
];

const AboutChess = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Stop observing once visible
          if (gridRef.current) {
            observer.unobserve(gridRef.current);
          }
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.2, // Trigger when 20% visible
      }
    );

    if (gridRef.current) {
      observer.observe(gridRef.current);
    }

    return () => {
      if (gridRef.current) {
        observer.unobserve(gridRef.current);
      }
    };
  }, []);

  return (
    <section className="about-section">
      <div className="about-bg-gradient" />

      <div className="container">
        <div 
          ref={gridRef}
          className={`about-grid ${isVisible ? 'is-visible' : ''}`}
        >
          <div className="about-divider-h" />
          <div className="about-divider-v" />

          <div className="about-image-panel">
            <div className="about-image-overlay" />
            <div className="about-image-wrapper">
              <img
                src="/king.png"
                alt="Luxury chess king"
                className="about-image"
              />
            </div>
          </div>

          <div className="about-content-panel">
            <div style={{ maxWidth: '600px' }}>
              <span className="about-eyebrow">
                Strategy. Focus. Precision.
              </span>

              <h2 className="about-title">
                ABOUT CHESS
              </h2>

              <p className="about-description">
                Chess is a game of timing, patience, and deep strategy. This
                platform is built to keep that experience elegant, fast, and
                competitive from the first move.
              </p>

              <div className="about-features">
                <h3 className="about-subtitle">
                  WHY THIS WEBSITE
                </h3>

                <ul className="about-list">
                  {aboutPoints.map((point) => (
                    <li key={point} className="about-item">
                      <span className="about-item-dot" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <button
                  onClick={() => navigate("/game")}
                  type="button"
                  className="btn-glass"
                >
                  Play Online
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutChess;
