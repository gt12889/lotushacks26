'use client';

interface SponsorBadgeProps {
  sponsors: string[];
}

const SPONSOR_COLORS: Record<string, string> = {
  TinyFish: '#00DBE7',
  BrightData: '#22C55E',
  Qwen: '#A855F7',
  OpenRouter: '#F97316',
  Exa: '#14B8A6',
  ElevenLabs: '#EC4899',
  OpenAI: '#94A3B8',
};

export default function SponsorBadge({ sponsors }: SponsorBadgeProps) {
  return (
    <div className="flex gap-1 flex-wrap">
      {sponsors.map((sponsor) => {
        const color = SPONSOR_COLORS[sponsor] || '#64748B';
        return (
          <span
            key={sponsor}
            className="px-1.5 py-0.5 rounded border bg-transparent text-[8px] uppercase font-mono font-bold"
            style={{ borderColor: color, color }}
          >
            {sponsor}
          </span>
        );
      })}
    </div>
  );
}
