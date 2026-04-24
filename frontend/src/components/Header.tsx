'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, History, Settings, ExternalLink } from 'lucide-react';
import { CommandPaletteHint } from '@/components/CommandPalette';

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'History', href: '/history', icon: History },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <header className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? 'header-scrolled' : 'header-top'}`}>
      <div className="header-glow-line" />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="logo-container relative">
            <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full group-hover:bg-cyan-400/30 transition-all duration-500" />
            <div className="relative z-10 w-8 h-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" alt="ContextWeaver Icon" className="w-full h-full drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            </div>
          </div>
          <span className="font-orbitron font-black text-xl tracking-widest bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
            ContextWeaver
          </span>
        </Link>

        {/* Center Nav Pill */}
        {pathname !== '/' && (
          <div className="nav-pill-container hidden md:block">
            <nav className="nav-pill-track">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-pill-item ${isActive ? 'nav-pill-active' : ''}`}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                    {isActive && <span className="nav-active-dot" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          {pathname !== '/' && <CommandPaletteHint />}
          <a
            href="https://github.com/edycutjong/contextweaver"
            target="_blank"
            rel="noopener noreferrer"
            className="github-cta"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Source</span>
          </a>
        </div>
      </div>
    </header>
  );
}
