"use client";

import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from "lucide-react";

export type ToastKind = "success" | "info" | "warning" | "error";
export type ToastPayload = {
  id?: string;
  kind?: ToastKind;
  title: string;
  description?: string;
  duration?: number;
};

type ActiveToast = Required<Pick<ToastPayload, "id" | "kind" | "title" | "duration">> & {
  description?: string;
};

const KIND_STYLE: Record<
  ToastKind,
  { icon: React.ComponentType<{ className?: string }>; accent: string; glow: string; ring: string }
> = {
  success: {
    icon: CheckCircle2,
    accent: "text-emerald-300",
    glow: "shadow-[0_0_25px_rgba(16,185,129,0.25)]",
    ring: "border-emerald-500/40",
  },
  info: {
    icon: Info,
    accent: "text-cyan-300",
    glow: "shadow-[0_0_25px_rgba(6,182,212,0.25)]",
    ring: "border-cyan-500/40",
  },
  warning: {
    icon: AlertTriangle,
    accent: "text-amber-300",
    glow: "shadow-[0_0_25px_rgba(245,158,11,0.25)]",
    ring: "border-amber-500/40",
  },
  error: {
    icon: XCircle,
    accent: "text-red-300",
    glow: "shadow-[0_0_25px_rgba(239,68,68,0.25)]",
    ring: "border-red-500/40",
  },
};

export function pushToast(payload: ToastPayload) {
  // istanbul ignore next
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastPayload>("contextweaver:toast", { detail: payload }));
}

export default function ToastLayer() {
  const [mounted, setMounted] = useState(false);
  const [toasts, setToasts] = useState<ActiveToast[]>([]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: string) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    function onToast(e: Event) {
      const ev = e as CustomEvent<ToastPayload>;
      const p = ev.detail;
      if (!p) return;
      const toast: ActiveToast = {
        id: p.id ?? `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        kind: p.kind ?? "info",
        title: p.title,
        description: p.description,
        duration: p.duration ?? 3600,
      };
      setToasts((ts) => [...ts, toast].slice(-4));
      if (toast.duration > 0) {
        window.setTimeout(() => dismiss(toast.id), toast.duration);
      }
    }
    window.addEventListener("contextweaver:toast", onToast as EventListener);
    return () => window.removeEventListener("contextweaver:toast", onToast as EventListener);
  }, [dismiss]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed top-20 right-4 z-99997 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const { icon: Icon, accent, glow, ring } = KIND_STYLE[t.kind];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className={`pointer-events-auto min-w-[260px] max-w-[360px] rounded-xl border ${ring} ${glow} bg-slate-950/85 backdrop-blur-xl overflow-hidden`}
              role="status"
            >
              <div className="flex items-start gap-3 px-3 py-2.5">
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${accent}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{t.title}</div>
                  {t.description && (
                    <div className="text-xs text-slate-400 leading-snug mt-0.5">{t.description}</div>
                  )}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="text-slate-500 hover:text-white shrink-0 mt-0.5"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {t.duration > 0 && (
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: t.duration / 1000, ease: "linear" }}
                  style={{ transformOrigin: "left" }}
                  className={`h-0.5 ${
                    t.kind === "success"
                      ? "bg-emerald-400/60"
                      : t.kind === "warning"
                        ? "bg-amber-400/60"
                        : t.kind === "error"
                          ? "bg-red-400/60"
                          : "bg-cyan-400/60"
                  }`}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
