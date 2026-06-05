'use client';
import { useState, useEffect, useCallback } from 'react';
import { getDecks, createDeck, updateDeck, deleteDeck } from '@/lib/database';
import { Deck } from '@/types';

export function useDecks(userId: string | undefined) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await getDecks(userId);
      setDecks(data);
    } catch (e) {
      setError('Error cargando mazos');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (data: { name: string; description: string; color: string }) => {
    if (!userId) return;
    await createDeck(userId, data);
    await fetch();
  };

  const update = async (deckId: string, data: Partial<Deck>) => {
    await updateDeck(deckId, data);
    await fetch();
  };

  const remove = async (deckId: string) => {
    await deleteDeck(deckId);
    setDecks(prev => prev.filter(d => d.$id !== deckId));
  };

  return { decks, loading, error, refetch: fetch, create, update, remove };
}
