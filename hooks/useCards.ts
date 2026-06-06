'use client';
import { useState, useEffect, useCallback } from 'react';
import { getCards, createCard, updateCard, deleteCard, syncDeckCounts } from '@/lib/database';
import { Card } from '@/types';

export function useCards(deckId: string | undefined) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!deckId) return;
    try {
      setLoading(true);
      const data = await getCards(deckId);
      setCards(data);
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (userId: string, data: { question: string; answer: string; tags: string[]; deckId: string }) => {
    await createCard(userId, { ...data, difficulty: 0, interval: 1, easeFactor: 2.5, repetitions: 0 });
    // Sync counts so dashboard and deck list show the correct number
    await syncDeckCounts(deckId!);
    await fetch();
  };

  const update = async (cardId: string, data: Partial<Card>) => {
    await updateCard(cardId, data);
    await fetch();
  };

  const remove = async (cardId: string) => {
    await deleteCard(cardId);
    setCards(prev => prev.filter(c => c.$id !== cardId));
    // Sync counts after deletion
    await syncDeckCounts(deckId!);
  };

  return { cards, loading, refetch: fetch, create, update, remove };
}
