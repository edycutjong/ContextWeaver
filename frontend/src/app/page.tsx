"use client";

import { useState, useEffect, useRef } from 'react';
import PipelineGraph from '@/components/PipelineGraph';
import ChunkInspector from '@/components/ChunkInspector';
import ConfidenceHeatmap from '@/components/ConfidenceHeatmap';

export default function Dashboard() {
  const [pipelineStep, setPipelineStep] = useState<string>('idle');
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [processedChunks, setProcessedChunks] = useState<any[]>([]);
  const [finalResult, setFinalResult] = useState<any | null>(null);
  const [selectedChunk, setSelectedChunk] = useState<any | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logMessages]);

  const startPipeline = () => {
    setIsRunning(true);
    setPipelineStep('init');
    setLogMessages(['Starting ContextWeaver annotation pipeline...']);
    setProcessedChunks([]);
    setFinalResult(null);

    const eventSource = new EventSource('http://localhost:8000/api/stream/123?text=Demo_Run');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPipelineStep(data.step);
      
      if (data.message) {
        setLogMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${data.message}`]);
      }

      if (data.step === 'chunk_complete') {
        // Initialize the chunks array with empty data
        setProcessedChunks(data.chunks.map((raw_text: string, i: number) => ({
          chunk_idx: i,
          raw_text,
        })));
      }

      if (data.step === 'annotate_complete') {
        setProcessedChunks(prev => {
          const newChunks = [...prev];
          newChunks[data.chunk_idx] = data.result;
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2 flex items-center">
              ContextWeaver
            </h1>
            <p className="text-slate-400">Dynamic In-Context Learning Router</p>
          </div>
          <button 
            onClick={startPipeline}
            disabled={isRunning}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              isRunning ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
            }`}
          >
            {isRunning ? 'Pipeline Running...' : 'Run Document Annotation'}
          </button>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Visualizations */}
          <div className="lg:col-span-2 space-y-6">
            <PipelineGraph currentStep={pipelineStep} />
            <ConfidenceHeatmap chunks={processedChunks} onSelectChunk={setSelectedChunk} />
          </div>

          {/* Right Column: Logs & Results */}
          <div className="flex flex-col space-y-6 h-full">
            
            {/* Live Logs */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl flex flex-col h-96">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50 rounded-t-xl font-semibold flex items-center">
                <div className={`w-2 h-2 rounded-full mr-3 ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
                Terminal Logs
              </div>
              <div className="flex-1 p-4 font-mono text-xs text-slate-400 overflow-y-auto space-y-2">
                {logMessages.map((msg, i) => (
                  <div key={i}>{msg}</div>
                ))}
                <div ref={logsEndRef} />
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
                    <p className="text-3xl font-bold text-white">{(finalResult.mean_confidence * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <p className="text-slate-400 text-sm">Extracted Entities</p>
                    <p className="text-3xl font-bold text-white">{finalResult.merged_entities?.length || 0}</p>
                  </div>
                </div>
                <button className="w-full mt-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors border border-slate-700">
                  Export JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inspector Modal */}
      <ChunkInspector chunkData={selectedChunk} onClose={() => setSelectedChunk(null)} />
    </div>
  );
}
