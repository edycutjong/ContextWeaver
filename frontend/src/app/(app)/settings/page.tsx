"use client";

import React, { useState } from "react";
import { Database, Cpu, Save, Sparkles, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function SliderField({
  label,
  min,
  max,
  value,
  onChange,
  unit,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (val: number) => void;
  unit: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <label className="block text-sm font-medium text-slate-300">{label}</label>
        <motion.span
          key={value}
          initial={{ scale: 1.2, color: '#22d3ee' }}
          animate={{ scale: 1, color: '#ffffff' }}
          transition={{ duration: 0.25 }}
          className="text-sm font-mono font-bold tabular-nums"
        >
          {value} <span className="text-slate-500 text-xs">{unit}</span>
        </motion.span>
      </div>

      <div className="relative h-2 mb-2">
        <div className="absolute inset-0 rounded-full bg-slate-800" />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)] pointer-events-none"
          style={{ left: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [topK, setTopK] = useState(3);
  const [chunkSize, setChunkSize] = useState(200);
  const [chunkOverlap, setChunkOverlap] = useState(20);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    const savedSettings = localStorage.getItem('contextweaver_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.topK) setTopK(parsed.topK);
        if (parsed.chunkSize) setChunkSize(parsed.chunkSize);
        if (parsed.chunkOverlap) setChunkOverlap(parsed.chunkOverlap);
      } catch (e) {}
    }
  }, []);

  function handleSave() {
    localStorage.setItem('contextweaver_settings', JSON.stringify({ topK, chunkSize, chunkOverlap }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          Router Settings
        </h1>
        <p className="text-slate-400">Configure embedding parameters and model routing thresholds.</p>
      </div>

      <div className="space-y-6">
        {/* ChromaDB Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Database className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Retrieval Engine (ChromaDB)</h2>
              <p className="text-xs text-slate-400">Tune semantic search behaviour</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 relative z-10">
            <SliderField label="Chunk Size" min={256} max={2048} value={chunkSize} onChange={setChunkSize} unit="tokens" />
            <SliderField label="Chunk Overlap" min={0} max={500} value={chunkOverlap} onChange={setChunkOverlap} unit="tokens" />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-3">Top-K Retrieval</label>
              <div className="grid grid-cols-3 gap-3">
                {[3, 5, 10].map((k) => (
                  <motion.button
                    key={k}
                    onClick={() => setTopK(k)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`relative px-4 py-3 rounded-lg border font-medium transition-colors ${
                      topK === k
                        ? 'text-cyan-300 border-cyan-500/50'
                        : 'text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {topK === k && (
                      <motion.div
                        layoutId="topk-active"
                        className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">{k} Chunks</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Model Routing */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 24 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden"
        >
          <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Model Routing</h2>
              <p className="text-xs text-slate-400">Pick which model handles each chunk</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 relative z-10">
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              className="bg-slate-950/50 p-5 rounded-lg border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/20 blur-2xl pointer-events-none" />
              <div className="flex justify-between items-center mb-3 relative">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-white font-semibold">Fast Model</span>
                </div>
                <span className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-1 rounded">Active</span>
              </div>
              <div className="text-xs text-cyan-300 font-mono mb-2 relative">Qwen3-4B</div>
              <p className="text-sm text-slate-400 relative">Used for low-complexity queries and rapid extraction.</p>
              <div className="mt-3 flex gap-1 relative">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleY: 0.3 }}
                    animate={{ scaleY: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1 }}
                    className="w-1 h-4 bg-cyan-400/70 rounded-full origin-bottom"
                  />
                ))}
              </div>
            </motion.div>

            <div className="bg-slate-950/50 p-5 rounded-lg border border-slate-800 opacity-60 cursor-not-allowed relative overflow-hidden">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span className="text-white font-semibold">Deep Model</span>
                </div>
                <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-1 rounded">Pro Only</span>
              </div>
              <div className="text-xs text-amber-300 font-mono mb-2">Llama-3-70B</div>
              <p className="text-sm text-slate-400">Used for complex reasoning and multi-hop synthesis.</p>
            </div>
          </div>
        </motion.section>

        <div className="flex justify-end pt-4 items-center gap-4">
          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded-lg text-sm shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              >
                <Sparkles className="w-4 h-4" /> Saved successfully
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            onClick={handleSave}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold px-6 py-3 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-shadow relative overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:animate-[shimmer_1.5s_infinite]" />
            <Save className="w-4 h-4 relative" /> <span className="relative">Save Configuration</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
