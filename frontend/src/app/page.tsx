"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Zap, Shield, ZapIcon, Cpu, Package } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const PREVIEW_STEPS = [
  { id: 'doc', label: '📄 Document' },
  { id: 'chunker', label: '✂️ Chunker' },
  { id: 'retrieve', label: '🗄️ Retrieve' },
  { id: 'qwen', label: '🧠 Qwen3-4B' },
  { id: 'results', label: '📊 Results' },
];

function PipelinePreview() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIdx((i) => (i + 1) % PREVIEW_STEPS.length);
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative rounded-2xl bg-slate-900/40 border border-slate-800 backdrop-blur-sm p-6 md:p-10 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.06),transparent_30%,transparent_70%,rgba(168,85,247,0.06))]"
      />
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-6 text-center relative">Live pipeline preview</p>
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 relative">
        {PREVIEW_STEPS.map((step, idx) => {
          const active = idx === activeIdx;
          return (
            <React.Fragment key={step.id}>
              <motion.div
                animate={{
                  scale: active ? 1.05 : 1,
                  boxShadow: active
                    ? '0 0 24px rgba(6,182,212,0.45)'
                    : '0 0 0px rgba(6,182,212,0)',
                }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className={`px-4 py-2.5 rounded-lg border text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-cyan-950/80 border-cyan-400 text-white'
                    : 'bg-slate-900/80 border-slate-700 text-slate-400'
                }`}
              >
                {step.label}
              </motion.div>
              {idx < PREVIEW_STEPS.length - 1 && (
                <div className="relative w-6 md:w-10 h-0.5 bg-slate-700 rounded-full overflow-hidden hidden sm:block">
                  <motion.div
                    animate={{ x: active ? ['-100%', '100%'] : '0%' }}
                    transition={active ? { duration: 1.4, ease: 'linear', repeat: Infinity } : { duration: 0 }}
                    className="absolute inset-y-0 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [10, -10]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-10, 10]), { stiffness: 300, damping: 30 });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function onMouseLeave() {
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <motion.div
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    el?.style.setProperty('--mouse-x', `${e.clientX}px`);
    el?.style.setProperty('--mouse-y', `${e.clientY}px`);
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-slate-950 text-slate-200 flex flex-col relative overflow-hidden"
      style={{ '--mouse-x': '50%', '--mouse-y': '50%' } as React.CSSProperties}
    >
      {/* Mouse spotlight */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: 'radial-gradient(600px at var(--mouse-x) var(--mouse-y), rgba(6,182,212,0.07), transparent 60%)' }}
      />
      {/* Background decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-600/20 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Navbar */}
      <header className="container mx-auto px-6 py-8 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/50 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="ContextWeaver Logo" className="w-6 h-6 object-contain" />
          </div>
          <span className="font-bold text-2xl text-white tracking-tight">ContextWeaver</span>
        </div>
        <Link 
          href="/dashboard"
          className="px-6 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-medium border border-slate-700 transition-colors"
        >
          Enter App
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-10 -mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-medium text-sm mb-8"
        >
          <ZapIcon className="w-4 h-4" /> FlagOS Open Computing Global Challenge
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500 mb-8 max-w-4xl leading-tight"
        >
          Dynamic In-Context Learning Router.
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-slate-400 max-w-2xl mb-8 leading-relaxed"
        >
          Optimize LLM accuracy through visual transparency and real-time visualization. Built for high-performance AI orchestration.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-400 mb-12"
        >
          <span className="text-slate-500">Jointly hosted by:</span>
          <span className="px-3 py-1 rounded-full border border-slate-800 bg-slate-900/50">FlagOS Community</span>
          <span className="px-3 py-1 rounded-full border border-slate-800 bg-slate-900/50">BAAI</span>
          <span className="px-3 py-1 rounded-full border border-slate-800 bg-slate-900/50">CCF ODTC</span>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex gap-4 mb-20"
        >
          <Link 
            href="/dashboard"
            className="px-8 py-4 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-lg shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all hover:scale-105"
          >
            Launch Dashboard
          </Link>
          <a
            href="https://github.com/edycutjong/contextweaver"
            target="_blank"
            rel="noreferrer"
            className="px-8 py-4 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg border border-slate-700 transition-all"
          >
            View Source
          </a>
        </motion.div>
      </main>

      {/* Feature Grid */}
      <section className="container mx-auto px-6 pb-24 grid md:grid-cols-3 gap-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <TiltCard className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm h-full">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/50 flex items-center justify-center mb-6">
              <Cpu className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Sub-millisecond Routing</h3>
            <p className="text-slate-400 leading-relaxed">
              Intelligently route chunks to specific models based on latency constraints and complexity scores.
            </p>
          </TiltCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <TiltCard className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm h-full">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Visual Pipeline</h3>
            <p className="text-slate-400 leading-relaxed">
              Watch the RAG process happen in real-time. Full transparency into chunking, retrieval, and generation.
            </p>
          </TiltCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <TiltCard className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm h-full">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/50 flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">ChromaDB + Qwen3</h3>
            <p className="text-slate-400 leading-relaxed">
              Enterprise-grade vector storage tightly integrated with local Qwen3-4B inference.
            </p>
          </TiltCard>
        </motion.div>
      </section>

      <section className="container mx-auto px-6 pb-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <PipelinePreview />
        </motion.div>
      </section>

      {/* Footer / Sponsor Section */}
      <footer className="w-full border-t border-slate-800 bg-slate-950/80 backdrop-blur-md relative z-10 py-8 mt-auto">
        <div className="container mx-auto px-6 text-center">
          <p className="text-slate-500 text-sm mb-4">
            Targeting Track 3 of the FlagOS Open Computing Global Challenge.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-400">
            <span>Jointly hosted by:</span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/30 transition-colors">FlagOS Community</span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/30 transition-colors">Beijing Academy of Artificial Intelligence (BAAI)</span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/30 transition-colors">CCF ODTC</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
