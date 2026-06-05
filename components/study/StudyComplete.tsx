'use client';
import { Button } from '@/components/ui/Button';
import { CheckCircle, ArrowLeft, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StudyCompleteProps {
  deckName: string;
  totalReviewed: number;
  onStudyAgain: () => void;
}

export function StudyComplete({ deckName, totalReviewed, onStudyAgain }: StudyCompleteProps) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[--background] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-green-50 dark:bg-green-950 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-semibold text-[--foreground] mb-2">¡Sesión completada!</h1>
        <p className="text-[--muted] mb-2">Has repasado <strong className="text-[--foreground]">{totalReviewed} tarjetas</strong> de</p>
        <p className="text-[--muted] font-medium text-[--foreground] mb-8">{deckName}</p>
        <div className="bg-green-50 dark:bg-green-950 rounded-2xl p-5 mb-8 text-left">
          <p className="text-sm text-green-700 dark:text-green-400">
            El algoritmo de repetición espaciada ha calculado la próxima fecha de revisión para cada tarjeta. Vuelve mañana para seguir progresando.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => router.push('/dashboard')}>
            <ArrowLeft size={16} /> Dashboard
          </Button>
          <Button onClick={onStudyAgain}>
            <RotateCcw size={16} /> Estudiar de nuevo
          </Button>
        </div>
      </div>
    </div>
  );
}
