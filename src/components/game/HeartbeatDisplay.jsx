import { useEffect, useRef } from 'react';

export default function HeartbeatDisplay({ mode = 'normal', timeLeft = null }) {
  const canvasRef = useRef(null);
  const phaseRef = useRef(0);
  
  const effectiveMode = timeLeft === 0 ? 'timeout' : mode;

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
  }, [effectiveMode]);

  return (
    <div className="heartbeat-wrapper">
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