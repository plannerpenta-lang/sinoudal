import { useState, useEffect, useRef, useCallback } from 'react';

export function useHeartbeat(mode = 'normal') {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const phaseRef = useRef(0);

  const getBPM = useCallback(() => {
    switch (mode) {
      case 'boosted':
        return 140;
      case 'glitch':
        return 100;
      default:
        return 60;
    }
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      ctx.fillStyle = 'rgba(10, 14, 23, 0.3)';
      ctx.fillRect(0, 0, width, height);

      const bpm = getBPM();
      const beatInterval = 60000 / bpm;
      phaseRef.current += (16.67 / beatInterval) * Math.PI * 2;

      const y = height / 2;
      const amplitude = mode === 'boosted' ? 80 : 50;

      ctx.beginPath();
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 20;

      const points = [];
      for (let x = 0; x < width; x++) {
        const normalizedX = x / width;
        const heartbeat = Math.sin(phaseRef.current + normalizedX * Math.PI * 4);

        let wave = Math.sin(normalizedX * Math.PI * 8 + phaseRef.current * 0.5) * 10;
        let ecg = 0;

        if (heartbeat > 0.7) {
          ecg = amplitude * Math.sin((normalizedX - 0.3) * Math.PI * 10);
        } else if (heartbeat > 0.5) {
          ecg = -amplitude * 0.3 * Math.sin((normalizedX - 0.35) * Math.PI * 8);
        }

        const yPos = y + wave + ecg * heartbeat;
        points.push({ x, y: yPos });
      }

      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }

      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mode, getBPM]);

  return { canvasRef };
}