'use client';
import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, ChevronDown, Check } from 'lucide-react';
import { useSpeech, SPEECH_LANGS, SpeechLang } from '@/hooks/useSpeech';

interface SpeakButtonProps {
  text: string;
  size?: 'sm' | 'md';
  label?: string;
}

export function SpeakButton({ text, size = 'md', label }: SpeakButtonProps) {
  const { speak, stop, speaking, supported, lang, setLang } = useSpeech();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  if (!supported) return null;

  const isSmall = size === 'sm';
  const currentFlag = SPEECH_LANGS.find(l => l.code === lang)?.flag ?? '🔊';

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (speaking) stop();
    else speak(text);
  };

  return (
    <div className="relative flex items-center gap-0.5 shrink-0" ref={menuRef}>
      {/* Play button */}
      <button
        onClick={handleSpeak}
        title={speaking ? 'Detener' : `Escuchar${label ? `: ${label}` : ''}`}
        className="flex items-center gap-1.5 rounded-xl transition-all active:scale-95"
        style={{
          padding: isSmall ? '4px 8px' : '6px 12px',
          backgroundColor: speaking ? '#eff6ff' : 'var(--accent)',
          color: speaking ? '#2563eb' : 'var(--muted)',
          border: `1.5px solid ${speaking ? '#bfdbfe' : 'var(--border)'}`,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--foreground)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = speaking ? '#2563eb' : 'var(--muted)'; }}
      >
        {speaking ? <VolumeX size={isSmall ? 12 : 14} /> : <Volume2 size={isSmall ? 12 : 14} />}
        {!isSmall && <span className="text-xs font-medium">{speaking ? 'Parar' : (label ?? 'Escuchar')}</span>}
        {speaking && (
          <span className="flex gap-0.5 items-end" style={{ height: 12 }}>
            {[8, 12, 6].map((h, i) => (
              <span key={i} className="w-0.5 rounded-full animate-pulse"
                style={{ height: h, backgroundColor: '#2563eb', animationDelay: `${i * 0.15}s`, display: 'inline-block' }} />
            ))}
          </span>
        )}
      </button>

      {/* Language picker */}
      <button
        onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
        className="flex items-center gap-0.5 rounded-xl transition-all"
        style={{
          padding: isSmall ? '4px 5px' : '6px 7px',
          backgroundColor: 'var(--accent)',
          color: 'var(--muted)',
          border: '1.5px solid var(--border)',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
      >
        <span style={{ fontSize: isSmall ? 11 : 13 }}>{currentFlag}</span>
        <ChevronDown size={9} style={{ opacity: 0.5 }} />
      </button>

      {menuOpen && (
        <div className="absolute bottom-full mb-2 right-0 z-50 rounded-xl py-1.5 min-w-[195px]"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.14)' }}
          onClick={e => e.stopPropagation()}>
          <p className="px-3 pb-1.5 pt-0.5 text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
            Idioma
          </p>
          {SPEECH_LANGS.map(l => (
            <button key={l.code}
              onClick={e => { e.stopPropagation(); setLang(l.code); setMenuOpen(false); setTimeout(() => speak(text), 50); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left transition-colors"
              style={{ backgroundColor: lang === l.code ? 'var(--accent)' : 'transparent', color: 'var(--foreground)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = lang === l.code ? 'var(--accent)' : 'transparent')}>
              <span style={{ fontSize: 15 }}>{l.flag}</span>
              <span className="flex-1">{l.label}</span>
              {lang === l.code && <Check size={12} style={{ color: 'var(--primary)' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
