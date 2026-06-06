'use client';
import { useState } from 'react';
import { Card, Deck } from '@/types';
import { getDeckColors } from '@/lib/utils';
import { ArrowLeft, Zap, BookOpen, Flame, Layers, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export interface SessionConfig {
  cards: Card[];
  mode: 'quick' | 'normal' | 'intensive' | 'all' | 'custom';
  limit: number;
}

interface StudyLobbyProps {
  deck: Deck;
  allCards: Card[];
  onStart: (config: SessionConfig) => void;
}

function selectCards(allCards: Card[], limit: number): Card[] {
  const now = new Date();

  // Split into priority buckets
  const overdue  = allCards.filter(c => c.nextReview && new Date(c.nextReview) < now && c.repetitions > 0);
  const dueToday = allCards.filter(c => c.nextReview && new Date(c.nextReview) <= now && c.repetitions === 0);
  const hard     = allCards.filter(c => (c.difficulty || 0) >= 2 && (!c.nextReview || new Date(c.nextReview) > now));
  const newCards = allCards.filter(c => !c.nextReview || c.repetitions === 0).filter(c => !dueToday.includes(c));
  const rest     = allCards.filter(c =>
    !overdue.includes(c) && !dueToday.includes(c) && !hard.includes(c) && !newCards.includes(c)
  );

  // Fill up to limit in priority order
  const selected: Card[] = [];
  for (const bucket of [overdue, dueToday, hard, newCards, rest]) {
    for (const card of bucket) {
      if (selected.length >= limit) break;
      if (!selected.includes(card)) selected.push(card);
    }
    if (selected.length >= limit) break;
  }
  return selected;
}

const MODES = [
  {
    id: 'quick' as const,
    label: 'Estudio rápido',
    limit: 10,
    icon: Zap,
    color: '#f59e0b',
    bg: '#fef9ee',
    border: '#fde68a',
    text: '#92400e',
    desc: '~5 min · Perfecto para repasar rápido',
  },
  {
    id: 'normal' as const,
    label: 'Estudio normal',
    limit: 20,
    icon: BookOpen,
    color: '#6366f1',
    bg: '#eef2ff',
    border: '#c7d2fe',
    text: '#312e81',
    desc: '~10 min · La sesión diaria ideal',
  },
  {
    id: 'intensive' as const,
    label: 'Estudio intensivo',
    limit: 50,
    icon: Flame,
    color: '#ef4444',
    bg: '#fef2f2',
    border: '#fecaca',
    text: '#450a0a',
    desc: '~25 min · Para días con más tiempo',
  },
  {
    id: 'all' as const,
    label: 'Todo el mazo',
    limit: Infinity,
    icon: Layers,
    color: '#10b981',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    text: '#14532d',
    desc: 'Sin límite · Todas las tarjetas pendientes',
  },
];

export function StudyLobby({ deck, allCards, onStart }: StudyLobbyProps) {
  const router = useRouter();
  const colors = getDeckColors(deck.color);
  const [customVal, setCustomVal] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const now = new Date();

  const dueCount  = allCards.filter(c => !c.nextReview || new Date(c.nextReview) <= now).length;
  const newCount  = allCards.filter(c => !c.repetitions).length;
  const hardCount = allCards.filter(c => (c.difficulty || 0) >= 2).length;
  const estTime   = (n: number) => n <= 10 ? '~5 min' : n <= 20 ? '~10 min' : n <= 50 ? '~25 min' : `~${Math.round(allCards.length * 0.5)} min`;

  const handleMode = (mode: typeof MODES[number]) => {
    const limit = mode.limit === Infinity ? allCards.length : mode.limit;
    onStart({ cards: selectCards(allCards, limit), mode: mode.id, limit });
  };

  const handleCustom = () => {
    const n = parseInt(customVal);
    if (!n || n < 1) return;
    const limit = Math.min(n, allCards.length);
    onStart({ cards: selectCards(allCards, limit), mode: 'custom', limit });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 sm:px-6"
        style={{ backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => router.back()}
          className="p-2 rounded-xl transition-colors"
          style={{ color: 'var(--muted)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: deck.color }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{deck.name}</span>
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-8 sm:px-6">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
            Sesión de estudio
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Elige cuántas tarjetas quieres repasar hoy
          </p>
        </div>

        {/* Stats pills */}
        <div className="flex flex-wrap gap-2 mb-7">
          {[
            { label: `${dueCount} pendientes`, color: dueCount > 0 ? '#d97706' : 'var(--muted)', bg: dueCount > 0 ? '#fef9ee' : 'var(--accent)' },
            { label: `${newCount} nuevas`, color: '#2563eb', bg: '#eff6ff' },
            { label: `${hardCount} difíciles`, color: '#dc2626', bg: '#fef2f2' },
            { label: `${allCards.length} total`, color: 'var(--muted)', bg: 'var(--accent)' },
          ].map(p => (
            <span key={p.label} className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: p.bg, color: p.color }}>
              {p.label}
            </span>
          ))}
        </div>

        {/* Mode cards */}
        <div className="flex flex-col gap-3 mb-4">
          {MODES.map(mode => {
            const available = mode.limit === Infinity ? allCards.length : Math.min(mode.limit, allCards.length);
            const disabled = allCards.length === 0;
            return (
              <button key={mode.id}
                disabled={disabled}
                onClick={() => handleMode(mode)}
                className="flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.99] disabled:opacity-40"
                style={{ backgroundColor: mode.bg, borderColor: mode.border }}
                onMouseEnter={e => !disabled && (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: mode.color + '22' }}>
                  <mode.icon size={20} style={{ color: mode.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold" style={{ color: mode.text }}>{mode.label}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: mode.color + '18', color: mode.color }}>
                      {available} tarjetas
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: mode.text, opacity: 0.65 }}>{mode.desc}</p>
                </div>
                <ChevronRight size={16} style={{ color: mode.text, opacity: 0.4 }} />
              </button>
            );
          })}
        </div>

        {/* Custom amount */}
        {!showCustom ? (
          <button
            onClick={() => setShowCustom(true)}
            className="w-full py-3 rounded-xl text-sm font-medium transition-colors"
            style={{ color: 'var(--muted)', backgroundColor: 'var(--accent)', border: '1px dashed var(--border)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}>
            <Clock size={14} className="inline mr-1.5" />
            Cantidad personalizada
          </button>
        ) : (
          <div className="flex gap-2 items-center p-3 rounded-xl"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <input
              type="number"
              min={1}
              max={allCards.length}
              value={customVal}
              onChange={e => setCustomVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCustom()}
              placeholder={`1 – ${allCards.length}`}
              autoFocus
              className="flex-1 bg-transparent text-sm outline-none px-1"
              style={{ color: 'var(--foreground)' }}
            />
            <button onClick={handleCustom}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-fg)' }}>
              Iniciar
            </button>
            <button onClick={() => setShowCustom(false)}
              className="px-3 py-1.5 rounded-lg text-sm"
              style={{ color: 'var(--muted)' }}>
              ✕
            </button>
          </div>
        )}

        {allCards.length === 0 && (
          <p className="text-center text-sm mt-6" style={{ color: 'var(--muted)' }}>
            Este mazo no tiene tarjetas todavía
          </p>
        )}
      </div>
    </div>
  );
}
