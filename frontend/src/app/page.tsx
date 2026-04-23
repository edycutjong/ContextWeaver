"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
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
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md p-8 md:p-12 overflow-hidden group shadow-[0_0_40px_rgba(0,0,0,0.3)]">
      {/* Dynamic background glow based on active step */}
      <motion.div
        className="absolute inset-0 z-0 opacity-40 hidden sm:block"
        animate={{
          background: `radial-gradient(600px circle at ${10 + activeIdx * 20}% 50%, rgba(6,182,212,0.3), transparent 60%)`,
        }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />
      
      <div className="relative z-10 flex flex-col items-center">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 mb-12 font-bold drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
          Live Telemetry Stream
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center w-full max-w-5xl mx-auto">
          {PREVIEW_STEPS.map((step, idx) => {
            const active = idx === activeIdx;
            const past = idx < activeIdx;
            return (
              <React.Fragment key={step.id}>
                {/* Node */}
                <motion.div
                  animate={{
                    scale: active ? 1.15 : 1,
                    y: active ? -5 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative z-20 flex flex-col items-center justify-center my-2 sm:my-0"
                >
                  {/* Orbit ring for active node */}
                  {active && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-cyan-400"
                      initial={{ opacity: 0.8, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.5 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                  <motion.div
                    animate={{
                      boxShadow: active 
                        ? '0 0 30px rgba(6,182,212,0.6), inset 0 0 15px rgba(6,182,212,0.4)' 
                        : past 
                        ? '0 0 10px rgba(6,182,212,0.1), inset 0 0 0px rgba(6,182,212,0)'
                        : '0 0 0px rgba(6,182,212,0)',
                      borderColor: active ? 'rgba(34,211,238,0.8)' : past ? 'rgba(34,211,238,0.3)' : 'rgba(51,65,85,0.5)',
                      backgroundColor: active ? 'rgba(8,145,178,0.2)' : 'rgba(15,23,42,0.6)',
                    }}
                    className="px-5 py-3 rounded-xl border-2 backdrop-blur-md transition-colors relative z-10"
                  >
                    <span className={`text-base md:text-lg font-bold whitespace-nowrap transition-colors ${active ? 'text-white' : past ? 'text-cyan-100' : 'text-slate-500'}`}>
                      {step.label}
                    </span>
                  </motion.div>
                  
                  {/* Status text below node */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: active ? 1 : 0, y: active ? 0 : 10 }}
                    className="absolute -bottom-8 whitespace-nowrap text-[10px] uppercase font-mono text-cyan-400 tracking-wider hidden sm:block"
                  >
                    {active ? "Processing..." : ""}
                  </motion.div>
                </motion.div>

                {/* Horizontal Line (Desktop) */}
                {idx < PREVIEW_STEPS.length - 1 && (
                  <div className="relative flex-1 h-1.5 bg-slate-800/80 mx-2 rounded-full overflow-hidden hidden sm:block z-10">
                    <motion.div
                      initial={{ x: '-100%' }}
                      animate={{ x: active ? '100%' : '-100%', opacity: active ? [1, 1, 0] : 0 }}
                      transition={{ 
                        duration: active ? 2 : 0, 
                        ease: 'linear',
                        opacity: { times: [0, 0.9, 1], duration: active ? 2 : 0 }
                      }}
                      className="absolute inset-y-0 w-full bg-gradient-to-r from-transparent via-cyan-400 to-cyan-200"
                    />
                    {active && (
                      <motion.div
                        initial={{ left: '0%', opacity: 1 }}
                        animate={{ left: '100%', opacity: [1, 1, 0] }}
                        transition={{ 
                          duration: 2, 
                          ease: 'linear',
                          opacity: { times: [0, 0.9, 1], duration: 2 }
                        }}
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_4px_rgba(34,211,238,1)] z-20"
                      />
                    )}
                  </div>
                )}
                {/* Vertical Line (Mobile) */}
                {idx < PREVIEW_STEPS.length - 1 && (
                  <div className="relative w-1.5 h-10 bg-slate-800/80 my-2 rounded-full overflow-hidden sm:hidden z-10">
                    <motion.div
                      initial={{ y: '-100%' }}
                      animate={{ y: active ? '100%' : '-100%', opacity: active ? [1, 1, 0] : 0 }}
                      transition={{ 
                        duration: active ? 2 : 0, 
                        ease: 'linear',
                        opacity: { times: [0, 0.9, 1], duration: active ? 2 : 0 }
                      }}
                      className="absolute inset-x-0 h-full bg-gradient-to-b from-transparent via-cyan-400 to-cyan-200"
                    />
                    {active && (
                      <motion.div
                        initial={{ top: '0%', opacity: 1 }}
                        animate={{ top: '100%', opacity: [1, 1, 0] }}
                        transition={{ 
                          duration: 2, 
                          ease: 'linear',
                          opacity: { times: [0, 0.9, 1], duration: 2 }
                        }}
                        className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_4px_rgba(34,211,238,1)] z-20"
                      />
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
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

      <Header />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-10 pt-12">
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
          className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500 mb-8 w-full max-w-none mx-auto leading-tight px-2 sm:px-0"
        >
          <span className="md:whitespace-nowrap">Dynamic In-Context</span> <br /> <span className="md:whitespace-nowrap">Learning Router.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed"
        >
          Optimize LLM accuracy through visual transparency and real-time visualization. Built for high-performance AI orchestration.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="flex justify-center items-center gap-4 mb-6 w-full"
        >
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-12 py-4 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-lg shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all hover:scale-105"
          >
            Launch Dashboard
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col items-center justify-center gap-3 text-sm text-slate-400 mb-20"
        >
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="text-slate-500">Jointly hosted by:</div>
            <span className="px-3 py-1 rounded-full border border-slate-800 bg-slate-900/50">FlagOS Community</span>
            <span className="px-3 py-1 rounded-full border border-slate-800 bg-slate-900/50">BAAI</span>
            <span className="px-3 py-1 rounded-full border border-slate-800 bg-slate-900/50">CCF ODTC</span>
          </div>
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
    </div>
  );
}
