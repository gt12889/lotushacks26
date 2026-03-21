'use client';

import React, { useRef, useState, useCallback } from 'react';

interface DockProps {
  children: React.ReactNode;
  className?: string;
  /** Max scale factor for hovered item (default 1.2) */
  magnification?: number;
  /** How many neighbors are affected (default 2) */
  distance?: number;
}

interface DockItemProps {
  children: React.ReactNode;
  className?: string;
  /** Scale value from 0-1 representing proximity to cursor */
  scale?: number;
}

const DockContext = React.createContext<{
  mouseX: number | null;
  magnification: number;
  distance: number;
}>({ mouseX: null, magnification: 1.2, distance: 2 });

export function Dock({
  children,
  className = '',
  magnification = 1.2,
  distance = 2,
}: DockProps) {
  const [mouseX, setMouseX] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMouseX(e.clientX - rect.left);
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setMouseX(null);
  }, []);

  return (
    <DockContext.Provider value={{ mouseX, magnification, distance }}>
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`flex items-end gap-1 ${className}`}
      >
        {children}
      </div>
    </DockContext.Provider>
  );
}

export function DockItem({
  children,
  className = '',
}: DockItemProps) {
  const { mouseX, magnification, distance } = React.useContext(DockContext);
  const itemRef = useRef<HTMLDivElement>(null);

  let scale = 1;
  if (mouseX !== null && itemRef.current) {
    const rect = itemRef.current.getBoundingClientRect();
    const parentRect = itemRef.current.parentElement?.getBoundingClientRect();
    if (parentRect) {
      const itemCenterX = rect.left - parentRect.left + rect.width / 2;
      const dist = Math.abs(mouseX - itemCenterX);
      const itemWidth = rect.width;
      const maxDist = itemWidth * distance;
      if (dist < maxDist) {
        const proximity = 1 - dist / maxDist;
        // Smooth cosine curve for natural magnification falloff
        const smoothed = (1 + Math.cos(Math.PI * (1 - proximity))) / 2;
        scale = 1 + (magnification - 1) * smoothed;
      }
    }
  }

  return (
    <div
      ref={itemRef}
      className={`transition-transform duration-150 ease-out origin-bottom ${className}`}
      style={{ transform: `scale(${scale})` }}
    >
      {children}
    </div>
  );
}
