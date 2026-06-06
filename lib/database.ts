import { databases, DATABASE_ID, COLLECTION_DECKS, COLLECTION_CARDS, COLLECTION_REVIEWS, COLLECTION_USER_STATS } from './appwrite';
import { ID, Query, Permission, Role } from 'appwrite';
import { Deck, Card, Review, UserStats } from '@/types';

function userPerms(userId: string) {
  return [
    Permission.read(Role.user(userId)),
    Permission.write(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
}

// ── Recalcula totalCards y dueCards de un mazo y los guarda ──────────────────
export async function syncDeckCounts(deckId: string) {
  try {
    // Traer todas las tarjetas del mazo
    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_CARDS, [
      Query.equal('deckId', deckId),
      Query.limit(5000),
    ]);
    const cards = res.documents;
    const now = new Date().toISOString();
    const due = cards.filter(c => !c.nextReview || c.nextReview <= now).length;

    await databases.updateDocument(DATABASE_ID, COLLECTION_DECKS, deckId, {
      totalCards: cards.length,
      dueCards: due,
      lastStudied: new Date().toISOString(),
    });
  } catch {
    // No bloquear el flujo si falla el sync
  }
}

// ---- DECKS ----
export async function getDecks(userId: string): Promise<Deck[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION_DECKS, [
    Query.equal('userId', userId),
    Query.orderDesc('$updatedAt'),
    Query.limit(100),
  ]);
  return res.documents as unknown as Deck[];
}

export async function createDeck(userId: string, data: Omit<Deck, '$id' | '$createdAt' | '$updatedAt' | 'userId' | 'totalCards' | 'dueCards'>) {
  return databases.createDocument(DATABASE_ID, COLLECTION_DECKS, ID.unique(), {
    userId,
    ...data,
    totalCards: 0,
    dueCards: 0,
  }, userPerms(userId));
}

export async function updateDeck(deckId: string, data: Partial<Deck>) {
  return databases.updateDocument(DATABASE_ID, COLLECTION_DECKS, deckId, data);
}

export async function deleteDeck(deckId: string) {
  return databases.deleteDocument(DATABASE_ID, COLLECTION_DECKS, deckId);
}

// ---- CARDS ----
export async function getCards(deckId: string): Promise<Card[]> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION_CARDS, [
    Query.equal('deckId', deckId),
    Query.orderDesc('$createdAt'),
    Query.limit(500),
  ]);
  return res.documents as unknown as Card[];
}

export async function getDueCards(userId: string, limit = 20): Promise<Card[]> {
  const now = new Date().toISOString();
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION_CARDS, [
    Query.equal('userId', userId),
    Query.lessThanEqual('nextReview', now),
    Query.limit(limit),
  ]);
  return res.documents as unknown as Card[];
}

export async function createCard(userId: string, data: Omit<Card, '$id' | '$createdAt' | '$updatedAt' | 'userId'>) {
  const now = new Date().toISOString();
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION_CARDS, ID.unique(), {
    userId,
    ...data,
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReview: now,
  }, userPerms(userId));
  // Actualizar contadores del mazo
  await syncDeckCounts(data.deckId);
  return doc;
}

export async function updateCard(cardId: string, data: Partial<Card>) {
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTION_CARDS, cardId, data);
  // Si cambió nextReview, resync el mazo
  if (data.nextReview && data.deckId) {
    await syncDeckCounts(data.deckId as string);
  }
  return doc;
}

export async function deleteCard(cardId: string, deckId?: string) {
  await databases.deleteDocument(DATABASE_ID, COLLECTION_CARDS, cardId);
  if (deckId) await syncDeckCounts(deckId);
}

// ---- REVIEWS ----
export async function createReview(userId: string, data: Omit<Review, '$id' | '$createdAt'>) {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTION_REVIEWS, ID.unique(), data, userPerms(userId));
  // Resync contadores del mazo tras cada revisión
  await syncDeckCounts(data.deckId);
  return doc;
}

export async function getTodayReviews(userId: string): Promise<Review[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION_REVIEWS, [
    Query.equal('userId', userId),
    Query.greaterThanEqual('reviewedAt', today.toISOString()),
    Query.limit(500),
  ]);
  return res.documents as unknown as Review[];
}

export async function getWeekReviews(userId: string): Promise<Review[]> {
  const week = new Date();
  week.setDate(week.getDate() - 7);
  week.setHours(0, 0, 0, 0);
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION_REVIEWS, [
    Query.equal('userId', userId),
    Query.greaterThanEqual('reviewedAt', week.toISOString()),
    Query.limit(1000),
  ]);
  return res.documents as unknown as Review[];
}

// ---- USER STATS ----
export async function getUserStats(userId: string): Promise<UserStats | null> {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION_USER_STATS, [
    Query.equal('userId', userId),
    Query.limit(1),
  ]);
  return res.documents[0] as unknown as UserStats || null;
}

export async function upsertUserStats(userId: string, data: Partial<UserStats>) {
  const existing = await getUserStats(userId);
  if (existing) {
    return databases.updateDocument(DATABASE_ID, COLLECTION_USER_STATS, existing.$id, data);
  }
  return databases.createDocument(DATABASE_ID, COLLECTION_USER_STATS, ID.unique(), {
    userId,
    currentStreak: 0,
    longestStreak: 0,
    totalReviews: 0,
    totalTimeSeconds: 0,
    cardsLearned: 0,
    ...data,
  }, userPerms(userId));
}
