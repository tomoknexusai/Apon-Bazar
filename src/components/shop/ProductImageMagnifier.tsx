/**
 * TOMSHOPBD — PRODUCT IMAGE MAGNIFIER & GALLERY SYSTEM
 * 
 * Features:
 * - Desktop: Smooth magnifying glass / zoom effect on mouse hover
 *   - Magnifies exact area under mouse pointer
 *   - Follows mouse position smoothly without image distortion
 *   - Fixed container dimensions (aspect-square)
 *   - Subtle transition effects
 * - Mobile / Android:
 *   - Tap opens full-screen Large Image Viewer (Lightbox)
 *   - Pinch-to-zoom, double-tap to zoom, swipe between images
 * - Thumbnails:
 *   - Multi-image thumbnails with active state and smooth switching
 * - Performance:
 *   - Responsive image sizing, lazy loading, asynchronous decoding
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  ZoomIn,
  Sparkles,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import { ProductImageLightbox } from './ProductImageLightbox';

interface ProductImageMagnifierProps {
  images: string[];
  productTitle: string;
  className?: string;
  zoomLevel?: number; // Default 2.2x
  badge?: React.ReactNode;
  aspectRatioClass?: string;
  extraAction?: React.ReactNode;
}

export const ProductImageMagnifier: React.FC<ProductImageMagnifierProps> = ({
  images,
  productTitle,
  className = '',
  zoomLevel = 2.2,
  badge,
  aspectRatioClass = 'aspect-square',
  extraAction
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Safe images fallback
  const validImages = images && images.length > 0
    ? images
    : ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800'];

  const currentImage = validImages[activeIndex] || validImages[0];

  // Mouse Move tracking for exact area magnification
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isTouchDevice) return;
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

      setMousePos({ x, y });
    },
    [isTouchDevice]
  );

  const handleMouseEnter = () => {
    if (!isTouchDevice) {
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setMousePos({ x: 50, y: 50 });
  };

  // Touch start detection to avoid hover conflicts on mobile
  const handleTouchStart = () => {
    setIsTouchDevice(true);
  };

  // Click / Tap opens full-screen lightbox
  const handleClick = () => {
    setIsLightboxOpen(true);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % validImages.length);
  };

  return (
    <div className={`space-y-3 select-none ${className}`}>
      {/* Main Image Container with Magnifier Lens */}
      <div
        ref={containerRef}
        id="tomshopbd-main-image-viewport"
        className={`relative ${aspectRatioClass} w-full rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/80 shadow-xs cursor-zoom-in group`}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        title="ক্লিক করে বড় ফুল-স্ক্রিন ভিউয়ার খুলুন"
      >
        {/* The Scalable High-Quality Product Image */}
        <div className="w-full h-full relative overflow-hidden">
          <img
            src={currentImage}
            alt={productTitle}
            className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-100 ease-out"
            style={{
              transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
              transform: isHovering && !isTouchDevice ? `scale(${zoomLevel})` : 'scale(1)',
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.05))'
            }}
            loading="eager"
            decoding="async"
          />
        </div>

        {/* Optional Custom Badges (e.g. Discount, PV point) */}
        {badge && (
          <div className="absolute top-3 left-3 z-10 pointer-events-none transition-opacity duration-200"
            style={{ opacity: isHovering ? 0.3 : 1 }}
          >
            {badge}
          </div>
        )}

        {/* Optional Extra Action button (e.g. Play Video) */}
        {extraAction && (
          <div
            className="absolute bottom-3 right-3 z-10 transition-opacity duration-200"
            onClick={(e) => e.stopPropagation()}
            style={{ opacity: isHovering ? 0.3 : 1 }}
          >
            {extraAction}
          </div>
        )}

        {/* Left / Right Quick Carousel Arrows (if >1 image) */}
        {validImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-neutral-900/90 hover:bg-white text-neutral-800 dark:text-neutral-200 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all active:scale-95 cursor-pointer border border-neutral-200 dark:border-neutral-700"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-neutral-900/90 hover:bg-white text-neutral-800 dark:text-neutral-200 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all active:scale-95 cursor-pointer border border-neutral-200 dark:border-neutral-700"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Desktop Magnifying Glass Status Indicator Badge */}
        <div
          className="hidden sm:flex absolute bottom-3 left-3 z-10 items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium shadow-md pointer-events-none transition-all duration-200"
          style={{ opacity: isHovering ? 0.9 : 0.7 }}
        >
          {isHovering ? (
            <>
              <ZoomIn className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-emerald-300 font-bold">{Math.round(zoomLevel * 100)}% জুম</span>
              <span className="text-neutral-400 text-[10px] hidden md:inline">• ক্লিক করে ফুলস্ক্রিন</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-neutral-300" />
              <span>হোভার করে ম্যাগনিফাই • ক্লিক করে ফুলস্ক্রিন</span>
            </>
          )}
        </div>

        {/* Mobile Tap Cue Badge */}
        <div className="sm:hidden absolute bottom-3 left-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-medium shadow-md pointer-events-none">
          <Maximize2 className="w-3 h-3 text-emerald-400" />
          <span>ট্যাপ করে ফুল-স্ক্রিন ও জুম করুন</span>
        </div>

        {/* Expand / Fullscreen Button on Top Right */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsLightboxOpen(true);
          }}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-neutral-900/90 hover:bg-emerald-600 hover:text-white text-neutral-700 dark:text-neutral-200 flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer border border-neutral-200 dark:border-neutral-700"
          title="ফুলস্ক্রিন ইমেজ ভিউয়ার খুলুন"
          aria-label="Open Fullscreen Lightbox"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Thumbnails Navigation Row (Below Main Image) */}
      {validImages.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
          {validImages.map((img, idx) => {
            const isActive = activeIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                onMouseEnter={() => {
                  if (!isTouchDevice) setActiveIndex(idx);
                }}
                className={`snap-start w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer bg-neutral-100 dark:bg-neutral-800 ${
                  isActive
                    ? 'border-[#198754] ring-2 ring-emerald-400/40 scale-105 shadow-sm'
                    : 'border-neutral-200 dark:border-neutral-700/80 opacity-70 hover:opacity-100 hover:border-emerald-300'
                }`}
                title={`ছবি ${idx + 1}`}
                aria-label={`View image ${idx + 1}`}
              >
                <img
                  src={img}
                  alt={`${productTitle} thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover pointer-events-none"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* High-Resolution Full-Screen Lightbox Modal */}
      <ProductImageLightbox
        isOpen={isLightboxOpen}
        images={validImages}
        initialIndex={activeIndex}
        productTitle={productTitle}
        onClose={() => setIsLightboxOpen(false)}
      />
    </div>
  );
};
