"use client";

import React from 'react';

type HeatmapProps = {
  chunks: any[];
  onSelectChunk: (chunk: any) => void;
};

export default function ConfidenceHeatmap({ chunks, onSelectChunk }: HeatmapProps) {
  if (!chunks || chunks.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
      <h3 className="text-white font-semibold mb-4 flex items-center">
        <span className="mr-2">🔥</span> Confidence Heatmap
      </h3>
      <div className="grid grid-cols-10 gap-2">
        {chunks.map((chunk, i) => {
          const confidence = chunk.result?.confidence || 0;
          let bgColor = 'bg-slate-800'; // Default unannotated
          
          if (confidence > 0) {
            if (confidence >= 0.9) bgColor = 'bg-green-500';
            else if (confidence >= 0.8) bgColor = 'bg-green-400';
            else if (confidence >= 0.7) bgColor = 'bg-amber-400';
            else bgColor = 'bg-red-500';
          }
          
          return (
            <button
              key={i}
              onClick={() => onSelectChunk(chunk)}
              className={`w-full aspect-square rounded ${bgColor} hover:ring-2 ring-white transition-all group relative`}
            >
              <span className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-xs text-white px-2 py-1 rounded pointer-events-none z-10 whitespace-nowrap">
                Chunk {i}: {confidence ? `${(confidence * 100).toFixed(0)}%` : 'Processing...'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
