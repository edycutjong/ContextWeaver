"use client";

import React, { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  z: number;
  r: number;
  vx: number;
  vy: number;
  twinkle: number;
  hue: number;
};

export default function StarField({
  density = 0.00012,
  className = "",
}: {
  density?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pausedRef = useRef<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    let width = 0;
    let height = 0;

    function resize() {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      const count = Math.min(260, Math.max(60, Math.floor(width * height * density)));
      const stars: Star[] = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: Math.random() * 0.8 + 0.2,
          r: Math.random() * 1.4 + 0.2,
          vx: (Math.random() - 0.5) * 0.05,
          vy: (Math.random() - 0.5) * 0.05,
          twinkle: Math.random() * Math.PI * 2,
          hue: Math.random() > 0.75 ? 280 : 190,
        });
      }
      starsRef.current = stars;
    }

    function onMove(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }

    let last = performance.now();
    function frame(now: number) {
      if (pausedRef.current) {
        last = now;
        rafRef.current = requestAnimationFrame(frame);
        return;
      }
      const dt = Math.min(33, now - last) / 16.67;
      last = now;
      ctx.clearRect(0, 0, width, height);

      // Additive blending gives stars a glow halo for free without the
      // per-star shadowBlur that was the hot path.
      ctx.globalCompositeOperation = "lighter";

      const stars = starsRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.twinkle += 0.02 * dt;

        // Gentle parallax drift away from cursor
        if (mx || my) {
          const dx = s.x - mx;
          const dy = s.y - my;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < 14400) {
            const f = (1 - dist2 / 14400) * 0.35 * s.z;
            s.x += (dx / Math.sqrt(dist2 + 0.01)) * f;
            s.y += (dy / Math.sqrt(dist2 + 0.01)) * f;
          }
        }

        // Wrap
        if (s.x < -4) s.x = width + 4;
        if (s.x > width + 4) s.x = -4;
        if (s.y < -4) s.y = height + 4;
        if (s.y > height + 4) s.y = -4;

        const alpha = (0.4 + Math.sin(s.twinkle) * 0.35) * s.z;
        const radius = s.r * s.z;

        // Core dot.
        ctx.beginPath();
        ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, 90%, 75%, ${alpha})`;
        ctx.fill();

        // Halo — larger translucent disc that blooms via additive blending.
        ctx.beginPath();
        ctx.arc(s.x, s.y, radius * 2.6, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, 95%, 65%, ${alpha * 0.18})`;
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      rafRef.current = requestAnimationFrame(frame);
    }

    function onLaunchStart() {
      pausedRef.current = true;
      if (ctx) ctx.clearRect(0, 0, width, height);
    }
    function onLaunchEnd() {
      pausedRef.current = false;
      last = performance.now();
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("contextweaver:launch-start", onLaunchStart);
    window.addEventListener("contextweaver:launch-end", onLaunchEnd);
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("contextweaver:launch-start", onLaunchStart);
      window.removeEventListener("contextweaver:launch-end", onLaunchEnd);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`fixed inset-0 w-full h-full pointer-events-none z-[-1] ${className}`}
    />
  );
}
