'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AuroraProps {
  className?: string;
  colors?: string[];
  speed?: number;
  opacity?: number;
  blur?: number;
}

export function Aurora({
  className,
  colors = ['#00DBE7', '#0E7490', '#2DD4BF', '#0D4F6B', '#00DBE7'],
  speed = 1,
  opacity = 0.3,
  blur = 80,
}: AuroraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    function draw() {
      if (!canvas || !ctx) return;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < colors.length; i++) {
        const t = time * speed * 0.0003;
        const xOffset = Math.sin(t + i * 1.7) * width * 0.3;
        const yOffset = Math.cos(t * 0.7 + i * 2.1) * height * 0.2;
        const cx = width * 0.5 + xOffset;
        const cy = height * 0.4 + yOffset;
        const radius = Math.max(width, height) * (0.3 + Math.sin(t * 0.5 + i) * 0.1);

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        gradient.addColorStop(0, colors[i]);
        gradient.addColorStop(1, 'transparent');

        ctx.globalAlpha = opacity / colors.length * (1.2 + Math.sin(t + i * 0.9) * 0.3);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(cx, cy, radius, radius * 0.6, (t + i) * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      time += 16;
      animationId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [colors, speed, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 w-full h-full pointer-events-none', className)}
      style={{ filter: `blur(${blur}px)` }}
    />
  );
}
