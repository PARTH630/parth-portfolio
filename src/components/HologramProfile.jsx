import { useEffect, useRef } from 'react';
import { animate } from 'motion';
import './HologramProfile.css';

const details = [
  { className: 'orbit-top-left', label: 'EDUCATION', value: 'MNIT Jaipur' },
  { className: 'orbit-top-right', label: 'ROLE', value: 'AI · Data Science' },
  { className: 'orbit-bottom-left', label: 'SKILLS', value: 'Python · SQL' },
  { className: 'orbit-bottom-right', label: 'FOCUS', value: 'Machine Learning' },
];

// The effect is contained in the hologram scene, not the whole page.
// Canvas 2D is used here to avoid requiring WebGPU/Three.js on visitors' devices.
function ParticlePortrait({ imageRef }) {
  const sceneRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const portrait = imageRef.current;
    if (!scene || !context || !portrait) return;

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) return; // Show the original photo immediately.

    let disposed = false;
    let started = false;
    let playback = null;
    let intersectionObserver = null;

    async function start() {
      if (disposed || started) return;
      started = true;

      try {
        if (!portrait.complete) {
          await new Promise((resolve, reject) => {
            portrait.addEventListener('load', resolve, { once: true });
            portrait.addEventListener('error', reject, { once: true });
          });
        }
        if (!portrait.naturalWidth || disposed) return;

        const sceneWidth = scene.clientWidth;
        const sceneHeight = scene.clientHeight;
        if (!sceneWidth || !sceneHeight) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(sceneWidth * dpr);
        canvas.height = Math.round(sceneHeight * dpr);
        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Sample the real PNG's pixels so the dots actually form the portrait.
        const sampleWidth = sceneWidth < 400 ? 105 : 135;
        const aspect = portrait.naturalHeight / portrait.naturalWidth;
        const sampleHeight = Math.min(190, Math.round(sampleWidth * aspect));
        const offscreen = document.createElement('canvas');
        offscreen.width = sampleWidth;
        offscreen.height = sampleHeight;
        const off = offscreen.getContext('2d', { willReadFrequently: true });
        if (!off) return;
        off.drawImage(portrait, 0, 0, sampleWidth, sampleHeight);
        const pixels = off.getImageData(0, 0, sampleWidth, sampleHeight).data;

        const wrapper = portrait.parentElement;
        const boxWidth = wrapper.offsetWidth;
        const boxHeight = wrapper.offsetHeight;
        // Same 'object-fit: contain' as the existing CSS.
        const fit = Math.min(boxWidth / portrait.naturalWidth, boxHeight / portrait.naturalHeight);
        const drawWidth = portrait.naturalWidth * fit;
        const drawHeight = portrait.naturalHeight * fit;
        const left = wrapper.offsetLeft - boxWidth / 2 + (boxWidth - drawWidth) / 2;
        const top = wrapper.offsetTop + (boxHeight - drawHeight) / 2;

        const dots = [];
        const step = sceneWidth < 400 ? 2 : 2;
        for (let y = 0; y < sampleHeight; y += step) {
          for (let x = 0; x < sampleWidth; x += step) {
            const index = (y * sampleWidth + x) * 4;
            const alpha = pixels[index + 3] / 255;
            if (alpha < 0.28 || Math.random() > alpha * 0.82) continue;
            const angle = Math.random() * Math.PI * 2;
            const radius = (0.34 + Math.random() * 0.62) * Math.max(sceneWidth, sceneHeight);
            const brightness = (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
            dots.push({
              x0: sceneWidth / 2 + Math.cos(angle) * radius,
              y0: sceneHeight / 2 + Math.sin(angle) * radius,
              x1: left + ((x + 0.5) / sampleWidth) * drawWidth,
              y1: top + ((y + 0.5) / sampleHeight) * drawHeight,
              phase: Math.random() * Math.PI * 2,
              delay: Math.random() * 0.32,
              size: 0.65 + Math.random() * 0.8,
              alpha: 0.52 + brightness / 700,
              gold: Math.random() < 0.085,
            });
          }
        }
        if (disposed || dots.length === 0) return;

        // Only hide the original photo when the particle animation can run.
        scene.classList.add('holo-particle-active');
        const duration = 3.4;
        const ease = (t) => 1 - Math.pow(1 - t, 3);
        const render = (progress) => {
          if (disposed) return;
          context.clearRect(0, 0, sceneWidth, sceneHeight);
          context.globalCompositeOperation = 'lighter';
          for (const p of dots) {
            const local = Math.max(0, Math.min(1, (progress - p.delay) / (1 - p.delay)));
            const amount = ease(local);
            const swirl = (1 - amount) * Math.sin(progress * 16 + p.phase) * 22;
            const x = p.x0 + (p.x1 - p.x0) * amount + swirl;
            const y = p.y0 + (p.y1 - p.y0) * amount + swirl * 0.45;
            const fade = progress > 0.84 ? Math.max(0, (1 - progress) / 0.16) : 1;
            context.globalAlpha = p.alpha * fade * (0.45 + 0.55 * local);
            context.fillStyle = p.gold ? '#f3c776' : '#75d8f6';
            context.fillRect(x, y, p.size * 1.25, p.size * 1.25);
          }
          context.globalAlpha = 1;
          context.globalCompositeOperation = 'source-over';
          if (progress >= 0.82) scene.classList.add('holo-particle-formed');
        };

        playback = animate(0, 1, {
          duration,
          ease: 'linear',
          onUpdate: render,
          onComplete: () => {
            if (disposed) return;
            context.clearRect(0, 0, sceneWidth, sceneHeight);
            scene.classList.remove('holo-particle-active');
            scene.classList.remove('holo-particle-formed');
          },
        });
      } catch (error) {
        // A photo-loading or canvas error should never hide the real portrait.
        console.warn('Hologram particle effect unavailable:', error);
        scene.classList.remove('holo-particle-active', 'holo-particle-formed');
      }
    }

    // Start only once when the visitor can actually see the hologram.
    intersectionObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        intersectionObserver?.disconnect();
        start();
      }
    }, { threshold: 0.12 });
    intersectionObserver.observe(scene);

    return () => {
      disposed = true;
      intersectionObserver?.disconnect();
      playback?.stop();
      scene.classList.remove('holo-particle-active', 'holo-particle-formed');
    };
  }, [imageRef]);

  return (
    <div className="holo-particle-layer" ref={sceneRef} aria-hidden="true">
      <canvas className="holo-particle-canvas" ref={canvasRef} />
    </div>
  );
}

