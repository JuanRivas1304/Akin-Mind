'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

// Debe coincidir con el BRAND del app layout
const BRAND = {
  name: 'AkinMind',
  letter: 'A',
  logoSrc: '/icon.png', // null para usar solo letra
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[--background] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {/* Logo */}
          {BRAND.logoSrc && !imgError ? (
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl overflow-hidden bg-[--accent] mb-4">
              <Image
                src={BRAND.logoSrc}
                alt={BRAND.name}
                width={56}
                height={56}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[--primary] text-[--primary-fg] text-2xl font-bold mb-4">
              {BRAND.letter}
            </div>
          )}
          <h1 className="text-2xl font-semibold text-[--foreground]">{BRAND.name}</h1>
          <p className="text-[--muted] text-sm mt-1">Aprende más, recuerda más</p>
        </div>
        <div className="bg-[--card-bg] rounded-2xl border border-[--border] p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
