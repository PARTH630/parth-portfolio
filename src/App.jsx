
import { useState, useCallback, useEffect } from 'react';

import AIWelcome from './components/AIWelcome';
import AIOrb from './components/AIOrb';
import AIChat from './components/AIChat';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Projects from './components/Projects';
import Experience from './components/Experience';
import Achievements from './components/Achievements';
import Contact from './components/Contact';
import Footer from './components/Footer';

import './App.css';
import './BatmanTheme.css';
import './SectionBackgrounds.css';
import './ResponsiveFixes.css';

function App() {

  // ==========================================
  // WELCOME + ORB ANIMATION STATES
  // ==========================================

  const [showWelcome, setShowWelcome] = useState(true);
  const [isFlying, setIsFlying] = useState(false);
  const [isDocked, setIsDocked] = useState(false);

  // ==========================================
  // CHATBOT STATES
  // ==========================================

  const [chatOpen, setChatOpen] = useState(false);

  // Greeting stays visible until first interaction
  const [showChatHint, setShowChatHint] = useState(false);

  // Prevent greeting from appearing again
  const [hintShown, setHintShown] = useState(false);

  // ==========================================
  // WELCOME ANIMATION HANDLERS
  // ==========================================

  const handleLaunch = useCallback(() => {
    setIsFlying(true);
  }, []);

  const handleWelcomeComplete = useCallback(() => {
    setShowWelcome(false);
  }, []);

  // ==========================================
  // ORB FLIGHT COMPLETION
  // ==========================================

  function handleFlightEnd(event) {

    // Ignore animations from child elements
    if (event.target !== event.currentTarget) {
      return;
    }

    setIsFlying(false);
    setIsDocked(true);
  }

  // ==========================================
  // AUTOMATIC PERMANENT GREETING POPUP
  // ==========================================

  useEffect(() => {

    if (!isDocked || chatOpen || hintShown) {
      return;
    }

    // Show greeting immediately after orb docks
    setShowChatHint(true);
    setHintShown(true);

  }, [isDocked, chatOpen, hintShown]);

  // ==========================================
  // OPEN CHATBOT
  // ==========================================

  function openChatbot() {
    setShowChatHint(false);
    setHintShown(true);
    setChatOpen(true);
  }

  // ==========================================
  // TOGGLE CHATBOT
  // ==========================================

  function toggleChatbot() {
    setShowChatHint(false);
    setHintShown(true);
    setChatOpen(previous => !previous);
  }

  // ==========================================
  // MAIN PORTFOLIO
  // ==========================================

  return (
    <>

      {/* =====================================
          BATMAN WELCOME SCREEN
      ===================================== */}

      {showWelcome && (
        <AIWelcome
          onLaunch={handleLaunch}
          onComplete={handleWelcomeComplete}
        />
      )}

      {/* =====================================
          NAVIGATION
      ===================================== */}

      <Navbar />

      {/* =====================================
          PORTFOLIO CONTENT
      ===================================== */}

      <main>

        <Hero />

        <div className="cinematic-sections">

          {/* Gotham / Batcave background video */}
          <div
            className="sections-video-layer"
            aria-hidden="true"
          >
            <video
              className="sections-bg-video"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            >
              <source
                src="/videos/batcave-bg.mp4"
                type="video/mp4"
              />
            </video>

            <div className="sections-video-overlay" />
          </div>

          {/* Portfolio sections */}
          <About />
          <Skills />
          <Projects />
          <Experience />
          <Achievements />
          <Contact />

        </div>

      </main>

      {/* =====================================
          FOOTER
      ===================================== */}

      <Footer />

      {/* =====================================
          FLYING PARTH.AI ORB
      ===================================== */}

      {isFlying && (
        <div
          className="ai-orb-flight-path"
          onAnimationEnd={handleFlightEnd}
          aria-hidden="true"
        >
          <AIOrb mode="flight" />
        </div>
      )}

      {/* =====================================
          DOCKED PARTH.AI CHATBOT
      ===================================== */}

      {isDocked && (
        <>

          {/* LangChain + Groq RAG Chatbot */}
          <AIChat
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
          />

          {/* =================================
              PERMANENT GREETING POPUP
          ================================= */}

          {showChatHint && !chatOpen && (
            <button
              type="button"
              className="ai-chat-hint"
              onClick={openChatbot}
              aria-label="Open PARTH.AI chatbot"
            >
              <span className="ai-chat-hint-status">
                <span className="ai-chat-hint-dot" />
                PARTH.AI · ONLINE
              </span>

              <span className="ai-chat-hint-message">
                Hey there! 👋 Need any info about Parth?
              </span>

              <span className="ai-chat-hint-action">
                Ask me anything →
              </span>
            </button>
          )}

          {/* =================================
              FLOATING ENERGY ORB
          ================================= */}

          <AIOrb
            mode="dock"
            isOpen={chatOpen}
            onClick={toggleChatbot}
          />

        </>
      )}

    </>
  );
}

export default App;
