export interface Deck {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string;
  name: string;
  description: string;
  color: string;
  totalCards: number;
  dueCards: number;
  lastStudied?: string;
}

export interface Card {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string;
  deckId: string;
  question: string;
  answer: string;
  tags: string[];
  imageId?: string;
  difficulty: number;
  nextReview?: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
}

export interface Review {
  $id: string;
  $createdAt: string;
  userId: string;
  cardId: string;
  deckId: string;
  rating: number;
  timeSpent: number;
  reviewedAt: string;
}

export interface UserStats {
  $id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate?: string;
  totalReviews: number;
  totalTimeSeconds: number;
  cardsLearned: number;
}

export interface User {
  $id: string;
  name: string;
  email: string;
}
