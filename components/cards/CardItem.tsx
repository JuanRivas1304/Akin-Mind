'use client';
import { Card } from '@/types';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatRelative } from '@/lib/utils';

interface CardItemProps {
  card: Card;
  onEdit: (card: Card) => void;
  onDelete: (cardId: string) => void;
}

export function CardItem({ card, onEdit, onDelete }: CardItemProps) {
  const isNew = !card.repetitions;
  const isDue = card.nextReview && new Date(card.nextReview) <= new Date();

  return (
    <div className="bg-[--card-bg] rounded-xl border border-[--border] p-4 hover:border-[--primary]/20 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[--foreground] mb-1 line-clamp-2">{card.question}</p>
          <p className="text-xs text-[--muted] line-clamp-2">{card.answer}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => onEdit(card)}
            className="p-1.5 rounded-lg text-[--muted] hover:text-[--foreground] hover:bg-[--accent] transition-colors">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(card.$id)}
            className="p-1.5 rounded-lg text-[--muted] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {card.tags?.map(t => (
          <span key={t} className="px-2 py-0.5 rounded-full bg-[--accent] text-[--muted] text-xs">{t}</span>
        ))}
        {isNew && <Badge variant="info">Nueva</Badge>}
        {isDue && !isNew && <Badge variant="warning">Pendiente</Badge>}
        {!isDue && !isNew && <Badge variant="success">Al día</Badge>}
        {card.repetitions > 0 && (
          <span className="text-xs text-[--muted] ml-auto">
            {card.repetitions} {card.repetitions === 1 ? 'vez' : 'veces'} · {formatRelative(card.$updatedAt)}
          </span>
        )}
      </div>
    </div>
  );
}
