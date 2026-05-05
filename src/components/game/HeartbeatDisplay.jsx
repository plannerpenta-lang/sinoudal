import { useEffect, useRef } from 'react';

// Simple beep function using Web Audio API

const playHeartbeatBeep = (volume = 0.15) => {
  try {
    // Create fresh audio context each time to avoid suspension issues
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Short, subtle beep
    oscillator.frequency.value = 600;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.08);
    
    console.log('♥ Beep!');
  } catch (e) {
    console.log('Audio error:', e);
  }
};

export default function HeartbeatDisplay({ mode = 'normal', timeLeft = null }) {
  const canvasRef = useRef(null);
  const phaseRef = useRef(0);
  const offsetRef = useRef(0);
  const modeRef = useRef(mode);
  const pulseRef = useRef(0);
  const lastBeatRef = useRef(0);
  
  // Determine effective mode: if timeLeft is 0, show timeout state
  const effectiveMode = timeLeft === 0 ? 'timeout' : mode;

  useEffect(() => {
    modeRef.current = effectiveMode;
  }, [effectiveMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let lastTime = performance.now();

    const draw = () => {
      const currentMode = effectiveMode;
      const now = performance.now();
      const delta = now - lastTime;
      lastTime = now;

      const w = canvas.width;
      const h = canvas.height;
      const centerY = h / 2;

      // Clear with fade effect for trail
      ctx.fillStyle = 'rgba(5, 5, 5, 0.15)';
      ctx.fillRect(0, 0, w, h);

      const currentBpm = currentMode === 'boosted' ? 140 : currentMode === 'idle' ? 38 : 72;
      const beatInterval = 60000 / currentBpm;
      const phaseIncrement = (16.67 / beatInterval) * delta * 0.06;
      phaseRef.current = (phaseRef.current + phaseIncrement) % 1;
      offsetRef.current = (offsetRef.current + phaseIncrement * 0.08) % 1;

      // Pulse effect synced with heartbeat
      const pulseSpeed = currentMode === 'boosted' ? 2.3 : currentMode === 'idle' ? 0.6 : 1.2;
      pulseRef.current += delta * 0.001 * pulseSpeed;
      const pulseIntensity = (Math.sin(pulseRef.current) + 1) / 2;

      // Aurora background glow
      const auroraGrad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w);
      if (currentMode === 'glitch') {
        auroraGrad.addColorStop(0, `rgba(255, 0, 50, ${0.1 + pulseIntensity * 0.1})`);
        auroraGrad.addColorStop(0.5, 'rgba(255, 0, 50, 0.02)');
      } else if (currentMode === 'boosted') {
        auroraGrad.addColorStop(0, `rgba(255, 0, 80, ${0.15 + pulseIntensity * 0.15})`);
        auroraGrad.addColorStop(0.5, 'rgba(255, 0, 50, 0.03)');
      } else {
        auroraGrad.addColorStop(0, `rgba(0, 255, 200, ${0.04 + pulseIntensity * 0.04})`);
        auroraGrad.addColorStop(0.5, 'rgba(0, 255, 200, 0.01)');
      }
      auroraGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = auroraGrad;
      ctx.fillRect(0, 0, w, h);

      // Enhanced grid with glow
      ctx.strokeStyle = currentMode === 'glitch' || currentMode === 'boosted' 
        ? `rgba(255, 0, 50, ${0.08 + pulseIntensity * 0.05})`
        : `rgba(0, 255, 200, ${0.04 + pulseIntensity * 0.03})`;
      ctx.lineWidth = 0.4;
      ctx.shadowBlur = 8;
      ctx.shadowColor = ctx.strokeStyle;

      for (let x = 0; x <= w; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Major grid lines
      ctx.strokeStyle = currentMode === 'glitch' || currentMode === 'boosted'
        ? `rgba(255, 0, 50, ${0.15 + pulseIntensity * 0.1})`
        : `rgba(0, 255, 200, ${0.08 + pulseIntensity * 0.05})`;
      ctx.lineWidth = 0.8;
      ctx.shadowBlur = 15;

      for (let x = 0; x <= w; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += 100) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Center line
      ctx.strokeStyle = currentMode === 'glitch' || currentMode === 'boosted'
        ? `rgba(255, 0, 50, ${0.3 + pulseIntensity * 0.2})`
        : `rgba(0, 255, 200, ${0.15 + pulseIntensity * 0.1})`;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(w, centerY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (currentMode === 'glitch') {
        // Enhanced glitch effect
        const glitchIntensity = 0.5 + pulseIntensity * 0.5;
        ctx.strokeStyle = `rgba(255, 0, 50, ${glitchIntensity})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ff0033';
        ctx.shadowBlur = 20 + pulseIntensity * 10;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        for (let x = 0; x < w; x++) {
          const noise = Math.random() > 0.85 ? (Math.random() - 0.5) * 40 * glitchIntensity : 0;
          const y = centerY + noise + Math.sin(x * 0.1) * 5;
          ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Glitch fill
        ctx.fillStyle = `rgba(255, 0, 50, ${0.05 + pulseIntensity * 0.1})`;
        ctx.fillRect(0, 0, w, h);

        // Horizontal glitch lines
        for (let i = 0; i < 12; i++) {
          const y = Math.random() * h;
          const thickness = Math.random() * 3;
          ctx.fillStyle = `rgba(255, 0, 50, ${Math.random() * 0.3})`;
          ctx.fillRect(0, y, w, thickness);
        }
      } else if (currentMode === 'flatline') {
        // Flatline with subtle pulse
        ctx.strokeStyle = `rgba(100, 100, 100, ${0.4 + pulseIntensity * 0.1})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#666';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(w, centerY);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (currentMode === 'timeout') {
        // Timeout - flatline red alert
        ctx.strokeStyle = `rgba(255, 0, 50, ${0.8 + pulseIntensity * 0.2})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ff0033';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(w, centerY);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Red alert glow background
        ctx.fillStyle = `rgba(255, 0, 50, ${0.1 + pulseIntensity * 0.1})`;
        ctx.fillRect(0, 0, w, h);
      } else {
        // Normal / Boosted ECG
        const isBoosted = currentMode === 'boosted';
        const baseColor = isBoosted ? '#ff0055' : '#00ffcc';
        const glowColor = isBoosted ? '#ff0055' : '#00ffcc';
        const lineW = isBoosted ? 3 : 2.5;
        const glowIntensity = isBoosted ? 30 + pulseIntensity * 15 : 25 + pulseIntensity * 10;

        // Main ECG line with enhanced glow
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = glowIntensity;
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = lineW;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(0, centerY);

        const cycle = phaseRef.current;

        // Check if we're at the start of a new beat (QRS complex) to play beep
        const beatPhase = cycle % 1;
        if (beatPhase >= 0.16 && beatPhase < 0.18 && lastBeatRef.current !== Math.floor(cycle)) {
          lastBeatRef.current = Math.floor(cycle);
          // Play subtle beep synchronized with heartbeat
          playHeartbeatBeep(isBoosted ? 0.2 : 0.12);
        }

        for (let x = 0; x < w; x++) {
          const t = x / w;
          const rawPhase = cycle + t * 0.15;
          const phase = rawPhase % 1;

          let y = centerY;
          
          // Smoother baseline
          y += Math.sin(x * 0.2 + cycle * 15) * 1.5;

          // P wave (atrial depolarization)
          if (phase >= 0.08 && phase < 0.14) {
            const pPhase = (phase - 0.08) / 0.06;
            y -= 12 * Math.sin(pPhase * Math.PI);
          }
          // QRS complex (ventricular depolarization)
          else if (phase >= 0.16 && phase < 0.22) {
            const qrsPhase = (phase - 0.16) / 0.06;
            if (qrsPhase < 0.15) {
              y += 8; // Q
            } else if (qrsPhase < 0.5) {
              y -= 65 * Math.sin((qrsPhase - 0.15) / 0.35 * Math.PI); // R (taller)
            } else {
              y += 18 * Math.sin((qrsPhase - 0.5) / 0.5 * Math.PI); // S
            }
          }
          // T wave (ventricular repolarization)
          else if (phase >= 0.36 && phase < 0.52) {
            const tPhase = (phase - 0.36) / 0.16;
            y -= 20 * Math.sin(tPhase * Math.PI);
          }

          ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Secondary glow layer
        ctx.globalAlpha = 0.4;
        ctx.shadowBlur = glowIntensity * 2;
        ctx.lineWidth = lineW * 1.5;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Phosphor afterglow trail
        ctx.shadowBlur = 8;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = lineW * 0.7;
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
          const t = x / w;
          const rawPhase = cycle + t * 0.15 - 0.02;
          const phase = ((rawPhase % 1) + 1) % 1;
          let y = centerY;
          
          if (phase >= 0.16 && phase < 0.22) {
            const qrsPhase = (phase - 0.16) / 0.06;
            if (qrsPhase >= 0.15 && qrsPhase < 0.5) {
              y -= 65 * Math.sin((qrsPhase - 0.15) / 0.35 * Math.PI);
            }
          }
          
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        // Enhanced scan line
        const scanX = (offsetRef.current * w * 0.15) % w;
        const scanGrad = ctx.createLinearGradient(scanX - 40, 0, scanX + 8, 0);
        scanGrad.addColorStop(0, 'transparent');
        scanGrad.addColorStop(0.6, `${baseColor}44`);
        scanGrad.addColorStop(0.9, `${baseColor}88`);
        scanGrad.addColorStop(1, `${baseColor}CC`);
        ctx.fillStyle = scanGrad;
        ctx.fillRect(scanX - 40, 0, 48, h);

        // Bright dot at scan position
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(scanX, centerY, 4, 0, Math.PI * 2);
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
      <canvas 
        ref={canvasRef} 
        className="ecg-canvas" 
        width={640} 
        height={280}
        style={{
          filter: mode === 'boosted' || mode === 'glitch' 
            ? 'drop-shadow(0 0 20px rgba(255,0,80,0.5))' 
            : 'drop-shadow(0 0 20px rgba(0,255,200,0.4))'
        }}
      />
    </div>
  );
}