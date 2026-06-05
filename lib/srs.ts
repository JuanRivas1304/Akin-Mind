export type Rating = 1 | 2 | 3 | 4;

export interface SRSResult {
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReview: Date;
}

export function calculateNextReview(
  rating: Rating,
  interval: number = 1,
  easeFactor: number = 2.5,
  repetitions: number = 0
): SRSResult {
  let newInterval: number;
  let newEase = easeFactor;
  let newReps = repetitions;

  if (rating === 1) {
    newInterval = 1;
    newReps = 0;
    newEase = Math.max(1.3, easeFactor - 0.2);
  } else if (rating === 2) {
    newInterval = Math.max(1, Math.round(interval * 1.2));
    newEase = Math.max(1.3, easeFactor - 0.1);
    newReps += 1;
  } else if (rating === 3) {
    if (repetitions === 0) newInterval = 1;
    else if (repetitions === 1) newInterval = 4;
    else newInterval = Math.round(interval * easeFactor);
    newReps += 1;
  } else {
    if (repetitions === 0) newInterval = 1;
    else if (repetitions === 1) newInterval = 4;
    else newInterval = Math.round(interval * easeFactor * 1.3);
    newEase = Math.min(3.0, easeFactor + 0.1);
    newReps += 1;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);
  nextReview.setHours(0, 0, 0, 0);

  return { interval: newInterval, easeFactor: newEase, repetitions: newReps, nextReview };
}

export function getRatingLabel(rating: Rating): string {
  const labels = { 1: 'Muy difícil', 2: 'Difícil', 3: 'Fácil', 4: 'Muy fácil' };
  return labels[rating];
}

export function getNextReviewText(rating: Rating, interval: number, easeFactor: number, repetitions: number): string {
  const result = calculateNextReview(rating, interval, easeFactor, repetitions);
  const days = result.interval;
  if (days === 0) return 'hoy';
  if (days === 1) return 'mañana';
  return `en ${days} días`;
}
