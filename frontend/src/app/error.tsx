'use client';

import { useEffect } from 'react';
import { useLocale } from '@/components/LocaleProvider';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-6 px-6 max-w-lg mx-auto text-center">
      <div className="rounded-lg border border-alert-red/40 bg-alert-red/10 px-6 py-5 w-full">
        <h2 className="text-sm font-bold text-t1 mb-2">{t('error.pageTitle')}</h2>
        <p className="text-xs text-t3 leading-relaxed">
          {error.message?.trim() ? error.message : t('error.pageFallback')}
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="px-6 py-2.5 bg-cyan text-abyss font-bold rounded-lg text-sm hover:bg-cyan/80 transition-colors"
      >
        {t('error.tryAgain')}
      </button>
    </div>
  );
}
