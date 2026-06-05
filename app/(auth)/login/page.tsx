'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { login } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { account } from '@/lib/appwrite';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Completa todos los campos'); return; }
    try {
      setLoading(true); setError('');
      await login(email, password);
      const user = await account.get();
      setUser(user);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err?.message?.includes('Invalid credentials') ? 'Email o contraseña incorrectos' : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-[--foreground]">Iniciar sesión</h2>
      {error && <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>}
      <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" autoComplete="email" />
      <Input label="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
      <div className="text-right">
        <Link href="/forgot-password" className="text-xs text-[--muted] hover:text-[--foreground] transition-colors">¿Olvidaste tu contraseña?</Link>
      </div>
      <Button type="submit" loading={loading} className="w-full mt-1">Entrar</Button>
      <p className="text-center text-sm text-[--muted]">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="text-[--foreground] font-medium hover:underline">Regístrate</Link>
      </p>
    </form>
  );
}
