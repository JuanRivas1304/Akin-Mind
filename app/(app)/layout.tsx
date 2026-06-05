'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { logout } from '@/lib/auth';
import { LayoutDashboard, Layers, BarChart2, LogOut, Menu, X } from 'lucide-react';

// ─── CONFIGURA TU MARCA AQUÍ ────────────────────────────────────────────────
const BRAND = {
  name: 'AkinMind',       // Nombre que aparece en el sidebar
  letter: 'A',            // Letra de respaldo si no hay imagen
  logoSrc: '/icon.png',   // Pon tu imagen en /public/logo.png  (o null para usar letra)
  // logoSrc: null,        // ← descomenta esta línea para usar solo la letra
};
// ─────────────────────────────────────────────────────────────────────────────

function BrandLogo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const [imgError, setImgError] = useState(false);
  const dim = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  const text = size === 'sm' ? 'text-xs' : 'text-sm';

  if (BRAND.logoSrc && !imgError) {
    return (
      <div className={`${dim} rounded-full overflow-hidden shrink-0 bg-[--accent]`}>
        <Image
          src={BRAND.logoSrc}
          alt={BRAND.name}
          width={size === 'sm' ? 24 : 32}
          height={size === 'sm' ? 24 : 32}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`${dim} rounded-full bg-[--primary] text-[--primary-fg] flex items-center justify-center font-bold ${text} shrink-0`}>
      {BRAND.letter}
    </div>
  );
}

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/decks', label: 'Mazos', icon: Layers },
  { href: '/stats', label: 'Estadísticas', icon: BarChart2 },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, setUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading) return (
    <div className="min-h-screen bg-[--background] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[--primary]/20 border-t-[--primary] rounded-full animate-spin" />
    </div>
  );
  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    setUser(null);
    router.replace('/login');
  };

  const SidebarContent = () => (
    <>
      <div className="px-5 py-5 border-b border-[--border] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BrandLogo size="md" />
          <span className="font-semibold text-[--foreground]">{BRAND.name}</span>
        </div>
        {/* Close button only on mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg hover:bg-[--accent] text-[--muted]"
        >
          <X size={18} />
        </button>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${active
                  ? 'bg-[--primary] text-[--primary-fg]'
                  : 'text-[--muted] hover:bg-[--accent] hover:text-[--foreground]'
                }`}>
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-[--border]">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs font-medium text-[--foreground] truncate">{user.name}</p>
          <p className="text-xs text-[--muted] truncate">{user.email}</p>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[--muted] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 w-full transition-colors">
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[--background] flex">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-56 shrink-0 border-r border-[--border] bg-[--card-bg] flex-col h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile overlay + drawer ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative z-50 w-64 bg-[--card-bg] h-full flex flex-col shadow-xl slide-up">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-[--card-bg] border-b border-[--border]">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl hover:bg-[--accent] text-[--muted] transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" />
            <span className="font-semibold text-sm text-[--foreground]">{BRAND.name}</span>
          </div>
          {/* Active page label */}
          <span className="ml-auto text-xs text-[--muted] font-medium">
            {NAV.find(n => pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href)))?.label ?? ''}
          </span>
        </header>

        <main className="flex-1">{children}</main>

        {/* Mobile bottom navigation */}
        <nav className="lg:hidden sticky bottom-0 z-30 flex border-t border-[--border] bg-[--card-bg]">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors
                  ${active ? 'text-[--foreground]' : 'text-[--muted]'}`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
