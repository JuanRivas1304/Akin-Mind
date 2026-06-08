'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Card } from '@/types';
import { Sparkles, Wand2, Copy, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';

type Mode = 'free' | 'improve' | 'mimic';
interface GeneratedCard { question: string; answer: string; tags: string[]; }

interface AIGenerateModalProps {
  open: boolean;
  onClose: () => void;
  deckName: string;
  existingCards: Card[];
  onImport: (cards: GeneratedCard[]) => Promise<void>;
}

const COUNTS = [5, 10, 20, 30];

const MODES: { key: Mode; label: string; icon: React.ReactNode; desc: string; needsCards: boolean; needsInput: boolean }[] = [
  {
    key: 'free',
    label: 'Generar desde texto',
    icon: <Sparkles size={15} />,
    desc: 'Escribe palabras, conceptos o un párrafo y la IA crea las tarjetas.',
    needsCards: false, needsInput: true,
  },
  {
    key: 'mimic',
    label: 'Usar mi formato',
    icon: <Copy size={15} />,
    desc: 'La IA aprende el estilo de tus tarjetas y genera nuevas con el mismo formato.',
    needsCards: true, needsInput: true,
  },
  {
    key: 'improve',
    label: 'Mejorar existentes',
    icon: <Wand2 size={15} />,
    desc: 'La IA revisa y mejora tus tarjetas actuales para que sean más claras y memorables.',
    needsCards: true, needsInput: false,
  },
];

export function AIGenerateModal({ open, onClose, deckName, existingCards, onImport }: AIGenerateModalProps) {
  const [mode, setMode]           = useState<Mode>('free');
  const [input, setInput]         = useState('');
  const [count, setCount]         = useState(10);
  const [loading, setLoading]     = useState(false);
  const [loadingText, setLoadingText] = useState('Analizando contenido...');
  const [loadingProgress, setLoadingProgress] = useState(10);
  const [error, setError]         = useState('');
  const [generated, setGenerated] = useState<GeneratedCard[]>([]);
  const [importing, setImporting] = useState(false);
  const [expanded, setExpanded]   = useState<number | null>(null);
  const [editing, setEditing]     = useState<number | null>(null);
  const [editQ, setEditQ]         = useState('');
  const [editA, setEditA]         = useState('');

  const currentMode = MODES.find(m => m.key === mode)!;
  const canGenerate = (currentMode.needsCards && existingCards.length === 0)
    ? false
    : currentMode.needsInput ? input.trim().length > 3 : true;

  const handleGenerate = async () => {
  setLoading(true);
  setError('');
  setGenerated([]);

  const steps = [
    { text: 'Analizando contenido...', progress: 15 },
    { text: 'Creando preguntas...', progress: 35 },
    { text: 'Generando respuestas...', progress: 60 },
    { text: 'Organizando tarjetas...', progress: 82 },
    { text: 'Finalizando...', progress: 95 },
  ];

  let current = 0;

  setLoadingText(steps[0].text);
  setLoadingProgress(steps[0].progress);

  const interval = setInterval(() => {
    current = (current + 1) % steps.length;
    setLoadingText(steps[current].text);
    setLoadingProgress(steps[current].progress);
  }, 1800);

  try {
    const actualCount = mode === 'improve' ? existingCards.length : count;

    const res = await fetch('/api/ai/generate-cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        input: input.trim(),
        existingCards: existingCards.map(c => ({
          question: c.question,
          answer: c.answer,
        })),
        count: actualCount,
        deckName,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      setError(data.error || 'Error al contactar con la IA');
      return;
    }

    setLoadingProgress(100);

    setTimeout(() => {
      setGenerated(data.cards);
      setExpanded(null);
    }, 300);

  } catch (e: any) {
    setError(e.message || 'Error de red. Revisa tu conexión.');
  } finally {
    clearInterval(interval);

    setTimeout(() => {
      setLoading(false);
      setLoadingText('Analizando contenido...');
      setLoadingProgress(10);
    }, 400);
  }
};

  const handleImport = async () => {
    setImporting(true);
    await onImport(generated);
    setImporting(false);
    setGenerated([]); setInput(''); setError('');
    onClose();
  };

  const removeCard = (i: number) => setGenerated(p => p.filter((_, idx) => idx !== i));
  const startEdit  = (i: number) => { setEditing(i); setEditQ(generated[i].question); setEditA(generated[i].answer); setExpanded(i); };
  const saveEdit   = (i: number) => { setGenerated(p => p.map((c, idx) => idx === i ? { ...c, question: editQ, answer: editA } : c)); setEditing(null); };

  const handleClose = () => {
    if (loading || importing) return;
    setGenerated([]); setInput(''); setError(''); setEditing(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="✨ Generar tarjetas con IA" className="sm:max-w-2xl">

      {generated.length === 0 ? (
        <div className="flex flex-col gap-5">

          {/* Mode tabs */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'var(--muted)' }}>Modo</p>
            <div className="flex flex-col gap-2">
              {MODES.map(m => {
                const disabled = m.needsCards && existingCards.length === 0;
                const active = mode === m.key;
                return (
                  <button
  key={m.key}
  disabled={disabled || loading}
  onClick={() => !disabled && !loading && setMode(m.key)}
                    className="flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all"
                    style={{
                      borderColor: active ? 'var(--primary)' : 'var(--border)',
                      backgroundColor: active ? 'var(--accent)' : 'transparent',
                      opacity: disabled ? 0.4 : 1,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                    }}>
                    <span className="mt-0.5 shrink-0" style={{ color: active ? 'var(--foreground)' : 'var(--muted)' }}>{m.icon}</span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{m.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        {disabled ? 'Necesitas al menos una tarjeta en el mazo' : m.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text input */}
          {currentMode.needsInput && (
            <Textarea
  label={mode === 'mimic' ? 'Nuevo contenido (la IA usará tu formato)' : 'Texto, palabras o conceptos'}
  placeholder={mode === 'free'
    ? 'Ej: thought, through, enough, thorough...\n\nO pega un párrafo, lista de verbos irregulares, conceptos de un tema...'
    : 'Escribe el nuevo contenido que quieres convertir en tarjetas con tu estilo...'}
  value={input}
  onChange={e => setInput(e.target.value)}
  rows={5}
  disabled={loading}
/>
          )}

          {/* Count selector */}
{mode !== 'improve' && (
  <div>
    <p
      className="text-xs font-semibold uppercase tracking-wider mb-2"
      style={{ color: 'var(--muted)' }}
    >
      Cantidad
    </p>

    <div className="flex gap-2 flex-wrap items-end">
      {COUNTS.map(n => (
        <button
          key={n}
          onClick={() => setCount(n)}
          className="px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all"
          style={{
            borderColor: count === n ? 'var(--primary)' : 'var(--border)',
            backgroundColor: count === n ? 'var(--primary)' : 'transparent',
            color: count === n ? 'var(--primary-fg)' : 'var(--foreground)',
          }}
        >
          {n}
        </button>
      ))}

      <div className="flex flex-col">
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-1"
          style={{ color: 'var(--muted)' }}
        >
          Personalizada
        </p>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={30}
            value={count}
            onChange={e =>
              setCount(
                Math.min(
                  30,
                  Math.max(1, parseInt(e.target.value) || 10)
                )
              )
            }
            className="w-16 px-3 py-2 rounded-xl text-sm border-2 text-center outline-none"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--accent)',
              color: 'var(--foreground)',
            }}
          />

          <span
            className="text-xs whitespace-nowrap"
            style={{ color: 'var(--muted)' }}
          >
            máx. 30
          </span>
        </div>
      </div>
    </div>
  </div>
)}

          {mode === 'improve' && existingCards.length > 0 && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'var(--accent)', color: 'var(--muted)' }}>
              Se mejorarán <strong style={{ color: 'var(--foreground)' }}>{existingCards.length} tarjetas</strong> del mazo &ldquo;{deckName}&rdquo;.
            </div>
          )}

          {loading && (
            <div
              className="rounded-2xl p-4 border"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--accent)',
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-5 h-5 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: 'rgba(255,255,255,0.2)',
                    borderTopColor: 'var(--primary)',
                  }}
                />

                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {loadingText}
                  </p>

                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--muted)' }}
                  >
                    La IA está generando tus tarjetas...
                  </p>
                </div>
              </div>

              <div
                className="w-full h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--border)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${loadingProgress}%`,
                    backgroundColor: 'var(--primary)',
                  }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm"
              style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
              <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}

          

         <div className="mt-3 rounded-xl border border-[--border] bg-[--accent] px-3 py-2">
            <p className="text-xs text-[--muted] opacity-80 leading-relaxed">
              La generación de tarjetas con IA puede tardar algunos segundos dependiendo
              de la cantidad de tarjetas y el modo seleccionado.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={loading || importing}
            >
              Cancelar
            </Button>

            <Button
              onClick={handleGenerate}
              loading={loading}
              disabled={!canGenerate || loading || importing}
              className={loading ? 'cursor-wait opacity-90' : ''}
            >
              <Sparkles size={15} />
              {loading ? loadingText : 'Generar tarjetas'}
            </Button>
          </div>
        </div>

      ) : (
        /* Step 2 — Review */
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              {generated.length} tarjetas — revisa antes de importar
            </p>
            <button onClick={() => setGenerated([])}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ color: 'var(--muted)', backgroundColor: 'var(--accent)' }}>
              ← Volver
            </button>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: '50vh' }}>
            {generated.map((card, i) => (
              <div key={i} className="rounded-xl border overflow-hidden"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}>
                <div className="flex items-center gap-2 px-4 py-3">
                  <span className="text-xs shrink-0 tabular-nums font-medium" style={{ color: 'var(--muted)' }}>#{i + 1}</span>
                  <p className="text-sm flex-1 truncate" style={{ color: 'var(--foreground)' }}>{card.question}</p>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(i)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--muted)' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => removeCard(i)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--muted)' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; }}>
                      <Trash2 size={12} />
                    </button>
                    <button onClick={() => setExpanded(expanded === i ? null : i)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--muted)' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      {expanded === i ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>
                </div>

                {expanded === i && (
                  <div className="px-4 pb-4 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    {editing === i ? (
                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted)' }}>Pregunta</label>
                          <textarea value={editQ} onChange={e => setEditQ(e.target.value)} rows={2}
                            className="w-full text-sm px-3 py-2 rounded-lg outline-none resize-none"
                            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--accent)', color: 'var(--foreground)' }} />
                        </div>
                        <div>
                          <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted)' }}>Respuesta</label>
                          <textarea value={editA} onChange={e => setEditA(e.target.value)} rows={3}
                            className="w-full text-sm px-3 py-2 rounded-lg outline-none resize-none"
                            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--accent)', color: 'var(--foreground)' }} />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(i)} className="px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-fg)' }}>Guardar</button>
                          <button onClick={() => setEditing(null)} className="px-3 py-1.5 rounded-lg text-xs"
                            style={{ color: 'var(--muted)', backgroundColor: 'var(--accent)' }}>Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Pregunta</p>
                          <p className="text-sm" style={{ color: 'var(--foreground)' }}>{card.question}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Respuesta</p>
                          <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>{card.answer}</p>
                        </div>
                        {card.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {card.tags.map(t => (
                              <span key={t} className="px-2 py-0.5 rounded-full text-xs"
                                style={{ backgroundColor: 'var(--accent)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <Button variant="secondary" onClick={() => setGenerated([])}>Regenerar</Button>
            <Button onClick={handleImport} loading={importing}>
              <CheckCircle2 size={15} />
              {importing ? 'Importando…' : `Importar ${generated.length} tarjetas`}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
