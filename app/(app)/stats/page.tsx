'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserStats, getWeekReviews, getDecks } from '@/lib/database';
import { UserStats, Review, Deck } from '@/types';
import { Flame, Target, Clock, TrendingUp, Award, BookOpen, RefreshCw } from 'lucide-react';
import { syncUserStats } from '@/lib/statsSync';

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-[--card-bg] rounded-2xl border border-[--border] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3" style={{ color: color || 'var(--muted)' }}>
        {icon}<span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--foreground)' }}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{sub}</div>}
    </div>
  );
}

function fmtTime(seconds: number): string {
  if (!seconds || seconds < 60) return `${seconds || 0}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function StatsPage() {
  const { user } = useAuth();
  const [stats, setStats]           = useState<UserStats | null>(null);
  const [weekReviews, setWeekReviews] = useState<Review[]>([]);
  const [decks, setDecks]           = useState<Deck[]>([]);
  const [loading, setLoading]       = useState(true);
  const [syncing, setSyncing]       = useState(false);

  const load = async () => {
    if (!user) return;
    const [s, r, d] = await Promise.all([
      getUserStats(user.$id),
      getWeekReviews(user.$id),
      getDecks(user.$id),
    ]);
    setStats(s); setWeekReviews(r); setDecks(d);
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [user]);

  // Manual recalculate button — useful if stats seem wrong
  const handleResync = async () => {
    if (!user) return;
    setSyncing(true);
    await syncUserStats(user.$id);
    await load();
    setSyncing(false);
  };

  // ── Weekly chart data ─────────────────────────────────────────────────────
  // Always show Mon→Sun of the CURRENT week
  const weekData = (() => {
    const today = new Date();
    const todayIdx = (today.getDay() + 6) % 7; // 0=Mon…6=Sun
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (todayIdx - i));
      date.setHours(0, 0, 0, 0);
      const next = new Date(date);
      next.setDate(date.getDate() + 1);

      const count = weekReviews.filter(r => {
        const d = new Date(r.reviewedAt);
        return d >= date && d < next;
      }).length;

      return {
        label: ['L', 'M', 'X', 'J', 'V', 'S', 'D'][i],
        count,
        isToday: i === todayIdx,
        isFuture: i > todayIdx,
      };
    });
  })();

  const maxCount = Math.max(...weekData.map(d => d.count), 1);

  // ── Precision: from week reviews (ratings 3 or 4 = correct) ──────────────
  const weekAccuracy = weekReviews.length > 0
    ? Math.round((weekReviews.filter(r => r.rating >= 3).length / weekReviews.length) * 100)
    : null;

  // ── Time: from user_stats (accumulated across all time) ──────────────────
  const totalTime   = fmtTime(stats?.totalTimeSeconds ?? 0);
  const streak      = stats?.currentStreak ?? 0;
  const bestStreak  = stats?.longestStreak ?? 0;
  const totalReviews = stats?.totalReviews ?? 0;
  const cardsLearned = stats?.cardsLearned ?? 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
    </div>
  );

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-4xl mx-auto pb-24 lg:pb-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
          Estadísticas
        </h1>
        {/* Recalculate button */}
        <button
          onClick={handleResync}
          disabled={syncing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--muted)', border: '1px solid var(--border)' }}
          title="Recalcular estadísticas"
        >
          <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Calculando…' : 'Recalcular'}
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">

        <StatCard
          icon={<Flame size={14} />}
          label="Racha actual"
          value={`${streak}d`}
          sub={`Mejor racha: ${bestStreak} días`}
          color="#f97316"
        />

        <StatCard
          icon={<Target size={14} />}
          label="Precisión"
          value={weekAccuracy !== null ? `${weekAccuracy}%` : '—'}
          sub={weekReviews.length > 0 ? `${weekReviews.length} revisiones esta semana` : 'Sin revisiones esta semana'}
          color="#10b981"
        />

        <StatCard
          icon={<Clock size={14} />}
          label="Tiempo total"
          value={totalTime}
          sub="tiempo acumulado estudiando"
          color="#6366f1"
        />

        <StatCard
          icon={<TrendingUp size={14} />}
          label="Revisiones totales"
          value={totalReviews}
          sub="todas las sesiones"
        />

        <StatCard
          icon={<Award size={14} />}
          label="Dominadas"
          value={cardsLearned}
          sub="tarjetas con 5+ correctas"
          color="#f59e0b"
        />

        <StatCard
          icon={<BookOpen size={14} />}
          label="Mazos"
          value={decks.length}
        />
      </div>

      {/* ── Weekly chart ── */}
      <div className="bg-[--card-bg] rounded-2xl border border-[--border] p-4 sm:p-6 mb-5">
        <h2 className="text-sm font-semibold mb-5" style={{ color: 'var(--foreground)' }}>
          Esta semana
        </h2>
        <div className="flex items-end gap-2 sm:gap-3" style={{ height: 120 }}>
          {weekData.map(({ label, count, isToday, isFuture }) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-xs" style={{ color: 'var(--muted)', minHeight: 16 }}>
                {count > 0 ? count : ''}
              </span>
              <div className="w-full rounded-t-lg transition-all duration-500" style={{
                height: isFuture
                  ? 3
                  : count === 0
                    ? 3
                    : Math.max(8, Math.round((count / maxCount) * 80)),
                backgroundColor: isToday
                  ? 'var(--primary)'
                  : count > 0
                    ? '#94a3b8'
                    : 'var(--accent)',
                opacity: isFuture ? 0.3 : 1,
              }} />
              <span className="text-xs font-medium" style={{
                color: isToday ? 'var(--foreground)' : 'var(--muted)',
                fontWeight: isToday ? 600 : 400,
              }}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 flex justify-between text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--muted)' }}>
          <span>{weekReviews.length} revisiones esta semana</span>
          <span>~{Math.round(weekReviews.length / 7)}/día</span>
        </div>
      </div>

      {/* ── Deck progress ── */}
      {decks.length > 0 && (
        <div className="bg-[--card-bg] rounded-2xl border border-[--border] p-4 sm:p-6">
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            Progreso por mazo
          </h2>
          <div className="flex flex-col gap-5">
            {decks.map(deck => {
              const deckWeekReviews = weekReviews.filter(r => r.deckId === deck.$id).length;

              // Progress = percentage of cards NOT due (al día)
              const pct = deck.totalCards > 0
                ? Math.min(100, Math.round(((deck.totalCards - (deck.dueCards || 0)) / deck.totalCards) * 100))
                : 0;

              // Deck-level accuracy this week
              const deckCorrect = weekReviews.filter(r => r.deckId === deck.$id && r.rating >= 3).length;
              const deckAcc = deckWeekReviews > 0
                ? Math.round((deckCorrect / deckWeekReviews) * 100)
                : null;

              return (
                <div key={deck.$id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: deck.color }} />
                      <span className="text-sm truncate" style={{ color: 'var(--foreground)' }}>{deck.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      {deckAcc !== null && (
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>
                          {deckAcc}% acierto
                        </span>
                      )}
                      <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--accent)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: deck.color }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      {deck.totalCards} tarjetas · {deck.dueCards || 0} pendientes
                    </span>
                    {deckWeekReviews > 0 && (
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>
                        {deckWeekReviews} esta semana
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
