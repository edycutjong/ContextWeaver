"use client";

import React, { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  life: number;
  maxLife: number;
  size: number;
  rotation: number;
  vr: number;
  color: string;
  shape: "rect" | "circle";
};

const COLORS = ["#06b6d4", "#22d3ee", "#a855f7", "#f472b6", "#fbbf24", "#34d399"];

export default function ConfettiBurst({ trigger }: { trigger: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const partsRef = useRef<Particle[]>([]);
  const lastTriggerRef = useRef<number>(0);

  useEffect(() => {
    if (!trigger || trigger === lastTriggerRef.current) return;
    lastTriggerRef.current = trigger;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = rect.width / 2;
    const cy = rect.height * 0.45;
    const count = 120;
    const fresh: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      fresh.push({
        x: cx + (Math.random() - 0.5) * 10,
        y: cy + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        g: 0.14 + Math.random() * 0.06,
        life: 0,
        maxLife: 80 + Math.random() * 60,
        size: 3 + Math.random() * 5,
        rotation: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: Math.random() > 0.35 ? "rect" : "circle",
      });
    }
    partsRef.current = fresh;

    function step() {
      if (!ctx) return;
      ctx.clearRect(0, 0, rect.width, rect.height);
      const parts = partsRef.current;
      let alive = 0;
      for (const p of parts) {
        p.life += 1;
        if (p.life > p.maxLife) continue;
        alive++;
        p.vy += p.g;
        p.vx *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vr;

        const t = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, t));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size / 1.5);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (alive > 0) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        ctx.clearRect(0, 0, rect.width, rect.height);
        rafRef.current = null;
      }
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
