"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  LayoutDashboard,
  History,
  Settings,
  Home,
  ExternalLink,
  Zap,
  Keyboard,
  Play,
  Code2,
  Command as CommandIcon,
} from "lucide-react";

type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  section: string;
  keywords?: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  perform: () => void;
};

export default function CommandPalette() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const runPipeline = useCallback(() => {
    window.dispatchEvent(new CustomEvent("contextweaver:run"));
  }, []);

  const items: CommandItem[] = useMemo(
    () => [
      {
        id: "nav-home",
        label: "Home",
        hint: "Landing page",
        section: "Navigate",
        icon: Home,
        keywords: "landing home start",
        perform: () => router.push("/"),
      },
      {
        id: "nav-dashboard",
        label: "Dashboard",
        hint: "Live pipeline view",
        section: "Navigate",
        icon: LayoutDashboard,
        keywords: "pipeline graph run annotate",
        shortcut: "G D",
        perform: () => router.push("/dashboard"),
      },
      {
        id: "nav-history",
        label: "Query History",
        hint: "Past queries and metrics",
        section: "Navigate",
        icon: History,
        keywords: "history queries logs",
        shortcut: "G H",
        perform: () => router.push("/history"),
      },
      {
        id: "nav-settings",
        label: "Router Settings",
        hint: "Chunking and routing config",
        section: "Navigate",
        icon: Settings,
        keywords: "settings chunk size top k model router",
        shortcut: "G S",
        perform: () => router.push("/settings"),
      },
      {
        id: "action-run",
        label: "Run Annotation Pipeline",
        hint: "Trigger the live pipeline",
        section: "Actions",
        icon: Play,
        keywords: "run start pipeline annotate",
        shortcut: "R",
        perform: runPipeline,
      },
      {
        id: "action-shortcuts",
        label: "Show Keyboard Shortcuts",
        hint: "View all hotkeys",
        section: "Help",
        icon: Keyboard,
        keywords: "shortcuts help keybindings hotkeys",
        shortcut: "?",
        perform: () => window.dispatchEvent(new CustomEvent("contextweaver:shortcuts")),
      },
      {
        id: "link-github",
        label: "Open GitHub Repository",
        hint: "github.com/edycutjong/contextweaver",
        section: "Help",
        icon: Code2,
        keywords: "source code github repo",
        perform: () =>
          window.open("https://github.com/edycutjong/contextweaver", "_blank", "noopener,noreferrer"),
      },
    ],
    [router, runPipeline],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      /* istanbul ignore next */
      const hay = `${it.label} ${it.hint ?? ""} ${it.keywords ?? ""} ${it.section}`.toLowerCase();
      return q.split(/\s+/).every((tok) => hay.includes(tok));
    });
  }, [query, items]);

  // Group by section for display
  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const it of filtered) {
      const arr = map.get(it.section) ?? [];
      arr.push(it);
      map.set(it.section, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveIdx(0);
  }, [query, open]);

  // Global ⌘K / Ctrl+K + programmatic open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("contextweaver:palette", onOpen as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("contextweaver:palette", onOpen as EventListener);
    };
  }, []);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Keep active row scrolled into view
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const row = container.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    if (row) {
      const top = row.offsetTop;
      const bottom = top + row.offsetHeight;
      if (top < container.scrollTop) container.scrollTop = top - 8;
      else if (bottom > container.scrollTop + container.clientHeight)
        container.scrollTop = bottom - container.clientHeight + 8;
    }
  }, [activeIdx]);

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = filtered[activeIdx];
      if (it) {
        it.perform();
        setOpen(false);
        setQuery("");
      }
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-99998 bg-black/60 backdrop-blur-md flex items-start justify-center p-4 pt-[12vh]"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-2xl overflow-hidden border border-slate-700/80 shadow-[0_40px_80px_rgba(0,0,0,0.6),0_0_40px_rgba(6,182,212,0.15)]"
          >
            <div className="relative bg-slate-950/95 backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-400/60 to-transparent" />
              <div className="pointer-events-none absolute -inset-40 bg-[radial-gradient(600px_circle_at_50%_-20%,rgba(6,182,212,0.15),transparent_60%)]" />

              {/* Search bar */}
              <div className="relative flex items-center gap-3 px-4 py-3 border-b border-slate-800/80">
                <Search className="w-4 h-4 text-cyan-400 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onInputKey}
                  placeholder="Type a command or search..."
                  className="flex-1 bg-transparent outline-none text-slate-100 placeholder:text-slate-500 text-sm"
                  aria-label="Command search"
                  suppressHydrationWarning
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 border border-slate-800 rounded px-1.5 py-0.5">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="relative max-h-[50vh] overflow-y-auto py-2">
                {filtered.length === 0 ? (
                  <div className="py-10 text-center text-sm text-slate-500">
                    No commands match &quot;{query}&quot;
                  </div>
                ) : (
                  grouped.map(([section, rows]) => (
                    <div key={section} className="mb-1">
                      <div className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        {section}
                      </div>
                      <div>
                        {rows.map((it) => {
                          const Icon = it.icon;
                          const idx = filtered.indexOf(it);
                          const active = idx === activeIdx;
                          return (
                            <button
                              key={it.id}
                              data-idx={idx}
                              onMouseEnter={() => setActiveIdx(idx)}
                              onClick={() => {
                                it.perform();
                                setOpen(false);
                                setQuery("");
                              }}
                              className={`w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                active
                                  ? "bg-cyan-500/10 text-white"
                                  : "text-slate-300 hover:bg-slate-800/40"
                              }`}
                            >
                              <div
                                className={`w-7 h-7 rounded-md flex items-center justify-center border ${
                                  active
                                    ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300"
                                    : "border-slate-800 bg-slate-900/60 text-slate-400"
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <span className="flex-1 truncate">
                                <span className="font-medium">{it.label}</span>
                                {it.hint && (
                                  <span className="ml-2 text-xs text-slate-500">{it.hint}</span>
                                )}
                              </span>
                              {it.shortcut && (
                                <kbd className="text-[10px] font-mono text-slate-400 border border-slate-800 rounded px-1.5 py-0.5 bg-slate-900/60">
                                  {it.shortcut}
                                </kbd>
                              )}
                              {it.id.startsWith("link-") && (
                                <ExternalLink className="w-3 h-3 text-slate-500" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="relative flex items-center justify-between text-[11px] text-slate-500 px-4 py-2 border-t border-slate-800/80 bg-slate-950/60">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <kbd className="font-mono border border-slate-800 rounded px-1 py-0.5">↑↓</kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="font-mono border border-slate-800 rounded px-1 py-0.5">↵</kbd>
                    select
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span className="font-orbitron tracking-wider text-cyan-400">ContextWeaver</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function CommandPaletteHint() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("contextweaver:palette"))}
      className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 border border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/70 hover:text-slate-200 rounded-md px-2 py-1 transition-colors"
      aria-label="Open command palette"
    >
      <CommandIcon className="w-3 h-3" />
      <span>K</span>
    </button>
  );
}
