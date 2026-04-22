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
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6 font-sans relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-cyan-500 opacity-20 blur-[100px]" />
      <div className="absolute left-1/3 bottom-0 -z-10 m-auto h-[400px] w-[400px] rounded-full bg-purple-600 opacity-10 blur-[120px]" />
      
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-900/80 backdrop-blur-md p-6 rounded-xl border border-slate-700/50 shadow-[0_0_40px_rgba(6,182,212,0.15)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="flex items-center space-x-6 relative z-10">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-500/30 shrink-0 group-hover:scale-105 transition-transform duration-500 bg-slate-950 p-1">
              <div className="absolute inset-0 bg-cyan-400/20 animate-pulse" />
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
