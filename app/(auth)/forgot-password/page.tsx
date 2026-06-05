'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { sendPasswordReset } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Ingresa tu email'); return; }
    try {
      setLoading(true);
      await sendPasswordReset(email);
      setSent(true);
    } catch {
      setError('Error al enviar el email. Verifica que la cuenta existe.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-950 flex items-center justify-center mx-auto mb-4 text-2xl">✉️</div>
      <h2 className="font-semibold text-[--foreground] mb-2">Email enviado</h2>
      <p className="text-sm text-[--muted] mb-4">Revisa tu bandeja de entrada y sigue las instrucciones.</p>
      <Link href="/login" className="text-sm text-[--foreground] font-medium hover:underline">Volver al inicio de sesión</Link>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-[--foreground]">Recuperar contraseña</h2>
      <p className="text-sm text-[--muted]">Te enviaremos un enlace para restablecer tu contraseña.</p>
      {error && <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>}
      <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
      <Button type="submit" loading={loading} className="w-full">Enviar enlace</Button>
      <Link href="/login" className="text-center text-sm text-[--muted] hover:text-[--foreground] transition-colors">← Volver</Link>
    </form>
  );
}
