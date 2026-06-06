'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { databases, DATABASE_ID, COLLECTION_DECKS } from '@/lib/appwrite';
import { getCards } from '@/lib/database';
import { Deck, Card } from '@/types';
import { StudyLobby, SessionConfig } from '@/components/study/StudyLobby';
import { StudySession, SessionResult } from '@/components/study/StudySession';
import { StudyComplete } from '@/components/study/StudyComplete';

type Phase = 'lobby' | 'session' | 'complete';

export default function StudyPage() {
  const params  = useParams();
  const deckId  = params.deckId as string;
  const { user } = useAuth();

  const [deck, setDeck]         = useState<Deck | null>(null);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [loading, setLoading]   = useState(true);
  const [phase, setPhase]       = useState<Phase>('lobby');
  const [config, setConfig]     = useState<SessionConfig | null>(null);
  const [result, setResult]     = useState<SessionResult | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [d, cards] = await Promise.all([
      databases.getDocument(DATABASE_ID, COLLECTION_DECKS, deckId),
      getCards(deckId),
    ]);
    setDeck(d as unknown as Deck);
    setAllCards(cards);
    setLoading(false);
  };

  useEffect(() => { load(); }, [deckId, user]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
    </div>
  );

  if (!deck) return null;

  // ── Lobby ──────────────────────────────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <StudyLobby
        deck={deck}
        allCards={allCards}
        onStart={cfg => {
          setConfig(cfg);
          setPhase('session');
        }}
      />
    );
  }

  // ── Session ────────────────────────────────────────────────────────────────
  if (phase === 'session' && config) {
    return (
      <StudySession
        cards={config.cards}
        deckId={deckId}
        deckName={deck.name}
        deckColor={deck.color}
        userId={user!.$id}
        onComplete={res => {
          setResult(res);
          setPhase('complete');
        }}
      />
    );
  }

  // ── Complete ───────────────────────────────────────────────────────────────
  if (phase === 'complete' && result) {
    return (
      <StudyComplete
        deckId={deckId}
        deckName={deck.name}
        result={result}
        onStudyMore={async () => {
          // Reload cards from server to get updated nextReview dates
          await load();
          setPhase('lobby');
        }}
      />
    );
  }

  return null;
}
