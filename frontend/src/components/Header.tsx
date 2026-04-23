'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Zap, LayoutDashboard, History, Settings, ExternalLink } from 'lucide-react';

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
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="logo-container">
            <div className="logo-glow" />
            <div className="logo-icon">
              <Zap className="h-4 w-4 text-white" />
            </div>
          </div>
          <span className="font-mono font-bold text-lg tracking-tight text-slate-200">
            ContextWeaver
          </span>
        </Link>

        {/* Center Nav Pill */}
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

        {/* GitHub CTA */}
        <a
          href="https://github.com/edycutjong/ContextWeaver"
          target="_blank"
          rel="noopener noreferrer"
          className="github-cta"
        >
          <ExternalLink className="h-4 w-4" />
          <span className="hidden sm:inline">Source</span>
        </a>
      </div>
    </header>
  );
}
