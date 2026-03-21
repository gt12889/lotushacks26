'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useLocale } from '@/components/LocaleProvider';
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
  const isLanding = pathname === '/';
  const reduceMotion = useReducedMotion();

  const languageToggle = (
    <span className="flex items-center gap-1 text-xs shrink-0 font-mono">
      <button
        type="button"
        onClick={() => setLocale('vi')}
        className={locale === 'vi' ? 'text-cyan font-medium' : 'text-t3 hover:text-t1'}
      >
        VN
      </button>
      <span className="text-t3">/</span>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={locale === 'en' ? 'text-cyan font-medium' : 'text-t3 hover:text-t1'}
      >
        EN
      </button>
    </span>
  );

  if (isLanding) {
    return (
      <motion.div
        className="fixed top-0 right-0 z-50 p-4 md:p-6"
        initial={reduceMotion ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26, delay: 0.12 }}
      >
        <motion.div
          whileHover={reduceMotion ? undefined : { scale: 1.03 }}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className="rounded-lg border border-border/50 bg-abyss/70 backdrop-blur-md px-3 py-2 shadow-sm"
        >
          {languageToggle}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <header className="bg-abyss border-b border-border sticky top-0 z-50 backdrop-blur-md nav-header-enter">
      <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0 transition-opacity hover:opacity-90">
          <Image
            src="/icon.svg"
            alt="Megalodon MD"
            width={32}
            height={32}
            unoptimized
            className="w-8 h-8 object-contain"
          />
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
                'nav-link-animated px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200',
                pathname === link.href
                  ? 'bg-cyan/10 text-cyan'
                  : 'text-t3 hover:text-t1'
              )}
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>
        {languageToggle}
      </div>
    </header>
  );
}
