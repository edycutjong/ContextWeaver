"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Globe, Check } from "lucide-react";
import { LOCALE_COOKIE, locales, type Locale } from "@/i18n/config";

const SETTINGS_KEY = "contextweaver_settings";

export function setLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...parsed, language: locale }));
  } catch {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ language: locale }));
  }
}



export default function LanguageSwitcher() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Locale>(locale);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(locale: Locale) {
    setLocaleCookie(locale);
    setCurrent(locale);
    setOpen(false);
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("languageAria")}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 border border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/70 hover:text-slate-200 rounded-md px-2 py-1 transition-colors"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{current === "zh" ? t("languageZh") : t("languageEn")}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-36 rounded-lg border border-slate-700/80 bg-slate-950/95 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_24px_rgba(6,182,212,0.12)] overflow-hidden z-99999"
        >
          {(locales as readonly Locale[]).map((loc) => {
            const active = current === loc;
            const label = loc === "zh" ? t("languageZh") : t("languageEn");
            return (
              <button
                key={loc}
                role="menuitemradio"
                aria-checked={active}
                onClick={() => pick(loc)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors ${
                  active ? "bg-cyan-500/10 text-cyan-300" : "text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                <span>{label}</span>
                {active && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
