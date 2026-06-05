'use client';
import { Deck } from '@/types';
import { getDeckColors, formatRelative } from '@/lib/utils';
import { MoreHorizontal, Pencil, Trash2, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeckCardProps {
  deck: Deck;
  onEdit: (deck: Deck) => void;
  onDelete: (deckId: string) => void;
}

export function DeckCard({ deck, onEdit, onDelete }: DeckCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const colors = getDeckColors(deck.color);

  return (
    <div
      className="relative rounded-2xl p-5 border cursor-pointer card-float"
      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
      onClick={() => router.push(`/decks/${deck.$id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-3 h-3 rounded-full mt-1" style={{ backgroundColor: deck.color }} />
        <div className="relative">
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
            className="p-1 rounded-lg hover:bg-black/5 transition-colors"
            style={{ color: colors.text }}
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-8 z-20 bg-[--card-bg] border border-[--border] rounded-xl shadow-lg py-1 min-w-[140px]"
              onClick={e => e.stopPropagation()}
            >
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[--foreground] hover:bg-[--accent] transition-colors"
                onClick={() => { onEdit(deck); setMenuOpen(false); }}
              >
                <Pencil size={14} /> Editar
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                onClick={() => { onDelete(deck.$id); setMenuOpen(false); }}
              >
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="font-semibold text-sm mb-1" style={{ color: colors.text }}>{deck.name}</h3>
      {deck.description && (
        <p className="text-xs mb-3 opacity-70 line-clamp-2" style={{ color: colors.text }}>{deck.description}</p>
      )}

      <div className="flex items-center justify-between mt-4">
        <span className="text-xs font-medium" style={{ color: colors.text }}>{deck.totalCards} tarjetas</span>
        {deck.dueCards > 0 ? (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/60 border" style={{ color: colors.text, borderColor: colors.border }}>
            {deck.dueCards} pendientes
          </span>
        ) : (
          <span className="text-xs text-green-600 font-medium">✓ Al día</span>
        )}
      </div>

      {deck.lastStudied && (
        <p className="text-xs mt-2 opacity-50" style={{ color: colors.text }}>
          Estudiado {formatRelative(deck.lastStudied)}
        </p>
      )}
    </div>
  );
}
