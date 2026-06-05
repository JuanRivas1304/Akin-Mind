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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet on mobile, centered modal on sm+ */}
      <div className={cn(
        'relative bg-[--card-bg] border border-[--border] w-full fade-in',
        // Mobile: bottom sheet
        'rounded-t-2xl max-h-[90vh] overflow-y-auto',
        // Desktop: centered card
        'sm:rounded-2xl sm:shadow-xl sm:max-w-lg',
        className
      )}>
        {/* Drag handle (mobile only) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[--border]" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-[--border]">
          <h2 className="text-base font-semibold text-[--foreground]">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[--accent] text-[--muted] hover:text-[--foreground] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
