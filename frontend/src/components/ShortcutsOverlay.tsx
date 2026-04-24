"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, X } from "lucide-react";

const GROUPS: { title: string; items: { keys: string[]; label: string }[] }[] = [
  {
    title: "Global",
    items: [
      { keys: ["⌘", "K"], label: "Open command palette" },
      { keys: ["Ctrl", "K"], label: "Open command palette (Win/Linux)" },
      { keys: ["?"], label: "Show this overlay" },
      { keys: ["Esc"], label: "Close overlays" },
    ],
  },
  {
    title: "Navigation",
    items: [
      { keys: ["G", "D"], label: "Go to Dashboard" },
      { keys: ["G", "H"], label: "Go to History" },
      { keys: ["G", "S"], label: "Go to Settings" },
      { keys: ["G", "L"], label: "Go to Landing" },
    ],
  },
  {
    title: "Dashboard",
    items: [
      { keys: ["R"], label: "Run annotation pipeline" },
    ],
  },
];

export default function ShortcutsOverlay() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function isEditable(el: EventTarget | null): boolean {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el.isContentEditable
      );
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "?" && !isEditable(e.target) && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function onEvent() {
      setOpen((v) => !v);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("contextweaver:shortcuts", onEvent as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("contextweaver:shortcuts", onEvent as EventListener);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[99996] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950/95 backdrop-blur-xl shadow-[0_40px_80px_rgba(0,0,0,0.6),0_0_40px_rgba(168,85,247,0.12)]"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-purple-300" />
                <span className="text-sm font-semibold tracking-wide text-white">Keyboard Shortcuts</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 grid sm:grid-cols-2 gap-5">
              {GROUPS.map((g) => (
                <div key={g.title}>
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">
                    {g.title}
                  </div>
                  <ul className="space-y-1.5">
                    {g.items.map((it) => (
                      <li
                        key={it.label}
                        className="flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="text-slate-300">{it.label}</span>
                        <span className="flex items-center gap-1 shrink-0">
                          {it.keys.map((k) => (
                            <kbd
                              key={k}
                              className="font-mono text-[10px] text-slate-200 border border-slate-700/80 rounded px-1.5 py-0.5 bg-slate-900/60 shadow-[inset_0_-1px_0_rgba(0,0,0,0.4)]"
                            >
                              {k}
                            </kbd>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="px-5 py-2 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Press <kbd className="font-mono border border-slate-800 rounded px-1 py-0.5">?</kbd> anywhere to toggle this overlay.</span>
              <span className="font-orbitron tracking-wider text-slate-400">ContextWeaver</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
