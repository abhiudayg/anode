"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";

export function MainOrangeArrow() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Global page scroll tracking
  const { scrollYProgress } = useScroll();

  // Physics-based spring for fluid organic deceleration/acceleration on scroll
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 32,
    restDelta: 0.0005,
  });

  // Track height fill
  const lineHeight = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

  // Arrow vertical position along the conduit
  const arrowTop = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-y-0 left-0 right-0 pointer-events-none z-20 overflow-hidden select-none"
    >
      <div className="max-w-7xl mx-auto h-full relative px-4 sm:px-6 lg:px-8">
        {/* Continuous Orange Thread Conduit */}
        <div className="absolute top-36 bottom-24 left-1.5 sm:left-2.5 lg:left-3 xl:-left-6 2xl:-left-10 w-[2px]">
          
          {/* Top Source Knot (Hero Origin) */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border border-[#ff531a]/40 bg-[#0a0a0c] flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-[#ff7a4a] shadow-[0_0_8px_#ff531a]" />
            </div>
            {/* Ambient Source Glow */}
            <div className="absolute w-16 h-16 rounded-full bg-[#ff531a]/15 blur-md -z-10" />
          </div>

          {/* Background Static Guide Track */}
          <div className="absolute inset-0 w-[2px] bg-gradient-to-b from-[#ff531a]/20 via-white/[0.06] to-[#ff531a]/25 rounded-full" />

          {/* Active Glowing High-Energy Orange Thread */}
          <motion.div
            style={{ height: lineHeight }}
            className="absolute top-0 left-0 w-full overflow-visible"
          >
            {/* Multi-Tier Optical Glow 1: Wide Ambient Halo */}
            <div className="absolute top-0 -left-[7px] w-[16px] h-full bg-[#ff531a] opacity-20 blur-[8px] rounded-full" />

            {/* Multi-Tier Optical Glow 2: Mid Focused Halo */}
            <div className="absolute top-0 -left-[2px] w-[6px] h-full bg-[#ff531a] opacity-60 blur-[3px] rounded-full" />

            {/* Multi-Tier Optical Glow 3: Sharp Laser Core */}
            <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-[#ffd9c7] via-[#ff7a4a] to-[#ff531a] shadow-[0_0_10px_#ff531a]" />

            {/* Periodic Energy Pulse Tracer */}
            <motion.div
              className="absolute left-0 w-full h-24 bg-gradient-to-b from-transparent via-white to-transparent shadow-[0_0_12px_#ffffff]"
              animate={{ y: ["-10%", "110%"] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
            />
          </motion.div>

          {/* Main Orange Arrow Runner (Leading the Scroll) */}
          <motion.div
            style={{ top: arrowTop }}
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
          >
            {/* 240px Ambient Radial Glow Aura */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-60 sm:h-60 rounded-full pointer-events-none -z-10"
              style={{
                background:
                  "radial-gradient(circle, rgba(255, 83, 26, 0.42) 0%, rgba(255, 83, 26, 0.12) 45%, rgba(255, 83, 26, 0) 70%)",
              }}
            />

            {/* Main Orange Arrow Badge */}
            <div className="relative group flex items-center justify-center">
              {/* Outer Energy Pulse Ring */}
              <div className="absolute -inset-1 rounded-full bg-[#ff531a]/40 blur-sm animate-pulse" />

              {/* The Orange Arrow Head */}
              <div
                className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-[#ff8c5a] via-[#ff6a3a] to-[#ff4500] border border-[#ffd9c7]/80 flex items-center justify-center"
                style={{
                  boxShadow:
                    "0 0 16px 5px rgba(255, 83, 26, 0.85), 0 0 32px 10px rgba(255, 83, 26, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.6)",
                }}
              >
                {/* Crisp Downward Arrow Icon */}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] -translate-y-[0.5px]"
                >
                  <path
                    d="M12 4v16m0 0l-5.5-5.5M12 20l5.5-5.5"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Bottom Destination Terminal Node (Footer Land) */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border border-[#ff531a]/50 bg-[#0a0a0c] flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff7a4a] shadow-[0_0_10px_#ff531a]" />
            </div>
            {/* Ambient Signoff Glow */}
            <div className="absolute w-20 h-20 rounded-full bg-[#ff531a]/20 blur-lg -z-10" />
          </div>

        </div>
      </div>
    </div>
  );
}
