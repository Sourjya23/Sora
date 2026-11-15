import { useEffect } from 'react';
import { X } from 'lucide-react';
import { INFO_MODAL_TOPICS } from '../data/soraContent';

interface InfoModalProps {
  topicKey: string | null;
  onClose: () => void;
  onOpenBooking: () => void;
}

export function InfoModal({ topicKey, onClose, onOpenBooking }: InfoModalProps) {
  useEffect(() => {
    if (!topicKey) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [topicKey, onClose]);

  if (!topicKey) return null;
  const content = INFO_MODAL_TOPICS[topicKey];
  if (!content) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-3xl border border-white/15 bg-[hsl(204_82%_11%_/_0.96)] p-7 text-foreground shadow-2xl backdrop-blur-xl sm:p-9"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{content.eyebrow}</p>
            <h2
              id="info-modal-title"
              className="mt-1.5 text-3xl font-normal tracking-tight text-foreground"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              {content.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${content.title}`}
            className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/15 text-foreground transition-colors hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {content.body.map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/12 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenBooking();
            }}
            className="cursor-pointer rounded-full bg-white px-6 py-2.5 text-sm font-medium text-[#0A0A0A] transition-transform duration-200 hover:scale-[1.03]"
          >
            Begin Journey
          </button>
        </div>
      </div>
    </div>
  );
}
