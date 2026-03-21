'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/trends', label: 'Trends' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/optimize', label: 'Optimize' },
  { href: '/architecture', label: 'How It Works' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="bg-abyss border-b border-border sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-cyan rounded-lg flex items-center justify-center">
            <span className="text-abyss font-bold text-base">M</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-t1 leading-tight">Megladon MD</h1>
            <p className="text-[10px] text-t3 leading-tight">Pharmaceutical Price Intelligence</p>
          </div>
        </Link>
        <nav className="flex gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'text-cyan bg-cyan/10'
                  : 'text-t2 hover:text-t1 hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button className="text-xs text-t3 border border-border rounded px-2 py-1 hover:text-t1 hover:border-cyan/30 transition-colors">
          VN / EN
        </button>
      </div>
    </header>
  );
}
