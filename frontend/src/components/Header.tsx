'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Package, LayoutDashboard, History, Settings, ExternalLink } from 'lucide-react';

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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-full h-full drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
                <defs>
                  <linearGradient id="neon-cyan-header" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee"/>
                    <stop offset="100%" stopColor="#0284c7"/>
                  </linearGradient>
                  <linearGradient id="neon-purple-header" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#e879f9"/>
                    <stop offset="100%" stopColor="#7e22ce"/>
                  </linearGradient>
                </defs>
                <rect width="512" height="512" rx="112" fill="transparent" />
                <g transform="translate(256, 256)">
                  <g transform="rotate(25)">
                    <ellipse cx="0" cy="0" rx="180" ry="55" fill="none" stroke="url(#neon-cyan-header)" strokeWidth="16" opacity="0.9"/>
                    <ellipse cx="0" cy="0" rx="180" ry="55" fill="none" stroke="#ffffff" strokeWidth="4" opacity="0.9"/>
                    <circle cx="-180" cy="0" r="10" fill="#ffffff" />
                    <circle cx="180" cy="0" r="10" fill="#ffffff" />
                  </g>
                  <g transform="rotate(-50)">
                    <ellipse cx="0" cy="0" rx="180" ry="55" fill="none" stroke="url(#neon-purple-header)" strokeWidth="16" opacity="0.9"/>
                    <ellipse cx="0" cy="0" rx="180" ry="55" fill="none" stroke="#ffffff" strokeWidth="4" opacity="0.9"/>
                    <circle cx="-180" cy="0" r="10" fill="#ffffff" />
                    <circle cx="180" cy="0" r="10" fill="#ffffff" />
                  </g>
                  <g>
                    <path d="M 0 -140 C 15 -15, 15 -15, 140 0 C 15 15, 15 15, 0 140 C -15 15, -15 15, -140 0 C -15 -15, -15 -15, 0 -140 Z" fill="url(#neon-cyan-header)"/>
                    <g transform="rotate(45)">
                      <path d="M 0 -100 C 10 -10, 10 -10, 100 0 C 10 10, 10 10, 0 100 C -10 10, -10 10, -100 0 C -10 -10, -10 -10, 0 -100 Z" fill="url(#neon-purple-header)"/>
                    </g>
                  </g>
                  <circle cx="0" cy="0" r="24" fill="#ffffff" />
                </g>
              </svg>
            </div>
          </div>
          <span className="font-orbitron font-black text-xl tracking-widest bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">
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

        {/* GitHub CTA */}
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
    </header>
  );
}
