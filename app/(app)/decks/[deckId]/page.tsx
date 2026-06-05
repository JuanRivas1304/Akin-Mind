'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCards } from '@/hooks/useCards';
import { getDeckCards_deck } from './helpers';
import { databases, DATABASE_ID, COLLECTION_DECKS } from '@/lib/appwrite';
import { Deck } from '@/types';
import { CardItem } from '@/components/cards/CardItem';
import { CardModal } from '@/components/cards/CardModal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ArrowLeft, Plus, Play, CreditCard } from 'lucide-react';
import { getDeckColors } from '@/lib/utils';

export default function DeckDetailPage() {
  const params = useParams();
  const deckId = params.deckId as string;
  const { user } = useAuth();
  const router = useRouter();
  const { cards, loading, create, update, remove } = useCards(deckId);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  useEffect(() => {
    databases.getDocument(DATABASE_ID, COLLECTION_DECKS, deckId)
      .then(d => setDeck(d as unknown as Deck))
      .catch(() => router.replace('/decks'));
  }, [deckId]);

  const dueCards = cards.filter(c => !c.nextReview || new Date(c.nextReview) <= new Date());
  const colors = deck ? getDeckColors(deck.color) : null;

  const handleSave = async (data: { question: string; answer: string; tags: string[] }) => {
    if (!user) return;
    if (editingCard) {
      await update((editingCard as any).$id, data);
    } else {
      await create(user.$id, { ...data, deckId });
    }
  };

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto">
      <button onClick={() => router.push('/decks')} className="flex items-center gap-2 text-[--muted] hover:text-[--foreground] text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Volver a mazos
      </button>

      {deck && (
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: deck.color }} />
            <div>
              <h1 className="text-2xl font-semibold text-[--foreground]">{deck.name}</h1>
              {deck.description && <p className="text-[--muted] text-sm mt-0.5">{deck.description}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Nueva tarjeta
            </Button>
            {dueCards.length > 0 && (
              <Button onClick={() => router.push(`/decks/${deckId}/study`)}>
                <Play size={16} /> Estudiar ({dueCards.length})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total', value: cards.length },
          { label: 'Pendientes', value: dueCards.length },
          { label: 'Dominadas', value: cards.filter(c => c.repetitions >= 5).length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[--card-bg] rounded-xl border border-[--border] p-4 text-center">
            <div className="text-xl font-semibold text-[--foreground]">{value}</div>
            <div className="text-xs text-[--muted] mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-[--accent] rounded-xl animate-pulse" />)}
        </div>
      ) : cards.length === 0 ? (
        <EmptyState
          icon={<CreditCard size={24} />}
          title="Sin tarjetas todavía"
          description="Crea tu primera tarjeta para empezar a estudiar"
          action={{ label: 'Crear tarjeta', onClick: () => setModalOpen(true) }}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {cards.map(card => (
            <CardItem key={card.$id} card={card}
              onEdit={c => { setEditingCard(c as any); setModalOpen(true); }}
              onDelete={remove}
            />
          ))}
        </div>
      )}

      <CardModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingCard(null); }}
        onSave={handleSave}
        card={editingCard}
      />
    </div>
  );
}
