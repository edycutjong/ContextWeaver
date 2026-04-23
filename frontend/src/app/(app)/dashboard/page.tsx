"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import PipelineGraph from '@/components/PipelineGraph';
import ChunkInspector from '@/components/ChunkInspector';
import ConfidenceHeatmap from '@/components/ConfidenceHeatmap';
import { NodeData, EdgeData } from '@/components/PipelineGraph';

type GraphType = 'contextweaver' | 'standard-rag' | 'multi-agent' | 'evaluator-optimizer' | 'routing-agent';

const graphs: Record<GraphType, { nodes: NodeData[], edges: EdgeData[], isNodeActive: (nodeId: string, step: string) => boolean }> = {
  'contextweaver': {
    nodes: [
      { id: 'doc', label: '📄 Document', x: 0, y: 100 },
      { id: 'chunker', label: '✂️ Chunker', x: 140, y: 100 },
      { id: 'vectordb', label: '🗄️ ChromaDB', x: 280, y: 0 },
      { id: 'prompt', label: '📝 Prompt Builder', x: 280, y: 200 },
      { id: 'qwen', label: '🧠 Qwen3-4B', x: 420, y: 100 },
      { id: 'results', label: '📊 Results', x: 560, y: 100 },
    ],
    edges: [
      { source: 'doc', target: 'chunker' },
      { source: 'chunker', target: 'vectordb' },
      { source: 'chunker', target: 'prompt' },
      { source: 'vectordb', target: 'prompt' },
      { source: 'prompt', target: 'qwen' },
      { source: 'qwen', target: 'results' },
    ],
    isNodeActive: (nodeId, step) => {
      if (step === 'init' && nodeId === 'doc') return true;
      if ((step === 'chunking' || step === 'chunk_complete') && nodeId === 'chunker') return true;
      if ((step === 'retrieving' || step === 'retrieve_complete') && nodeId === 'vectordb') return true;
      if (step === 'building_prompt' && nodeId === 'prompt') return true;
      if ((step === 'annotating' || step === 'annotate_complete') && nodeId === 'qwen') return true;
      if ((step === 'merging' || step === 'done') && nodeId === 'results') return true;
      return false;
    }
  },
  'standard-rag': {
    nodes: [
      { id: 'query', label: '🔍 User Query', x: 0, y: 100 },
      { id: 'embed', label: '🧮 Embeddings', x: 140, y: 100 },
      { id: 'vectordb', label: '🗄️ Vector DB', x: 280, y: 100 },
      { id: 'llm', label: '🤖 LLM', x: 420, y: 100 },
      { id: 'output', label: '📝 Output', x: 560, y: 100 },
    ],
    edges: [
      { source: 'query', target: 'embed' },
      { source: 'embed', target: 'vectordb' },
      { source: 'vectordb', target: 'llm' },
      { source: 'llm', target: 'output' },
    ],
    isNodeActive: (nodeId, step) => {
      if (step === 'init' && nodeId === 'query') return true;
      if ((step === 'chunking' || step === 'chunk_complete') && nodeId === 'embed') return true;
      if ((step === 'retrieving' || step === 'retrieve_complete') && nodeId === 'vectordb') return true;
      if ((step === 'building_prompt' || step === 'annotating' || step === 'annotate_complete') && nodeId === 'llm') return true;
      if ((step === 'merging' || step === 'done') && nodeId === 'output') return true;
      return false;
    }
  },
  'multi-agent': {
    nodes: [
      { id: 'task', label: '📋 Task', x: 0, y: 100 },
      { id: 'router', label: '🚦 Router Agent', x: 140, y: 100 },
      { id: 'agent1', label: '🕵️ Researcher', x: 280, y: 0 },
      { id: 'agent2', label: '🧑‍💻 Coder', x: 280, y: 100 },
      { id: 'agent3', label: '🧐 Reviewer', x: 280, y: 200 },
      { id: 'merger', label: '🔄 Synthesizer', x: 420, y: 100 },
      { id: 'results', label: '🎯 Final Output', x: 560, y: 100 },
    ],
    edges: [
      { source: 'task', target: 'router' },
      { source: 'router', target: 'agent1' },
      { source: 'router', target: 'agent2' },
      { source: 'router', target: 'agent3' },
      { source: 'agent1', target: 'merger' },
      { source: 'agent2', target: 'merger' },
      { source: 'agent3', target: 'merger' },
      { source: 'merger', target: 'results' },
    ],
    isNodeActive: (nodeId, step) => {
      if (step === 'init' && nodeId === 'task') return true;
      if ((step === 'chunking' || step === 'chunk_complete') && nodeId === 'router') return true;
      if ((step === 'retrieving' || step === 'retrieve_complete') && (nodeId === 'agent1' || nodeId === 'agent2' || nodeId === 'agent3')) return true;
      if ((step === 'building_prompt' || step === 'annotating' || step === 'annotate_complete') && nodeId === 'merger') return true;
      if ((step === 'merging' || step === 'done') && nodeId === 'results') return true;
      return false;
    }
  },
  'evaluator-optimizer': {
    nodes: [
      { id: 'task', label: '📋 Task', x: 0, y: 100 },
      { id: 'generator', label: '🏗️ Generator', x: 180, y: 100 },
      { id: 'evaluator', label: '⚖️ Evaluator', x: 360, y: 100 },
      { id: 'results', label: '✨ Results', x: 540, y: 100 },
    ],
    edges: [
      { source: 'task', target: 'generator' },
      { source: 'generator', target: 'evaluator' },
      { source: 'evaluator', target: 'generator' },
      { source: 'evaluator', target: 'results' },
    ],
    isNodeActive: (nodeId, step) => {
      if (step === 'init' && nodeId === 'task') return true;
      if ((step === 'chunking' || step === 'chunk_complete') && nodeId === 'generator') return true;
      if ((step === 'retrieving' || step === 'retrieve_complete') && nodeId === 'evaluator') return true;
      if ((step === 'building_prompt' || step === 'annotating' || step === 'annotate_complete') && nodeId === 'generator') return true;
      if ((step === 'merging' || step === 'done') && nodeId === 'results') return true;
      return false;
    }
  },
  'routing-agent': {
    nodes: [
      { id: 'input', label: '📥 Input', x: 0, y: 100 },
      { id: 'classifier', label: '🧭 Classifier', x: 140, y: 100 },
      { id: 'expert_a', label: '🏃 Expert A', x: 320, y: 0 },
      { id: 'expert_b', label: '🏋️ Expert B', x: 320, y: 100 },
      { id: 'expert_c', label: '🏊 Expert C', x: 320, y: 200 },
      { id: 'results', label: '📊 Results', x: 500, y: 100 },
    ],
    edges: [
      { source: 'input', target: 'classifier' },
      { source: 'classifier', target: 'expert_a' },
      { source: 'classifier', target: 'expert_b' },
      { source: 'classifier', target: 'expert_c' },
      { source: 'expert_a', target: 'results' },
      { source: 'expert_b', target: 'results' },
      { source: 'expert_c', target: 'results' },
    ],
    isNodeActive: (nodeId, step) => {
      if (step === 'init' && nodeId === 'input') return true;
      if ((step === 'chunking' || step === 'chunk_complete') && nodeId === 'classifier') return true;
      if ((step === 'retrieving' || step === 'retrieve_complete') && (nodeId === 'expert_a' || nodeId === 'expert_b' || nodeId === 'expert_c')) return true;
      if ((step === 'building_prompt' || step === 'annotating' || step === 'annotate_complete') && (nodeId === 'expert_a' || nodeId === 'expert_b' || nodeId === 'expert_c')) return true;
      if ((step === 'merging' || step === 'done') && nodeId === 'results') return true;
      return false;
    }
  }
};

const ENTITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  ORG:    { bg: 'bg-blue-500/20',   text: 'text-blue-300',   border: 'border-blue-500/30' },
  PERSON: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
  LOC:    { bg: 'bg-green-500/20',  text: 'text-green-300',  border: 'border-green-500/30' },
  DATE:   { bg: 'bg-amber-500/20',  text: 'text-amber-300',  border: 'border-amber-500/30' },
};
const DEFAULT_ENTITY_STYLE = { bg: 'bg-slate-700/50', text: 'text-slate-300', border: 'border-slate-600' };

function AnimatedNumber({ value, decimals = 0, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  const motionVal = useMotionValue(0);
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    const unsub = motionVal.on('change', (v) =>
      setDisplay(decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString())
    );
    const ctrl = animate(motionVal, value, { duration: 1.5, ease: 'easeOut' });
    return () => { ctrl.stop(); unsub(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{display}{suffix}</>;
}

export default function Dashboard() {
  const [pipelineStep, setPipelineStep] = useState<string>('idle');
  const [selectedGraph, setSelectedGraph] = useState<GraphType>('contextweaver');
  const [logMessages, setLogMessages] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [processedChunks, setProcessedChunks] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [finalResult, setFinalResult] = useState<any | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedChunk, setSelectedChunk] = useState<any | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Typewriter state
  const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Reset state when graph tab changes
  useEffect(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    /* eslint-disable react-hooks/set-state-in-effect */
    setPipelineStep('idle');
    setLogMessages([]);
    setDisplayedLogs([]);
    setProcessedChunks([]);
    setFinalResult(null);
    setSelectedChunk(null);
    setIsRunning(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [selectedGraph]);

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [displayedLogs]);

  // Typewriter effect: type the newest log line char-by-char
  useEffect(() => {
    const newCount = logMessages.length;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (newCount === 0) { setDisplayedLogs([]); return; }

    const completeLines = logMessages.slice(0, newCount - 1);
    const lastLine = logMessages[newCount - 1];

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    let charIdx = 0;
    setIsTyping(true);

    typingIntervalRef.current = setInterval(() => {
      charIdx++;
      setDisplayedLogs([...completeLines, lastLine.slice(0, charIdx)]);
      if (charIdx >= lastLine.length) {
        clearInterval(typingIntervalRef.current!);
        typingIntervalRef.current = null;
        setIsTyping(false);
      }
    }, 18);

    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, [logMessages]);

  const startPipeline = () => {
    setIsRunning(true);
    setPipelineStep('init');
    setLogMessages(['Starting ContextWeaver annotation pipeline...']);
    setDisplayedLogs([]);
    setProcessedChunks([]);
    setFinalResult(null);

    let queryParams = "";
    const savedSettings = localStorage.getItem('contextweaver_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        const params = new URLSearchParams();
        if (parsed.chunkSize) params.append('chunk_size', parsed.chunkSize.toString());
        if (parsed.chunkOverlap) params.append('chunk_overlap', parsed.chunkOverlap.toString());
        if (parsed.topK) params.append('top_k', parsed.topK.toString());
        queryParams = `?${params.toString()}`;
      } catch {}
    }

    const eventSource = new EventSource(`http://localhost:8000/api/stream/123${queryParams}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPipelineStep(data.step);

      if (data.message) {
        setLogMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${data.message}`]);
      }

      if (data.step === 'chunk_complete') {
        setProcessedChunks(data.chunks.map((raw_text: string, i: number) => ({
          chunk_idx: i,
          raw_text,
          examples: [],
        })));
      }

      if (data.step === 'retrieve_complete') {
        setProcessedChunks(prev => {
          const newChunks = [...prev];
          newChunks[data.chunk_idx] = { ...newChunks[data.chunk_idx], examples: data.examples };
          return newChunks;
        });
      }

      if (data.step === 'annotate_complete') {
        setProcessedChunks(prev => {
          const newChunks = [...prev];
          newChunks[data.chunk_idx] = { ...newChunks[data.chunk_idx], ...data.result };
          return newChunks;
        });
      }

      if (data.step === 'done') {
        setFinalResult(data.final_result);
        setLogMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ Pipeline complete! Accuracy optimized.`]);
        setIsRunning(false);
        eventSource.close();
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      setLogMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ❌ Connection error.`]);
      setIsRunning(false);
      eventSource.close();
    };
  };

  const handleExport = () => {
    const exportData = {
      pipeline: selectedGraph,
      timestamp: new Date().toISOString(),
      summary: finalResult,
      chunks: processedChunks,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contextweaver-results-${selectedGraph}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="w-full flex-1 flex flex-col font-sans relative p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 relative z-10 w-full">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900/80 backdrop-blur-md p-6 rounded-xl border border-slate-700/50 shadow-[0_0_40px_rgba(6,182,212,0.15)] relative overflow-hidden group gap-4">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="flex items-center space-x-6 relative z-10">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-500/30 shrink-0 group-hover:scale-105 transition-transform duration-500 bg-slate-950 p-3 flex items-center justify-center">
                <div className="absolute inset-0 bg-cyan-400/20 animate-pulse" />
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400 relative z-10">
                  <rect width="8" height="8" x="3" y="3" rx="2" />
                  <path d="M7 11v4a2 2 0 0 0 2 2h4" />
                  <rect width="8" height="8" x="13" y="13" rx="2" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 mb-1 flex items-center tracking-tight">
                  Pipeline Overview
                </h1>
                <p className="text-slate-400 font-medium tracking-wide">Dynamic In-Context Learning Router</p>
              </div>
            </div>
            <button
              onClick={startPipeline}
              disabled={isRunning}
              className={`relative z-10 px-8 py-3.5 rounded-xl font-bold tracking-wide transition-all overflow-hidden ${
                isRunning ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] border border-cyan-400/30'
              }`}
            >
              {isRunning && (
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              )}
              <span className="relative flex items-center">
                {isRunning ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Pipeline Active...
                  </>
                ) : 'Run Document Annotation'}
              </span>
            </button>
          </div>

          {/* Graph Selector (Moved to Top) */}
          <div className="flex flex-wrap justify-center gap-2 bg-slate-900/50 p-2 rounded-xl border border-slate-700/50 w-full backdrop-blur-sm relative z-20">
            <button
              onClick={() => setSelectedGraph('contextweaver')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedGraph === 'contextweaver' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              ContextWeaver Flow
            </button>
            <button
              onClick={() => setSelectedGraph('standard-rag')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedGraph === 'standard-rag' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              Standard RAG
            </button>
            <button
              onClick={() => setSelectedGraph('multi-agent')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedGraph === 'multi-agent' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              Multi-Agent System
            </button>
            <button
              onClick={() => setSelectedGraph('evaluator-optimizer')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedGraph === 'evaluator-optimizer' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              Evaluator-Optimizer
            </button>
            <button
              onClick={() => setSelectedGraph('routing-agent')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedGraph === 'routing-agent' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              Routing Agent
            </button>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column: Visualizations */}
            <div className="lg:col-span-2 space-y-6">

              {/* Pipeline graph with animated shimmer ring when running */}
              <div className="relative rounded-xl">
                {isRunning && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -inset-px rounded-xl bg-[length:200%_100%] bg-gradient-to-r from-cyan-500/60 via-purple-500/60 to-cyan-500/60 animate-[shimmer_3s_linear_infinite] opacity-80"
                  />
                )}
                <div className="relative z-10 rounded-xl bg-slate-900">
                  <PipelineGraph
                    key={selectedGraph}
                    currentStep={pipelineStep}
                    nodes={graphs[selectedGraph].nodes}
                    edges={graphs[selectedGraph].edges}
                    isNodeActive={graphs[selectedGraph].isNodeActive}
                  />
                </div>
              </div>

              {/* Live running metrics */}
              <AnimatePresence>
                {isRunning && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-3 gap-4"
                  >
                    <div className="bg-slate-900/70 border border-cyan-500/20 rounded-xl p-4 backdrop-blur-sm">
                      <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Stage</p>
                      <p className="text-lg font-bold text-cyan-300 font-mono mt-1 truncate">{pipelineStep}</p>
                    </div>
                    <div className="bg-slate-900/70 border border-purple-500/20 rounded-xl p-4 backdrop-blur-sm">
                      <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Chunks</p>
                      <p className="text-lg font-bold text-purple-300 font-mono mt-1">
                        <AnimatedNumber value={processedChunks.length} />
                      </p>
                    </div>
                    <div className="bg-slate-900/70 border border-emerald-500/20 rounded-xl p-4 backdrop-blur-sm">
                      <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Avg confidence</p>
                      <p className="text-lg font-bold text-emerald-300 font-mono mt-1">
                        <AnimatedNumber
                          value={(() => {
                            const scored = processedChunks.filter((c) => typeof c.confidence === 'number');
                            if (scored.length === 0) return 0;
                            return (scored.reduce((a, c) => a + c.confidence, 0) / scored.length) * 100;
                          })()}
                          decimals={1}
                          suffix="%"
                        />
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <ConfidenceHeatmap chunks={processedChunks} onSelectChunk={setSelectedChunk} />
            </div>

            {/* Right Column: Logs & Results */}
            <div className="flex flex-col space-y-6 h-full relative z-20">

              {/* Live Logs */}
              <div className="bg-slate-950 border border-slate-700 rounded-xl flex flex-col h-96 relative overflow-hidden">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.06),transparent_60%)]"
                />
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 rounded-t-xl font-semibold flex items-center relative z-10">
                  <div className={`w-2 h-2 rounded-full mr-3 ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
                  Terminal Logs
                </div>
                <div ref={logsContainerRef} className="flex-1 p-4 font-mono text-xs text-slate-400 overflow-y-auto space-y-1.5 scroll-smooth relative z-10">
                  {displayedLogs.map((msg, i) => {
                    const promptColor = msg.includes('❌')
                      ? 'text-red-400'
                      : msg.includes('✅')
                      ? 'text-emerald-400'
                      : msg.includes('⚠️')
                      ? 'text-amber-400'
                      : 'text-cyan-600';
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-start gap-1"
                      >
                        <span className={`${promptColor} select-none shrink-0`}>{'>'}</span>
                        <span className="break-all">{msg}</span>
                        {i === displayedLogs.length - 1 && isTyping && (
                          <span className="animate-pulse inline-block w-1.5 h-3 bg-cyan-400 ml-0.5 rounded-sm shrink-0" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Final Results Panel */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-900/50 rounded-xl p-6 shadow-xl flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center">
                    {finalResult ? '✅ Annotation Complete' : '⏳ Waiting for Results...'}
                  </h3>
                  
                  {finalResult ? (
                    <div className="space-y-4">
                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <p className="text-slate-400 text-sm">Mean Confidence</p>
                        <p className="text-3xl font-bold text-white">
                          <AnimatedNumber value={finalResult.mean_confidence * 100} decimals={1} suffix="%" />
                        </p>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <p className="text-slate-400 text-sm mb-2">
                          Extracted Entities (<AnimatedNumber value={finalResult.merged_entities?.length || 0} />)
                        </p>
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                          <AnimatePresence>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {(finalResult.merged_entities || []).slice(0, 20).map((entity: any, i: number) => {
                              const label = entity.type || entity.label || 'DEFAULT';
                              const style = ENTITY_STYLES[label] || DEFAULT_ENTITY_STYLE;
                              return (
                                <motion.span
                                  key={`${entity.value || entity}-${i}`}
                                  initial={{ scale: 0.5, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.5, opacity: 0 }}
                                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 350, damping: 22 }}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}
                                >
                                  <span className="text-[10px] font-bold opacity-60">{label}</span>
                                  {entity.value || entity}
                                </motion.span>
                              );
                            })}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 rounded-lg border border-slate-800/60 bg-slate-950/40 p-4 flex flex-col justify-center gap-3">
                      <div className="space-y-2">
                        <div className="h-2.5 rounded bg-slate-800/70 animate-pulse" style={{ width: '100%' }} />
                        <div className="h-2.5 rounded bg-slate-800/70 animate-pulse" style={{ width: '82%' }} />
                        <div className="h-2.5 rounded bg-slate-800/70 animate-pulse" style={{ width: '64%' }} />
                      </div>
                      <p className="text-slate-500 text-xs text-center mt-3">
                        {isRunning ? 'Streaming annotations…' : 'Run the pipeline to see extraction results here.'}
                      </p>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleExport} 
                  disabled={!finalResult}
                  className={`w-full mt-6 py-2 rounded transition-colors border cursor-pointer relative z-10 font-medium ${
                    finalResult 
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' 
                      : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                  }`}
                >
                  Export JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inspector Modal */}
      <ChunkInspector chunkData={selectedChunk} onClose={() => setSelectedChunk(null)} />
    </>
  );
}
