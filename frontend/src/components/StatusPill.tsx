const STATUS_STYLES: Record<string, { text: string; border: string; bg: string }> = {
  best: { text: 'text-success', border: 'border-success/30', bg: 'bg-success/20' },
  critical: { text: 'text-alert-red', border: 'border-alert-red/30', bg: 'bg-alert-red/20' },
  monitor: { text: 'text-blue-400', border: 'border-blue-400/30', bg: 'bg-blue-400/20' },
  active: { text: 'text-success', border: 'border-success/30', bg: 'bg-success/20' },
  searching: { text: 'text-warn', border: 'border-warn/30', bg: 'bg-warn/20' },
  error: { text: 'text-alert-red', border: 'border-alert-red/30', bg: 'bg-alert-red/20' },
  'out-of-stock': { text: 'text-t3', border: 'border-t3/30', bg: 'bg-t3/20' },
};

interface StatusPillProps {
  status: string;
  label?: string;
}

export default function StatusPill({ status, label }: StatusPillProps) {
  const s = STATUS_STYLES[status.toLowerCase()] || STATUS_STYLES.monitor;
  return (
    <span className={`inline-block px-2 py-0.5 text-[9px] uppercase font-mono font-bold border rounded ${s.text} ${s.border} ${s.bg}`}>
      {label || status}
    </span>
  );
}
