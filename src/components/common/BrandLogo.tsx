/**
 * Official Brand Logo Component for Apon Bazar (আপন বাজার)
 * Incorporates the official brand insignia:
 * - Green dynamic shopping cart with speed lines & eco leaf "A" icon
 * - Dual-tone "Apon Bazar" typography (Green + Orange)
 * - Optional Bengali motto: "— আপনার প্রয়োজন, আমাদের প্রতিশ্রুতি —"
 */

import React, { useState } from 'react';

export interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
  iconOnly?: boolean;
  className?: string;
  onClick?: () => void;
  alt?: string;
}

const sizeMap = {
  xs: { imgSize: 'h-6 w-6', fullImgSize: 'h-7', textTitle: 'text-xs', taglineText: 'text-[8px]' },
  sm: { imgSize: 'h-8 w-8', fullImgSize: 'h-9', textTitle: 'text-sm sm:text-base', taglineText: 'text-[9px]' },
  md: { imgSize: 'h-10 w-10 sm:h-11 sm:w-11', fullImgSize: 'h-11 sm:h-12', textTitle: 'text-base sm:text-lg', taglineText: 'text-[10px] sm:text-[11px]' },
  lg: { imgSize: 'h-14 w-14 sm:h-16 sm:w-16', fullImgSize: 'h-16 sm:h-20', textTitle: 'text-xl sm:text-2xl', taglineText: 'text-xs sm:text-sm' },
  xl: { imgSize: 'h-20 w-20 sm:h-24 sm:w-24', fullImgSize: 'h-24 sm:h-28', textTitle: 'text-2xl sm:text-3xl', taglineText: 'text-sm sm:text-base' },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = false,
  iconOnly = false,
  className = '',
  onClick,
  alt = 'Apon Bazar - আপন বাজার'
}) => {
  const [imgError, setImgError] = useState(false);
  const dimensions = sizeMap[size] || sizeMap.md;

  // Render official full image if text & logo are combined
  if (!iconOnly && showTagline) {
    return (
      <div
        onClick={onClick}
        className={`flex flex-col items-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
        title="Apon Bazar - আপনার প্রয়োজন, আমাদের প্রতিশ্রুতি"
      >
        <img
          src="/apon-bazar-logo.png"
          alt={alt}
          referrerPolicy="no-referrer"
          className={`${dimensions.fullImgSize} w-auto object-contain rounded-lg`}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 select-none ${onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''} ${className}`}
      title="Apon Bazar (আপন বাজার)"
    >
      {/* Visual Icon / Cart + Leaf Symbol */}
      <div className={`relative shrink-0 flex items-center justify-center ${dimensions.imgSize}`}>
        {!imgError ? (
          <img
            src="/apon-bazar-logo.png"
            alt={alt}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain drop-shadow-2xs"
            onError={() => setImgError(true)}
          />
        ) : (
          /* High-Fidelity SVG Fallback Vector matching brand */
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Speed Lines */}
            <path d="M8 32H26M14 42H28M8 52H24" stroke="#16a34a" strokeWidth="4.5" strokeLinecap="round" />
            {/* Cart Frame */}
            <path
              d="M26 26H35L42 56H72L80 32H38"
              stroke="#16a34a"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* 'A' Orange bar */}
            <path d="M46 54L55 24" stroke="#ea580c" strokeWidth="6" strokeLinecap="round" />
            {/* 'A' Leaf right branch */}
            <path
              d="M55 24C65 24 76 34 76 46C76 54 68 56 60 56C54 56 48 50 48 42C55 42 66 40 70 34"
              fill="#22c55e"
              stroke="#16a34a"
              strokeWidth="1.5"
            />
            {/* Wheels */}
            <circle cx="45" cy="67" r="5.5" fill="#16a34a" />
            <circle cx="69" cy="67" r="5.5" fill="#16a34a" />
            {/* Ground arc */}
            <path d="M30 76C45 74 65 74 84 76" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {/* Brand Name Typography */}
      {showText && !iconOnly && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-1">
            <span className={`font-black tracking-tight ${dimensions.textTitle}`}>
              <span className="text-emerald-700 dark:text-emerald-400">Apon</span>
              <span className="text-orange-500 dark:text-orange-400 ml-1">Bazar</span>
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-neutral-600 dark:text-neutral-400 hidden sm:inline">
              (আপন বাজার)
            </span>
          </div>

          {showTagline && (
            <p className={`font-medium text-emerald-800 dark:text-emerald-300 mt-0.5 tracking-tight ${dimensions.taglineText}`}>
              — আপনার প্রয়োজন, আমাদের প্রতিশ্রুতি —
            </p>
          )}
        </div>
      )}
    </div>
  );
};
