/**
 * TOMSHOPBD — PRODUCT IMAGE LIGHTBOX / LARGE IMAGE VIEWER
 * 
 * Features:
 * - High-resolution full-screen viewing
 * - Pinch-to-zoom on mobile/touch screens
 * - Double-tap to zoom (1x <-> 2.5x)
 * - Mouse drag / touch drag pan when zoomed
 * - Swipe left/right between multiple product images when not zoomed
 * - Zoom controls (+, -, 1:1 Reset)
 * - Navigation buttons (<, >) and thumbnail ribbon
 * - Keyboard shortcuts (Esc to close, Arrow keys for navigation, +/- for zoom)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  Minimize,
  Sparkles
} from 'lucide-react';

interface ProductImageLightboxProps {
  isOpen: boolean;
  images: string[];
  initialIndex?: number;
  productTitle: string;
  onClose: () => void;
}

export const ProductImageLightbox: React.FC<ProductImageLightboxProps> = ({
  isOpen,
  images,
  initialIndex = 0,
  productTitle,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);

  // Multi-touch pinch tracking
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(1);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync initial index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      // Prevent background scrolling while modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialIndex]);

  // Reset zoom & pan when image changes
  const handleIndexChange = useCallback((newIndex: number) => {
    setCurrentIndex(newIndex);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    handleIndexChange((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, handleIndexChange]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    handleIndexChange((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, handleIndexChange]);

  // Keyboard navigation & zoom
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        setScale((prev) => Math.min(prev + 0.5, 4));
      } else if (e.key === '-' || e.key === '_') {
        setScale((prev) => {
          const next = Math.max(prev - 0.5, 1);
          if (next === 1) setPosition({ x: 0, y: 0 });
          return next;
        });
      } else if (e.key === '0') {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  // Zoom controls
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Double tap/click to zoom
  const handleDoubleTap = (clientX: number, clientY: number) => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2.5);
      // Center slightly on tapped point
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const offsetX = (rect.width / 2 - clientX) * 0.8;
        const offsetY = (rect.height / 2 - clientY) * 0.8;
        setPosition({ x: offsetX, y: offsetY });
      }
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.25, 4));
    } else {
      setScale((prev) => {
        const next = Math.max(prev - 0.25, 1);
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Mouse drag / Pan when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      e.preventDefault();
      const maxOffset = (scale - 1) * 350;
      const newX = Math.max(-maxOffset, Math.min(maxOffset, e.clientX - dragStart.x));
      const newY = Math.max(-maxOffset, Math.min(maxOffset, e.clientY - dragStart.y));
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Events (Mobile/Android Pinch, Double Tap, Swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // 2 fingers = Pinch start
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartDistRef.current = dist;
      pinchStartScaleRef.current = scale;
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

      // Double-tap detection
      const now = Date.now();
      if (now - lastTapTime < 300) {
        handleDoubleTap(touch.clientX, touch.clientY);
        setLastTapTime(0);
      } else {
        setLastTapTime(now);
      }

      if (scale > 1) {
        setIsDragging(true);
        setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      // Pinch to Zoom
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / pinchStartDistRef.current;
      const newScale = Math.max(1, Math.min(4, pinchStartScaleRef.current * factor));
      setScale(newScale);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      // Pan zoomed image
      const touch = e.touches[0];
      const maxOffset = (scale - 1) * 350;
      const newX = Math.max(-maxOffset, Math.min(maxOffset, touch.clientX - dragStart.x));
      const newY = Math.max(-maxOffset, Math.min(maxOffset, touch.clientY - dragStart.y));
      setPosition({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    pinchStartDistRef.current = null;
    setIsDragging(false);

    // Swipe detection when scale is 1
    if (scale === 1 && touchStartPosRef.current && e.changedTouches.length === 1) {
      const touchEnd = e.changedTouches[0];
      const diffX = touchEnd.clientX - touchStartPosRef.current.x;
      const diffY = touchEnd.clientY - touchStartPosRef.current.y;

      // Ensure horizontal swipe is dominant and exceeds 50px threshold
      if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        if (diffX < 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }
    touchStartPosRef.current = null;
  };

  if (!isOpen || !images || images.length === 0) return null;

  const currentImageSrc = images[currentIndex] || images[0];

  return (
    <div
      ref={containerRef}
      id="tomshopbd-product-image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Product Image Viewer"
      className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col justify-between select-none touch-none animate-in fade-in duration-200"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Bar / Header */}
      <div className="w-full flex items-center justify-between px-3 sm:px-6 py-3 bg-neutral-950/80 border-b border-neutral-800/80 text-white z-20">
        
        {/* Title & Counter */}
        <div className="flex items-center gap-3 truncate pr-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded-lg text-xs font-bold shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ছবি {currentIndex + 1} / {images.length}</span>
          </div>
          <h3 className="text-xs sm:text-sm font-semibold truncate text-neutral-200">
            {productTitle}
          </h3>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          
          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 4}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 disabled:opacity-40 disabled:hover:bg-neutral-800/80 text-white flex items-center justify-center transition-all cursor-pointer"
            title="Zoom In (+)"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 disabled:opacity-40 disabled:hover:bg-neutral-800/80 text-white flex items-center justify-center transition-all cursor-pointer"
            title="Zoom Out (-)"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Reset Zoom */}
          {scale > 1 && (
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2.5 h-8 sm:h-9 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-emerald-400 flex items-center gap-1 text-xs font-bold transition-all cursor-pointer"
              title="Reset Zoom (0)"
              aria-label="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">রিসেট</span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-white hidden sm:flex items-center justify-center transition-all cursor-pointer"
            title="Toggle Fullscreen"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-600/90 hover:bg-rose-700 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg ml-1"
            title="Close (Esc)"
            aria-label="Close Lightbox"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Display Viewport */}
      <div
        className={`flex-1 relative flex items-center justify-center overflow-hidden p-2 sm:p-6 ${
          scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
        }`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={(e) => handleDoubleTap(e.clientX, e.clientY)}
      >
        {/* Navigation Arrow Previous */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-2 sm:left-6 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-white border border-neutral-700/60 flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Previous Image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Displayed Image */}
        <div
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-100 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center'
          }}
        >
          <img
            src={currentImageSrc}
            alt={`${productTitle} - ${currentIndex + 1}`}
            className="max-h-[72vh] sm:max-h-[76vh] max-w-[92vw] sm:max-w-[85vw] object-contain rounded-lg shadow-2xl pointer-events-none select-none"
            loading="eager"
            decoding="async"
          />
        </div>

        {/* Navigation Arrow Next */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 sm:right-6 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-white border border-neutral-700/60 flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Next Image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Interactive Helper Hint Badge */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[11px] text-neutral-300 pointer-events-none flex items-center gap-1.5 shadow">
          <span>{scale > 1 ? 'ড্র্যাগ করে ঘুরিয়ে দেখুন' : 'ডাবল-ট্যাপ / স্ক্রোল করে জুম করুন'}</span>
          <span className="text-emerald-400 font-bold">({Math.round(scale * 100)}%)</span>
        </div>
      </div>

      {/* Bottom Thumbnail Ribbon */}
      {images.length > 1 && (
        <div className="w-full bg-neutral-950/85 border-t border-neutral-800/80 px-4 py-2 sm:py-3 z-20">
          <div className="max-w-xl mx-auto flex items-center justify-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleIndexChange(idx)}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                  currentIndex === idx
                    ? 'border-emerald-500 scale-105 shadow-md shadow-emerald-500/20'
                    : 'border-neutral-700/60 opacity-60 hover:opacity-100 hover:border-neutral-500'
                }`}
                title={`ছবি ${idx + 1}`}
              >
                <img
                  src={img}
                  alt={`thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
