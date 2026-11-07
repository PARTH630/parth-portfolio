
import HologramProfile from './HologramProfile';

import {
  Mail,
  ArrowRight,
} from 'lucide-react';

import './Hero.css';

function Hero() {
  const email = 'parthpatkar169@gmail.com';

  // Automatically handles localhost and GitHub Pages.
  const BASE_URL = import.meta.env.BASE_URL;

  const backgroundVideo = `${BASE_URL}videos/gotham.mp4`;
  const resumeFile = `${BASE_URL}resume.pdf`;

  return (
    <section className="hero" id="home">

      {/* Gotham background video */}
      <div className="hero-background" aria-hidden="true">
        
        
        <video
          className="hero-video"
          src={backgroundVideo}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={(e) => {
            console.log("Gotham video loaded");
            e.currentTarget.play().catch((error) => {
              console.warn("Video autoplay blocked:", error);
            });
          }}
          onError={(e) => {
            console.error(
              "Gotham video failed:",
              e.currentTarget.error
            );
          }}
        />

        <div className="hero-overlay"></div>
        <div className="hero-light"></div>
      </div>

      {/* Hero introduction */}
      <div className="hero-content">

        <div className="availability">
          <span className="status-dot"></span>
          DATA SCIENCE · AI · MACHINE LEARNING
        </div>

        <h1>
          Hi, I'm <span>Parth Patkar.</span>
          <br />
          I build intelligent
          <br />
          solutions with data & AI.
        </h1>

        <p className="hero-description">
          I'm passionate about AI Engineering and Data Science, 
          with a background in Metallurgical and Materials Engineering from MNIT Jaipur. 
          I enjoy transforming raw data into actionable insights, 
          developing machine learning models, and building intelligent, 
          real-world applications using Generative AI, LLMs, and modern AI technologies.
        </p>

        {/* Action buttons */}
        <div className="hero-buttons">

          <a
            href="#projects"
            className="primary-btn"
          >
            Explore My Work
            <ArrowRight size={18} />
          </a>

          <a
            href={resumeFile}
            download="Parth_Patkar_Resume.pdf"
            className="resume-button"
            type="application/pdf"
            aria-label="Download Parth Patkar resume"
          >
            Download Resume
            <ArrowRight size={18} />
          </a>

        </div>

        {/* Social links */}
        <div className="social-links">

          <a
            href={`mailto:${email}`}
            aria-label="Email Parth"
          >
            <Mail />
          </a>

          <a
            href="https://github.com/PARTH630"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            GitHub
          </a>

          <a
            href="https://www.linkedin.com/in/parth-patkar-108519314/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            LinkedIn
          </a>

        </div>
      </div>

      {/* Batman holographic profile */}
      <div className="hero-visual">

        <div
          className="glow-circle"
          aria-hidden="true"
        ></div>

        <HologramProfile />

      </div>

    </section>
  );
}

export default Hero;
