"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Database, FileText } from 'lucide-react';

type ChunkData = {
  chunk_idx: string | number;
  confidence?: number;
  raw_text?: string;
  examples?: Array<{ similarity_score?: number; text?: string; annotation?: string }>;
  prompt?: string;
  annotation?: string;
};

type InspectorProps = {
  chunkData: ChunkData | null;
  onClose: () => void;
};

function ConfidenceRing({ value }: { value: number }) {
  const size = 48;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - value);
  const color = value >= 0.8 ? '#4ade80' : value >= 0.6 ? '#fbbf24' : '#f87171';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} stroke="#1e293b" fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          stroke={color}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white tabular-nums">
        {Math.round(value * 100)}%
      </div>
    </div>
  );
}

const ENTITY_STYLES: Record<string, { bg: string, text: string, border: string }> = {
  DEFAULT: { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' },
};

const DEFAULT_ENTITY_STYLE = ENTITY_STYLES.DEFAULT;

export default function ChunkInspector({ chunkData, onClose }: InspectorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (chunkData) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [chunkData]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {chunkData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[99999] overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6"
        >
          <div className="flex min-h-full items-start justify-center pt-10 pb-10">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-6xl flex flex-col shadow-[0_0_60px_rgba(6,182,212,0.15)] overflow-hidden relative shrink-0"
            >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />

            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/30 flex justify-between items-center relative z-10 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20">
                  <Database className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-wide">Chunk Inspector</h2>
                  <p className="text-sm text-slate-400">
                    Viewing details for Chunk <span className="text-cyan-300 font-mono font-bold">#{chunkData.chunk_idx}</span>
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* 3-Column Content */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-0 text-sm relative z-10 md:h-[600px]">
              {/* Column 1: Raw Text */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="border-r border-slate-700/50 flex flex-col bg-slate-900/50 min-h-0"
              >
                <div className="px-4 py-3 bg-slate-800/40 border-b border-slate-700/50 font-semibold text-slate-300 flex items-center gap-2 shrink-0">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Raw Source Text
                </div>
                <div className="p-4 overflow-y-auto flex-1 font-mono text-xs leading-relaxed text-slate-400 whitespace-pre-wrap">
                  {chunkData.raw_text}
                </div>
              </motion.div>

              {/* Column 2: Retrieved Examples */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="border-b md:border-b-0 md:border-r border-slate-800 flex flex-col min-h-0 overflow-hidden bg-slate-900/50"
              >
                <div className="p-3 bg-slate-800/50 font-semibold text-slate-300 border-b border-slate-800 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">2</span>
                    Retrieved ICL Examples
                  </div>
                  <span className="text-xs bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">ChromaDB Top-3</span>
                </div>
                <div className="p-4 overflow-y-auto flex-1 space-y-3">
                  {chunkData.examples?.map((ex, i: number) => {
                    const simPct = (ex.similarity_score || 0) * 100;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + i * 0.08 }}
                        whileHover={{ scale: 1.01, borderColor: 'rgba(6,182,212,0.4)' }}
                        className="bg-slate-800/60 rounded-lg p-3 border border-slate-700 transition-colors"
                      >
                        <div className="flex justify-between text-xs mb-2 text-slate-400">
                          <span className="font-medium">Example {i + 1}</span>
                          <span className="text-cyan-400 font-mono">{simPct.toFixed(1)}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-slate-900 mb-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${simPct}%` }}
                            transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 shadow-[0_0_6px_rgba(6,182,212,0.6)]"
                          />
                        </div>
                        <div className="text-slate-300 mb-2 font-mono text-[11px] p-2 bg-slate-900/80 rounded leading-relaxed">{ex.text}</div>
                        <div className="text-green-400 font-mono text-[11px] break-all">➔ {ex.annotation}</div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Column 3: Model Response */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="flex flex-col bg-slate-900/50 min-h-0 overflow-hidden"
              >
                <div className="p-3 bg-slate-800/50 font-semibold text-slate-300 border-b border-slate-800 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-purple-500/20 text-purple-400 text-xs flex items-center justify-center font-bold">3</span>
                    Model Response
                  </div>
                  <span className="text-xs bg-purple-900/60 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">Qwen3-4B</span>
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                  <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Prompt Sent</h4>
                  <div className="bg-slate-950 p-2 rounded text-slate-400 font-mono text-[11px] mb-4 max-h-40 overflow-y-auto border border-slate-800 leading-relaxed">
                    {chunkData.prompt}
                  </div>

                  <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Extracted JSON</h4>
                  <div className="bg-slate-950 p-3 rounded text-green-400 font-mono text-[11px] whitespace-pre-wrap border border-green-500/20 shadow-[inset_0_0_20px_rgba(34,197,94,0.05)] leading-relaxed">
                    {chunkData.annotation}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
