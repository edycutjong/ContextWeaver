"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

type HeatmapChunk = {
  confidence?: number;
  result?: { confidence?: number };
  [key: string]: unknown;
};

type HeatmapProps = {
  chunks: HeatmapChunk[];
  onSelectChunk: (chunk: HeatmapChunk) => void;
};

const LEGEND = [
  { label: '≥90%', className: 'bg-green-500' },
  { label: '≥80%', className: 'bg-green-400' },
  { label: '≥70%', className: 'bg-amber-400' },
  { label: '<70%', className: 'bg-red-500' },
];

function ChunkCell({ chunk, i, onSelectChunk }: { chunk: HeatmapChunk, i: number, onSelectChunk: (chunk: HeatmapChunk) => void }) {
  const t = useTranslations('heatmap');
  const confidence = chunk.confidence || chunk.result?.confidence || 0;
  let bgColor = 'bg-slate-800';
  let borderTint = 'border-slate-500/40';

  if (confidence > 0) {
    if (confidence >= 0.9) {
      bgColor = 'bg-green-500';
      borderTint = 'border-green-400/50';
    } else if (confidence >= 0.8) {
      bgColor = 'bg-green-400';
      borderTint = 'border-green-300/50';
    } else if (confidence >= 0.7) {
      bgColor = 'bg-amber-400';
      borderTint = 'border-amber-300/50';
    } else {
      bgColor = 'bg-red-500';
      borderTint = 'border-red-400/50';
    }
  }

  const isFirstRow = Math.floor(i / 10) === 0;
  const tooltipPosition = isFirstRow ? '-bottom-9' : '-top-9';

  return (
    <motion.button
      onClick={() => onSelectChunk(chunk)}
      className="w-full aspect-square rounded hover:ring-2 ring-white transition-colors group relative hover:z-100"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
    >
      <motion.div
        className={`absolute inset-0 rounded ${bgColor}`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />
      <span
        className={`opacity-0 group-hover:opacity-100 absolute ${tooltipPosition} left-1/2 -translate-x-1/2 bg-slate-950/95 backdrop-blur-sm border ${borderTint} text-xs text-white px-2 py-1 rounded-md pointer-events-none z-100 whitespace-nowrap shadow-lg transition-opacity`}
      >
        {t('chunk', { 
          i: i + 1, 
          confidence: confidence ? `${(confidence * 100).toFixed(0)}%` : t('processing') 
        })}
      </span>
    </motion.button>
  );
}

export default function ConfidenceHeatmap({ chunks, onSelectChunk }: HeatmapProps) {
  const t = useTranslations('heatmap');
  if (!chunks || chunks.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col h-full">
      <h3 className="text-white font-semibold mb-4 flex items-center shrink-0">
        <span className="mr-2">🔥</span> {t('title')}
      </h3>
      <div className="flex-1 pr-2 pb-2">
        <div className="grid grid-cols-10 gap-2 pb-2">
        <AnimatePresence>
          {chunks.map((chunk, i) => (
            <ChunkCell key={`chunk-${i}`} chunk={chunk} i={i} onSelectChunk={onSelectChunk} />
          ))}
          {/* Placeholders to maintain grid height and prevent layout shift up/down */}
          {Array.from({ length: Math.max(0, Math.max(30, Math.ceil(chunks.length / 10) * 10) - chunks.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="w-full aspect-square rounded bg-slate-800/30 border border-slate-700/30" />
          ))}
        </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-500 shrink-0 border-t border-slate-800 pt-3">
        <span className="uppercase tracking-wider font-medium">{t('legend')}</span>
        {LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span aria-hidden className={`w-2.5 h-2.5 rounded-sm ${item.className}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
