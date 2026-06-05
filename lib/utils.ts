import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function formatRelative(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'ahora mismo';
  if (mins < 60) return `hace ${mins}min`;
  if (hours < 24) return `hace ${hours}h`;
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} días`;
  return formatDate(date);
}

export const DECK_COLORS = [
  { label: 'Ámbar', value: '#f59e0b', bg: '#fef9ee', border: '#fde68a', text: '#92400e' },
  { label: 'Índigo', value: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', text: '#312e81' },
  { label: 'Esmeralda', value: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', text: '#14532d' },
  { label: 'Rosa', value: '#ec4899', bg: '#fdf2f8', border: '#f9a8d4', text: '#500724' },
  { label: 'Naranja', value: '#f97316', bg: '#fff7ed', border: '#fed7aa', text: '#431407' },
  { label: 'Azul', value: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', text: '#1e3a8a' },
  { label: 'Violeta', value: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', text: '#2e1065' },
  { label: 'Rojo', value: '#ef4444', bg: '#fef2f2', border: '#fecaca', text: '#450a0a' },
];

export function getDeckColors(color: string) {
  return DECK_COLORS.find(c => c.value === color) || DECK_COLORS[0];
}
