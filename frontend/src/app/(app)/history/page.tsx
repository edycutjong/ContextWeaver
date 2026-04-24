"use client";

import React, { useEffect, useState } from "react";
import { Search, Clock, CheckCircle2, AlertCircle, TrendingUp, Zap, Database, Activity } from "lucide-react";
import { motion, useMotionValue, animate } from "framer-motion";
import { useTranslations } from "next-intl";


function AnimatedStat({ value, decimals = 0, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  const motionVal = useMotionValue(0);
  const [display, setDisplay] = useState('0');
  useEffect(() => {
    const unsub = motionVal.on('change', (v) =>
      setDisplay(decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString())
    );
    const ctrl = animate(motionVal, value, { duration: 1.2, ease: 'easeOut' });
    return () => { ctrl.stop(); unsub(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <>{display}{suffix}</>;
}

export default function HistoryPage() {
  const t = useTranslations('history');
  const tCommon = useTranslations('common');
  const [search, setSearch] = useState("");
  
  const history = React.useMemo(() => [
    { id: "1", query: t('mock.q1'), time: t('mock.t1'), latency: 245, status: "success", tokens: 124 },
    { id: "2", query: t('mock.q2'), time: t('mock.t2'), latency: 312, status: "success", tokens: 342 },
    { id: "3", query: t('mock.q3'), time: t('mock.t3'), latency: 185, status: "success", tokens: 89 },
    { id: "4", query: t('mock.q4'), time: t('mock.t4'), latency: 45, status: "filtered", tokens: 0 },
  ], [t]);

  const filtered = history.filter((h) => h.query.toLowerCase().includes(search.toLowerCase()));
  const successCount = history.filter((h) => h.status === "success").length;
  const avgLatency = Math.round(history.reduce((a, h) => a + h.latency, 0) / history.length);
  const totalTokens = history.reduce((a, h) => a + h.tokens, 0);
  const successRate = (successCount / history.length) * 100;

  const stats: Array<{ label: string; value: number; icon: React.ElementType; color: string; decimals?: number; suffix?: string }> = [
    { label: t('stats.totalQueries'), value: history.length, icon: Database, color: "cyan" },
    { label: t('stats.avgLatency'), value: avgLatency, icon: Zap, color: "purple", suffix: tCommon('ms') },
    { label: t('stats.successRate'), value: successRate, icon: TrendingUp, color: "emerald", decimals: 1, suffix: tCommon('percent') },
    { label: t('stats.tokensUsed'), value: totalTokens, icon: Activity, color: "amber" },
  ];

  const colorMap: Record<string, string> = {
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/30 shadow-[0_0_20px_rgba(139,92,246,0.15)]",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(251,191,36,0.15)]",
  };

  return (
    <div className="w-full flex-1 flex flex-col font-sans relative p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-orbitron font-black text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-blue-400 to-purple-500 mb-1 flex items-center tracking-wide">
              {t('title')}
            </h1>
            <p className="text-slate-400 font-medium tracking-wide">{t('subtitle')}</p>
          </div>

          <div className="relative group" suppressHydrationWarning>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search')}
              className="bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(6,182,212,0.2)] w-72 transition-all"
              suppressHydrationWarning
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 260, damping: 22 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`p-5 rounded-xl border backdrop-blur-sm ${colorMap[stat.color]} transition-shadow`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon className="w-5 h-5" />
                  <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                </div>
                <div className="text-2xl font-bold text-white">
                  <AnimatedStat value={stat.value} decimals={stat.decimals} suffix={stat.suffix} />
                </div>
                <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">{t('table.status')}</th>
                <th className="px-6 py-4 font-medium">{t('table.query')}</th>
                <th className="px-6 py-4 font-medium">{t('table.time')}</th>
                <th className="px-6 py-4 font-medium">{t('table.latency')}</th>
                <th className="px-6 py-4 font-medium">{t('table.tokens')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((item, i) => {
                const latencyColor = item.latency < 100 ? "text-emerald-400" : item.latency < 250 ? "text-cyan-400" : "text-amber-400";
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    whileHover={{ x: 4, backgroundColor: 'rgba(6,182,212,0.05)' }}
                    className="hover:bg-slate-800/30 transition-colors relative group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      {item.status === "success" ? (
                        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md text-xs font-medium w-fit border border-emerald-400/20 group-hover:shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-shadow">
                          <CheckCircle2 className="w-3 h-3" /> {t('status.success')}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md text-xs font-medium w-fit border border-amber-400/20 group-hover:shadow-[0_0_12px_rgba(251,191,36,0.3)] transition-shadow">
                          <AlertCircle className="w-3 h-3" /> {t('status.filtered')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-200 font-medium truncate max-w-[300px] group-hover:text-white transition-colors">
                      {item.query}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" /> {item.time}
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm font-mono ${latencyColor}`}>
                      {item.latency}{tCommon('ms')}
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-sm font-mono">
                      {item.tokens}
                    </td>
                    <td className="absolute left-0 top-0 bottom-0 w-0.5 bg-linear-to-b from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden />
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-10 text-center text-slate-500">{t('empty', { q: search })}</div>
          )}
        </div>
      </div>
    </div>
  );
}
