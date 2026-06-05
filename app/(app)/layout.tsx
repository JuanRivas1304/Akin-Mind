'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { logout } from '@/lib/auth';
import { LayoutDashboard, Layers, BarChart2, LogOut, BookOpen } from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/decks', label: 'Mazos', icon: Layers },
  { href: '/stats', label: 'Estadísticas', icon: BarChart2 },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, setUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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

  return (
    <div className="min-h-screen bg-[--background] flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-[--border] bg-[--card-bg] flex flex-col h-screen sticky top-0">
        <div className="px-5 py-5 border-b border-[--border]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[--primary] text-[--primary-fg] flex items-center justify-center font-bold text-sm">M</div>
            <span className="font-semibold text-[--foreground]">Memori</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${active ? 'bg-[--primary] text-[--primary-fg]' : 'text-[--muted] hover:bg-[--accent] hover:text-[--foreground]'}`}>
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
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
