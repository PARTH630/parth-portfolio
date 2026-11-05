
import { ArrowUp, Mail } from 'lucide-react';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-top">

          <div className="footer-brand">
            <a href="#home" className="footer-logo">
              PARTH<span>.</span>
            </a>

            <p>
              Transforming data into insights and building
              intelligent solutions with AI.
            </p>
          </div>

          <div className="footer-navigation">
            <h3>Quick Links</h3>
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#skills">Skills</a>
            <a href="#projects">Projects</a>
            <a href="#experience">Experience</a>
            <a href="#contact">Contact</a>
          </div>

          <div className="footer-connect">
            <h3>Connect With Me</h3>

            <a
              href="https://github.com/PARTH630"
              target="_blank"
              rel="noreferrer"
            >
              GitHub ↗
            </a>

            <a
              href="https://www.linkedin.com/in/parth-patkar-108519314/"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn ↗
            </a>

            <a href="mailto:parthpatkar169@gmail.com">
              <Mail size={17} /> Email Me
            </a>
          </div>

        </div>

        <div className="footer-bottom">
          <p>© {currentYear} Parth Patkar. All rights reserved.</p>

          <a href="#home" className="back-to-top">
            Back to top <ArrowUp size={16} />
          </a>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
