"use client";

import React, { useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes: Node[] = [
  { id: 'doc', position: { x: 50, y: 150 }, data: { label: '📄 Document' }, type: 'input' },
  { id: 'chunker', position: { x: 250, y: 150 }, data: { label: '✂️ Chunker' } },
  { id: 'vectordb', position: { x: 450, y: 50 }, data: { label: '🗄️ ChromaDB' } },
  { id: 'prompt', position: { x: 450, y: 250 }, data: { label: '📝 Prompt Builder' } },
  { id: 'qwen', position: { x: 650, y: 150 }, data: { label: '🧠 Qwen3-4B' } },
  { id: 'results', position: { x: 850, y: 150 }, data: { label: '📊 Results' }, type: 'output' },
];

const initialEdges: Edge[] = [
  { id: 'e1', source: 'doc', target: 'chunker', animated: true },
  { id: 'e2', source: 'chunker', target: 'vectordb', animated: true },
  { id: 'e3', source: 'chunker', target: 'prompt', animated: true },
  { id: 'e4', source: 'vectordb', target: 'prompt', animated: true, label: 'Retrieve top-3' },
  { id: 'e5', source: 'prompt', target: 'qwen', animated: true },
  { id: 'e6', source: 'qwen', target: 'results', animated: true },
];

export default function PipelineGraph({ currentStep }: { currentStep: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update node styles based on current step
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        let isActive = false;
        if (currentStep === 'init' && node.id === 'doc') isActive = true;
        if (currentStep === 'chunking' && (node.id === 'doc' || node.id === 'chunker')) isActive = true;
        if (currentStep === 'retrieving' && node.id === 'vectordb') isActive = true;
        if (currentStep === 'annotating' && (node.id === 'prompt' || node.id === 'qwen')) isActive = true;
        if (currentStep === 'merging' || currentStep === 'done') isActive = true;

        return {
          ...node,
          style: {
            ...node.style,
            background: isActive ? '#06b6d4' : '#1e293b',
            color: '#fff',
            border: isActive ? '2px solid #22d3ee' : '1px solid #334155',
            boxShadow: isActive ? '0 0 15px rgba(6, 182, 212, 0.5)' : 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            transition: 'all 0.3s ease',
          },
        };
      })
    );
  }, [currentStep, setNodes]);

  return (
    <div style={{ width: '100%', height: '400px' }} className="border border-slate-700 rounded-xl overflow-hidden bg-slate-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        colorMode="dark"
      >
        <Background color="#334155" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
