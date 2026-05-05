import { useEffect, useRef, useCallback, useState } from 'react';

export default function HeartbeatDisplay({ mode = 'normal', timeLeft = null, audioEnabled = false }) {
  const canvasRef = useRef(null);
  const phaseRef = useRef(0);
  const audioContextRef = useRef(null);
  const lastBeatTimeRef = useRef(0);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  
  const effectiveMode = timeLeft === 0 ? 'timeout' : mode;

  const unlockAudio = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    // Play silent sound to unlock
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.001);
    
    setAudioUnlocked(true);
    console.log('🔊 AUDIO UNLOCKED - state:', ctx.state);
  }, []);

  // Try to auto-init when audio becomes enabled
  useEffect(() => {
    if (audioEnabled && !audioUnlocked) {
      unlockAudio().catch(e => console.log('Auto unlock failed:', e));
    }
  }, [audioEnabled, audioUnlocked, unlockAudio]);

  const playBeep = useCallback(async () => {
    if (!audioEnabled || !audioUnlocked) return;
    
    try {
      const ctx = audioContextRef.current;
      if (!ctx || ctx.state !== 'running') return;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = 800;
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
      
      console.log('♥ BEEP!');
    } catch (e) {
      console.log('Beep error:', e.message);
    }
  }, [audioEnabled, audioUnlocked]);

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

      // Fade effect
      ctx.fillStyle = 'rgba(5, 5, 5, 0.15)';
      ctx.fillRect(0, 0, w, h);

      const currentBpm = currentMode === 'boosted' ? 140 : currentMode === 'idle' ? 38 : 72;
      const beatInterval = 60000 / currentBpm;
      const phaseIncrement = (16.67 / beatInterval) * delta * 0.06;
      phaseRef.current = (phaseRef.current + phaseIncrement) % 1;

      // Play beep on each beat
      const beatDuration = 60000 / currentBpm;
      const timeSinceLastBeat = now - lastBeatTimeRef.current;
      
      if (timeSinceLastBeat >= beatDuration) {
        lastBeatTimeRef.current = now;
        playBeep();
      }

      // Draw grid
      ctx.strokeStyle = currentMode === 'timeout' || currentMode === 'boosted' 
        ? 'rgba(255, 0, 50, 0.08)' 
        : 'rgba(0, 255, 200, 0.08)';
      ctx.lineWidth = 0.4;
      
      for (let x = 0; x <= w; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y <= h; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Draw ECG
      if (currentMode === 'timeout') {
        // Red flatline
        ctx.strokeStyle = 'rgba(255, 0, 50, 0.9)';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ff0033';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(w, centerY);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = 'rgba(255, 0, 50, 0.1)';
        ctx.fillRect(0, 0, w, h);
      } else {
        // Normal ECG
        const isBoosted = currentMode === 'boosted';
        const baseColor = isBoosted ? '#ff0055' : '#00ffcc';
        
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = isBoosted ? 25 : 15;
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = isBoosted ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(0, centerY);

        const cycle = phaseRef.current;

        for (let x = 0; x < w; x++) {
          const t = x / w;
          const rawPhase = cycle + t * 0.15;
          const phase = rawPhase % 1;
          let y = centerY;
          
          y += Math.sin(x * 0.2 + cycle * 15) * 1.5;

          if (phase >= 0.08 && phase < 0.14) {
            const pPhase = (phase - 0.08) / 0.06;
            y -= 12 * Math.sin(pPhase * Math.PI);
          } else if (phase >= 0.16 && phase < 0.22) {
            const qrsPhase = (phase - 0.16) / 0.06;
            if (qrsPhase < 0.15) {
              y += 8;
            } else if (qrsPhase < 0.5) {
              y -= 65 * Math.sin((qrsPhase - 0.15) / 0.35 * Math.PI);
            } else {
              y += 18 * Math.sin((qrsPhase - 0.5) / 0.5 * Math.PI);
            }
          } else if (phase >= 0.36 && phase < 0.52) {
            const tPhase = (phase - 0.36) / 0.16;
            y -= 20 * Math.sin(tPhase * Math.PI);
          }

          ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, [effectiveMode, playBeep]);

  return (
    <div className="heartbeat-wrapper" style={{ position: 'relative' }}>
      {audioEnabled && !audioUnlocked && (
        <button 
          onClick={unlockAudio}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            padding: '8px 16px',
            background: '#00ffcc',
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 100,
            boxShadow: '0 0 10px rgba(0,255,200,0.5)'
          }}
        >
          🔊 Activar Sonido
        </button>
      )}
      <canvas 
        ref={canvasRef} 
        className="ecg-canvas" 
        width={640} 
        height={280}
        style={{
          filter: effectiveMode === 'boosted' || effectiveMode === 'timeout'
            ? 'drop-shadow(0 0 20px rgba(255,0,80,0.5))' 
            : 'drop-shadow(0 0 20px rgba(0,255,200,0.4))'
        }}
      />
    </div>
  );
}