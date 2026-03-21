'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/components/LocaleProvider';

export default function AbyssFooter() {
  const { t } = useLocale();
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }) + ' UTC');
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="border-t border-white/5 bg-deep px-6 py-3">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between text-xs text-t3 font-mono">
        <div className="flex gap-6">
          <span className="hover:text-t2 cursor-pointer transition-colors duration-200">{t('footer.privacy')}</span>
          <span className="hover:text-t2 cursor-pointer transition-colors duration-200">{t('footer.methodology')}</span>
          <span className="hover:text-t2 cursor-pointer transition-colors duration-200">{t('footer.oracle')}</span>
        </div>
        <span>
          {t('footer.sync')} {time}
        </span>
      </div>
    </footer>
  );
}
