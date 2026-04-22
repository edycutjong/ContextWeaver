"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, Settings, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/history", label: "History", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="w-64 border-r border-slate-800 bg-slate-950/50 backdrop-blur-md flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
          <Zap className="w-4 h-4 text-cyan-400" />
        </div>
        <span className="font-bold text-xl text-white tracking-tight">ContextWeaver</span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                isActive ? "text-cyan-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-bg"
                  className="absolute inset-0 rounded-lg bg-cyan-500/10 border border-cyan-500/20"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-bar"
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <Icon className="w-5 h-5 relative z-10" />
              <span className="relative z-10">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-800 text-xs text-slate-500 font-medium">
        FlagOS Hackathon 2026
      </div>
    </div>
  );
}
