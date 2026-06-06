'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

export type SpeechLang = 'en-US' | 'en-GB' | 'es-ES' | 'fr-FR' | 'de-DE' | 'ja-JP' | 'it-IT' | 'pt-BR';

export const SPEECH_LANGS: { code: SpeechLang; label: string; flag: string }[] = [
  { code: 'en-US', label: 'Inglés (EE.UU.)', flag: '🇺🇸' },
  { code: 'en-GB', label: 'Inglés (UK)',     flag: '🇬🇧' },
  { code: 'es-ES', label: 'Español',          flag: '🇪🇸' },
  { code: 'fr-FR', label: 'Francés',          flag: '🇫🇷' },
  { code: 'de-DE', label: 'Alemán',           flag: '🇩🇪' },
  { code: 'ja-JP', label: 'Japonés',          flag: '🇯🇵' },
  { code: 'it-IT', label: 'Italiano',         flag: '🇮🇹' },
  { code: 'pt-BR', label: 'Portugués',        flag: '🇧🇷' },
];

const STORAGE_KEY = 'memori_speech_lang';

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [lang, setLangState] = useState<SpeechLang>('en-US');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    const saved = localStorage.getItem(STORAGE_KEY) as SpeechLang | null;
    if (saved) setLangState(saved);
  }, []);

  // Stop speech when component unmounts
  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  const setLang = useCallback((l: SpeechLang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  /**
   * speak(text) — reproduce el texto completo
   * speak(text, { selection: 'word' }) — extrae solo la primera palabra en inglés/fonema
   */
  const speak = useCallback((text: string, opts?: { rate?: number }) => {
    if (!supported) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang  = lang;
    utterance.rate  = opts?.rate ?? 0.9;   // ligeramente más lento para pronunciación
    utterance.pitch = 1;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend   = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [supported, lang]);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking, supported, lang, setLang };
}

/**
 * Extrae el "fragmento pronunciable" de un texto.
 * Ejemplos:
 *   "pronunciación: thought"  → "thought"
 *   "¿Cómo se dice 'water'?"  → "water"
 *   "Hello"                   → "Hello"
 *   "to run / running"        → "to run"  (primer segmento)
 */
export function extractSpeakable(text: string): string {
  // Si hay dos puntos, tomar lo que está después (ej "pronunciación: thought")
  const colonParts = text.split(':');
  if (colonParts.length >= 2) {
    const after = colonParts.slice(1).join(':').trim();
    if (after.length > 0 && after.length < 100) return after;
  }

  // Si hay comillas simples o dobles, extraer el contenido
  const quoted = text.match(/['"""'']([\w\s'-]+)['"""'']/);
  if (quoted) return quoted[1].trim();

  // Si hay barra (/), tomar el primer segmento
  const slashParts = text.split('/');
  if (slashParts.length >= 2 && slashParts[0].trim().length < 50) {
    return slashParts[0].trim();
  }

  // Texto completo como fallback
  return text.trim();
}
