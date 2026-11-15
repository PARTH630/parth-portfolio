import { useCallback, useEffect, useRef, useState } from 'react';
import { animate } from 'motion';
import './HologramProfile.css';

const details = [
  { className: 'orbit-top-left', label: 'EDUCATION', value: 'MNIT Jaipur' },
  { className: 'orbit-top-right', label: 'ROLE', value: 'AI · Data Science' },
  { className: 'orbit-bottom-left', label: 'SKILLS', value: 'Python · SQL' },
  { className: 'orbit-bottom-right', label: 'FOCUS', value: 'Machine Learning' },
];

const FORMATION_SECONDS = 5;

function ParticlePortrait({ imageRef, replayKey, onFinish, introFinished }) {
  const layerRef = useRef(null);
  const canvasRef = useRef(null);
  const onFinishRef = useRef(onFinish);
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);

  useEffect(() => {
    // Do not begin particle assembly behind the welcome screen.
    if (!introFinished) return;

    const layer = layerRef.current;
    const canvas = canvasRef.current;
    const portrait = imageRef.current;
    const holoScene = layer?.closest('.holo-scene');
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!layer || !ctx || !portrait || !holoScene) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      holoScene.classList.add('holo-photo-revealed');
      onFinishRef.current?.();
      return;
    }

    let disposed = false;
    let playback;
    let observer;
    let hasStarted = false;
    let revealed = false;

    // Keep the photograph invisible while waiting for the intro and assembly.
    holoScene.classList.remove('holo-photo-revealed');

    const clearStatus = () => {
      layer.classList.remove('holo-particle-active', 'holo-particle-formed');
    };

    async function start() {
      if (disposed || hasStarted) return;
      hasStarted = true;

      try {
        // decode() also works when the image loaded before this effect ran.
        if (!portrait.complete || !portrait.naturalWidth) await portrait.decode();
        if (disposed || !portrait.naturalWidth) return;

        const rect = layer.getBoundingClientRect();
        const box = portrait.parentElement.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        if (!width || !height || !box.width || !box.height) {
          throw new Error('Hologram has zero-size layout');
        }

        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        // Use transparent PNG pixels, not a generic silhouette.
        const sampleW = width < 400 ? 108 : 144;
        const sampleH = Math.min(204, Math.round(sampleW * portrait.naturalHeight / portrait.naturalWidth));
        const source = document.createElement('canvas');
        source.width = sampleW;
        source.height = sampleH;
        const sampleCtx = source.getContext('2d', { willReadFrequently: true });
        if (!sampleCtx) throw new Error('Cannot create sampling canvas');
        sampleCtx.drawImage(portrait, 0, 0, sampleW, sampleH);
        const pixels = sampleCtx.getImageData(0, 0, sampleW, sampleH).data;

        // Exact object-fit: contain rectangle, measured relative to canvas.
        const fit = Math.min(box.width / portrait.naturalWidth, box.height / portrait.naturalHeight);
        const visibleW = portrait.naturalWidth * fit;
        const visibleH = portrait.naturalHeight * fit;
        const originX = box.left - rect.left + (box.width - visibleW) / 2;
        const originY = box.top - rect.top + (box.height - visibleH) / 2;

        const dots = [];
        for (let y = 0; y < sampleH; y += 2) {
          for (let x = 0; x < sampleW; x += 2) {
            const pixelIndex = (y * sampleW + x) * 4;
            const alpha = pixels[pixelIndex + 3] / 255;
            if (alpha < 0.24 || Math.random() > alpha * 0.9) continue;

            const angle = Math.random() * Math.PI * 2;
            const radius = (0.3 + Math.random() * 0.9) * Math.max(width, height);
            const r = pixels[pixelIndex];
            const g = pixels[pixelIndex + 1];
            const b = pixels[pixelIndex + 2];
            dots.push({
              startX: width / 2 + Math.cos(angle) * radius,
              startY: height / 2 + Math.sin(angle) * radius,
              endX: originX + ((x + 0.5) / sampleW) * visibleW,
              endY: originY + ((y + 0.5) / sampleH) * visibleH,
              delay: Math.random() * 0.25,
              phase: Math.random() * Math.PI * 2,
              size: 1.2 + Math.random() * 1.3,
              opacity: 0.65 + (r + g + b) / 255 / 9,
              color: Math.random() < 0.09 ? '#f3c776' : '#79ddff',
            });
          }
        }
        if (disposed || dots.length === 0) throw new Error('No visible portrait pixels');

        layer.classList.add('holo-particle-active');
        console.info(`[PARTH hologram] Forming portrait with ${dots.length} particles`);

        const ease = (t) => 1 - Math.pow(1 - t, 3);
        const render = (progress) => {
          if (disposed) return;
          ctx.clearRect(0, 0, width, height);
          ctx.globalCompositeOperation = 'lighter';
          for (const dot of dots) {
            const local = Math.max(0, Math.min(1, (progress - dot.delay) / (1 - dot.delay)));
            const amount = ease(local);
            const swirl = (1 - amount) * Math.sin(progress * 17 + dot.phase) * 28;
            const x = dot.startX + (dot.endX - dot.startX) * amount + swirl;
            const y = dot.startY + (dot.endY - dot.startY) * amount + swirl * 0.4;
            const fade = progress > 0.82 ? Math.max(0, (1 - progress) / 0.18) : 1;
            ctx.globalAlpha = dot.opacity * (0.4 + local * 0.6) * fade;
            ctx.fillStyle = dot.color;
            ctx.fillRect(x, y, dot.size, dot.size);
          }
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
          if (progress >= 0.84 && !revealed) {
            revealed = true;
            layer.classList.add('holo-particle-formed');
            holoScene.classList.add('holo-photo-revealed');
          }
        };

        playback = animate(0, 1, {
          duration: FORMATION_SECONDS,
          ease: 'linear',
          onUpdate: render,
          onComplete: () => {
            if (disposed) return;
            ctx.clearRect(0, 0, width, height);
            clearStatus();
            holoScene.classList.add('holo-photo-revealed');
            console.info('[PARTH hologram] Particle formation complete');
            onFinishRef.current?.();
          },
        });
      } catch (error) {
        console.warn('[PARTH hologram] Particle effect unavailable:', error);
        clearStatus();
        holoScene.classList.add('holo-photo-revealed');
        onFinishRef.current?.();
      }
    }

    observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        start();
      }
    }, { threshold: 0.45 });
    observer.observe(layer);

    return () => {
      disposed = true;
      observer?.disconnect();
      playback?.stop();
      clearStatus();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [imageRef, replayKey, introFinished]);

  return (
    <div className="holo-particle-layer" ref={layerRef} aria-hidden="true">
      <canvas className="holo-particle-canvas" ref={canvasRef} />
    </div>
  );
}

export default function HologramProfile({ introFinished = false }) {
  const imageRef = useRef(null);
  const [replayKey, setReplayKey] = useState(0);
  const [isForming, setIsForming] = useState(false);
  const photo = `${import.meta.env.BASE_URL}images/profile.png`;

  const finish = useCallback(() => setIsForming(false), []);
  const replay = () => {
    setIsForming(true);
    setReplayKey((value) => value + 1);
  };

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

        <ParticlePortrait imageRef={imageRef} replayKey={replayKey} onFinish={finish} introFinished={introFinished} />

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
        <button
          type="button"
          className="holo-replay-button"
          onClick={replay}
          disabled={isForming || !introFinished}
          aria-label="Replay hologram particle formation"
        >
          {isForming ? 'ASSEMBLING...' : '↻ REPLAY HOLOGRAM'}
        </button>
      </div>

      <div className="holo-footer">
        <span>SYS.STATUS: ACTIVE</span>
        <span>HOLOGRAPHIC INTERFACE // 2026</span>
      </div>
    </div>
  );
}
