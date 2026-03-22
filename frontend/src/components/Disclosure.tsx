'use client';

import { useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface DisclosureProps {
  /** Compact header text shown in collapsed state */
  title: string;
  /** Optional count badge shown next to title */
  badge?: string | number | null;
  /** Whether the section starts expanded */
  defaultOpen?: boolean;
  /** Content to render when expanded */
  children: ReactNode;
  /** Optional icon element shown before the title */
  icon?: ReactNode;
  /** Accent color for the left border when open — defaults to cyan */
  accent?: string;
}

export default function Disclosure({
  title,
  badge,
  defaultOpen = false,
  children,
  icon,
  accent = '#00DBE7',
}: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-lg border transition-colors"
      style={{
        borderColor: open ? `${accent}33` : 'var(--color-border, #1E293B)',
        borderLeftWidth: open ? 2 : 1,
        borderLeftColor: open ? accent : undefined,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left group hover:bg-[#ffffff06] transition-colors rounded-lg"
      >
        <ChevronRight
          className="w-3.5 h-3.5 text-[#94A3B8] transition-transform duration-200 flex-shrink-0"
          style={{ transform: open ? 'rotate(90deg)' : undefined }}
        />
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-widest flex-1">
          {title}
        </span>
        {badge != null && (
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${accent}15`, color: accent }}
          >
            {badge}
          </span>
        )}
      </button>
      {open && <div className="px-4 pb-4 space-y-4">{children}</div>}
    </div>
  );
}
