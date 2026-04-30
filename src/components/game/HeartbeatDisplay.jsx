import { useEffect, useRef } from 'react';

export default function HeartbeatDisplay({ mode = 'normal', timeLeft = null }) {
  const canvasRef = useRef(null);
  const phaseRef = useRef(0);
  const offsetRef = useRef(0);
  const modeRef = useRef(mode);

  // Keep modeRef in sync with prop
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    console.log('[HEARTBEAT] effect running, mode:', mode);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let lastTime = performance.now();

    const draw = () => {
      const currentMode = modeRef.current;

      const now = performance.now();
      const delta = now - lastTime;
      lastTime = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const currentBpm = currentMode === 'boosted' ? 140 : currentMode === 'idle' ? 38 : 72;

      const beatInterval = 60000 / currentBpm;
      const phaseIncrement = (16.67 / beatInterval) * delta * 0.06;
      phaseRef.current = (phaseRef.current + phaseIncrement) % 1;

      offsetRef.current = (offsetRef.current + phaseIncrement * 0.08) % 1;

      const w = canvas.width;
      const h = canvas.height;
      const centerY = h / 2;

      // ── OSCILLOSCOPE GRID ──
      ctx.strokeStyle = currentMode === 'glitch' ? 'rgba(236, 0, 24, 0.15)' : 'rgba(0, 114, 109, 0.12)';
      ctx.lineWidth = 0.3;

      for (let x = 0; x <= w; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += 10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      ctx.strokeStyle = currentMode === 'glitch' ? 'rgba(236, 0, 24, 0.25)' : 'rgba(0, 114, 109, 0.22)';
      ctx.lineWidth = 0.6;
      for (let x = 0; x <= w; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      ctx.strokeStyle = currentMode === 'glitch' ? 'rgba(236, 0, 24, 0.35)' : 'rgba(0, 114, 109, 0.35)';
      ctx.lineWidth = 0.8;
      for (let y = 0; y <= h; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      ctx.strokeStyle = currentMode === 'glitch' ? 'rgba(236, 0, 24, 0.5)' : 'rgba(0, 191, 176, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(w, centerY);
      ctx.stroke();

      if (currentMode === 'glitch') {
        ctx.strokeStyle = '#EC0018';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#EC0018';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        for (let x = 0; x < w; x++) {
          const slice = Math.random() > 0.9 ? (Math.random() - 0.5) * 30 : 0;
          ctx.lineTo(x, centerY + slice);
        }
        ctx.stroke();

        ctx.fillStyle = 'rgba(236, 0, 24, 0.08)';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(236, 0, 24, 0.4)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 8; i++) {
          const ny = Math.random() * h;
          ctx.beginPath();
          ctx.moveTo(0, ny);
          ctx.lineTo(w, ny + (Math.random() - 0.5) * 10);
          ctx.stroke();
        }
      } else if (currentMode === 'flatline') {
        ctx.strokeStyle = 'rgba(0, 191, 176, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#00BFB0';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(w, centerY);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // ── NORMAL / BOOSTED MODE ──
        const baseColor = currentMode === 'boosted' ? '#EC0018' : '#00BFB0';
        const glowColor = currentMode === 'boosted' ? '#EC0018' : '#00BFB0';
        const lineW = currentMode === 'boosted' ? 2.5 : 2;

        ctx.shadowColor = glowColor;
        ctx.shadowBlur = currentMode === 'boosted' ? 25 : 15;
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = lineW;
        ctx.beginPath();
        ctx.moveTo(0, centerY);

        const cycle = phaseRef.current;

        for (let x = 0; x < w; x++) {
          const t = x / w;
          const rawPhase = cycle + t * 0.18;
          const phase = rawPhase % 1;

          let y = centerY;
          y += Math.sin(x * 0.3 + phaseRef.current * 10) * 0.8;

          if (phase < 0.06) {
            y = centerY;
          } else if (phase < 0.10) {
            y = centerY - 8 * Math.sin((phase - 0.06) / 0.04 * Math.PI);
          } else if (phase < 0.13) {
            y = centerY;
          } else if (phase < 0.17) {
            y = centerY + 5 * Math.sin((phase - 0.13) / 0.04 * Math.PI);
          } else if (phase < 0.22) {
            y = centerY - 58 * Math.sin((phase - 0.17) / 0.05 * Math.PI);
          } else if (phase < 0.26) {
            y = centerY + 14 * Math.sin((phase - 0.22) / 0.04 * Math.PI);
          } else if (phase < 0.36) {
            y = centerY - 2;
          } else if (phase < 0.52) {
            y = centerY - 18 * Math.sin((phase - 0.36) / 0.16 * Math.PI);
          } else if (phase < 0.62) {
            y = centerY - 4 * Math.sin((phase - 0.52) / 0.1 * Math.PI);
          } else {
            y = centerY + Math.sin(phase * 8) * 1.2;
          }

          ctx.lineTo(x, y);
        }
        ctx.stroke();

        // ── Phosphor afterglow ──
        ctx.shadowBlur = 4;
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = lineW * 0.6;
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
          const t = x / w;
          const rawPhase = cycle + t * 0.18 - 0.015;
          const phase = ((rawPhase % 1) + 1) % 1;
          let y = centerY;
          y += Math.sin(x * 0.3 + phaseRef.current * 10) * 0.8;
          if (phase >= 0.17 && phase < 0.22) {
            y = centerY - 58 * Math.sin((phase - 0.17) / 0.05 * Math.PI);
          } else if (phase >= 0.36 && phase < 0.52) {
            y = centerY - 18 * Math.sin((phase - 0.36) / 0.16 * Math.PI);
          }
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        // ── Moving scan line ──
        const scanX = (offsetRef.current * w * 0.18) % w;
        const scanGrad = ctx.createLinearGradient(scanX - 30, 0, scanX + 5, 0);
        scanGrad.addColorStop(0, 'transparent');
        scanGrad.addColorStop(0.7, `${baseColor}33`);
        scanGrad.addColorStop(1, `${baseColor}66`);
        ctx.fillStyle = scanGrad;
        ctx.fillRect(scanX - 30, 0, 35, h);

        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 10;
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.arc(scanX, centerY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [mode, timeLeft]);

  return (
    <div className="heartbeat-wrapper">
      <canvas ref={canvasRef} className="ecg-canvas" width={640} height={380} />
    </div>
  );
}
