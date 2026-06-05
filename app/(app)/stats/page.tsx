'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserStats, getWeekReviews, getDecks } from '@/lib/database';
import { UserStats, Review, Deck } from '@/types';
import { Flame, Target, Clock, TrendingUp, Award, BookOpen } from 'lucide-react';

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-[--card-bg] rounded-2xl border border-[--border] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3" style={{ color: color || 'var(--muted)' }}>
        {icon}<span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl sm:text-3xl font-semibold text-[--foreground]">{value}</div>
      {sub && <div className="text-xs text-[--muted] mt-1">{sub}</div>}
    </div>
  );
}

export default function StatsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [weekReviews, setWeekReviews] = useState<Review[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserStats(user.$id),
      getWeekReviews(user.$id),
      getDecks(user.$id),
    ]).then(([s, r, d]) => {
      setStats(s); setWeekReviews(r); setDecks(d);
    }).finally(() => setLoading(false));
  }, [user]);

  const weekData = Array(7).fill(0).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    date.setHours(0, 0, 0, 0);
    const next = new Date(date); next.setDate(next.getDate() + 1);
    const count = weekReviews.filter(r => {
      const d = new Date(r.reviewedAt);
      return d >= date && d < next;
    }).length;
    return {
      label: ['L','M','X','J','V','S','D'][(date.getDay() + 6) % 7],
      count,
      isToday: i === 6,
    };
  });

  const maxCount = Math.max(...weekData.map(d => d.count), 1);
  const accuracy = weekReviews.length > 0
    ? Math.round((weekReviews.filter(r => r.rating >= 3).length / weekReviews.length) * 100)
    : 0;

  const totalMins = stats ? Math.round(stats.totalTimeSeconds / 60) : 0;
  const timeStr = totalMins >= 60 ? `${Math.round(totalMins / 60)}h ${totalMins % 60}m` : `${totalMins}m`;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[--primary]/20 border-t-[--primary] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-4xl mx-auto pb-24 lg:pb-8">
      <h1 className="text-xl sm:text-2xl font-semibold text-[--foreground] mb-5">Estadísticas</h1>

      {/* Stats — 2 cols on mobile, 3 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <StatCard icon={<Flame size={14} />} label="Racha actual" value={`${stats?.currentStreak || 0}d`}
          sub={`Mejor: ${stats?.longestStreak || 0} días`} color="#f97316" />
        <StatCard icon={<Target size={14} />} label="Precisión" value={`${accuracy}%`}
          sub="esta semana" color="#10b981" />
        <StatCard icon={<Clock size={14} />} label="Tiempo total" value={timeStr}
          sub="de estudio" color="#6366f1" />
        <StatCard icon={<TrendingUp size={14} />} label="Revisiones" value={stats?.totalReviews || 0} />
        <StatCard icon={<Award size={14} />} label="Dominadas" value={stats?.cardsLearned || 0}
          sub="5+ correctas" color="#f59e0b" />
        <StatCard icon={<BookOpen size={14} />} label="Mazos" value={decks.length} />
      </div>

      {/* Weekly chart */}
      <div className="bg-[--card-bg] rounded-2xl border border-[--border] p-4 sm:p-6 mb-5">
        <h2 className="text-sm font-semibold text-[--foreground] mb-5">Últimos 7 días</h2>
        <div className="flex items-end gap-2 sm:gap-3 h-28 sm:h-32">
          {weekData.map(({ label, count, isToday }) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1.5 sm:gap-2">
              <span className="text-xs text-[--muted]">{count > 0 ? count : ''}</span>
              <div className="w-full rounded-t-lg transition-all" style={{
                height: `${Math.max((count / maxCount) * 80, count > 0 ? 8 : 3)}px`,
                backgroundColor: isToday ? 'var(--primary)' : count > 0 ? '#cbd5e1' : '#f1f5f9',
              }} />
              <span className={`text-xs font-medium ${isToday ? 'text-[--foreground]' : 'text-[--muted]'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-[--border] flex justify-between text-xs text-[--muted]">
          <span>{weekReviews.length} revisiones</span>
          <span>~{Math.round(weekReviews.length / 7)}/día</span>
        </div>
      </div>

      {/* Deck progress */}
      {decks.length > 0 && (
        <div className="bg-[--card-bg] rounded-2xl border border-[--border] p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-[--foreground] mb-4">Progreso por mazo</h2>
          <div className="flex flex-col gap-4">
            {decks.map(deck => {
              const deckReviews = weekReviews.filter(r => r.deckId === deck.$id).length;
              const pct = deck.totalCards > 0
                ? Math.min(100, Math.round(((deck.totalCards - deck.dueCards) / deck.totalCards) * 100))
                : 0;
              return (
                <div key={deck.$id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: deck.color }} />
                      <span className="text-sm text-[--foreground] truncate">{deck.name}</span>
                    </div>
                    <span className="text-xs text-[--muted] shrink-0 ml-2">{pct}%</span>
                  </div>
                  <div className="h-2 bg-[--accent] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: deck.color }} />
                  </div>
                  {deckReviews > 0 && (
                    <p className="text-xs text-[--muted] mt-1">{deckReviews} revisiones esta semana</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
