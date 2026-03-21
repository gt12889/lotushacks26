'use client';

import { useRef, useState, useCallback } from 'react';

interface GlareHoverProps {
  children: React.ReactNode;
  className?: string;
  glareColor?: string;
  glareOpacity?: number;
  glareSize?: number;
  borderRadius?: string;
}

export default function GlareHover({
  children,
  className = '',
  glareColor = 'rgba(255,255,255,0.15)',
  glareOpacity = 1,
  glareSize = 200,
  borderRadius = 'inherit',
}: GlareHoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [glarePos, setGlarePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setGlarePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    []
  );

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => setIsHovering(false), []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ borderRadius }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          borderRadius,
          opacity: isHovering ? glareOpacity : 0,
          background: `radial-gradient(${glareSize}px circle at ${glarePos.x}px ${glarePos.y}px, ${glareColor}, transparent)`,
        }}
      />
    </div>
  );
}
