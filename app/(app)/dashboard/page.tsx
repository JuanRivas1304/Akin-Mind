'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDecks, getDueCards, getTodayReviews, getUserStats } from '@/lib/database';
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

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [dueCards, setDueCards] = useState<Card[]>([]);
  const [todayReviews, setTodayReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getDecks(user.$id),
      getDueCards(user.$id, 50),
      getTodayReviews(user.$id),
      getUserStats(user.$id),
    ]).then(([d, c, r, s]) => {
      setDecks(d); setDueCards(c); setTodayReviews(r); setStats(s);
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
  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const today = new Date().getDay();

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[--foreground]">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-[--muted] text-sm mt-1">
          {dueCards.length > 0
            ? `Tienes ${dueCards.length} tarjeta${dueCards.length > 1 ? 's' : ''} pendiente${dueCards.length > 1 ? 's' : ''} hoy`
            : '¡Estás al día! No hay tarjetas pendientes'}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard label="Pendientes" value={dueCards.length} icon={<Clock size={12} />} sub="para hoy" />
        <StatCard label="Estudiadas hoy" value={todayReviews.length} icon={<CheckCircle size={12} />} />
        <StatCard label="Racha" value={`${streak} días`} icon={<Flame size={12} />} sub={streak > 0 ? '¡Sigue así!' : 'Empieza hoy'} />
        <StatCard label="Total mazos" value={decks.length} icon={<BookOpen size={12} />} />
      </div>

      {/* Streak week */}
      <div className="bg-[--card-bg] rounded-2xl border border-[--border] p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[--foreground]">Esta semana</h2>
          {streak > 0 && <span className="flex items-center gap-1 text-xs text-orange-500 font-medium"><Flame size={12} /> {streak} días de racha</span>}
        </div>
        <div className="flex gap-2">
          {days.map((d, i) => {
            const isToday = i === (today === 0 ? 6 : today - 1);
            const studied = i < (today === 0 ? 6 : today - 1);
            return (
              <div key={d} className={`flex-1 flex flex-col items-center gap-1.5`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium transition-colors
                  ${isToday ? 'bg-[--primary] text-[--primary-fg]' :
                    studied ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    'bg-[--accent] text-[--muted]'}`}>
                  {studied && !isToday ? '✓' : d}
                </div>
                <span className="text-xs text-[--muted]">{d}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA if due cards */}
      {dueCards.length > 0 && decks.length > 0 && (
        <div className="bg-[--primary] rounded-2xl p-5 mb-6 flex items-center justify-between">
          <div>
            <p className="text-[--primary-fg] font-semibold mb-0.5">¡Es hora de estudiar!</p>
            <p className="text-[--primary-fg]/60 text-sm">{dueCards.length} tarjetas esperan tu revisión</p>
          </div>
          <Button variant="secondary" onClick={() => router.push('/decks')} className="shrink-0">
            <Zap size={14} /> Estudiar ahora
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
                  className="bg-[--card-bg] rounded-xl border border-[--border] px-4 py-3 flex items-center gap-3 hover:border-[--primary]/20 cursor-pointer transition-colors"
                  onClick={() => router.push(`/decks/${deck.$id}`)}>
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: deck.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[--foreground] truncate">{deck.name}</p>
                    <p className="text-xs text-[--muted]">{deck.totalCards} tarjetas{deck.lastStudied ? ` · ${formatRelative(deck.lastStudied)}` : ''}</p>
                  </div>
                  {deck.dueCards > 0 ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={{ backgroundColor: colors.bg, color: colors.text }}>
                      {deck.dueCards} pendientes
                    </span>
                  ) : (
                    <span className="text-xs text-green-500 font-medium shrink-0">✓ Al día</span>
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
