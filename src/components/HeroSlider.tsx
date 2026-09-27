import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Pause,
  Play,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { HeroSlide } from '../types';
import { useApp } from '../context/AppContext';

interface HeroSliderProps {
  slides?: HeroSlide[];
  onOpenLightbox?: (item: any) => void;
  onNavigate?: (path: string) => void;
}

const DEFAULT_FALLBACK_IMAGES: Record<string, string> = {
  slide_01: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
  slide_02: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80',
  slide_03: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80',
  slide_04: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
  slide_05: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80',
  slide_06: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
  slide_07: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
  slide_08: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
};

export default function HeroSlider({ slides = [], onOpenLightbox, onNavigate }: HeroSliderProps) {
  const { currentUser } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // If slides array is empty, provide fallback
  const activeSlides = slides && slides.length > 0 ? slides : [];

  const handleNext = useCallback(() => {
    if (activeSlides.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  }, [activeSlides.length]);

  const handlePrev = useCallback(() => {
    if (activeSlides.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  }, [activeSlides.length]);

  // Autoplay timer
  useEffect(() => {
    if (!isPlaying || activeSlides.length <= 1) return;
    autoPlayRef.current = setInterval(() => {
      handleNext();
    }, 4500);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isPlaying, handleNext, activeSlides.length]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) handleNext();
    if (isRightSwipe) handlePrev();
  };

  if (activeSlides.length === 0) {
    return null;
  }

  const currentSlide = activeSlides[currentIndex] || activeSlides[0];

  return (
    <div
      className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#05281A] text-white shadow-2xl border border-emerald-900/60 group"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Hon. Raphael Nnanna Igbokwe Leadership Gallery"
    >
      {/* Background Ambience Glow */}
      <div className="absolute inset-0 bg-radial from-emerald-600/10 via-transparent to-black/80 pointer-events-none" />

      {/* Main Slide Presentation Stage */}
      <div className="relative aspect-[16/9] sm:aspect-[21/9] min-h-[360px] sm:min-h-[460px] w-full overflow-hidden flex items-end">
        {/* Slide Images (Stacked for smooth crossfade transitions) */}
        {activeSlides.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={slide.id || idx}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                isActive
                  ? 'opacity-100 scale-100 z-10'
                  : 'opacity-0 scale-105 z-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.imageUrl}
                alt={slide.title}
                onError={(e) => {
                  const fallback =
                    DEFAULT_FALLBACK_IMAGES[slide.id] ||
                    DEFAULT_FALLBACK_IMAGES[`slide_0${(idx % 8) + 1}`] ||
                    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80';
                  if (e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
                className="w-full h-full object-cover object-center filter brightness-[0.92] contrast-[1.05]"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
              {/* Cinematic Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#041E13] via-[#041E13]/55 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#041E13]/70 via-transparent to-[#041E13]/40" />
            </div>
          );
        })}

        {/* Top Floating Badge Bar */}
        <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-8 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#063B27]/85 backdrop-blur-md border border-[#C8A951]/40 text-[#C8A951] text-[11px] font-bold uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3 h-3 text-[#C8A951]" />
              <span>Leadership in Action</span>
            </span>

            {currentSlide.tag && (
              <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-[11px] font-medium tracking-wide">
                {currentSlide.tag}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Admin Direct Quick Edit Link */}
            {currentUser && onNavigate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('/admin');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0B5D3B]/90 hover:bg-[#063B27] backdrop-blur-md text-emerald-100 text-[11px] font-bold transition-colors cursor-pointer border border-emerald-400/30"
                title="Edit these 8 slides in Admin CMS"
              >
                <Edit3 className="w-3 h-3 text-[#C8A951]" />
                <span className="hidden md:inline">Edit Slides in Admin</span>
              </button>
            )}

            {/* Slide Counter */}
            <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white font-mono text-xs font-semibold">
              {String(currentIndex + 1).padStart(2, '0')}&nbsp;/&nbsp;{String(activeSlides.length).padStart(2, '0')}
            </div>

            {/* Lightbox zoom button */}
            {onOpenLightbox && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLightbox({
                    imageUrl: currentSlide.imageUrl,
                    title: currentSlide.title,
                    description: currentSlide.caption,
                    category: currentSlide.tag || 'Hon. Igbokwe Leadership',
                  });
                }}
                className="p-1.5 sm:p-2 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/10 text-white transition-all cursor-pointer"
                title="View Full Resolution"
              >
                <Maximize2 className="w-4 h-4 text-emerald-300" />
              </button>
            )}

            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 sm:p-2 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/10 text-white transition-all cursor-pointer"
              title={isPlaying ? 'Pause Auto-slide' : 'Play Auto-slide'}
            >
              {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Previous / Next Arrow Controls */}
        <button
          onClick={handlePrev}
          aria-label="Previous leadership slide"
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-[#0B5D3B] backdrop-blur-md border border-white/20 hover:border-emerald-300 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-105"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={handleNext}
          aria-label="Next leadership slide"
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-[#0B5D3B] backdrop-blur-md border border-white/20 hover:border-emerald-300 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-105"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Slide Content Caption Overlay */}
        <div className="relative z-20 w-full p-5 sm:p-8 lg:p-10 max-w-4xl space-y-2">
          {currentSlide.tag && (
            <span className="sm:hidden inline-block text-[10px] font-bold text-[#C8A951] uppercase tracking-wider mb-1">
              {currentSlide.tag}
            </span>
          )}

          <h3 className="text-xl sm:text-2xl lg:text-3xl font-serif-title font-bold text-white tracking-tight drop-shadow-md line-clamp-2">
            {currentSlide.title}
          </h3>

          {currentSlide.caption && (
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-2xl drop-shadow line-clamp-2 sm:line-clamp-3">
              {currentSlide.caption}
            </p>
          )}

          {/* Progress / Pagination Pill Indicators */}
          <div className="pt-3 flex items-center gap-2">
            {activeSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Jump to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  i === currentIndex
                    ? 'w-8 bg-[#C8A951]'
                    : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mini Thumbnail Ribbon (Clickable 8-slide strip on tablet/desktop) */}
      <div className="hidden md:flex items-center gap-2 p-3 bg-[#03170F] border-t border-emerald-950/80 overflow-x-auto scrollbar-none">
        {activeSlides.map((slide, idx) => {
          const isSelected = idx === currentIndex;
          return (
            <button
              key={slide.id || idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative flex-1 min-w-[100px] h-14 rounded-lg overflow-hidden transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-[#C8A951] scale-[1.02] opacity-100 shadow-md'
                  : 'opacity-50 hover:opacity-80'
              }`}
            >
              <img
                src={slide.imageUrl}
                alt={slide.title}
                onError={(e) => {
                  const fallback =
                    DEFAULT_FALLBACK_IMAGES[slide.id] ||
                    DEFAULT_FALLBACK_IMAGES[`slide_0${(idx % 8) + 1}`] ||
                    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80';
                  if (e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute bottom-1 inset-x-1 text-[9px] font-semibold text-white truncate text-left px-1">
                {slide.title}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
