"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";

type LaunchDetail = {
  href: string;
  originX: number;
  originY: number;
  reducedMotion: boolean;
};

const EVENT = "contextweaver:launch";
const EVENT_START = "contextweaver:launch-start";
const EVENT_END = "contextweaver:launch-end";

export function launchToDashboard(opts: {
  href?: string;
  originX?: number;
  originY?: number;
}) {
  /* istanbul ignore next */
  if (typeof window === "undefined") return;
  const reducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const href = opts.href ?? "/dashboard";
  const cx = Number.isFinite(opts.originX as number) && (opts.originX as number) > 0
    ? (opts.originX as number)
    : window.innerWidth / 2;
  const cy = Number.isFinite(opts.originY as number) && (opts.originY as number) > 0
    ? (opts.originY as number)
    : window.innerHeight / 2;
  window.dispatchEvent(
    new CustomEvent<LaunchDetail>(EVENT, {
      detail: { href, originX: cx, originY: cy, reducedMotion },
    }),
  );
}

type Star = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  length: number;
  hue: number;
  maxAlpha: number;
};

export default function LaunchTransition() {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState<null | LaunchDetail>(null);
  const [phase, setPhase] = useState<"idle" | "warp" | "reveal">("idle");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const starsRef = useRef<Star[]>([]);
  const startTimeRef = useRef<number>(0);
  const router = useRouter();

  // Iris radius driven imperatively so no React re-renders during the reveal.
  const irisR = useMotionValue(0);
  const originX = active?.originX ?? 0;
  const originY = active?.originY ?? 0;
  const reduced = active?.reducedMotion ?? false;
  const maskImage = useMotionTemplate`radial-gradient(circle at ${originX}px ${originY}px, transparent ${irisR}px, black calc(${irisR}px + 1.5px))`;

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const seedStars = useCallback((cx: number, cy: number, width: number, height: number) => {
    const count = Math.min(140, Math.max(70, Math.floor((width * height) / 7200)));
    const stars: Star[] = [];
    const diag = Math.hypot(width, height);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 40 + 4;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      stars.push({
        x,
        y,
        dx,
        dy,
        length: 2 + Math.random() * 3,
        hue: Math.random() > 0.72 ? 280 : 190,
        maxAlpha: 0.55 + (radius / diag) * 0.6,
      });
    }
    starsRef.current = stars;
  }, []);

  const runWarp = useCallback(
    (detail: LaunchDetail) => {
      const canvas = canvasRef.current;
      /* istanbul ignore next */
      if (!canvas) return;
      /* istanbul ignore next */
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      seedStars(detail.originX, detail.originY, width, height);
      startTimeRef.current = performance.now();

      const warpDuration = 0.75;

      const step = (now: number) => {
        const canvasEl = canvasRef.current;
        /* istanbul ignore next */
        if (!canvasEl) return;
        const c2 = canvasEl.getContext("2d");
        /* istanbul ignore next */
        if (!c2) return;

        const t = (now - startTimeRef.current) / 1000;
        const progress = Math.min(1, t / warpDuration);
        const accel = progress * progress * 28 + progress * 2.4;

        // Fade previous frame; then switch to additive blending so overlapping
        // streaks bloom without expensive shadowBlur calls.
        c2.globalCompositeOperation = "source-over";
        c2.fillStyle = "rgba(2, 6, 23, 0.18)";
        c2.fillRect(0, 0, width, height);

        c2.globalCompositeOperation = "lighter";
        c2.lineCap = "round";
        c2.lineWidth = 1.2 + progress * 1.8;

        const stars = starsRef.current;
        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          const speed = accel + s.length * 0.7;
          s.x += s.dx * speed;
          s.y += s.dy * speed;

          const tailX = s.x - s.dx * speed * s.length;
          const tailY = s.y - s.dy * speed * s.length;

          const grad = c2.createLinearGradient(tailX, tailY, s.x, s.y);
          grad.addColorStop(0, `hsla(${s.hue}, 95%, 70%, 0)`);
          grad.addColorStop(1, `hsla(${s.hue}, 95%, 78%, ${s.maxAlpha})`);
          c2.strokeStyle = grad;
          c2.beginPath();
          c2.moveTo(tailX, tailY);
          c2.lineTo(s.x, s.y);
          c2.stroke();
        }

        c2.globalCompositeOperation = "source-over";

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          rafRef.current = null;
        }
      };

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(step);
    },
    [seedStars],
  );

  useEffect(() => {
    function onLaunch(e: Event) {
      const ev = e as CustomEvent<LaunchDetail>;
      if (!ev.detail) return;
      if (active) return;
      setActive(ev.detail);
      window.dispatchEvent(new CustomEvent(EVENT_START));
    }
    window.addEventListener(EVENT, onLaunch as EventListener);
    return () => window.removeEventListener(EVENT, onLaunch as EventListener);
  }, [active]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!active) return;

    irisR.set(0);

    const maxR = Math.hypot(
      Math.max(active.originX, window.innerWidth - active.originX),
      Math.max(active.originY, window.innerHeight - active.originY),
    ) * 1.12;

    if (active.reducedMotion) {
      setPhase("warp");
      const navT = window.setTimeout(() => router.push(active.href), 80);
      const revealT = window.setTimeout(() => {
        setPhase("reveal");
        animate(irisR, maxR, { duration: 0.22, ease: [0.6, 0, 0.2, 1] });
      }, 180);
      const endT = window.setTimeout(() => {
        setActive(null);
        setPhase("idle");
        window.dispatchEvent(new CustomEvent(EVENT_END));
      }, 440);
      return () => {
        window.clearTimeout(navT);
        window.clearTimeout(revealT);
        window.clearTimeout(endT);
      };
    }

    setPhase("warp");
    runWarp(active);
    const navT = window.setTimeout(() => router.push(active.href), 180);
    const revealT = window.setTimeout(() => {
      setPhase("reveal");
      animate(irisR, maxR, { duration: 0.42, ease: [0.6, 0, 0.2, 1] });
    }, 650);
    const endT = window.setTimeout(() => {
      /* istanbul ignore next */
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setActive(null);
      setPhase("idle");
      window.dispatchEvent(new CustomEvent(EVENT_END));
    }, 1100);
    return () => {
      window.clearTimeout(navT);
      window.clearTimeout(revealT);
      window.clearTimeout(endT);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, router, runWarp, irisR]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!mounted) return null;

  const showOverlay = active !== null;

  return createPortal(
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          key="launch-overlay"
          role="presentation"
          aria-hidden
          className="fixed inset-0 z-100000 pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{ willChange: "opacity" }}
        >
          {/* Slate iris — opaque over the whole viewport, with a hole around
              the click origin that grows during the reveal phase. */}
          <motion.div
            className="absolute inset-0 bg-[#020617]"
            style={{
              maskImage,
              WebkitMaskImage: maskImage,
              maskMode: "alpha",
              willChange: "mask-image",
            }}
          />

          {/* Warp canvas — rides on top of the iris, so streaks are visible in
              the slate region and fade out as the dashboard is revealed. */}
          {!reduced && (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 1 }}
              animate={{ opacity: phase === "reveal" ? 0 : 1 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              style={{ willChange: "opacity" }}
            >
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ width: "100%", height: "100%", willChange: "transform" }}
              />
            </motion.div>
          )}

          {/* Single focal bloom from click origin. */}
          {!reduced && (
            <motion.div
              className="absolute rounded-full"
              style={{
                left: originX,
                top: originY,
                width: 14,
                height: 14,
                translateX: "-50%",
                translateY: "-50%",
                background:
                  "radial-gradient(circle, rgba(165,243,252,0.95) 0%, rgba(34,211,238,0.55) 35%, rgba(6,182,212,0) 70%)",
                filter: "blur(1px)",
                willChange: "transform, opacity",
              }}
              initial={{ scale: 0, opacity: 0.95 }}
              animate={{ scale: 200, opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
            />
          )}

          {/* Cyan aperture ring — tracks the iris edge so the reveal reads as
              a camera aperture opening. Scale is GPU-accelerated. */}
          {!reduced && phase === "reveal" && (
            <motion.div
              className="absolute rounded-full"
              style={{
                left: originX,
                top: originY,
                width: 16,
                height: 16,
                marginLeft: -8,
                marginTop: -8,
                border: "2px solid rgba(34,211,238,0.55)",
                boxShadow:
                  "0 0 24px rgba(34,211,238,0.35), inset 0 0 24px rgba(34,211,238,0.22)",
                willChange: "transform, opacity",
              }}
              initial={{ scale: 1, opacity: 0.95 }}
              animate={{
                scale: Math.max(40, Math.hypot(
                  Math.max(originX, window.innerWidth - originX),
                  Math.max(originY, window.innerHeight - originY),
                ) / 8),
                opacity: 0,
              }}
              transition={{ duration: 0.45, ease: [0.6, 0, 0.2, 1] }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
