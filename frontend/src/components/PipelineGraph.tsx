"use client";

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Scissors, Database, FileEdit, BarChart, LucideIcon } from 'lucide-react';
import { ChromaIcon, QwenIcon } from '@/components/CustomIcons';

export interface NodeData {
  id: string;
  label: string;
  x: number;
  y: number;
  icon?: LucideIcon;
}

export interface EdgeData {
  source: string;
  target: string;
}

const defaultSteps: NodeData[] = [
  { id: 'doc', label: 'Document', x: 0, y: 100, icon: FileText },
  { id: 'chunker', label: 'Chunker', x: 150, y: 100, icon: Scissors },
  { id: 'vectordb', label: 'ChromaDB', x: 300, y: 20, icon: Database },
  { id: 'prompt', label: 'Prompt Builder', x: 300, y: 200, icon: FileEdit },
  { id: 'qwen', label: 'Qwen3-4B', x: 450, y: 100, icon: QwenIcon },
  { id: 'results', label: 'Results', x: 600, y: 100, icon: BarChart },
];

const defaultEdges: EdgeData[] = [
  { source: 'doc', target: 'chunker' },
  { source: 'chunker', target: 'vectordb' },
  { source: 'chunker', target: 'prompt' },
  { source: 'vectordb', target: 'prompt' },
  { source: 'prompt', target: 'qwen' },
  { source: 'qwen', target: 'results' },
];

export interface PipelineGraphProps {
  currentStep: string;
  nodes?: NodeData[];
  edges?: EdgeData[];
  isNodeActive?: (nodeId: string, currentStep: string) => boolean;
}

export default function PipelineGraph({ 
  currentStep, 
  nodes = defaultSteps, 
  edges = defaultEdges,
  isNodeActive = (nodeId, step) => {
    if (step === 'init' && nodeId === 'doc') return true;
    if ((step === 'chunking' || step === 'chunk_complete') && nodeId === 'chunker') return true;
    if ((step === 'retrieving' || step === 'retrieve_complete') && nodeId === 'vectordb') return true;
    if ((step === 'annotating' || step === 'annotate_complete') && (nodeId === 'prompt' || nodeId === 'qwen')) return true;
    if (step === 'merging' && nodeId === 'results') return true;
    if (step === 'done') return true;
    return false;
  }
}: PipelineGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Need to wait for mount to render lines correctly to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);

  const [positions, setPositions] = useState<{ [key: string]: { x: number, y: number } }>(() => {
    return nodes.reduce((acc, node) => {
      acc[node.id] = { x: node.x, y: node.y };
      return acc;
    }, {} as Record<string, { x: number, y: number }>);
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPositions(
      nodes.reduce((acc, node) => {
        acc[node.id] = { x: node.x, y: node.y };
        return acc;
      }, {} as Record<string, { x: number, y: number }>)
    );
  }, [nodes]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  return (
    <div className="w-full h-[400px] border border-slate-700/50 rounded-xl bg-slate-900/50 backdrop-blur-sm overflow-x-auto overflow-y-hidden">
      <div 
        ref={containerRef}
        className="min-w-[1200px] h-full relative"
      >
        {/* Background grid pattern */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />
      
      {/* SVG for edges */}
      {mounted && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <filter id="particle-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {edges.map((edge, i) => {
            const sourcePos = positions[edge.source];
            const targetPos = positions[edge.target];
            if (!sourcePos || !targetPos) return null;

            const nodeWidth = 140;
            const nodeHeight = 50;
            const x1 = sourcePos.x + nodeWidth / 2 + 50;
            const y1 = sourcePos.y + nodeHeight / 2 + 50;
            const x2 = targetPos.x + nodeWidth / 2 + 50;
            const y2 = targetPos.y + nodeHeight / 2 + 50;

            const cx = (x1 + x2) / 2;
            const d = `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
            const edgeId = `edge-${edge.source}-${edge.target}`;
            const active = isNodeActive(edge.source, currentStep) || isNodeActive(edge.target, currentStep);

            return (
              <motion.path
                key={edgeId}
                id={edgeId}
                d={d}
                fill="none"
                stroke={active ? "#06b6d4" : "#334155"}
                strokeWidth={active ? 3 : 2}
                className="transition-colors duration-500"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: i * 0.1 }}
              />
            );
          })}

          {/* Flowing particles along active edges */}
          {edges.map((edge) => {
            const active = isNodeActive(edge.source, currentStep) || isNodeActive(edge.target, currentStep);
            if (!active) return null;
            const edgeId = `edge-${edge.source}-${edge.target}`;
            return [0, 0.6, 1.2].map((offset, pi) => (
              <circle
                key={`particle-${edgeId}-${pi}`}
                r="4"
                fill="#22d3ee"
                filter="url(#particle-glow)"
                opacity="0.9"
              >
                <animateMotion
                  dur="1.8s"
                  begin={`${offset}s`}
                  repeatCount="indefinite"
                >
                  <mpath href={`#${edgeId}`} />
                </animateMotion>
              </circle>
            ));
          })}
        </svg>
      )}

      {/* Nodes */}
      <div className="absolute inset-0 p-[50px] z-10 pointer-events-none">
        {nodes.map((node) => {
          const active = isNodeActive(node.id, currentStep);
          return (
            <motion.div
              key={node.id}
              drag
              dragConstraints={containerRef}
              dragElastic={0}
              dragMomentum={false}
              initial={{ x: node.x, y: node.y }}
              animate={{
                boxShadow: active
                  ? [
                      '0 0 16px rgba(6,182,212,0.35)',
                      '0 0 28px rgba(6,182,212,0.6)',
                      '0 0 16px rgba(6,182,212,0.35)',
                    ]
                  : '0 0 0px rgba(6,182,212,0)',
              }}
              transition={active ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
              onUpdate={(latest) => {
                if (latest.x !== undefined && latest.y !== undefined) {
                  const lx = typeof latest.x === 'number' ? latest.x : parseFloat(latest.x as string);
                  const ly = typeof latest.y === 'number' ? latest.y : parseFloat(latest.y as string);
                  if (!isNaN(lx) && !isNaN(ly)) {
                    setPositions(prev => {
                      if (prev[node.id]?.x === lx && prev[node.id]?.y === ly) return prev;
                      return {
                        ...prev,
                        [node.id]: { x: lx, y: ly }
                      };
                    });
                  }
                }
              }}
              className={`group absolute top-0 left-0 cursor-default hover:cursor-grab active:cursor-grabbing flex flex-col items-center justify-center w-[140px] max-w-[140px] flex-shrink-0 min-w-[140px] h-[50px] min-h-[50px] rounded-lg border-2 pointer-events-auto transition-colors duration-300 ${
                active
                  ? 'bg-cyan-950/90 border-cyan-400 text-white'
                  : 'bg-slate-800/90 border-slate-600 text-slate-300'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="font-medium text-sm whitespace-nowrap flex items-center gap-1.5">
                {node.icon && <node.icon className="w-4 h-4" />}
                {node.label}
              </span>
              {active && (
                <>
                  <motion.div
                    aria-hidden
                    className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_rgba(34,211,238,0.9)]"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    layoutId={`active-indicator-${node.id}`}
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,1)]"
                  />
                </>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
    </div>
  );
}


