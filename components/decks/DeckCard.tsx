'use client';
import { Deck } from '@/types';
import { getDeckColors, formatRelative } from '@/lib/utils';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DeckCardProps {
  deck: Deck;
  onEdit: (deck: Deck) => void;
  onDelete: (deckId: string) => void;
}

export function DeckCard({ deck, onEdit, onDelete }: DeckCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const colors = getDeckColors(deck.color);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div
      className="relative rounded-2xl p-5 border-2 cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.10)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)')}
      onClick={() => router.push(`/decks/${deck.$id}`)}
    >
      {/* Top row: dot + menu */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: deck.color }} />
        <div className="relative" ref={menuRef}>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: colors.text }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <MoreHorizontal size={16} />
          </button>

          {/* Dropdown — fully opaque, solid background */}
          {menuOpen && (
            <div
              className="absolute right-0 top-9 z-30 rounded-xl py-1 min-w-[148px] shadow-lg"
              style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm transition-colors text-left"
                style={{ color: 'var(--foreground)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={() => { onEdit(deck); setMenuOpen(false); }}
              >
                <Pencil size={13} style={{ color: 'var(--muted)' }} /> Editar
              </button>
              <button
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm transition-colors text-left"
                style={{ color: '#dc2626' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={() => { onDelete(deck.$id); setMenuOpen(false); }}
              >
                <Trash2 size={13} /> Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Name + description */}
      <h3 className="font-semibold text-sm mb-1" style={{ color: colors.text }}>{deck.name}</h3>
      {deck.description && (
        <p className="text-xs mb-3 line-clamp-2" style={{ color: colors.text, opacity: 0.65 }}>
          {deck.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-xs font-medium" style={{ color: colors.text }}>
          {deck.totalCards} tarjeta{deck.totalCards !== 1 ? 's' : ''}
        </span>
        {deck.dueCards > 0 ? (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.55)', color: colors.text, border: `1px solid ${colors.border}` }}>
            {deck.dueCards} pendientes
          </span>
        ) : (
          <span className="text-xs font-medium" style={{ color: '#16a34a' }}>✓ Al día</span>
        )}
      </div>

      {deck.lastStudied && (
        <p className="text-xs mt-2" style={{ color: colors.text, opacity: 0.45 }}>
          {formatRelative(deck.lastStudied)}
        </p>
      )}
    </div>
  );
}
