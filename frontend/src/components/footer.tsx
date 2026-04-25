import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-bg-gradient" />

      <div className="container">
        <div className="footer-main">
          <div>
            <span className="footer-brand-eyebrow">
              Circle To Square
            </span>
            <h3 className="footer-brand-title">
              PLAY CHESS ONLINE
            </h3>
            <p className="footer-brand-desc">
              Challenge players, sharpen strategy, and enjoy a premium chess
              experience built for speed and focus.
            </p>
          </div>

          <div>
            <h4 className="footer-nav-title">
              Quick Links
            </h4>
            <ul className="footer-nav-list">
              <li>
                <Link className="footer-nav-link" to="/">
                  Home
                </Link>
              </li>
              <li>
                <Link className="footer-nav-link" to="/game">
                  Play Game
                </Link>
              </li>
              <li>
                <a className="footer-nav-link" href="#">
                  About
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="footer-nav-title">
              Contact
            </h4>
            <ul className="footer-nav-list">
              <li>support@circletosquare.app</li>
              <li>Available 24/7 for match support</li>
              <li style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Built with React + TypeScript</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p>Copyright {year} Circle To Square. All rights reserved.</p>
            <p>Designed for modern competitive chess.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
