'use client';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/types';
import { X } from 'lucide-react';

interface CardModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { question: string; answer: string; tags: string[] }) => Promise<void>;
  card?: Card | null;
}

export function CardModal({ open, onClose, onSave, card }: CardModalProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (card) {
      setQuestion(card.question); setAnswer(card.answer); setTags(card.tags || []);
    } else {
      setQuestion(''); setAnswer(''); setTags([]);
    }
    setTagInput(''); setErrors({});
  }, [card, open]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!question.trim()) errs.question = 'La pregunta es obligatoria';
    if (!answer.trim()) errs.answer = 'La respuesta es obligatoria';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      setLoading(true);
      await onSave({ question: question.trim(), answer: answer.trim(), tags });
      onClose();
    } catch {
      setErrors({ form: 'Error al guardar la tarjeta' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={card ? 'Editar tarjeta' : 'Nueva tarjeta'}>
      <div className="flex flex-col gap-4">
        <Textarea label="Pregunta" value={question} onChange={e => { setQuestion(e.target.value); setErrors(p => ({ ...p, question: '' })); }}
          placeholder="¿Cuál es la capital de Francia?" error={errors.question} rows={3} />
        <Textarea label="Respuesta" value={answer} onChange={e => { setAnswer(e.target.value); setErrors(p => ({ ...p, answer: '' })); }}
          placeholder="París" error={errors.answer} rows={3} />
        <div>
          <label className="text-sm font-medium text-[--foreground] block mb-1.5">Etiquetas</label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {tags.map(t => (
              <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[--accent] text-xs text-[--muted] border border-[--border]">
                {t}
                <button onClick={() => setTags(prev => prev.filter(x => x !== t))} className="hover:text-red-500">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="vocabulario, gramática…" value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} className="flex-1" />
            <Button variant="secondary" size="sm" onClick={addTag}>Añadir</Button>
          </div>
        </div>
        {errors.form && <p className="text-xs text-red-500">{errors.form}</p>}
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={loading}>{card ? 'Guardar cambios' : 'Crear tarjeta'}</Button>
        </div>
      </div>
    </Modal>
  );
}
