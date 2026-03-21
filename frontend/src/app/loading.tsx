'use client';

import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useLocale } from '@/components/LocaleProvider';

export default function Loading() {
  const { t } = useLocale();
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 px-6">
      <LoadingSpinner size="lg" label={t('ui.loadingPage')} />
      <p className="text-xs font-mono text-t3 uppercase tracking-wider">{t('ui.loading')}</p>
    </div>
  );
}
