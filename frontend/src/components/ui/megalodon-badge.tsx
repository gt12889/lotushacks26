import { Badge } from './badge';

const STATUS_STYLES: Record<string, string> = {
  best: 'border-success/30 bg-success/20 text-success',
  critical: 'border-alert-red/30 bg-alert-red/20 text-alert-red',
  monitor: 'border-blue-400/30 bg-blue-400/20 text-blue-400',
  active: 'border-success/30 bg-success/20 text-success',
  searching: 'border-warn/30 bg-warn/20 text-warn',
  error: 'border-alert-red/30 bg-alert-red/20 text-alert-red',
  'out-of-stock': 'border-t3/30 bg-t3/20 text-t3',
};

interface MegalodonBadgeProps {
  status: string;
  label?: string;
}

export default function MegalodonBadge({ status, label }: MegalodonBadgeProps) {
  const colors = STATUS_STYLES[status.toLowerCase()] || STATUS_STYLES.monitor;
  return (
    <Badge
      variant="outline"
      className={`px-2 py-0.5 text-[9px] uppercase font-mono font-bold rounded ${colors}`}
    >
      {label || status}
    </Badge>
  );
}
