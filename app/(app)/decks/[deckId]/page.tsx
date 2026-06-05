'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCards } from '@/hooks/useCards';
import { databases, DATABASE_ID, COLLECTION_DECKS } from '@/lib/appwrite';
import { Deck } from '@/types';
import { CardItem } from '@/components/cards/CardItem';
import { CardModal } from '@/components/cards/CardModal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ArrowLeft, Plus, Play, CreditCard } from 'lucide-react';

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

  const handleSave = async (data: { question: string; answer: string; tags: string[] }) => {
    if (!user) return;
    if (editingCard) await update((editingCard as any).$id, data);
    else await create(user.$id, { ...data, deckId });
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-4xl mx-auto pb-24 lg:pb-8">
      {/* Back */}
      <button onClick={() => router.push('/decks')}
        className="flex items-center gap-2 text-[--muted] hover:text-[--foreground] text-sm mb-5 transition-colors">
        <ArrowLeft size={16} /> Volver a mazos
      </button>

      {deck && (
        <>
          {/* Deck header */}
          <div className="flex items-start justify-between gap-3 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-3.5 h-3.5 rounded-full shrink-0 mt-1" style={{ backgroundColor: deck.color }} />
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold text-[--foreground] truncate">{deck.name}</h1>
                {deck.description && (
                  <p className="text-[--muted] text-sm mt-0.5 line-clamp-2">{deck.description}</p>
                )}
              </div>
            </div>
            {/* Desktop buttons */}
            <div className="hidden sm:flex gap-2 shrink-0">
              <Button variant="secondary" size="sm" onClick={() => setModalOpen(true)}>
                <Plus size={15} /> Nueva tarjeta
              </Button>
              {dueCards.length > 0 && (
                <Button size="sm" onClick={() => router.push(`/decks/${deckId}/study`)}>
                  <Play size={15} /> Estudiar ({dueCards.length})
                </Button>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Total', value: cards.length },
              { label: 'Pendientes', value: dueCards.length },
              { label: 'Dominadas', value: cards.filter(c => c.repetitions >= 5).length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[--card-bg] rounded-xl border border-[--border] p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-xl font-semibold text-[--foreground]">{value}</div>
                <div className="text-xs text-[--muted] mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Mobile sticky action buttons */}
          <div className="sm:hidden flex gap-2 mb-5">
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(true)} className="flex-1">
              <Plus size={15} /> Nueva tarjeta
            </Button>
            {dueCards.length > 0 && (
              <Button size="sm" onClick={() => router.push(`/decks/${deckId}/study`)} className="flex-1">
                <Play size={15} /> Estudiar ({dueCards.length})
              </Button>
            )}
          </div>
        </>
      )}

      {/* Cards list */}
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
