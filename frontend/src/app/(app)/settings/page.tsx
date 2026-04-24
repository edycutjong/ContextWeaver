"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Database, Cpu, Save, Sparkles } from "lucide-react";
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
  const rawPct = ((value - min) / (max - min)) * 100;
  const pct = Math.max(0, Math.min(100, rawPct));

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
          className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-cyan-500 to-purple-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
          style={{ width: `calc(${pct}% + ${8 - pct * 0.16}px)` }}
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
          style={{ left: `calc(${pct}% + ${8 - pct * 0.16}px)` }}
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
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const [topK, setTopK] = useState(3);
  const [chunkSize, setChunkSize] = useState(512);
  const [chunkOverlap, setChunkOverlap] = useState(20);
  const [activeModel, setActiveModel] = useState('fast');
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    const savedSettings = localStorage.getItem('contextweaver_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        /* eslint-disable react-hooks/set-state-in-effect */
        if (parsed.topK) setTopK(parsed.topK);
        if (parsed.chunkSize) setChunkSize(parsed.chunkSize);
        if (parsed.chunkOverlap) setChunkOverlap(parsed.chunkOverlap);
        if (parsed.activeModel) setActiveModel(parsed.activeModel);
        /* eslint-enable react-hooks/set-state-in-effect */
      } catch {}
    }
  }, []);

  function handleSave() {
    localStorage.setItem('contextweaver_settings', JSON.stringify({ topK, chunkSize, chunkOverlap, activeModel }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="w-full flex-1 flex flex-col font-sans relative p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full pb-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-orbitron font-black text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-blue-400 to-purple-500 mb-1 flex items-center tracking-wide">
            {t('title')}
          </h1>
          <p className="text-slate-400 font-medium tracking-wide">{t('subtitle')}</p>
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
                <h2 className="text-xl font-orbitron font-semibold text-white">{t('chroma.title')}</h2>
                <p className="text-xs text-slate-400">{t('chroma.subtitle')}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 relative z-10">
              <SliderField label={t('fields.chunkSize')} min={256} max={2048} value={chunkSize} onChange={setChunkSize} unit={t('fields.tokens')} />
              <SliderField label={t('fields.chunkOverlap')} min={0} max={500} value={chunkOverlap} onChange={setChunkOverlap} unit={t('fields.tokens')} />

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-3">{t('fields.topK')}</label>
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
                          className="absolute inset-0 rounded-lg bg-linear-to-br from-cyan-500/20 to-purple-500/20 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        />
                      )}
                      <span className="relative z-10">{t('fields.chunks', { k })}</span>
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
                <h2 className="text-xl font-orbitron font-semibold text-white">{t('routing.title')}</h2>
                <p className="text-xs text-slate-400">{t('routing.subtitle')}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 relative z-10">
              {[
                { id: 'fast', icon: Sparkles, color: 'cyan', commonKey: 'qwen' },
                { id: 'deep', icon: Cpu, color: 'amber', commonKey: 'llama' }
              ].map((model) => {
                const Icon = model.icon;
                const isActive = activeModel === model.id;
                return (
                  <motion.div
                    key={model.id}
                    onClick={() => setActiveModel(model.id)}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className={`p-5 rounded-lg border cursor-pointer relative overflow-hidden transition-all ${
                      isActive 
                        ? `bg-${model.color}-950/50 border-${model.color}-500/30 shadow-[0_0_20px_rgba(${model.color === 'cyan' ? '6,182,212' : '245,158,11'},0.15)]` 
                        : 'bg-slate-900/40 border-slate-800'
                    }`}
                  >
                    <div className={`absolute top-0 right-0 w-20 h-20 bg-${model.color}-500/20 blur-2xl pointer-events-none`} />
                    <div className="flex justify-between items-center mb-3 relative">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isActive ? `text-${model.color}-400` : 'text-slate-400'}`} />
                        <span className="text-white font-semibold">{t(`model.${model.id}Name`)}</span>
                      </div>
                      {isActive && (
                        <span className={`text-xs bg-${model.color}-500/20 text-${model.color}-${model.color === 'cyan' ? '300' : '400'} border border-${model.color}-500/40 px-2 py-1 rounded`}>
                          {t('model.active')}
                        </span>
                      )}
                    </div>
                    <div className={`text-xs font-mono mb-2 relative ${isActive ? `text-${model.color}-300` : 'text-slate-500'}`}>
                      {tCommon(model.commonKey)}
                    </div>
                    <p className="text-sm text-slate-400 relative">{t(`model.${model.id}Desc`)}</p>
                    {isActive && (
                      <div className="mt-3 flex gap-1 relative">
                        {[...Array(8)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ scaleY: 0.3 }}
                            animate={{ scaleY: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1 }}
                            className={`w-1 h-4 bg-${model.color}-400/70 rounded-full origin-bottom`}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
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
                  <Sparkles className="w-4 h-4" /> {t('save.success')}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              onClick={handleSave}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold px-6 py-3 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-shadow relative overflow-hidden"
            >
              <span className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:animate-[shimmer_1.5s_infinite]" />
              <Save className="w-4 h-4 relative" /> <span className="relative">{t('save.button')}</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
