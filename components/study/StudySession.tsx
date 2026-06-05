'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/types';
import { Rating, calculateNextReview, getNextReviewText } from '@/lib/srs';
import { updateCard, createReview } from '@/lib/database';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Eye } from 'lucide-react';
import { getDeckColors } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface StudySessionProps {
  cards: Card[];
  deckId: string;
  deckName: string;
  deckColor: string;
  userId: string;
  onComplete: () => void;
}

const RATING_CONFIG = [
  { rating: 1 as Rating, label: 'Muy difícil', sub: 'hoy', color: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 active:bg-red-200 dark:bg-red-950 dark:border-red-800 dark:text-red-400' },
  { rating: 2 as Rating, label: 'Difícil',     sub: '~1d',  color: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 active:bg-orange-200 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-400' },
  { rating: 3 as Rating, label: 'Fácil',       sub: '~4d',  color: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 active:bg-green-200 dark:bg-green-950 dark:border-green-800 dark:text-green-400' },
  { rating: 4 as Rating, label: 'Muy fácil',   sub: '~10d', color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 active:bg-blue-200 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-400' },
];

export function StudySession({ cards, deckId, deckName, deckColor, userId, onComplete }: StudySessionProps) {
  const [queue, setQueue] = useState<Card[]>([...cards]);
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [transitioning, setTransitioning] = useState(false);
  const router = useRouter();
  const colors = getDeckColors(deckColor);

  const total = queue.length;
  const card = queue[current];
  const progress = Math.round((done / total) * 100);

  const reveal = () => { if (!revealed) setRevealed(true); };

  const handleRating = useCallback(async (rating: Rating) => {
    if (!card || transitioning) return;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const srs = calculateNextReview(rating, card.interval, card.easeFactor, card.repetitions);

    await updateCard(card.$id, {
      interval: srs.interval,
      easeFactor: srs.easeFactor,
      repetitions: srs.repetitions,
      nextReview: srs.nextReview.toISOString(),
      difficulty: rating <= 2 ? Math.min(3, (card.difficulty || 0) + 1) : Math.max(0, (card.difficulty || 0) - 1),
    });

    await createReview(userId, {
      userId, cardId: card.$id, deckId,
      rating, timeSpent,
      reviewedAt: new Date().toISOString(),
    });

    setTransitioning(true);
    setTimeout(() => {
      if (rating === 1) {
        const newQueue = [...queue];
        const c = newQueue.splice(current, 1)[0];
        newQueue.splice(Math.min(current + 3, newQueue.length), 0, c);
        setQueue(newQueue);
      } else {
        const newDone = done + 1;
        setDone(newDone);
        if (newDone >= total || current + 1 >= queue.length) { onComplete(); return; }
        setCurrent(c => c + 1);
      }
      setRevealed(false);
      setStartTime(Date.now());
      setTransitioning(false);
    }, 280);
  }, [card, current, done, total, queue, deckId, userId, startTime, transitioning, onComplete]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!revealed) { if (e.code === 'Space') { e.preventDefault(); reveal(); } return; }
      const map: Record<string, Rating> = { '1': 1, '2': 2, '3': 3, '4': 4 };
      if (map[e.key]) handleRating(map[e.key]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [revealed, handleRating]);

  if (!card) return null;

  return (
    <div className="min-h-screen bg-[--background] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 border-b border-[--border] bg-[--card-bg]">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-[--accent] text-[--muted] transition-colors shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[--muted] truncate mb-1">{deckName}</p>
          <div className="flex items-center gap-2.5">
            <div className="flex-1 h-2 bg-[--accent] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: deckColor }} />
            </div>
            <span className="text-xs text-[--muted] tabular-nums shrink-0">{done}/{total}</span>
          </div>
        </div>
      </div>

      {/* Card area — grows to fill available space */}
      <div className="flex-1 flex flex-col px-4 py-6 sm:px-6 sm:py-8 max-w-2xl mx-auto w-full">

        {/* The flashcard */}
        <div
          className={`flex-1 flex flex-col rounded-2xl border-2 p-6 sm:p-8 mb-5 cursor-pointer
            transition-all duration-280 select-none
            ${transitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
            ${!revealed ? 'active:scale-[0.98]' : ''}`}
          style={revealed
            ? { backgroundColor: '#f0fdf4', borderColor: '#86efac' }
            : { backgroundColor: colors.bg, borderColor: colors.border }
          }
          onClick={reveal}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: revealed ? '#16a34a' : colors.text, opacity: 0.55 }}>
            {revealed ? 'Respuesta' : 'Pregunta'}
          </p>

          <div className="flex-1 flex items-center justify-center">
            <p className="text-lg sm:text-xl font-medium leading-relaxed text-center"
              style={{ color: revealed ? '#14532d' : colors.text }}>
              {revealed ? card.answer : card.question}
            </p>
          </div>

          {!revealed && (
            <p className="text-center mt-4 text-xs flex items-center justify-center gap-1.5"
              style={{ color: colors.text, opacity: 0.45 }}>
              <Eye size={12} />
              Toca para revelar
              <span className="hidden sm:inline ml-1 opacity-70">· Espacio</span>
            </p>
          )}
        </div>

        {/* Action area */}
        {revealed ? (
          <div>
            <p className="text-xs text-center text-[--muted] mb-3">
              ¿Cómo lo recordaste?
              <span className="hidden sm:inline opacity-60 ml-1">(teclas 1–4)</span>
            </p>
            {/* 2×2 on mobile, 4 in a row on sm+ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {RATING_CONFIG.map(({ rating, label, sub, color }) => (
                <button
                  key={rating}
                  onClick={() => handleRating(rating)}
                  className={`flex flex-col items-center py-3.5 sm:py-3 px-2 rounded-xl border text-center
                    transition-all active:scale-95 ${color}`}
                >
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-xs opacity-65 mt-0.5">
                    {getNextReviewText(rating, card.interval, card.easeFactor, card.repetitions)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <Button size="lg" onClick={reveal} className="w-full sm:w-auto sm:mx-auto sm:px-10">
            <Eye size={16} /> Mostrar respuesta
          </Button>
        )}

        {/* Tags */}
        {card.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5 justify-center">
            {card.tags.map(t => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-[--accent] text-[--muted] text-xs">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
