'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGithubAuth } from '@/hooks/useGithubAuth';

export default function Navigation() {
  const pathname = usePathname();
  const { config, isAuthenticated } = useGithubAuth();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '◻' },
    { href: '/queue', label: 'Queue', icon: '☰' },
    { href: '/calendar', label: 'Calendar', icon: '▦' },
    { href: '/news', label: 'News', icon: '▲' },
    { href: '/settings', label: 'Settings', icon: '⚙' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href;
  };

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-xl border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-sm font-bold group-hover:bg-blue-400 transition-colors">
                MW
              </div>
              <span className="text-lg font-semibold tracking-tight">My Workspace</span>
            </Link>

            <div className="hidden sm:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? 'bg-white/15 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isAuthenticated && config && (
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>
                  {config.repositories.length} {config.repositories.length === 1 ? 'repo' : 'repos'} connected
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="sm:hidden border-t border-gray-700">
        <div className="flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 text-center py-2 text-xs font-medium transition-colors ${
                isActive(item.href)
                  ? 'text-white bg-white/10'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div>{item.icon}</div>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
