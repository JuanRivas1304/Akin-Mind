/**
 * statsSync.ts
 * 
 * Recalcula y guarda user_stats desde cero basándose en las reviews reales.
 * Se llama al finalizar cada sesión de estudio.
 * 
 * Métricas que calcula:
 *  - totalReviews        → total de documentos en reviews
 *  - totalTimeSeconds    → suma de timeSpent de todas las reviews
 *  - cardsLearned        → tarjetas con repetitions >= 5
 *  - currentStreak       → días consecutivos con al menos 1 review (hasta hoy)
 *  - longestStreak       → racha más larga histórica
 *  - lastStudyDate       → fecha de la última review
 */

import { databases, DATABASE_ID, COLLECTION_REVIEWS, COLLECTION_CARDS, COLLECTION_USER_STATS } from './appwrite';
import { Query, ID, Permission, Role } from 'appwrite';

function userPerms(userId: string) {
  return [
    Permission.read(Role.user(userId)),
    Permission.write(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
}

function toDateStr(date: Date): string {
  // YYYY-MM-DD en hora local
  return date.toISOString().slice(0, 10);
}

export async function syncUserStats(userId: string): Promise<void> {
  try {
    // ── 1. Traer TODAS las reviews del usuario ────────────────────────────
    // Appwrite limita a 5000 por query; para uso personal es más que suficiente
    const reviewsRes = await databases.listDocuments(DATABASE_ID, COLLECTION_REVIEWS, [
      Query.equal('userId', userId),
      Query.orderAsc('reviewedAt'),
      Query.limit(5000),
    ]);
    const reviews = reviewsRes.documents;

    // ── 2. Métricas básicas ───────────────────────────────────────────────
    const totalReviews     = reviews.length;
    const totalTimeSeconds = reviews.reduce((sum, r) => sum + (r.timeSpent || 0), 0);
    const lastStudyDate    = reviews.length > 0 ? reviews[reviews.length - 1].reviewedAt : null;

    // ── 3. Racha de días consecutivos ────────────────────────────────────
    // Construir set de días únicos con al menos 1 review
    const studiedDays = new Set<string>();
    for (const r of reviews) {
      studiedDays.add(r.reviewedAt.slice(0, 10)); // YYYY-MM-DD
    }

    // Calcular racha actual (hacia atrás desde hoy)
    let currentStreak = 0;
    const today  = new Date();
    const cursor = new Date(today);
    cursor.setHours(0, 0, 0, 0);

    while (studiedDays.has(toDateStr(cursor))) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    // Si no estudió hoy pero sí ayer, la racha sigue vigente
    // (algunos usuarios estudian antes de medianoche)
    if (currentStreak === 0) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const cursor2 = new Date(yesterday);
      cursor2.setHours(0, 0, 0, 0);
      let tempStreak = 0;
      while (studiedDays.has(toDateStr(cursor2))) {
        tempStreak++;
        cursor2.setDate(cursor2.getDate() - 1);
      }
      // Solo mantener la racha de ayer si fue ayer mismo
      if (studiedDays.has(toDateStr(yesterday))) {
        currentStreak = tempStreak;
      }
    }

    // Racha más larga histórica
    const sortedDays = Array.from(studiedDays).sort();
    let longestStreak = 0;
    let tempStreak    = 0;
    let prevDay: string | null = null;

    for (const day of sortedDays) {
      if (prevDay) {
        const prev = new Date(prevDay);
        const curr = new Date(day);
        const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
        if (diff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
      prevDay = day;
    }

    // ── 4. Tarjetas dominadas (repetitions >= 5) ─────────────────────────
    const cardsRes = await databases.listDocuments(DATABASE_ID, COLLECTION_CARDS, [
      Query.equal('userId', userId),
      Query.greaterThanEqual('repetitions', 5),
      Query.limit(5000),
    ]);
    const cardsLearned = cardsRes.total;

    // ── 5. Guardar / actualizar user_stats ───────────────────────────────
    const payload = {
      totalReviews,
      totalTimeSeconds,
      currentStreak,
      longestStreak,
      cardsLearned,
      ...(lastStudyDate ? { lastStudyDate } : {}),
    };

    // Buscar documento existente
    const existing = await databases.listDocuments(DATABASE_ID, COLLECTION_USER_STATS, [
      Query.equal('userId', userId),
      Query.limit(1),
    ]);

    if (existing.documents.length > 0) {
      await databases.updateDocument(
        DATABASE_ID, COLLECTION_USER_STATS, existing.documents[0].$id, payload
      );
    } else {
      await databases.createDocument(
        DATABASE_ID, COLLECTION_USER_STATS, ID.unique(),
        { userId, ...payload },
        userPerms(userId)
      );
    }
  } catch (err) {
    // No bloquear nunca el flujo de estudio
    console.warn('[statsSync] Error sincronizando stats:', err);
  }
}
