"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
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
  const [current, setCurrent] = useState<Locale>(locale);

  function pick(locale: Locale) {
    setLocaleCookie(locale);
    setCurrent(locale);
    router.refresh();
  }

  return (
    <div className="inline-flex items-center border border-slate-700/80 bg-slate-900/40 rounded-md overflow-hidden text-[11px] font-mono">
      {(locales as readonly Locale[]).map((loc, i) => {
        const active = current === loc;
        const label = loc === "zh" ? "中文" : "EN";
        return (
          <React.Fragment key={loc}>
            {i > 0 && <div className="w-px h-4 bg-slate-700/80" aria-hidden="true" />}
            <button
              type="button"
              onClick={() => pick(loc)}
              aria-label={loc === "zh" ? t("languageZh") : t("languageEn")}
              aria-pressed={active}
              className={`px-2.5 py-1 transition-colors ${
                active
                  ? "text-cyan-300 bg-cyan-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {label}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
