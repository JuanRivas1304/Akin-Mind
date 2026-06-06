'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/types';
import { Rating, calculateNextReview, getNextReviewText } from '@/lib/srs';
import { updateCard, createReview } from '@/lib/database';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Eye } from 'lucide-react';
import { getDeckColors } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { SpeakButton } from './SpeakButton';
import { SelectionSpeakPopup } from './SelectionSpeakPopup';

export interface SessionResult {
  total: number;
  correct: number;
  hard: number;
  timeSeconds: number;
}

interface StudySessionProps {
  cards: Card[];
  deckId: string;
  deckName: string;
  deckColor: string;
  userId: string;
  onComplete: (result: SessionResult) => void;
}

const RATING_CONFIG = [
  { rating: 1 as Rating, label: 'Muy difícil', bg: '#fef2f2', border: '#fecaca', textColor: '#7f1d1d' },
  { rating: 2 as Rating, label: 'Difícil',     bg: '#fff7ed', border: '#fed7aa', textColor: '#431407' },
  { rating: 3 as Rating, label: 'Fácil',       bg: '#f0fdf4', border: '#bbf7d0', textColor: '#14532d' },
  { rating: 4 as Rating, label: 'Muy fácil',   bg: '#eff6ff', border: '#bfdbfe', textColor: '#1e3a8a' },
];

