'use client';
import { useEffect, useState, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';

/**
 * Popup flotante que aparece cuando el usuario selecciona texto dentro
 * del contenedor padre. Muestra un botón "🔊 Escuchar selección".
 * 
 * Uso: envuelve el texto de la tarjeta con <SelectionSpeakPopup>
 */
export function SelectionSpeakPopup({ children }: { children: React.ReactNode }) {
  const { speak, stop, speaking, supported } = useSpeech();
  const [popup, setPopup] = useState<{ x: number; y: number; text: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!supported) return;

    const handleSelectionChange = () => {
      const sel = window.getSelection();
      const selected = sel?.toString().trim();

      // Hide if nothing selected or selection is outside our container
      if (!selected || selected.length < 1) {
        setPopup(null);
        return;
      }

      // Check that selection is inside our container
      if (containerRef.current && sel?.rangeCount) {
        const range = sel.getRangeAt(0);
        const container = containerRef.current;
        if (!container.contains(range.commonAncestorContainer)) {
          setPopup(null);
          return;
        }

        // Position popup above the selection
        const rect = range.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        setPopup({
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top - 8,
          text: selected,
        });
      }
    };

    // Listen for mouseup and touchend to catch end of selection
    const handleUp = () => setTimeout(handleSelectionChange, 10);

    document.addEventListener('mouseup', handleUp);
    document.addEventListener('touchend', handleUp);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchend', handleUp);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [supported]);

  // Hide popup when clicking outside it
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popup && popupRef.current && !popupRef.current.contains(e.target as Node)) {
        // Only clear if the click is not creating a new selection
        setTimeout(() => {
          const sel = window.getSelection()?.toString().trim();
          if (!sel) setPopup(null);
        }, 50);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [popup]);

  const handleSpeak = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!popup) return;
    if (speaking) stop();
    else speak(popup.text);
  };

  return (
    <div ref={containerRef} className="relative w-full flex-1 flex items-center justify-center">
      {children}

      {/* Floating popup */}
      {popup && (
        <button
          ref={popupRef}
          onMouseDown={handleSpeak}  // mousedown so it fires before selection clears
          className="absolute z-40 flex items-center gap-1.5 rounded-xl text-xs font-semibold shadow-lg transition-all active:scale-95"
          style={{
            left: Math.max(0, popup.x - 70),
            top: popup.y - 36,
            transform: 'translateY(-100%)',
            backgroundColor: speaking ? '#1d4ed8' : '#1e1e1e',
            color: '#ffffff',
            padding: '6px 12px',
            border: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
          }}
        >
          <Volume2 size={13} />
          {speaking ? 'Reproduciendo…' : `Escuchar "${popup.text.length > 20 ? popup.text.slice(0, 20) + '…' : popup.text}"`}

          {/* Arrow pointing down */}
          <span style={{
            position: 'absolute',
            bottom: -5,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: `5px solid ${speaking ? '#1d4ed8' : '#1e1e1e'}`,
          }} />
        </button>
      )}
    </div>
  );
}
