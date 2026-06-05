'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDecks } from '@/hooks/useDecks';
import { DeckCard } from '@/components/decks/DeckCard';
import { DeckModal } from '@/components/decks/DeckModal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Deck } from '@/types';
import { Plus, Layers, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export default function DecksPage() {
  const { user } = useAuth();
  const { decks, loading, create, update, remove } = useDecks(user?.$id);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [search, setSearch] = useState('');

  const filtered = decks.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (data: { name: string; description: string; color: string }) => {
    if (editingDeck) {
      await update(editingDeck.$id, data);
    } else {
      await create(data);
    }
  };

  const handleEdit = (deck: Deck) => { setEditingDeck(deck); setModalOpen(true); };
  const handleClose = () => { setModalOpen(false); setEditingDeck(null); };

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[--foreground]">Mis mazos</h1>
          <p className="text-[--muted] text-sm mt-0.5">{decks.length} {decks.length === 1 ? 'mazo' : 'mazos'}</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Nuevo mazo
        </Button>
      </div>

      {decks.length > 3 && (
        <div className="mb-5 max-w-xs">
          <Input placeholder="Buscar mazos…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-[--accent] rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Layers size={24} />}
          title={search ? 'Sin resultados' : 'Sin mazos todavía'}
          description={search ? 'Prueba con otra búsqueda' : 'Crea tu primer mazo para empezar a estudiar con flashcards'}
          action={!search ? { label: 'Crear mi primer mazo', onClick: () => setModalOpen(true) } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(deck => (
            <DeckCard key={deck.$id} deck={deck} onEdit={handleEdit} onDelete={remove} />
          ))}
        </div>
      )}

      <DeckModal open={modalOpen} onClose={handleClose} onSave={handleSave} deck={editingDeck} />
    </div>
  );
}
