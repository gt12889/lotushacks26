'use client';

import { AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription, AlertAction } from '@/components/ui/alert';
import { useLocale } from '@/components/LocaleProvider';

interface MegalodonAlertProps {
  drugName: string;
  message: string;
  onIntercept?: () => void;
}

export default function MegalodonAlert({ drugName, message, onIntercept }: MegalodonAlertProps) {
  const { t } = useLocale();
  return (
    <Alert
      variant="destructive"
      className="rounded-none border-0 border-l-4 border-alert-red bg-alert-bg px-6 py-3"
    >
      <AlertTriangle className="size-5 text-alert-red" />
      <AlertTitle className="text-alert-red font-bold text-xs uppercase tracking-wider">
        {t('megalodon.title')}
      </AlertTitle>
      <AlertDescription className="text-alert-red text-xs">
        {drugName} — {message}
      </AlertDescription>
      {onIntercept && (
        <AlertAction>
          <button
            onClick={onIntercept}
            className="bg-alert-red text-alert-bg px-4 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-alert-red/80 transition-colors"
          >
            {t('megalodon.intercept')}
          </button>
        </AlertAction>
      )}
    </Alert>
  );
}
