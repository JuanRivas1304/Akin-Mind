'use client';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DECK_COLORS } from '@/lib/utils';
import { Deck } from '@/types';

interface DeckModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string; color: string }) => Promise<void>;
  deck?: Deck | null;
}

export function DeckModal({ open, onClose, onSave, deck }: DeckModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(DECK_COLORS[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (deck) {
      setName(deck.name);
      setDescription(deck.description || '');
      setColor(deck.color || DECK_COLORS[0].value);
    } else {
      setName(''); setDescription(''); setColor(DECK_COLORS[0].value);
    }
  }, [deck, open]);

  const handleSubmit = async () => {
    if (!name.trim()) { setError('El nombre es obligatorio'); return; }
    try {
      setLoading(true);
      await onSave({ name: name.trim(), description: description.trim(), color });
      onClose();
    } catch {
      setError('Error al guardar el mazo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={deck ? 'Editar mazo' : 'Nuevo mazo'}>
      <div className="flex flex-col gap-4">
        <Input label="Nombre" value={name} onChange={e => { setName(e.target.value); setError(''); }} placeholder="Ej: Japonés N5" error={error} autoFocus />
        <Textarea label="Descripción (opcional)" value={description} onChange={e => setDescription(e.target.value)} placeholder="¿De qué trata este mazo?" rows={2} />
        <div>
          <label className="text-sm font-medium text-[--foreground] block mb-2">Color</label>
          <div className="flex flex-wrap gap-2">
            {DECK_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className="w-8 h-8 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: c.value,
                  borderColor: color === c.value ? c.value : 'transparent',
                  boxShadow: color === c.value ? `0 0 0 2px white, 0 0 0 4px ${c.value}` : 'none',
                }}
                title={c.label}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={loading}>{deck ? 'Guardar cambios' : 'Crear mazo'}</Button>
        </div>
      </div>
    </Modal>
  );
}
