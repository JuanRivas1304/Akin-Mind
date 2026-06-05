'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { databases, DATABASE_ID, COLLECTION_DECKS } from '@/lib/appwrite';
import { getDueCards, getCards } from '@/lib/database';
import { Deck, Card } from '@/types';
import { StudySession } from '@/components/study/StudySession';
import { StudyComplete } from '@/components/study/StudyComplete';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export default function StudyPage() {
  const params = useParams();
  const deckId = params.deckId as string;
  const { user } = useAuth();
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  const loadCards = async () => {
    if (!user) return;
    const [d, allCards] = await Promise.all([
      databases.getDocument(DATABASE_ID, COLLECTION_DECKS, deckId),
      getCards(deckId),
    ]);
    setDeck(d as unknown as Deck);
    const due = allCards.filter(c => !c.nextReview || new Date(c.nextReview) <= new Date());
    setCards(due.length > 0 ? due : allCards.slice(0, 20));
    setLoading(false);
  };

  useEffect(() => { loadCards(); }, [deckId, user]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-[--primary]/20 border-t-[--primary] rounded-full animate-spin" />
    </div>
  );

  if (!deck) return null;

  if (cards.length === 0) return (
    <div className="flex flex-col items-center justify-center h-screen px-4 text-center">
      <p className="text-[--foreground] font-semibold text-lg mb-2">No hay tarjetas para estudiar</p>
      <p className="text-[--muted] text-sm mb-6">Este mazo no tiene tarjetas todavía</p>
      <Button onClick={() => router.push(`/decks/${deckId}`)}>
        <ArrowLeft size={16} /> Volver al mazo
      </Button>
    </div>
  );

  if (completed) return (
    <StudyComplete
      deckName={deck.name}
      totalReviewed={cards.length}
      onStudyAgain={() => { setCompleted(false); loadCards(); }}
    />
  );

  return (
    <StudySession
      cards={cards}
      deckId={deckId}
      deckName={deck.name}
      deckColor={deck.color}
      userId={user!.$id}
      onComplete={() => setCompleted(true)}
    />
  );
}
