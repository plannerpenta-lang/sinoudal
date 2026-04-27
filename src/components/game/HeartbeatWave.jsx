import { useEffect, useRef, useState, useCallback } from 'react';

export default function HeartbeatWave({ mode = 'normal', compact = false, height = 180 }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const phaseRef = useRef(0);
  const trailRef = useRef([]);
  const animationRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: height });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const TRAIL_LENGTH = 6;
    const TRAIL_OPACITY = [0.5, 0.35, 0.22, 0.12, 0.06, 0.02];

    const getBPM = () => {
      switch (mode) {
        case 'boosted': return 140;
        case 'idle': return 45;
        case 'glitch': return 90;
        default: return 72;
      }
    };

    const getAmplitude = () => {
      switch (mode) {
        case 'boosted': return 1.3;
        case 'idle': return 0.5;
        case 'glitch': return 0.8;
        default: return 1.0;
      }
    };

    const getECGValue = (phase, amplitude) => {
      const cycle = phase % 1;

      if (mode === 'glitch') {
        return (Math.random() - 0.5) * 0.3 * amplitude;
      }

      if (mode === 'idle') {
        if (cycle < 0.15) return 0.08 * amplitude * Math.sin(cycle * Math.PI / 0.15);
        if (cycle < 0.22) return 0;
        if (cycle < 0.28) return 0.15 * amplitude * Math.sin((cycle - 0.22) / 0.06 * Math.PI);
        if (cycle < 0.45) return 0;
        if (cycle < 0.58) return 0.12 * amplitude * Math.sin((cycle - 0.45) / 0.13 * Math.PI);
        return (Math.random() - 0.5) * 0.02 * amplitude;
      }

      if (cycle < 0.08) return 0.12 * amplitude * Math.sin(cycle * Math.PI / 0.08);
      if (cycle < 0.16) return 0;
      if (cycle < 0.18) return -0.15 * amplitude * Math.sin((cycle - 0.16) / 0.02 * Math.PI);
      if (cycle < 0.22) return amplitude * Math.sin((cycle - 0.18) / 0.04 * Math.PI);
      if (cycle < 0.26) return -0.25 * amplitude * Math.sin((cycle - 0.22) / 0.04 * Math.PI);
      if (cycle < 0.34) return 0;
      if (cycle < 0.48) return 0.28 * amplitude * Math.sin((cycle - 0.34) / 0.14 * Math.PI);
      return (Math.random() - 0.5) * 0.015 * amplitude;
    };

    const drawGrid = (ctx, w, h) => {
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.08)';
      ctx.lineWidth = 0.5;
      for (let x = 20; x < w; x += 5) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 10; y < h; y += 5) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.18)';
      ctx.lineWidth = 1;
      for (let x = 20; x < w; x += 25) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 10; y < h; y += 25) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      ctx.strokeStyle = '#ff3333';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(255, 51, 51, 0.03)';
      ctx.fillRect(20, 0, 20, h);
      for (let y = 0; y < h; y += 10) {
        ctx.globalAlpha = y % 20 === 0 ? 0.5 : 0.15;
        ctx.fillStyle = y % 20 === 0 ? '#ff3333' : '#661111';
        ctx.fillRect(20, y, 20, 1);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.25)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(20, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawWave = (ctx, points, strokeColor, lineWidth, shadowBlur, opacity) => {
      if (!points || points.length === 0) return;
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = shadowBlur;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.stroke();
      ctx.restore();
    };

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) return;

      const bpm = getBPM();
      const amplitude = getAmplitude();

      ctx.fillStyle = 'rgba(0, 16, 8, 0.25)';
      ctx.fillRect(0, 0, w, h);
      drawGrid(ctx, w, h);

      const beatInterval = 60000 / bpm;
      const phaseIncrement = 16.67 / beatInterval;
      phaseRef.current += phaseIncrement;

      if (phaseRef.current >= 1) {
        phaseRef.current %= 1;
        const currentPoints = trailRef.current[0] || [];
        if (currentPoints.length > 0) {
          trailRef.current.unshift(currentPoints);
          if (trailRef.current.length > TRAIL_LENGTH) trailRef.current.pop();
        }
      }

      const centerY = h / 2;
      const points = [];
      const segments = 300;

      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * w;
        const normalizedX = i / segments;
        const ecgValue = getECGValue(phaseRef.current + normalizedX * 0.15, amplitude);
        const wave = Math.sin(normalizedX * Math.PI * 2 + phaseRef.current * 0.5) * (h * 0.03);
        points.push({ x, y: centerY + wave + ecgValue * (h * 0.35) });
      }

      trailRef.current[0] = points;

      const colors = {
        normal: '#00ff88',
        boosted: '#ff4466',
        idle: '#00ff88',
        glitch: '#ffcc00'
      };
      const color = colors[mode] || colors.normal;

      for (let i = TRAIL_LENGTH - 1; i >= 0; i--) {
        if (trailRef.current[i]?.length > 0) {
          drawWave(
            ctx, trailRef.current[i], color,
            compact ? 1 : (i === 0 ? 2.5 : 2.5 - i * 0.3),
            compact ? 5 : (i === 0 ? 20 : 15 - i * 2),
            TRAIL_OPACITY[i]
          );
        }
      }

      if (!compact) {
        ctx.fillStyle = color;
        ctx.font = 'bold 12px Courier New';
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillText(`${bpm} BPM`, 50, h - 12);
        ctx.font = '10px Courier New';
        ctx.fillStyle = 'rgba(0, 255, 136, 0.6)';
        ctx.shadowBlur = 5;
        ctx.fillText('HR', 10, h - 12);
        ctx.fillStyle = 'rgba(0, 255, 136, 0.5)';
        ctx.font = '9px Courier New';
        ctx.shadowBlur = 0;
        ctx.textAlign = 'right';
        ctx.fillText('25mm/s', w - 10, h - 12);
        ctx.textAlign = 'left';
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [mode, compact, canvasSize]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '150px' }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
}