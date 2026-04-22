"use client";

import React, { useEffect, useState } from "react";
import { Search, Clock, CheckCircle2, AlertCircle, TrendingUp, Zap, Database, Activity } from "lucide-react";
import { motion, useMotionValue, animate } from "framer-motion";

const MOCK_HISTORY = [
  { id: "1", query: "What are the core features of FlagOS?", time: "2 mins ago", latency: 245, status: "success", tokens: 124 },
  { id: "2", query: "How does the ContextWeaver router work?", time: "15 mins ago", latency: 312, status: "success", tokens: 342 },
  { id: "3", query: "Explain ChromaDB integration", time: "1 hour ago", latency: 185, status: "success", tokens: 89 },
  { id: "4", query: "What is the capital of France?", time: "2 hours ago", latency: 45, status: "filtered", tokens: 0 },
];

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
  const [search, setSearch] = useState("");
  const filtered = MOCK_HISTORY.filter((h) => h.query.toLowerCase().includes(search.toLowerCase()));
  const successCount = MOCK_HISTORY.filter((h) => h.status === "success").length;
  const avgLatency = Math.round(MOCK_HISTORY.reduce((a, h) => a + h.latency, 0) / MOCK_HISTORY.length);
  const totalTokens = MOCK_HISTORY.reduce((a, h) => a + h.tokens, 0);
  const successRate = (successCount / MOCK_HISTORY.length) * 100;

  const stats = [
    { label: "Total Queries", value: MOCK_HISTORY.length, icon: Database, color: "cyan", decimals: 0, suffix: "" },
    { label: "Avg Latency", value: avgLatency, icon: Zap, color: "purple", decimals: 0, suffix: "ms" },
    { label: "Success Rate", value: successRate, icon: TrendingUp, color: "emerald", decimals: 1, suffix: "%" },
    { label: "Tokens Used", value: totalTokens, icon: Activity, color: "amber", decimals: 0, suffix: "" },
  ];

  const colorMap: Record<string, string> = {
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/30 shadow-[0_0_20px_rgba(139,92,246,0.15)]",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(251,191,36,0.15)]",
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Query History
          </h1>
          <p className="text-slate-400">View past RAG queries, generation latency, and token usage.</p>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search history..."
            className="bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(6,182,212,0.2)] w-72 transition-all"
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
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Query</th>
              <th className="px-6 py-4 font-medium">Time</th>
              <th className="px-6 py-4 font-medium">Latency</th>
              <th className="px-6 py-4 font-medium">Tokens</th>
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
                        <CheckCircle2 className="w-3 h-3" /> Success
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md text-xs font-medium w-fit border border-amber-400/20 group-hover:shadow-[0_0_12px_rgba(251,191,36,0.3)] transition-shadow">
                        <AlertCircle className="w-3 h-3" /> Filtered
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
                    {item.latency}ms
                  </td>
                  <td className="px-6 py-4 text-slate-300 text-sm font-mono">
                    {item.tokens}
                  </td>
                  <td className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden />
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-10 text-center text-slate-500">No queries match &quot;{search}&quot;</div>
        )}
      </div>
    </div>
  );
}
