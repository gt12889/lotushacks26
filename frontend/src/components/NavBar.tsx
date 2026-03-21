'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/components/LocaleProvider';
import { Fish } from 'lucide-react';
import { cn } from '@/lib/utils';

const linkKeys = [
  { href: '/dashboard', key: 'nav.dashboard' as const },
  { href: '/trends', key: 'nav.trends' as const },
  { href: '/alerts', key: 'nav.alerts' as const },
  { href: '/optimize', key: 'nav.optimize' as const },
  { href: '/architecture', key: 'nav.howItWorks' as const },
];

export default function NavBar() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();

  return (
    <header className="bg-abyss border-b border-border sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 bg-cyan/10 border border-cyan/20 rounded-md">
            <Fish className="w-4 h-4 text-cyan" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-t1 leading-tight">Megladon MD</h1>
            <p className="text-[10px] text-t3 leading-tight">{t('nav.tagline')}</p>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          {linkKeys.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                pathname === link.href
                  ? 'bg-cyan/10 text-cyan'
                  : 'text-t3 hover:text-t1'
              )}
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>
        <span className="flex items-center gap-1 text-xs shrink-0">
          <button onClick={() => setLocale('vi')} className={locale === 'vi' ? 'text-cyan font-medium' : 'text-t3 hover:text-t1'}>
            VN
          </button>
          <span className="text-t3">/</span>
          <button onClick={() => setLocale('en')} className={locale === 'en' ? 'text-cyan font-medium' : 'text-t3 hover:text-t1'}>
            EN
          </button>
        </span>
      </div>
    </header>
  );
}
