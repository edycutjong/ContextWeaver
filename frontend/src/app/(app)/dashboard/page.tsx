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
      { id: 'chunker', label: '✂️ Chunker', x: 180, y: 100 },
      { id: 'vectordb', label: '🗄️ ChromaDB', x: 360, y: 0 },
      { id: 'prompt', label: '📝 Prompt Builder', x: 360, y: 200 },
      { id: 'qwen', label: '🧠 Qwen3-4B', x: 540, y: 100 },
      { id: 'results', label: '📊 Results', x: 720, y: 100 },
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
      { id: 'embed', label: '🧮 Embeddings', x: 180, y: 100 },
      { id: 'vectordb', label: '🗄️ Vector DB', x: 360, y: 100 },
      { id: 'llm', label: '🤖 LLM', x: 540, y: 100 },
      { id: 'output', label: '📝 Output', x: 720, y: 100 },
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
      { id: 'router', label: '🚦 Router Agent', x: 180, y: 100 },
      { id: 'agent1', label: '🕵️ Researcher', x: 360, y: 0 },
      { id: 'agent2', label: '🧑‍💻 Coder', x: 360, y: 100 },
      { id: 'agent3', label: '🧐 Reviewer', x: 360, y: 200 },
      { id: 'merger', label: '🔄 Synthesizer', x: 540, y: 100 },
      { id: 'results', label: '🎯 Final Output', x: 720, y: 100 },
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
      { id: 'generator', label: '🏗️ Generator', x: 220, y: 100 },
      { id: 'evaluator', label: '⚖️ Evaluator', x: 440, y: 100 },
      { id: 'results', label: '✨ Results', x: 660, y: 100 },
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
      { id: 'classifier', label: '🧭 Classifier', x: 180, y: 100 },
      { id: 'expert_a', label: '🏃 Expert A', x: 400, y: 0 },
      { id: 'expert_b', label: '🏋️ Expert B', x: 400, y: 100 },
      { id: 'expert_c', label: '🏊 Expert C', x: 400, y: 200 },
      { id: 'results', label: '📊 Results', x: 620, y: 100 },
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
    setPipelineStep('idle');
    setLogMessages([]);
    setDisplayedLogs([]);
    setProcessedChunks([]);
    setFinalResult(null);
    setSelectedChunk(null);
    setIsRunning(false);
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
      } catch (e) {}
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
      <div className="min-h-screen bg-[#020617] text-slate-200 p-6 font-sans relative">
        {/* Premium Background Effects */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-cyan-500 opacity-20 blur-[100px] pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -z-10 m-auto h-[400px] w-[400px] rounded-full bg-purple-600 opacity-10 blur-[120px] pointer-events-none" />

        {/* Aurora blobs */}
        <div
          className="aurora-blob absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"
          style={{ '--aurora-duration': '18s', '--aurora-delay': '0s' } as React.CSSProperties}
        />
        <div
          className="aurora-blob absolute top-1/2 -right-48 w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-3xl pointer-events-none"
          style={{ '--aurora-duration': '22s', '--aurora-delay': '-7s' } as React.CSSProperties}
        />
        <div
          className="aurora-blob absolute -bottom-48 left-1/3 w-[450px] h-[400px] rounded-full bg-blue-500/10 blur-3xl pointer-events-none"
          style={{ '--aurora-duration': '25s', '--aurora-delay': '-13s' } as React.CSSProperties}
        />

        <div className="max-w-7xl mx-auto space-y-6 relative z-10">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900/80 backdrop-blur-md p-6 rounded-xl border border-slate-700/50 shadow-[0_0_40px_rgba(6,182,212,0.15)] relative overflow-hidden group gap-4">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="flex items-center space-x-6 relative z-10">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-500/30 shrink-0 group-hover:scale-105 transition-transform duration-500 bg-slate-950 p-1">
                <div className="absolute inset-0 bg-cyan-400/20 animate-pulse" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon.svg" alt="ContextWeaver Logo" className="w-full h-full object-cover relative z-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 mb-1 flex items-center tracking-tight">
                  ContextWeaver
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

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column: Visualizations */}
            <div className="lg:col-span-2 space-y-6">

              {/* Graph Selector */}
              <div className="flex flex-wrap gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-700/50 w-fit backdrop-blur-sm relative z-20">
                <button
                  onClick={() => setSelectedGraph('contextweaver')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${selectedGraph === 'contextweaver' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'}`}
                >
                  ContextWeaver Flow
                </button>
                <button
                  onClick={() => setSelectedGraph('standard-rag')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${selectedGraph === 'standard-rag' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'}`}
                >
                  Standard RAG
                </button>
                <button
                  onClick={() => setSelectedGraph('multi-agent')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${selectedGraph === 'multi-agent' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'}`}
                >
                  Multi-Agent System
                </button>
                <button
                  onClick={() => setSelectedGraph('evaluator-optimizer')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${selectedGraph === 'evaluator-optimizer' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'}`}
                >
                  Evaluator-Optimizer
                </button>
                <button
                  onClick={() => setSelectedGraph('routing-agent')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${selectedGraph === 'routing-agent' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'}`}
                >
                  Routing Agent
                </button>
              </div>

              {/* Pipeline graph with spinning glow border when running */}
              <div className={`rounded-xl transition-all duration-500 ${isRunning ? 'ring-2 ring-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.6)] animate-pulse' : ''}`}>
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

              <ConfidenceHeatmap chunks={processedChunks} onSelectChunk={setSelectedChunk} />
            </div>

            {/* Right Column: Logs & Results */}
            <div className="flex flex-col space-y-6 h-full relative z-20">

              {/* Live Logs */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl flex flex-col h-96">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 rounded-t-xl font-semibold flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
                  Terminal Logs
                </div>
                <div ref={logsContainerRef} className="flex-1 p-4 font-mono text-xs text-slate-400 overflow-y-auto space-y-2 scroll-smooth">
                  {displayedLogs.map((msg, i) => (
                    <div key={i} className="flex items-start gap-1">
                      <span className="text-cyan-600 select-none shrink-0">{'>'}</span>
                      <span>{msg}</span>
                      {i === displayedLogs.length - 1 && isTyping && (
                        <span className="animate-pulse inline-block w-1.5 h-3 bg-cyan-400 ml-0.5 rounded-sm shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Results Panel */}
              {finalResult && (
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-900/50 rounded-xl p-6 shadow-xl flex-1">
                  <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center">
                    ✅ Annotation Complete
                  </h3>
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
                  <button onClick={handleExport} className="w-full mt-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors border border-slate-700 cursor-pointer relative z-10">
                    Export JSON
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inspector Modal */}
      <ChunkInspector chunkData={selectedChunk} onClose={() => setSelectedChunk(null)} />
    </>
  );
}