export default function HologramProfile() {
  const imageRef = useRef(null);
  const photo = `${import.meta.env.BASE_URL}images/profile.png`;

  function handleMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.setProperty('--person-rotate-y', `${x * 55}deg`);
    event.currentTarget.style.setProperty('--person-rotate-x', `${-y * 12}deg`);
  }

  function resetMove(event) {
    event.currentTarget.style.setProperty('--person-rotate-y', '0deg');
    event.currentTarget.style.setProperty('--person-rotate-x', '0deg');
  }

  return (
    <div className="hologram-profile" onMouseMove={handleMove} onMouseLeave={resetMove}>
      <div className="holo-header">
        <span className="holo-live-dot" />
        BATCOMPUTER / PROFILE_001
        <span className="holo-header-end">ONLINE</span>
      </div>

      <div className="holo-scene">
        <div className="holo-orbit holo-orbit-one" />
        <div className="holo-orbit holo-orbit-two" />
        <div className="holo-orbit holo-orbit-three" />

        <div className="holo-projection">
          <div className="holo-beam" />
          <div className="holo-portrait">
            <img ref={imageRef} src={photo} alt="Parth Patkar holographic portrait" draggable={false} />
          </div>
          <div className="holo-scanline" />
        </div>

        <ParticlePortrait imageRef={imageRef} />

        {details.map((detail) => (
          <div className={`holo-data ${detail.className}`} key={detail.label}>
            <span>{detail.label}</span>
            <strong>{detail.value}</strong>
          </div>
        ))}
        <div className="holo-platform"><div className="holo-platform-inner" /></div>
      </div>

      <div className="holo-identity">
        <p>IDENTITY VERIFIED</p>
        <h2>PARTH PATKAR</h2>
        <span>Senior Software Engineer · AI &amp; Data Science</span>
      </div>
      <div className="holo-footer">
        <span>SYS.STATUS: ACTIVE</span>
        <span>HOLOGRAPHIC INTERFACE // 2026</span>
      </div>
    </div>
  );
}
