'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[--background] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[--primary] text-[--primary-fg] text-xl font-bold mb-4">M</div>
          <h1 className="text-2xl font-semibold text-[--foreground]">Memori</h1>
          <p className="text-[--muted] text-sm mt-1">Aprende más, recuerda más</p>
        </div>
        <div className="bg-[--card-bg] rounded-2xl border border-[--border] p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
