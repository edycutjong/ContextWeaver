"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { useTranslations } from 'next-intl';
import PipelineGraph from '@/components/PipelineGraph';
import ChunkInspector from '@/components/ChunkInspector';
import ConfidenceHeatmap from '@/components/ConfidenceHeatmap';
import { NodeData, EdgeData } from '@/components/PipelineGraph';
import ThroughputSparkline from '@/components/ThroughputSparkline';
import ConfettiBurst from '@/components/ConfettiBurst';
import { pushToast } from '@/components/ToastLayer';
import { translateSseMessage } from '@/i18n/sseMessages';
import {
  FileText, Scissors, Database, FileEdit, BarChart, Search, Calculator, Bot, ClipboardList, TrafficCone, UserSearch, Code2, CheckSquare, Combine, Target, PenTool, Scale, Sparkles, Inbox, Compass, Activity, Dumbbell, Waves,
  CheckCircle2, XCircle, AlertTriangle, Loader2
} from "lucide-react";
import { ChromaIcon, QwenIcon } from '@/components/CustomIcons';

type GraphType = 'contextweaver' | 'standard-rag' | 'multi-agent' | 'evaluator-optimizer' | 'routing-agent';

type GraphDef = {
  nodes: { id: string; nodeKey: string; literal?: string; x: number; y: number; icon: NodeData['icon'] }[];
  edges: EdgeData[];
  isNodeActive: (nodeId: string, step: string) => boolean;
};

