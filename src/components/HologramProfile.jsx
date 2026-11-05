

import './HologramProfile.css';

// Information displayed around the hologram
const details = [
  {
    className: 'orbit-top-left',
    label: 'EDUCATION',
    value: 'MNIT Jaipur',
  },
  {
    className: 'orbit-top-right',
    label: 'ROLE',
    value: 'AI · Data Science',
  },
  {
    className: 'orbit-bottom-left',
    label: 'SKILLS',
    value: 'Python · SQL',
  },
  {
    className: 'orbit-bottom-right',
    label: 'FOCUS',
    value: 'Machine Learning',
  },
];

export default function HologramProfile() {
  // Transparent PNG with the background removed
  const photo = '/images/profile.png';

  // Rotate the hologram according to mouse position
  function handleMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();

    const x =
      (event.clientX - rect.left) / rect.width - 0.5;

    const y =
      (event.clientY - rect.top) / rect.height - 0.5;

    // Horizontal rotation: -27.5deg to +27.5deg
    event.currentTarget.style.setProperty(
      '--person-rotate-y',
      `${x * 55}deg`
    );

    // Vertical rotation: -6deg to +6deg
    event.currentTarget.style.setProperty(
      '--person-rotate-x',
      `${-y * 12}deg`
    );
  }

  // Return to the original position
  function resetMove(event) {
    event.currentTarget.style.setProperty(
      '--person-rotate-y',
      '0deg'
    );

    event.currentTarget.style.setProperty(
      '--person-rotate-x',
      '0deg'
    );
  }

  return (
    <div
      className="hologram-profile"
      onMouseMove={handleMove}
      onMouseLeave={resetMove}
    >

      {/* Hologram system header */}
      <div className="holo-header">
        <span className="holo-live-dot" />

        BATCOMPUTER / PROFILE_001

        <span className="holo-header-end">
          ONLINE
        </span>
      </div>

      {/* Main 3D hologram scene */}
      <div className="holo-scene">

        {/* Rotating holographic rings */}
        <div className="holo-orbit holo-orbit-one" />
        <div className="holo-orbit holo-orbit-two" />
        <div className="holo-orbit holo-orbit-three" />

        {/* Floating person projection */}
        <div className="holo-projection">

          {/* Light beam from projector */}
          <div className="holo-beam" />

          {/* Mouse-controlled portrait */}
          <div className="holo-portrait">
            <img
              src={photo}
              alt="Parth Patkar holographic portrait"
              draggable={false}
            />
          </div>

          {/* Moving holographic scanline */}
          <div className="holo-scanline" />

        </div>

        {/* Information floating around the person */}
        {details.map((detail) => (
          <div
            className={`holo-data ${detail.className}`}
            key={detail.label}
          >
            <span>{detail.label}</span>
            <strong>{detail.value}</strong>
          </div>
        ))}

        {/* Glowing circular projector */}
        <div className="holo-platform">
          <div className="holo-platform-inner" />
        </div>

      </div>

      {/* Identity details */}
      <div className="holo-identity">
        <p>IDENTITY VERIFIED</p>

        <h2>PARTH PATKAR</h2>

        <span>
          Senior Software Engineer · AI & Data Science
        </span>
      </div>

      {/* Hologram system footer */}
      <div className="holo-footer">
        <span>SYS.STATUS: ACTIVE</span>
        <span>HOLOGRAPHIC INTERFACE // 2026</span>
      </div>

    </div>
  );
}
