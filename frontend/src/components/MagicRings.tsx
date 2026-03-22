'use client';

import { useRef, useEffect } from 'react';

interface MagicRingsProps {
  color?: string;
  colorTwo?: string;
  ringCount?: number;
  speed?: number;
  attenuation?: number;
  lineThickness?: number;
  baseRadius?: number;
  radiusStep?: number;
  scaleRate?: number;
  opacity?: number;
  blur?: number;
  noiseAmount?: number;
  rotation?: number;
  ringGap?: number;
  fadeIn?: number;
  fadeOut?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  hoverScale?: number;
  parallax?: number;
  clickBurst?: boolean;
  className?: string;
}

export default function MagicRings({
  color = '#fc42ff',
  colorTwo = '#42fcff',
  ringCount = 6,
  speed = 1,
  attenuation = 10,
  lineThickness = 2,
  baseRadius = 0.35,
  radiusStep = 0.1,
  scaleRate = 0.1,
  opacity = 1,
  blur = 0,
  noiseAmount = 0.1,
  rotation = 0,
  ringGap = 1.5,
  fadeIn = 0.7,
  fadeOut = 0.5,
  followMouse = false,
  mouseInfluence = 0.2,
  hoverScale = 1.2,
  parallax = 0.05,
  clickBurst = false,
  className = '',
}: MagicRingsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 });
  const burstRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };
    if (followMouse) {
      canvas.addEventListener('mousemove', handleMouse);
    }

    const handleClick = () => {
      if (clickBurst) burstRef.current = 1;
    };
    if (clickBurst) {
      canvas.addEventListener('click', handleClick);
    }

    let animId: number;
    let t = 0;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;
      const size = Math.min(w, h);

      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * mouseInfluence;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * mouseInfluence;

      const mx = followMouse ? (mouseRef.current.x - 0.5) * parallax * 100 : 0;
      const my = followMouse ? (mouseRef.current.y - 0.5) * parallax * 100 : 0;

      ctx.clearRect(0, 0, w, h);

      if (blur > 0) {
        ctx.filter = `blur(${blur}px)`;
      }

      ctx.globalAlpha = Math.min(1, (t / 60) * fadeIn) * opacity * (1 - burstRef.current * 0.5);
      burstRef.current *= 0.95;

      const burstScale = 1 + burstRef.current * (hoverScale - 1);

      for (let i = 0; i < ringCount; i++) {
        const r = baseRadius * size * (1 + i * radiusStep * ringGap) * burstScale;
        const phase = (t * 0.016 * speed) / (1 + i / attenuation) + rotation * (Math.PI / 180) + (i * 0.1);
        const wobble = Math.sin(phase) * noiseAmount * r * 0.1;
        const rad = r + wobble;

        ctx.beginPath();
        const segments = 64;
        for (let j = 0; j <= segments; j++) {
          const angle = (j / segments) * Math.PI * 2 + phase * scaleRate;
          const x = cx + mx + Math.cos(angle) * rad;
          const y = cy + my + Math.sin(angle) * rad;
          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();

        const grad = ctx.createLinearGradient(cx - rad, cy - rad, cx + rad, cy + rad);
        grad.addColorStop(0, color);
        grad.addColorStop(1, colorTwo);
        ctx.strokeStyle = grad;
        ctx.lineWidth = lineThickness;
        ctx.stroke();
      }

      ctx.filter = 'none';
      ctx.globalAlpha = 1;

      t++;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (followMouse) canvas.removeEventListener('mousemove', handleMouse);
      if (clickBurst) canvas.removeEventListener('click', handleClick);
      cancelAnimationFrame(animId);
    };
  }, [
    color,
    colorTwo,
    ringCount,
    speed,
    attenuation,
    lineThickness,
    baseRadius,
    radiusStep,
    scaleRate,
    opacity,
    blur,
    noiseAmount,
    rotation,
    ringGap,
    fadeIn,
    fadeOut,
    followMouse,
    mouseInfluence,
    hoverScale,
    parallax,
    clickBurst,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ pointerEvents: followMouse || clickBurst ? 'auto' : 'none' }}
      aria-hidden
    />
  );
}