const graphDefs: Record<GraphType, GraphDef> = {
  'contextweaver': {
    nodes: [
      { id: 'doc', nodeKey: 'document', x: 0, y: 100, icon: FileText },
      { id: 'chunker', nodeKey: 'chunker', x: 250, y: 100, icon: Scissors },
      { id: 'vectordb', nodeKey: 'chromadb', x: 500, y: 20, icon: ChromaIcon },
      { id: 'prompt', nodeKey: 'promptBuilder', x: 500, y: 200, icon: FileEdit },
      { id: 'qwen', nodeKey: 'qwen', x: 750, y: 100, icon: QwenIcon },
      { id: 'results', nodeKey: 'results', x: 1000, y: 100, icon: BarChart },
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
      { id: 'query', nodeKey: 'userQuery', x: 0, y: 100, icon: Search },
      { id: 'embed', nodeKey: 'embeddings', x: 250, y: 100, icon: Calculator },
      { id: 'vectordb', nodeKey: 'vectorDb', x: 500, y: 100, icon: Database },
      { id: 'llm', nodeKey: 'llm', x: 750, y: 100, icon: Bot },
      { id: 'output', nodeKey: 'output', x: 1000, y: 100, icon: FileText },
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
      { id: 'task', nodeKey: 'task', x: 0, y: 100, icon: ClipboardList },
      { id: 'router', nodeKey: 'routerAgent', x: 220, y: 100, icon: TrafficCone },
      { id: 'agent1', nodeKey: 'researcher', x: 440, y: 20, icon: UserSearch },
      { id: 'agent2', nodeKey: 'coder', x: 440, y: 100, icon: Code2 },
      { id: 'agent3', nodeKey: 'reviewer', x: 440, y: 210, icon: CheckSquare },
      { id: 'merger', nodeKey: 'synthesizer', x: 660, y: 100, icon: Combine },
      { id: 'results', nodeKey: 'finalOutput', x: 880, y: 100, icon: Target },
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
      { id: 'task', nodeKey: 'task', x: 0, y: 100, icon: ClipboardList },
      { id: 'generator', nodeKey: 'generator', x: 300, y: 100, icon: PenTool },
      { id: 'evaluator', nodeKey: 'evaluator', x: 600, y: 100, icon: Scale },
      { id: 'results', nodeKey: 'results', x: 900, y: 100, icon: Sparkles },
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
      { id: 'input', nodeKey: 'input', x: 0, y: 100, icon: Inbox },
      { id: 'classifier', nodeKey: 'classifier', x: 300, y: 100, icon: Compass },
      { id: 'expert_a', nodeKey: 'expertA', x: 600, y: 20, icon: Activity },
      { id: 'expert_b', nodeKey: 'expertB', x: 600, y: 100, icon: Dumbbell },
      { id: 'expert_c', nodeKey: 'expertC', x: 600, y: 210, icon: Waves },
      { id: 'results', nodeKey: 'results', x: 900, y: 100, icon: BarChart },
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
    /* istanbul ignore next */
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
  ORG: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
  PERSON: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
  LOC: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30' },
  DATE: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
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
  const t = useTranslations('dashboard');
  const tNodes = useTranslations('dashboard.nodes');
  const tCommon = useTranslations('common');
  const tSse = useTranslations('sseLog');
  const graphs: Record<GraphType, { nodes: NodeData[]; edges: EdgeData[]; isNodeActive: GraphDef['isNodeActive'] }> = React.useMemo(() => {
    const out = {} as Record<GraphType, { nodes: NodeData[]; edges: EdgeData[]; isNodeActive: GraphDef['isNodeActive'] }>;
    (Object.keys(graphDefs) as GraphType[]).forEach((k) => {
      const def = graphDefs[k];
      out[k] = {
        edges: def.edges,
        isNodeActive: def.isNodeActive,
        nodes: def.nodes.map((n) => ({
          id: n.id,
          label: n.literal ?? tNodes(n.nodeKey),
          x: n.x,
          y: n.y,
          icon: n.icon,
        })),
      };
    });
    return out;
  }, [tNodes]);
  const [pipelineStep, setPipelineStep] = useState<string>('idle');
  const [activeModel] = useState<string>('fast');
  const [selectedGraph, setSelectedGraph] = useState<GraphType>('contextweaver');
  const [logMessages, setLogMessages] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [processedChunks, setProcessedChunks] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [finalResult, setFinalResult] = useState<any | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [competitionData, setCompetitionData] = useState<any | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedChunk, setSelectedChunk] = useState<any | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [documentText, setDocumentText] = useState<string>('');
  const eventSourceRef = useRef<EventSource | null>(null);

  // Typewriter state
  const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const [burstTrigger, setBurstTrigger] = useState(0);

  const logsContainerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

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
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [displayedLogs]);

  // Elapsed timer while pipeline is running
  useEffect(() => {
    if (!isRunning) return;
    startedAtRef.current = performance.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setElapsedMs(0);
    const id = window.setInterval(() => {
      /* istanbul ignore else -- defensive guard; ref is set above before this fires */
      if (startedAtRef.current != null) {
        setElapsedMs(performance.now() - startedAtRef.current);
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [isRunning]);

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
    /* istanbul ignore if -- defensive guard; callers (run button + global event) already gate on isRunning */
    if (isRunning) return;
    setIsRunning(true);
    setPipelineStep('init');
    setLogMessages([t('log.starting')]);
    setDisplayedLogs([]);
    setProcessedChunks([]);
    setFinalResult(null);
    setCompetitionData(null);
    pushToast({ kind: 'info', title: t('toast.startedTitle'), description: t('toast.startedDescription') });

    const params = new URLSearchParams();
    let hasParams = false;
    const savedSettings = localStorage.getItem('contextweaver_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        hasParams = true;
        if (parsed.chunkSize) params.append('chunk_size', parsed.chunkSize.toString());
        if (parsed.chunkOverlap) params.append('chunk_overlap', parsed.chunkOverlap.toString());
        if (parsed.topK) params.append('top_k', parsed.topK.toString());
      } catch { }
    }
    if (documentText.trim()) {
      params.append('text', documentText.trim());
      hasParams = true;
    }
    const queryParams = hasParams ? `?${params.toString()}` : '';

    const eventSource = new EventSource(`/api/stream/123${queryParams}`);
    eventSourceRef.current = eventSource;

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPipelineStep(data.step);

      if (data.message) {
        const localized = translateSseMessage(data.message, (k, vars) => tSse(k, vars));
        setLogMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${localized}`]);
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
        if (data.competition) setCompetitionData(data.competition);
        setLogMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${t('log.complete')}`]);
        setIsRunning(false);
        eventSource.close();
        setBurstTrigger((n) => n + 1);
        const entityCount = data.final_result?.merged_entities?.length ?? 0;
        const conf = (((data.final_result?.mean_confidence ?? 0) * 100) || 0).toFixed(1);
        pushToast({
          kind: 'success',
          title: t('toast.completeTitle'),
          description: t('toast.completeDescription', { count: entityCount, conf }),
          duration: 5000,
        });
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);

        // Save run summary to history
        const elapsed = startedAtRef.current ? Math.round(performance.now() - startedAtRef.current) : 0;
        const query = documentText.trim()
          ? `Doc: ${documentText.trim().substring(0, 80)}${documentText.trim().length > 80 ? '...' : ''}`
          : 'Sample document';
        const runEntry = {
          id: Date.now().toString(),
          query,
          time: new Date().toLocaleString(),
          latency: elapsed,
          status: 'success',
          tokens: data.final_result?.total_chunks_processed ?? 0,
        };
        try {
          const existing = JSON.parse(localStorage.getItem('contextweaver_history') || '[]');
          localStorage.setItem('contextweaver_history', JSON.stringify([runEntry, ...existing].slice(0, 50)));
        } catch { /* ignore storage errors */ }
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      setLogMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${t('log.connectionError')}`]);
      setIsRunning(false);
      eventSource.close();
      pushToast({ kind: 'error', title: t('toast.errorTitle'), description: t('toast.errorDescription') });
    };
  };

  // Listen for global run events (⌘K / R keybinding)
  useEffect(() => {
    function onRun() {
      if (!isRunning) startPipeline();
    }
    window.addEventListener('contextweaver:run', onRun);
    return () => window.removeEventListener('contextweaver:run', onRun);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const handleExport = () => {
    const exportData = {
      pipeline: selectedGraph,
      timestamp: new Date().toISOString(),
      summary: finalResult,
      chunks: processedChunks,
      competition: competitionData ?? null,
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
      <ConfettiBurst trigger={burstTrigger} />
      <div className="w-full flex-1 flex flex-col font-sans relative p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 relative z-10 w-full">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1], delay: 0.05 }}
            className="flex justify-between items-start mb-6 flex-wrap gap-4"
          >
            <div>
              <h1 className="text-3xl sm:text-4xl font-orbitron font-black text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-blue-400 to-purple-500 mb-1 flex items-center tracking-wide">
                {t('title')}
              </h1>
              <p className="text-slate-400 font-medium tracking-wide">{t('subtitle')}</p>
            </div>
            <motion.div
              whileHover={!isRunning ? { scale: 1.05 } : {}}
              whileTap={!isRunning ? { scale: 0.97 } : {}}
              className="relative z-10"
            >
              {/* Breathing glow halo — idle only */}
              {!isRunning && (
                <motion.div
                  className="absolute -inset-1 rounded-xl bg-linear-to-r from-cyan-500 via-blue-500 to-purple-600 blur-lg pointer-events-none"
                  animate={{ opacity: [0.4, 0.75, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              <button
                onClick={startPipeline}
                disabled={isRunning}
                className={`relative px-8 py-3.5 rounded-xl font-bold tracking-wide overflow-hidden transition-shadow ${
                  isRunning
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-linear-to-r from-cyan-500 via-blue-500 to-purple-600 text-white shadow-[0_0_30px_rgba(6,182,212,0.5)] group'
                }`}
              >
                {/* Hover shimmer — idle */}
                {!isRunning && (
                  <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                )}
                {/* Running shimmer */}
                {isRunning && (
                  <span className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {isRunning ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      {t('runButtonActive')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      {t('runButton')}
                    </>
                  )}
                </span>
              </button>
            </motion.div>
          </motion.div>

          {/* Document Input — visible when idle */}
          {pipelineStep === 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1], delay: 0.08 }}
              className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl p-4 backdrop-blur-sm"
            >
              <label className="block text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">
                Document Input
              </label>
              <textarea
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                placeholder="Paste your document text here, or leave empty to annotate a sample document…"
                rows={4}
                className="w-full bg-slate-950/60 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 resize-y focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all font-mono leading-relaxed"
              />
              <p className="text-xs text-slate-600 mt-1.5">
                {documentText.trim() ? `${documentText.trim().length} chars · will be passed to the annotator` : 'Empty → sample legal document will be used'}
              </p>
            </motion.div>
          )}

          {/* Graph Selector (Moved to Top) */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1], delay: 0.1 }}
            className="flex flex-wrap justify-center gap-2 bg-slate-900/50 p-2 rounded-xl border border-slate-700/50 w-full backdrop-blur-sm relative z-20"
          >
            <button
              onClick={() => setSelectedGraph('contextweaver')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all border ${selectedGraph === 'contextweaver' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              {t('tabs.contextweaver')}
            </button>
            <button
              onClick={() => setSelectedGraph('standard-rag')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all border ${selectedGraph === 'standard-rag' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              {t('tabs.standardRag')}
            </button>
            <button
              onClick={() => setSelectedGraph('multi-agent')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all border ${selectedGraph === 'multi-agent' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              {t('tabs.multiAgent')}
            </button>
            <button
              onClick={() => setSelectedGraph('evaluator-optimizer')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all border ${selectedGraph === 'evaluator-optimizer' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              {t('tabs.evaluatorOptimizer')}
            </button>
            <button
              onClick={() => setSelectedGraph('routing-agent')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all border ${selectedGraph === 'routing-agent' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              {t('tabs.routingAgent')}
            </button>
          </motion.div>

          {/* Top Section: Pipeline Graph & Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1], delay: 0.18 }}
            className="space-y-6"
          >

            {/* Pipeline graph with animated shimmer ring when running */}
            <div className="relative rounded-xl">
              {isRunning && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-1 rounded-xl bg-linear-to-r from-cyan-500/30 via-purple-500/30 to-cyan-500/30 animate-pulse blur-sm"
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


          </motion.div>

          {/* Bottom Section: Split Pane */}
          {pipelineStep !== 'idle' && (
            <div ref={resultsRef} className="flex flex-col gap-6 w-full">

              {selectedChunk && (() => {
                const selectedIndex = processedChunks.findIndex(c => c.chunk_idx === selectedChunk.chunk_idx);
                const handlePrevious = selectedIndex > 0 ? () => setSelectedChunk(processedChunks[selectedIndex - 1]) : undefined;
                const handleNext = selectedIndex >= 0 && selectedIndex < processedChunks.length - 1 ? () => setSelectedChunk(processedChunks[selectedIndex + 1]) : undefined;
                return (
                  <ChunkInspector
                    chunkData={selectedChunk}
                    onClose={() => setSelectedChunk(null)}
                    onPrevious={handlePrevious}
                    onNext={handleNext}
                    modelKey={activeModel === 'deep' ? /* istanbul ignore next */ 'llama' : 'qwen'}
                  />
                );
              })()}

              {/* Single Row Layout: Logs, Heatmap, Results */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start h-[380px]">
                {/* Column 1: Terminal Logs */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.0, ease: 'easeOut' }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl flex flex-col h-full relative overflow-hidden z-20"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.06),transparent_60%)]"
                  />
                  <div className="p-4 border-b border-slate-800 bg-slate-900/50 rounded-t-xl font-semibold flex items-center relative z-10">
                    <div className={`w-2 h-2 rounded-full mr-3 ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
                    {t('terminalTitle')}
                  </div>
                  <div ref={logsContainerRef} className="flex-1 p-4 font-mono text-xs text-slate-400 overflow-y-auto space-y-1.5 scroll-smooth relative z-10">
                    {displayedLogs.map((msg, i) => {
                      let Icon = null;
                      let iconClass = '';
                      let cleanMsg = msg;
                      let promptColor = 'text-cyan-600';

                      if (msg.includes('❌')) {
                        Icon = XCircle;
                        iconClass = 'text-red-400';
                        promptColor = 'text-red-400';
                        cleanMsg = msg.replace('❌', '');
                      } else if (msg.includes('✅')) {
                        Icon = CheckCircle2;
                        iconClass = 'text-emerald-400';
                        promptColor = 'text-emerald-400';
                        cleanMsg = msg.replace('✅', '');
                      } else if (msg.includes('⚠️')) {
                        Icon = AlertTriangle;
                        iconClass = 'text-amber-400';
                        promptColor = 'text-amber-400';
                        cleanMsg = msg.replace('⚠️', '');
                      }

                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-start gap-1"
                        >
                          <span className={`${promptColor} select-none shrink-0`}>{'>'}</span>
                          <span className="wrap-break-word whitespace-pre-wrap leading-tight flex items-start gap-1.5 flex-1 min-w-0">
                            {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${iconClass} mt-px`} />}
                            {cleanMsg}
                          </span>
                          {i === displayedLogs.length - 1 && isTyping && (
                            <span className="animate-pulse inline-block w-1.5 h-3 bg-cyan-400 ml-0.5 rounded-sm shrink-0 mt-0.5" />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Column 2: Confidence Heatmap */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4, ease: 'easeOut' }}
                  className="w-full h-full relative z-20 min-h-0"
                >
                  <ConfidenceHeatmap chunks={processedChunks} onSelectChunk={setSelectedChunk} />
                </motion.div>

                {/* Column 3: Annotation Complete / Final Results Panel */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.8, ease: 'easeOut' }}
                  className="w-full h-full bg-linear-to-br from-slate-900 to-slate-800 border border-cyan-900/50 rounded-xl p-4 shadow-xl flex flex-col z-20 overflow-hidden"
                >
                  <div className="w-full overflow-y-auto min-h-0 pr-1 pb-2 flex flex-col flex-1">
                    <h3 className="text-xl font-bold text-cyan-400 mb-3 flex items-center gap-2 shrink-0">
                      {finalResult ? (
                        <><CheckCircle2 className="w-6 h-6 text-emerald-400" /> {t('panel.complete')}</>
                      ) : isRunning ? (
                        <><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /> {t('panel.processing')}</>
                      ) : (
                        <><Target className="w-6 h-6 text-cyan-400" /> {t('panel.ready')}</>
                      )}
                    </h3>

                    {/* Live running metrics */}
                    <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
                      <div className="bg-slate-900/70 border border-cyan-500/20 rounded-xl p-3 backdrop-blur-sm transition-opacity duration-300 overflow-hidden">
                        <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">{t('metrics.stage')}</p>
                        <p className={`text-sm font-bold font-mono mt-0.5 truncate ${/* istanbul ignore next -- this block only renders when pipelineStep !== 'idle' */ pipelineStep !== 'idle' ? 'text-cyan-300' : 'text-slate-500'}`} title={pipelineStep}>
                          {t(`steps.${pipelineStep}`, { defaultValue: pipelineStep })}
                        </p>
                      </div>
                      <div className="bg-slate-900/70 border border-purple-500/20 rounded-xl p-3 backdrop-blur-sm transition-opacity duration-300">
                        <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">{t('metrics.chunks')}</p>
                        <p className={`text-sm font-bold font-mono mt-0.5 ${processedChunks.length > 0 ? 'text-purple-300' : 'text-slate-500'}`}>
                          <AnimatedNumber value={processedChunks.length} />
                        </p>
                      </div>
                      <div className="bg-slate-900/70 border border-emerald-500/20 rounded-xl p-3 backdrop-blur-sm transition-opacity duration-300">
                        <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">{t('metrics.avgConf')}</p>
                        <p className={`text-sm font-bold font-mono mt-0.5 ${processedChunks.length > 0 ? 'text-emerald-300' : 'text-slate-500'}`}>
                          <AnimatedNumber
                            value={(() => {
                              const scored = processedChunks.filter((c) => typeof c.confidence === 'number');
                              if (scored.length === 0) return 0;
                              return (scored.reduce((a, c) => a + c.confidence, 0) / scored.length) * 100;
                            })()}
                            decimals={1}
                            suffix={tCommon('percent')}
                          />
                        </p>
                      </div>
                      <div className="bg-slate-900/70 border border-amber-500/20 rounded-xl p-3 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">{t('metrics.elapsed')}</p>
                          <p className={`text-sm font-bold font-mono mt-0.5 tabular-nums ${isRunning || finalResult ? 'text-amber-300' : 'text-slate-500'}`}>
                            {(elapsedMs / 1000).toFixed(1)}{tCommon('s')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[0, 1, 2, 3].map((i) => (
                            <motion.span
                              key={i}
                              className="w-1 rounded-full bg-amber-400/70"
                              initial={{ height: 4 }}
                              animate={isRunning ? { height: [4, 12, 4] } : { height: 4 }}
                              transition={{
                                duration: 0.9,
                                repeat: isRunning ? Infinity : 0,
                                delay: i * 0.12,
                                ease: 'easeInOut',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <ThroughputSparkline
                          value={processedChunks.filter((c) => typeof c.confidence === 'number').length}
                          active={isRunning}
                        />
                      </div>
                    </div>

                    {finalResult ? (
                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mt-2">
                        <p className="text-slate-400 text-sm mb-3">
                          {t('entitiesLabel', { count: finalResult.merged_entities?.length || 0 })}
                        </p>
                        <div className="flex flex-wrap gap-2 pb-2">
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
                                  className={`inline-flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}
                                >
                                  <span className="text-[10px] font-bold opacity-60">
                                    {tCommon(`entities.${label.toLowerCase()}`, { defaultValue: label })}
                                  </span>
                                  {entity.value || entity}
                                </motion.span>
                              );
                            })}
                          </AnimatePresence>
                        </div>
                      </div>
                    ) : (
                      /* istanbul ignore next */
                      <div className="rounded-lg border border-slate-800/60 bg-slate-950/40 p-4 flex flex-col justify-center gap-3 flex-1 mt-2">
                        <div className="space-y-2">
                          <div className={`h-2.5 rounded bg-slate-800/70 ${isRunning ? 'animate-pulse' : ''}`} style={{ width: '100%' }} />
                          <div className={`h-2.5 rounded bg-slate-800/70 ${isRunning ? 'animate-pulse' : ''}`} style={{ width: '82%' }} />
                          <div className={`h-2.5 rounded bg-slate-800/70 ${isRunning ? 'animate-pulse' : ''}`} style={{ width: '64%' }} />
                        </div>
                        <p className="text-slate-500 text-xs text-center mt-3">
                          {isRunning ? t('skeleton.streaming') : t('skeleton.waiting')}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleExport}
                    disabled={!finalResult || isRunning}
                    className={`mt-4 w-full shrink-0 py-2 rounded transition-all border relative z-10 font-medium overflow-hidden ${/* istanbul ignore next */ finalResult
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 cursor-pointer'
                      : /* istanbul ignore next */ isRunning
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700'
                        : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                      }`}
                  >
                    {isRunning && (
                      <span className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    )}
                    <span className="relative flex items-center justify-center">
                      {isRunning ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          {t('export.preparing')}
                        </>
                      ) : t('export.label')}
                    </span>
                  </button>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
