'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDecks, getDueCards, getTodayReviews, getUserStats, getWeekReviews } from '@/lib/database';
import { Deck, Card, Review, UserStats } from '@/types';
import { useRouter } from 'next/navigation';
import { Flame, BookOpen, CheckCircle, Clock, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getDeckColors, formatRelative } from '@/lib/utils';
import Link from 'next/link';

function StatCard({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="bg-[--card-bg] rounded-2xl border border-[--border] p-4">
      <div className="flex items-center gap-2 text-[--muted] text-xs mb-2">{icon}{label}</div>
      <div className="text-2xl font-semibold text-[--foreground]">{value}</div>
      {sub && <div className="text-xs text-[--muted] mt-0.5">{sub}</div>}
    </div>
  );
}

/** Returns a Set of weekday indices (0=Mon…6=Sun) where the user studied this week */
function getStudiedDaysThisWeek(weekReviews: Review[]): Set<number> {
  const studied = new Set<number>();
  // Find the Monday of the current week
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun,1=Mon…6=Sat
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  weekReviews.forEach(r => {
    const d = new Date(r.reviewedAt);
    if (d >= monday) {
      // day index 0=Mon…6=Sun
      const idx = (d.getDay() + 6) % 7;
      studied.add(idx);
    }
  });
  return studied;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [dueCards, setDueCards] = useState<Card[]>([]);
  const [todayReviews, setTodayReviews] = useState<Review[]>([]);
  const [weekReviews, setWeekReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getDecks(user.$id),
      getDueCards(user.$id, 50),
      getTodayReviews(user.$id),
      getUserStats(user.$id),
      getWeekReviews(user.$id),
    ]).then(([d, c, r, s, wr]) => {
      setDecks(d); setDueCards(c); setTodayReviews(r); setStats(s); setWeekReviews(wr);
    }).finally(() => setLoading(false));
  }, [user]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[--primary]/20 border-t-[--primary] rounded-full animate-spin" />
    </div>
  );

  const streak = stats?.currentStreak || 0;
  const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  // today's index 0=Mon…6=Sun
  const todayIdx = (new Date().getDay() + 6) % 7;
  const studiedDays = getStudiedDaysThisWeek(weekReviews);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-4xl mx-auto pb-24 lg:pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-[--foreground]">
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-[--muted] text-sm mt-1">
          {dueCards.length > 0
            ? `Tienes ${dueCards.length} tarjeta${dueCards.length > 1 ? 's' : ''} pendiente${dueCards.length > 1 ? 's' : ''} hoy`
            : '¡Estás al día! No hay tarjetas pendientes'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Pendientes" value={dueCards.length} icon={<Clock size={12} />} sub="para hoy" />
        <StatCard label="Hoy" value={todayReviews.length} icon={<CheckCircle size={12} />} sub="estudiadas" />
        <StatCard label="Racha" value={`${streak}d`} icon={<Flame size={12} />} sub={streak > 0 ? '¡Sigue así!' : 'Empieza hoy'} />
        <StatCard label="Mazos" value={decks.length} icon={<BookOpen size={12} />} />
      </div>

      {/* Week tracker — only marks days with real reviews */}
      <div className="bg-[--card-bg] rounded-2xl border border-[--border] p-4 sm:p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[--foreground]">Esta semana</h2>
          {streak > 0 && (
            <span className="flex items-center gap-1 text-xs text-orange-500 font-medium">
              <Flame size={12} /> {streak} días
            </span>
          )}
        </div>
        <div className="flex gap-1.5 sm:gap-2">
          {DAY_LABELS.map((label, i) => {
            const isToday = i === todayIdx;
            // Only mark green if there are actual reviews logged for this day
            const didStudy = studiedDays.has(i);
            const isFuture = i > todayIdx;

            return (
              <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-medium transition-colors
                  ${isToday
                    ? 'bg-[--primary] text-[--primary-fg] ring-2 ring-[--primary]/20'
                    : didStudy
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : isFuture
                        ? 'bg-[--accent] text-[--muted] opacity-40'
                        : 'bg-[--accent] text-[--muted]'
                  }`}>
                  {isToday ? label : didStudy ? '✓' : label}
                </div>
                <span className="text-xs text-[--muted] hidden sm:block">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      {dueCards.length > 0 && decks.length > 0 && (
        <div className="bg-[--primary] rounded-2xl p-4 sm:p-5 mb-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[--primary-fg] font-semibold text-sm sm:text-base">¡Es hora de estudiar!</p>
            <p className="text-[--primary-fg]/60 text-xs sm:text-sm">{dueCards.length} tarjetas esperan</p>
          </div>
          <Button variant="secondary" onClick={() => router.push('/decks')} className="shrink-0 text-xs sm:text-sm">
            <Zap size={14} /> <span className="hidden sm:inline">Estudiar ahora</span><span className="sm:hidden">Ir</span>
          </Button>
        </div>
      )}

      {/* Decks list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[--foreground]">Tus mazos</h2>
          <Link href="/decks" className="text-xs text-[--muted] hover:text-[--foreground] flex items-center gap-1 transition-colors">
            Ver todos <ChevronRight size={12} />
          </Link>
        </div>
        {decks.length === 0 ? (
          <div className="bg-[--card-bg] rounded-2xl border border-[--border] border-dashed p-8 text-center">
            <p className="text-[--muted] text-sm mb-3">No tienes mazos todavía</p>
            <Button onClick={() => router.push('/decks')}>Crear mi primer mazo</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {decks.slice(0, 5).map(deck => {
              const colors = getDeckColors(deck.color);
              return (
                <div key={deck.$id}
                  className="bg-[--card-bg] rounded-xl border border-[--border] px-4 py-3 flex items-center gap-3 hover:border-[--primary]/20 cursor-pointer transition-colors active:scale-[0.99]"
                  onClick={() => router.push(`/decks/${deck.$id}`)}>
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: deck.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[--foreground] truncate">{deck.name}</p>
                    <p className="text-xs text-[--muted]">
                      {deck.totalCards} tarjetas{deck.lastStudied ? ` · ${formatRelative(deck.lastStudied)}` : ''}
                    </p>
                  </div>
                  {deck.dueCards > 0 ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                      style={{ backgroundColor: colors.bg, color: colors.text }}>
                      {deck.dueCards}
                    </span>
                  ) : (
                    <span className="text-xs text-green-500 font-medium shrink-0">✓</span>
                  )}
                  <ChevronRight size={14} className="text-[--muted] shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
