
import HologramProfile from './HologramProfile';

import {
  Mail,
  ArrowRight,
} from 'lucide-react';

import './Hero.css';

function Hero({ introFinished = false }) {
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
          onLoadedData={(event) => {
            console.log('Gotham video loaded');

            event.currentTarget.play().catch((error) => {
              console.warn('Video autoplay blocked:', error);
            });
          }}
          onError={(event) => {
            console.error(
              'Gotham video failed:',
              event.currentTarget.error
            );
          }}
        />

        <div className="hero-overlay" />
        <div className="hero-light" />
      </div>

      {/* Hero introduction */}
      <div className="hero-content">

        <div className="availability">
          <span className="status-dot" />
          DATA SCIENCE · AI · MACHINE LEARNING
        </div>

        <h1>
          Hi, I'm <span>Parth Patkar.</span>
          <br />
          I build intelligent
          <br />
          <span className="hero-headline-last">
            solutions with data &amp; AI.
          </span>
        </h1>

        <p className="hero-description">
          I'm passionate about AI Engineering and Data Science,
          with a background in Metallurgical and Materials
          Engineering from MNIT Jaipur.
          I enjoy transforming raw data into actionable insights,
          developing machine learning models, and building
          intelligent, real-world applications using Generative AI,
          LLMs, and modern AI technologies.
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
        />

        {/* Start particle formation after welcome animation */}
        <HologramProfile
          introFinished={introFinished}
        />

      </div>

    </section>
  );
}

export default Hero;
