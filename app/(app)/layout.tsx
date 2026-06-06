'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { logout } from '@/lib/auth';
import { LayoutDashboard, Layers, BarChart2, LogOut, Menu, X } from 'lucide-react';

// ─── CONFIGURA TU MARCA AQUÍ ─────────────────────────────────────────────────
const BRAND = {
  name: 'AkinMind',
  letter: 'A',
  logoSrc: '/icon.png', // Pon tu imagen en /public/logo.png  (null = solo letra)
};
// ─────────────────────────────────────────────────────────────────────────────

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/decks', label: 'Mazos', icon: Layers },
  { href: '/stats', label: 'Estadísticas', icon: BarChart2 },
];

function BrandLogo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const [imgError, setImgError] = useState(false);
  const dim = size === 'sm' ? 24 : 32;
  const cls = size === 'sm' ? 'w-6 h-6 rounded-full text-xs' : 'w-8 h-8 rounded-full text-sm';

  if (BRAND.logoSrc && !imgError) {
    return (
      <div className={`${cls} overflow-hidden shrink-0 ring-2 ring-white/10`} style={{ backgroundColor: 'var(--accent)' }}>
        <Image
          src={BRAND.logoSrc}
          alt={BRAND.name}
          width={dim}
          height={dim}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }
  return (
    <div className={`${cls} flex items-center justify-center font-bold shrink-0`}
      style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-fg)' }}>
      {BRAND.letter}
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, setUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
    </div>
  );
  if (!user) return null;

  const handleLogout = async () => {
    await logout(); setUser(null); router.replace('/login');
  };

  // Shared sidebar markup used in both desktop sidebar and mobile drawer
  const SidebarInner = () => (
    <>
      {/* Brand header */}
      <div className="px-5 py-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <BrandLogo size="md" />
          <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{BRAND.name}</span>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--muted)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: active ? 'var(--primary)' : 'transparent',
                color: active ? 'var(--primary-fg)' : 'var(--muted)',
              }}
              onMouseEnter={e => {
                if (!active) e.currentTarget.style.backgroundColor = 'var(--accent)';
              }}
              onMouseLeave={e => {
                if (!active) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="px-3 py-2 mb-1">
          <p className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>{user.name}</p>
          <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{user.email}</p>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm w-full transition-colors"
          style={{ color: 'var(--muted)' }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)';
            e.currentTarget.style.color = '#dc2626';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--muted)';
          }}
        >
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--background)' }}>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col h-screen sticky top-0"
        style={{ backgroundColor: 'var(--card-bg)', borderRight: '1px solid var(--border)' }}>
        <SidebarInner />
      </aside>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Solid overlay — no transparency problems */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer — fully opaque */}
          <aside className="relative z-50 w-64 h-full flex flex-col shadow-2xl slide-up"
            style={{ backgroundColor: 'var(--card-bg)' }}>
            <SidebarInner />
          </aside>
        </div>
      )}

      {/* ── Page content ── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3"
          style={{ backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--muted)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" />
            <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{BRAND.name}</span>
          </div>
          <span className="ml-auto text-xs font-medium" style={{ color: 'var(--muted)' }}>
            {NAV.find(n => pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href)))?.label ?? ''}
          </span>
        </header>

        <main className="flex-1">{children}</main>

        {/* Mobile bottom navigation */}
        <nav className="lg:hidden sticky bottom-0 z-30 flex"
          style={{ backgroundColor: 'var(--card-bg)', borderTop: '1px solid var(--border)' }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors"
                style={{ color: active ? 'var(--foreground)' : 'var(--muted)' }}>
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
