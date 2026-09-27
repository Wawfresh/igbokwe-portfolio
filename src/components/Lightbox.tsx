import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, MapPin, Calendar, Tag } from 'lucide-react';

interface LightboxItem {
  url: string;
  title: string;
  description?: string;
  category?: string;
  location?: string;
  date?: string;
}

interface LightboxProps {
  isOpen: boolean;
  item: LightboxItem | null;
  items?: LightboxItem[];
  currentIndex?: number;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function Lightbox({
  isOpen,
  item,
  items,
  currentIndex = 0,
  onClose,
  onPrev,
  onNext,
}: LightboxProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onPrev, onNext]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-20 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
        aria-label="Close fullscreen view"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Prev button */}
      {items && items.length > 1 && onPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      )}

      {/* Next button */}
      {items && items.length > 1 && onNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          aria-label="Next image"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      )}

      {/* Main container */}
      <div className="max-w-5xl w-full max-h-[92vh] flex flex-col items-center">
        <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-black/40">
          <img
            src={item.url}
            alt={item.title}
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80';
            }}
            className="max-h-[72vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
          />
        </div>

        {/* Metadata info */}
        <div className="w-full text-white mt-4 bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <h3 className="text-lg font-serif-title font-bold text-white">
              {item.title}
            </h3>
            {items && items.length > 1 && (
              <span className="text-xs text-white/60">
                {currentIndex + 1} of {items.length}
              </span>
            )}
          </div>

          {item.description && (
            <p className="text-sm text-white/80 mb-2 leading-relaxed">
              {item.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-white/70">
            {item.category && (
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-[#C8A951]" />
                {item.category}
              </span>
            )}
            {item.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#C8A951]" />
                {item.location}
              </span>
            )}
            {item.date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#C8A951]" />
                {item.date}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
