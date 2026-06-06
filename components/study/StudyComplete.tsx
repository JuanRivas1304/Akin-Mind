'use client';
import { SessionResult } from './StudySession';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowLeft, RotateCcw, TrendingUp, Clock, Target, Flame } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface StudyCompleteProps {
  deckId: string;
  deckName: string;
  result: SessionResult;
  onStudyMore: () => void;  // Go back to lobby
}

function pad(n: number) { return String(n).padStart(2, '0'); }
function fmtTime(s: number) {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${pad(s % 60)}s`;
}

export function StudyComplete({ deckId, deckName, result, onStudyMore }: StudyCompleteProps) {
  const router = useRouter();
  const { total, correct, hard, timeSeconds } = result;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const avgTime  = total > 0 ? Math.round(timeSeconds / total) : 0;

  // Choose emoji + message based on accuracy
  const { emoji, title, subtitle } = (() => {
    if (accuracy >= 90) return { emoji: '🏆', title: '¡Excelente sesión!', subtitle: 'Tu memoria está en forma.' };
    if (accuracy >= 70) return { emoji: '✨', title: '¡Buen trabajo!',      subtitle: 'Sigue así cada día.' };
    if (accuracy >= 50) return { emoji: '💪', title: '¡Sesión completada!', subtitle: 'La práctica hace al maestro.' };
    return                      { emoji: '🌱', title: '¡Sesión completada!', subtitle: 'Estas tarjetas volverán pronto.' };
  })();

  const stats = [
    { label: 'Tarjetas',   value: total,          icon: Target,    color: '#6366f1' },
    { label: 'Correctas',  value: correct,         icon: CheckCircle, color: '#16a34a' },
    { label: 'Difíciles',  value: hard,            icon: Flame,     color: '#dc2626' },
    { label: 'Tiempo',     value: fmtTime(timeSeconds), icon: Clock, color: '#f59e0b' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-sm">

        {/* Trophy */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-sm"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            {emoji}
          </div>
          <h1 className="text-2xl font-semibold text-center mb-1"
            style={{ color: 'var(--foreground)' }}>{title}</h1>
          <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>{subtitle}</p>
        </div>

        {/* Accuracy ring (simple) */}
        <div className="rounded-2xl p-5 mb-4 text-center"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
          <div className="text-5xl font-bold mb-1"
            style={{ color: accuracy >= 70 ? '#16a34a' : accuracy >= 50 ? '#d97706' : '#dc2626' }}>
            {accuracy}%
          </div>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>de respuestas correctas</p>

          {/* Accuracy bar */}
          <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--accent)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${accuracy}%`,
                backgroundColor: accuracy >= 70 ? '#16a34a' : accuracy >= 50 ? '#d97706' : '#dc2626',
              }} />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl p-3.5 flex items-center gap-3"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: color + '15' }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <div className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>{value}</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Time per card */}
        {avgTime > 0 && (
          <p className="text-center text-xs mb-6" style={{ color: 'var(--muted)' }}>
            <TrendingUp size={11} className="inline mr-1" />
            {avgTime}s por tarjeta en promedio
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button size="lg" onClick={onStudyMore} className="w-full">
            <RotateCcw size={16} /> Estudiar más
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => router.push(`/decks/${deckId}`)} className="w-full">
              <ArrowLeft size={15} /> Al mazo
            </Button>
            <Button variant="secondary" onClick={() => router.push('/dashboard')} className="w-full">
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
