"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

type Props = {
  value: number;
  active: boolean;
  label?: string;
  unit?: string;
  capacity?: number;
};

export default function ThroughputSparkline({
  value,
  active,
  label = "Throughput",
  unit = "chunks/s",
  capacity = 30,
}: Props) {
  const [points, setPoints] = useState<number[]>(() => Array(capacity).fill(0));
  const lastValueRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      lastValueRef.current = value;
      lastTimeRef.current = null;
      return;
    }
    const now = performance.now();
    const prev = lastValueRef.current;
    const prevTime = lastTimeRef.current ?? now;
    const dt = Math.max(1, now - prevTime) / 1000;
    const rate = Math.max(0, (value - prev) / dt);
    lastValueRef.current = value;
    lastTimeRef.current = now;

    setPoints((pts) => {
      const next = pts.slice(1);
      next.push(rate);
      return next;
    });
  }, [value, active]);

  // Tick forward every ~600ms while active so the line moves even without new values
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      setPoints((pts) => {
        const next = pts.slice(1);
        const last = pts[pts.length - 1] ?? 0;
        next.push(last * 0.78);
        return next;
      });
    }, 600);
    return () => window.clearInterval(id);
  }, [active]);

  const { path, areaPath, peak, current, avg } = useMemo(() => {
    const width = 100;
    const height = 32;
    const max = Math.max(1, ...points);
    const step = width / Math.max(1, points.length - 1);
    const coords = points.map((v, i) => {
      const x = i * step;
      const y = height - (v / max) * (height - 4) - 2;
      return { x, y };
    });
    const path = coords
      .map((c, i) => (i === 0 ? `M ${c.x.toFixed(2)} ${c.y.toFixed(2)}` : `L ${c.x.toFixed(2)} ${c.y.toFixed(2)}`))
      .join(" ");
    const areaPath = `${path} L ${width} ${height} L 0 ${height} Z`;
    const peak = max;
    const current = points[points.length - 1] ?? 0;
    const avg = points.reduce((a, b) => a + b, 0) / points.length;
    return { path, areaPath, peak, current, avg };
  }, [points]);

  return (
    <div className="col-span-2 bg-slate-900/70 border border-cyan-500/20 rounded-xl p-3 backdrop-blur-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Activity className={`w-3 h-3 ${active ? "text-cyan-300" : "text-slate-500"}`} />
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            {label}
          </span>
        </div>
        <motion.span
          key={Math.round(current * 10)}
          initial={{ opacity: 0.5, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`text-xs font-mono ${active ? "text-cyan-300" : "text-slate-500"}`}
        >
          {current.toFixed(1)} <span className="text-slate-600">{unit}</span>
        </motion.span>
      </div>

      <div className="h-9 w-full">
        <svg
          viewBox="0 0 100 32"
          preserveAspectRatio="none"
          className="w-full h-full"
          aria-hidden
        >
          <defs>
            <linearGradient id="spark-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(6,182,212,0.5)" />
              <stop offset="100%" stopColor="rgba(6,182,212,0)" />
            </linearGradient>
            <linearGradient id="spark-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#spark-area)" opacity={active ? 1 : 0.4} />
          <path
            d={path}
            fill="none"
            stroke="url(#spark-line)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={active ? 1 : 0.6}
          />
        </svg>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-0.5">
        <span>avg {avg.toFixed(1)}</span>
        <span>peak {peak.toFixed(1)}</span>
      </div>
    </div>
  );
}