export function StudySession({ cards, deckId, deckName, deckColor, userId, onComplete }: StudySessionProps) {
  const [queue, setQueue]         = useState<Card[]>([...cards]);
  const [current, setCurrent]     = useState(0);
  const [revealed, setRevealed]   = useState(false);
  const [done, setDone]           = useState(0);
  const [correct, setCorrect]     = useState(0);
  const [hard, setHard]           = useState(0);
  const [transitioning, setTrans] = useState(false);
  const sessionStart              = useRef(Date.now());
  const cardStart                 = useRef(Date.now());
  const router                    = useRouter();
  const colors                    = getDeckColors(deckColor);

  const total = cards.length;
  const card  = queue[current];
  const pct   = Math.round((done / total) * 100);

  const reveal = () => { if (!revealed) setRevealed(true); };

  const handleRating = useCallback(async (rating: Rating) => {
    if (!card || transitioning) return;
    const timeSpent = Math.round((Date.now() - cardStart.current) / 1000);
    const srs = calculateNextReview(rating, card.interval, card.easeFactor, card.repetitions);

    updateCard(card.$id, {
      interval: srs.interval, easeFactor: srs.easeFactor, repetitions: srs.repetitions,
      nextReview: srs.nextReview.toISOString(),
      difficulty: rating <= 2 ? Math.min(3, (card.difficulty || 0) + 1) : Math.max(0, (card.difficulty || 0) - 1),
    });
    createReview(userId, { userId, cardId: card.$id, deckId, rating, timeSpent, reviewedAt: new Date().toISOString() });

    const isHard = rating <= 2;
    setTrans(true);
    setTimeout(() => {
      if (rating === 1) {
        const retries = (card as any).__retries || 0;
        if (retries < 2) {
          const newQ = [...queue]; const [c] = newQ.splice(current, 1);
          (c as any).__retries = retries + 1;
          newQ.splice(Math.min(current + 3, newQ.length), 0, c); setQueue(newQ);
        } else {
          setDone(d => d + 1); setHard(h => h + 1);
          if (done + 1 >= total) { onComplete({ total, correct, hard: hard + 1, timeSeconds: Math.round((Date.now() - sessionStart.current) / 1000) }); return; }
          setCurrent(c => c + 1);
        }
      } else {
        const newDone = done + 1; setDone(newDone);
        if (isHard) setHard(h => h + 1); else setCorrect(c => c + 1);
        if (newDone >= total || current + 1 >= queue.length) {
          onComplete({ total, correct: correct + (isHard ? 0 : 1), hard: hard + (isHard ? 1 : 0), timeSeconds: Math.round((Date.now() - sessionStart.current) / 1000) }); return;
        }
        setCurrent(c => c + 1);
      }
      setRevealed(false); cardStart.current = Date.now(); setTrans(false);
    }, 260);
  }, [card, current, done, correct, hard, total, queue, deckId, userId, transitioning, onComplete]);

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

  const showDots = total <= 30;
  const dotCount = Math.min(total, 20);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--background)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 shrink-0"
        style={{ backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => router.back()} className="p-2 rounded-xl transition-colors shrink-0"
          style={{ color: 'var(--muted)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{deckName}</p>
            <span className="text-xs tabular-nums font-medium ml-3 shrink-0" style={{ color: 'var(--foreground)' }}>
              {done} / {total}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--accent)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: deckColor }} />
          </div>
          {showDots && (
            <div className="flex gap-1 mt-1.5 overflow-hidden">
              {Array.from({ length: dotCount }).map((_, i) => (
                <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                  style={{ backgroundColor: i < done ? deckColor : i === done ? deckColor + '55' : 'var(--accent)' }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col px-4 py-5 sm:px-6 sm:py-8 max-w-2xl mx-auto w-full">

        {/* ─── FLASHCARD ─────────────────────────────────────── */}
        <div className="flex-1 flex flex-col rounded-2xl border-2 p-5 sm:p-8 mb-5 transition-all duration-250"
          style={{
            backgroundColor: revealed ? '#f0fdf4' : colors.bg,
            borderColor: revealed ? '#86efac' : colors.border,
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? 'scale(0.96) translateY(4px)' : 'scale(1)',
          }}>

          {/* Face label + audio button for current face */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: revealed ? '#16a34a' : colors.text, opacity: 0.55 }}>
              {revealed ? 'Respuesta' : 'Pregunta'}
            </p>
            {/* Reproduce el texto COMPLETO de la cara visible */}
            <SpeakButton
              text={revealed ? card.answer : card.question}
              size="sm"
              label={revealed ? 'respuesta' : 'pregunta'}
            />
          </div>

          {/* ── Text with selection popup ─────────────────────── */}
          {/* Selecciona cualquier parte del texto y aparece un botón flotante */}
          <SelectionSpeakPopup>
            <p
              className="text-lg sm:text-xl font-medium leading-relaxed text-center whitespace-pre-wrap cursor-text"
              style={{ color: revealed ? '#14532d' : colors.text, userSelect: 'text' }}
            >
              {revealed ? card.answer : card.question}
            </p>
          </SelectionSpeakPopup>

          {/* When revealed: also offer to hear the question */}
          {revealed && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-4 flex-wrap"
              style={{ borderTop: '1px solid #bbf7d0' }}>
              <span className="text-xs" style={{ color: '#16a34a', opacity: 0.65 }}>
                Escuchar la pregunta:
              </span>
              <SpeakButton text={card.question} size="sm" label="pregunta" />
            </div>
          )}

          {/* Hint to reveal */}
          {!revealed && (
            <button
              onClick={reveal}
              className="mt-4 text-xs flex items-center justify-center gap-1.5 w-full"
              style={{ color: colors.text, opacity: 0.4 }}>
              <Eye size={12} />
              Toca aquí para revelar
              <span className="hidden sm:inline ml-1">· Espacio</span>
            </button>
          )}
        </div>

        {/* Rating buttons */}
        {revealed ? (
          <div>
            <p className="text-xs text-center mb-3 hidden sm:block" style={{ color: 'var(--muted)' }}>
              ¿Cómo lo recordaste? <span style={{ opacity: 0.5 }}>(teclas 1–4)</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {RATING_CONFIG.map(({ rating, label, bg, border, textColor }) => (
                <button key={rating} onClick={() => handleRating(rating)}
                  className="flex flex-col items-center py-4 sm:py-3 px-2 rounded-xl border-2 text-center transition-all active:scale-95"
                  style={{ backgroundColor: bg, borderColor: border }}
                  onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(0.96)')}
                  onMouseLeave={e => (e.currentTarget.style.filter = 'none')}>
                  <span className="text-sm font-semibold" style={{ color: textColor }}>{label}</span>
                  <span className="text-xs mt-0.5" style={{ color: textColor, opacity: 0.6 }}>
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
        {(card.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {card.tags.map(t => (
              <span key={t} className="px-2 py-0.5 rounded-full text-xs"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--muted)' }}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
