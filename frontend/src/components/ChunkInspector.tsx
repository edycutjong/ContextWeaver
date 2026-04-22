"use client";

import React from 'react';

type InspectorProps = {
  chunkData: any | null;
  onClose: () => void;
};

export default function ChunkInspector({ chunkData, onClose }: InspectorProps) {
  if (!chunkData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950">
          <div>
            <h2 className="text-xl font-bold text-white">Chunk Inspector</h2>
            <p className="text-sm text-slate-400">Chunk ID: {chunkData.chunk_idx} • Confidence: <span className={chunkData.result?.confidence > 0.8 ? 'text-green-400' : 'text-amber-400'}>{chunkData.result?.confidence || 'N/A'}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded">Close</button>
        </div>

        {/* 3-Column Content */}
        <div className="flex-1 grid grid-cols-3 gap-0 overflow-hidden text-sm">
          
          {/* Column 1: Raw Text */}
          <div className="border-r border-slate-800 flex flex-col">
            <div className="p-3 bg-slate-800/50 font-semibold text-slate-300 border-b border-slate-800">1. Raw Chunk Text</div>
            <div className="p-4 overflow-y-auto flex-1 text-slate-300 font-mono whitespace-pre-wrap">
              {chunkData.raw_text}
            </div>
          </div>

          {/* Column 2: Retrieved Examples */}
          <div className="border-r border-slate-800 flex flex-col">
            <div className="p-3 bg-slate-800/50 font-semibold text-slate-300 border-b border-slate-800 flex justify-between items-center">
              <span>2. Retrieved ICL Examples</span>
              <span className="text-xs bg-cyan-900 text-cyan-300 px-2 py-0.5 rounded">ChromaDB Top-3</span>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {chunkData.examples?.map((ex: any, i: number) => (
                <div key={i} className="bg-slate-800 rounded p-3 border border-slate-700">
                  <div className="flex justify-between text-xs mb-2 text-slate-400">
                    <span>Example {i + 1}</span>
                    <span className="text-cyan-400">Sim: {(ex.similarity_score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="text-slate-300 mb-2 font-mono text-xs p-2 bg-slate-900 rounded">{ex.text}</div>
                  <div className="text-green-400 font-mono text-xs break-all">➔ {ex.annotation}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Model Response */}
          <div className="flex flex-col bg-slate-900/50">
            <div className="p-3 bg-slate-800/50 font-semibold text-slate-300 border-b border-slate-800 flex justify-between items-center">
              <span>3. Model Response</span>
              <span className="text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded">Qwen3-4B</span>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Prompt Sent</h4>
              <div className="bg-slate-950 p-2 rounded text-slate-400 font-mono text-xs mb-4 max-h-40 overflow-y-auto border border-slate-800">
                {chunkData.result?.prompt}
              </div>
              
              <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Extracted JSON</h4>
              <div className="bg-slate-950 p-3 rounded text-green-400 font-mono text-xs whitespace-pre-wrap border border-slate-800">
                {chunkData.result?.annotation}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
