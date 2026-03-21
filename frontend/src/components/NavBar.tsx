'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Search' },
  { href: '/trends', label: 'Trends' },
  { href: '/optimize', label: 'Optimizer' },
  { href: '/alerts', label: 'Alerts' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-green-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-base">M</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">MediScrape</h1>
            <p className="text-[10px] text-gray-500 leading-tight">Pharmaceutical Price Intelligence</p>
          </div>
        </Link>
        <nav className="flex gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
