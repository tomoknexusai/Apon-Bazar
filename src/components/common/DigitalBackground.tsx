/**
 * DigitalBackground Component
 * Smart, colorful, digital, modern, lightweight background for Apon Bazar.
 * Features:
 * - Subtle multi-color radial gradients (Cyan, Indigo, Purple, Emerald, Pink)
 * - Micro digital grid / dot matrix overlay
 * - Abstract digital floating waves
 * - Hardware-accelerated, lightweight, zero performance impact on mobile devices
 */

import React, { memo } from 'react';

interface DigitalBackgroundProps {
  variant?: 'storefront' | 'dashboard' | 'hero' | 'minimal';
  className?: string;
}

export const DigitalBackground: React.FC<DigitalBackgroundProps> = memo(({
  variant = 'storefront',
  className = ''
}) => {
  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden -z-10 select-none ${className}`}
      aria-hidden="true"
    >
      {/* 1. Base Multi-Color Ambient Glow Blobs (Soft, diffused, 0 lag) */}
      <div className="absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] rounded-full bg-emerald-400/10 dark:bg-emerald-500/5 blur-[80px] sm:blur-[120px] will-change-transform transform-gpu animate-subtle-pulse" />
      <div className="absolute top-[5%] right-[-5%] w-[40vw] h-[40vw] max-w-[550px] max-h-[550px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/5 blur-[80px] sm:blur-[120px] will-change-transform transform-gpu" />
      <div className="absolute top-[40%] left-[10%] w-[35vw] h-[35vw] max-w-[500px] max-h-[500px] rounded-full bg-cyan-400/8 dark:bg-cyan-500/4 blur-[70px] sm:blur-[100px] will-change-transform transform-gpu" />
      <div className="absolute top-[65%] right-[5%] w-[42vw] h-[42vw] max-w-[550px] max-h-[550px] rounded-full bg-purple-500/8 dark:bg-purple-600/4 blur-[80px] sm:blur-[120px] will-change-transform transform-gpu" />
      <div className="absolute bottom-[-10%] left-[25%] w-[50vw] h-[40vw] max-w-[650px] max-h-[550px] rounded-full bg-pink-400/6 dark:bg-pink-500/3 blur-[90px] sm:blur-[130px] will-change-transform transform-gpu" />

      {/* 2. Micro Digital Geometric Grid Pattern (Subtle AI / Tech mesh) */}
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.20]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(100, 116, 139, 0.22) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* 3. Subtle Digital Wave Lines (Lightweight SVG curves for modern AI feel) */}
      {variant !== 'minimal' && (
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.12] dark:opacity-[0.06]"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1440 900"
        >
          <defs>
            <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#6366f1" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="waveGradient2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <path
            d="M-100,300 C300,150 600,450 1000,200 C1250,50 1400,280 1600,220"
            fill="none"
            stroke="url(#waveGradient1)"
            strokeWidth="1.5"
            strokeDasharray="6 8"
          />
          <path
            d="M-50,600 C250,450 650,750 1100,500 C1300,400 1450,550 1600,480"
            fill="none"
            stroke="url(#waveGradient2)"
            strokeWidth="1"
          />
        </svg>
      )}

      {/* 4. Fine Digital Tech Particles (CSS-rendered, 0 CPU overhead) */}
      <div className="hidden sm:block absolute top-[15%] left-[20%] w-1.5 h-1.5 rounded-full bg-cyan-400/40 shadow-xs" />
      <div className="hidden sm:block absolute top-[28%] right-[25%] w-2 h-2 rounded-full bg-purple-400/30 shadow-xs" />
      <div className="hidden sm:block absolute top-[55%] left-[12%] w-1 h-1 rounded-full bg-emerald-400/50" />
      <div className="hidden sm:block absolute top-[72%] right-[18%] w-1.5 h-1.5 rounded-full bg-pink-400/40" />
      <div className="hidden sm:block absolute top-[85%] left-[45%] w-1.5 h-1.5 rounded-full bg-indigo-400/40" />
    </div>
  );
});

DigitalBackground.displayName = 'DigitalBackground';
