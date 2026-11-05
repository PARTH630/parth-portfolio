
import { useEffect, useState } from 'react';
import AIOrb from './AIOrb';
import './AIWelcome.css';

export default function AIWelcome({
  onComplete,
  onLaunch,
}) {
  const [phase, setPhase] = useState('enter');

  useEffect(() => {
    const revealTimer = setTimeout(() => {
      setPhase('reveal');
    }, 500);

    // Start the orb's flight while welcome fades
    const launchTimer = setTimeout(() => {
      setPhase('exit');
      onLaunch?.();
    }, 4200);

    // Remove the welcome screen
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 5100);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(launchTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, onLaunch]);

  return (
    <div className={`ai-welcome ai-welcome-${phase}`}>
      <div className="ai-welcome-grid" aria-hidden="true" />
      <div className="ai-welcome-light" aria-hidden="true" />

      {/* Orb moves around the welcome text */}
      <div className="ai-welcome-orb">
        <AIOrb mode="welcome" />
      </div>

      <div className="ai-welcome-content">
        <div className="ai-system-status">
          <span className="ai-status-dot" />
          BATCOMPUTER // INITIALIZING
        </div>

        <div className="ai-welcome-line" />

        <h1>
          WELCOME TO
          <br />
          <span>PARTH'S PORTFOLIO</span>
        </h1>

        <p className="ai-welcome-subtitle">
          Where Data Meets Intelligence
        </p>

        <div className="ai-loading">
          <span>ESTABLISHING SECURE CONNECTION</span>
          <div className="ai-loading-track">
            <div className="ai-loading-progress" />
          </div>
        </div>
      </div>

      <div className="ai-welcome-bottom">
        <span>PARTH.AI / SYSTEM 01</span>
        <span>ACCESS GRANTED</span>
      </div>
    </div>
  );
}
