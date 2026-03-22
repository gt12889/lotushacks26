'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription, AlertAction } from '@/components/ui/alert';
import { useLocale } from '@/components/LocaleProvider';

interface MegalodonAlertProps {
  drugName: string;
  message: string;
  onIntercept?: () => void;
}

export default function MegalodonAlert({ drugName, message, onIntercept }: MegalodonAlertProps) {
  const { t } = useLocale();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <Alert
      variant="destructive"
      className="rounded-none border-0 border-l-4 border-alert-red bg-alert-bg px-6 py-3 cursor-pointer"
      onClick={() => setDismissed(true)}
    >
      <AlertTriangle className="size-5 text-alert-red" />
      <AlertTitle className="text-alert-red font-bold text-xs uppercase tracking-wider">
        {t('megalodon.title')}
      </AlertTitle>
      <AlertDescription className="text-alert-red text-xs">
        {drugName} — {message}
      </AlertDescription>
      <AlertAction>
        <div className="flex items-center gap-2">
          {onIntercept && (
            <button
              onClick={(e) => { e.stopPropagation(); onIntercept(); }}
              className="bg-alert-red text-alert-bg px-4 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-alert-red/80 transition-colors"
            >
              {t('megalodon.intercept')}
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
            className="text-alert-red hover:text-alert-red/60 transition-colors"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      </AlertAction>
    </Alert>
  );
}
