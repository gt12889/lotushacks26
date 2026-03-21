'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/components/LocaleProvider';
import { Dock, DockItem } from '@/components/ui/dock';

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
    <header className="bg-abyss border-b border-border sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 bg-cyan rounded-lg flex items-center justify-center">
            <span className="text-abyss font-bold text-base">M</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-t1 leading-tight">Megladon MD</h1>
            <p className="text-[10px] text-t3 leading-tight">{t('nav.tagline')}</p>
          </div>
        </Link>
        <nav className="flex flex-wrap justify-center">
          <Dock magnification={1.15} distance={2}>
            {linkKeys.map((link) => (
              <DockItem key={link.href}>
                <Link
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors block ${
                    pathname === link.href
                      ? 'text-cyan bg-cyan/10'
                      : 'text-t2 hover:text-t1 hover:bg-white/5'
                  }`}
                >
                  {t(link.key)}
                </Link>
              </DockItem>
            ))}
          </Dock>
        </nav>
        <div
          className="flex rounded border border-border overflow-hidden text-xs font-mono shrink-0"
          role="group"
          aria-label="Language"
        >
          <button
            type="button"
            onClick={() => setLocale('vi')}
            className={`px-2.5 py-1 transition-colors ${
              locale === 'vi'
                ? 'bg-cyan/20 text-cyan border-r border-border'
                : 'text-t3 hover:text-t1 bg-transparent border-r border-border'
            }`}
          >
            VN
          </button>
          <button
            type="button"
            onClick={() => setLocale('en')}
            className={`px-2.5 py-1 transition-colors ${
              locale === 'en' ? 'bg-cyan/20 text-cyan' : 'text-t3 hover:text-t1 bg-transparent'
            }`}
          >
            EN
          </button>
        </div>
      </div>
    </header>
  );
}
