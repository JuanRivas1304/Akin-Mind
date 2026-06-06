'use client';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Solid dark overlay — no backdrop-blur that fails on some browsers */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        onClick={onClose}
      />

      {/* Modal panel — fully opaque, never transparent */}
      <div className={cn(
        'relative w-full fade-in',
        // Mobile: bottom sheet with rounded top corners
        'rounded-t-2xl max-h-[92vh] overflow-y-auto',
        // Desktop: centered card
        'sm:rounded-2xl sm:shadow-2xl sm:max-w-lg',
        className
      )}
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
      >
        {/* Drag handle — mobile only */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--muted)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
