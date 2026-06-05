'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { register } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { account } from '@/lib/appwrite';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { setError('Completa todos los campos'); return; }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    try {
      setLoading(true); setError('');
      await register(name, email, password);
      const user = await account.get();
      setUser(user);
      router.replace('/dashboard');
    } catch (err: any) {
      if (err?.message?.includes('already exists')) setError('Este email ya está registrado');
      else setError('Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-[--foreground]">Crear cuenta</h2>
      {error && <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>}
      <Input label="Nombre" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" autoComplete="name" />
      <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" autoComplete="email" />
      <Input label="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
      <Button type="submit" loading={loading} className="w-full mt-1">Crear cuenta gratis</Button>
      <p className="text-center text-sm text-[--muted]">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-[--foreground] font-medium hover:underline">Inicia sesión</Link>
      </p>
    </form>
  );
}
