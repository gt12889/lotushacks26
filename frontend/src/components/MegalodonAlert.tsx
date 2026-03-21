'use client';

interface MegalodonAlertProps {
  drugName: string;
  message: string;
  onIntercept?: () => void;
}

export default function MegalodonAlert({ drugName, message, onIntercept }: MegalodonAlertProps) {
  return (
    <div className="bg-alert-bg border-l-4 border-alert-red px-6 py-3 flex items-center gap-4">
      <span className="text-alert-red text-lg">⚠</span>
      <div className="flex-1">
        <span className="text-alert-red font-bold text-xs uppercase tracking-wider">Megalodon Signal Detected</span>
        <span className="text-alert-red text-xs ml-3">{drugName} — {message}</span>
      </div>
      {onIntercept && (
        <button
          onClick={onIntercept}
          className="bg-alert-red text-alert-bg px-4 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-alert-red/80 transition-colors"
        >
          Intercept
        </button>
      )}
    </div>
  );
}
