
import './AIOrb.css';

export default function AIOrb({
  mode = 'welcome',
  onClick,
  isOpen = false,
}) {
  const isDocked = mode === 'dock';

  const orbContent = (
    <>
      {/* Glowing energy halo */}
      <div className="ai-orb-halo" />

      {/* Rotating holographic rings */}
      <div className="ai-orb-ring ai-orb-ring-one" />
      <div className="ai-orb-ring ai-orb-ring-two" />
      <div className="ai-orb-ring ai-orb-ring-three" />

      {/* Main energy core */}
      <div className="ai-orb-core">
        <div className="ai-orb-core-inner" />
      </div>

      {/* Golden sparks */}
      <span className="ai-orb-spark spark-one" />
      <span className="ai-orb-spark spark-two" />
      <span className="ai-orb-spark spark-three" />
      <span className="ai-orb-spark spark-four" />

      {/* Cyan + gold particle trail */}
      <div className="ai-orb-particles" aria-hidden="true">
        {Array.from({ length: 24 }, (_, index) => (
          <span
            className="ai-orb-particle"
            key={index}
            style={{ '--particle-index': index }}
          />
        ))}
      </div>
    </>
  );

  // Interactive button after the orb docks
  if (isDocked) {
    return (
      <button
        type="button"
        className={`ai-orb ai-orb-dock ${
          isOpen ? 'ai-orb-chat-active' : ''
        }`}
        onClick={onClick}
        aria-label={
          isOpen
            ? 'Close PARTH AI chatbot'
            : 'Open PARTH AI chatbot'
        }
        aria-expanded={isOpen}
        aria-controls="parth-ai-chat"
        title={isOpen ? 'Close PARTH.AI' : 'Ask PARTH.AI'}
      >
        {orbContent}
      </button>
    );
  }

  // Decorative orb during welcome and flight
  return (
    <div
      className={`ai-orb ai-orb-${mode}`}
      aria-hidden="true"
    >
      {orbContent}
    </div>
  );
}

