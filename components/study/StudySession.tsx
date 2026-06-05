'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/types';
import { Rating, calculateNextReview, getNextReviewText } from '@/lib/srs';
import { updateCard, createReview } from '@/lib/database';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, RotateCcw, Eye } from 'lucide-react';
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
  { rating: 1 as Rating, label: 'Muy difícil', sub: 'repetir hoy', color: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:border-red-800 dark:text-red-400' },
  { rating: 2 as Rating, label: 'Difícil', sub: '~1 día', color: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-400' },
  { rating: 3 as Rating, label: 'Fácil', sub: '~4 días', color: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:border-green-800 dark:text-green-400' },
  { rating: 4 as Rating, label: 'Muy fácil', sub: '~10 días', color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-400' },
];

export function StudySession({ cards, deckId, deckName, deckColor, userId, onComplete }: StudySessionProps) {
  const [queue, setQueue] = useState<Card[]>([...cards]);
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [flipping, setFlipping] = useState(false);
  const router = useRouter();
  const colors = getDeckColors(deckColor);

  const total = queue.length;
  const card = queue[current];
  const progress = Math.round((done / total) * 100);

  const reveal = () => {
    if (!revealed) setRevealed(true);
  };

  const handleRating = useCallback(async (rating: Rating) => {
    if (!card) return;
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
      userId,
      cardId: card.$id,
      deckId,
      rating,
      timeSpent,
      reviewedAt: new Date().toISOString(),
    });

    setFlipping(true);
    setTimeout(() => {
      if (rating === 1) {
        const newQueue = [...queue];
        const c = newQueue.splice(current, 1)[0];
        const insertAt = Math.min(current + 3, newQueue.length);
        newQueue.splice(insertAt, 0, c);
        setQueue(newQueue);
      } else {
        setDone(d => d + 1);
        if (current + 1 >= queue.length || (done + 1 >= total)) {
          onComplete();
          return;
        }
        setCurrent(c => c + 1);
      }
      setRevealed(false);
      setStartTime(Date.now());
      setFlipping(false);
    }, 300);
  }, [card, current, done, total, queue, deckId, userId, startTime, onComplete]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!revealed) { if (e.code === 'Space') { e.preventDefault(); reveal(); } return; }
      if (e.key === '1') handleRating(1);
      else if (e.key === '2') handleRating(2);
      else if (e.key === '3') handleRating(3);
      else if (e.key === '4') handleRating(4);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [revealed, handleRating]);

  if (!card) return null;

  return (
    <div className="min-h-screen bg-[--background] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-4 border-b border-[--border] bg-[--card-bg]">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-[--accent] text-[--muted] transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <p className="text-xs text-[--muted] mb-1">{deckName}</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-[--accent] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: deckColor }} />
            </div>
            <span className="text-xs text-[--muted] tabular-nums">{done}/{total}</span>
          </div>
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-2xl mx-auto w-full">
        <div
          className={`w-full rounded-2xl border-2 p-8 mb-6 cursor-pointer transition-all duration-300 ${flipping ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} ${revealed ? '' : 'hover:shadow-lg'}`}
          style={revealed
            ? { backgroundColor: '#f0fdf4', borderColor: '#86efac' }
            : { backgroundColor: colors.bg, borderColor: colors.border, transform: `rotate(${Math.random() > 0.5 ? -0.5 : 0.5}deg)` }
          }
          onClick={reveal}
        >
          <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: revealed ? '#16a34a' : colors.text, opacity: 0.6 }}>
            {revealed ? 'Respuesta' : 'Pregunta'}
          </p>
          <p className="text-xl font-medium leading-relaxed text-center" style={{ color: revealed ? '#14532d' : colors.text }}>
            {revealed ? card.answer : card.question}
          </p>
          {!revealed && (
            <p className="text-center mt-6 text-xs" style={{ color: colors.text, opacity: 0.5 }}>
              <Eye size={12} className="inline mr-1" /> Haz clic para revelar · Espacio
            </p>
          )}
        </div>

        {/* Rating buttons */}
        {revealed ? (
          <div className="w-full">
            <p className="text-xs text-center text-[--muted] mb-3">¿Cómo lo recordaste? <span className="opacity-50">(1-4)</span></p>
            <div className="grid grid-cols-4 gap-2">
              {RATING_CONFIG.map(({ rating, label, sub, color }) => (
                <button
                  key={rating}
                  onClick={() => handleRating(rating)}
                  className={`flex flex-col items-center py-3 px-2 rounded-xl border text-center transition-all active:scale-95 ${color}`}
                >
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-xs opacity-70 mt-0.5">{getNextReviewText(rating, card.interval, card.easeFactor, card.repetitions)}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <Button size="lg" onClick={reveal} className="px-8">
            <Eye size={16} /> Mostrar respuesta
          </Button>
        )}

        {card.tags?.length > 0 && (
          <div className="flex gap-2 mt-6">
            {card.tags.map(t => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-[--accent] text-[--muted] text-xs">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
