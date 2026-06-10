'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, Users, Shield, LogOut, ChevronRight, ArrowDownUp, BarChart2, Home, Menu, X } from 'lucide-react';

const NAV = [
  { href: '/admin', icon: LayoutDashboard, label: 'Overview' },
  { href: '/admin/users', icon: Users, label: 'Members' },
  { href: '/admin/transactions', icon: ArrowDownUp, label: 'Transactions' },
  { href: '/admin/reports', icon: BarChart2, label: 'Reports' },
  { href: '/', icon: Home, label: 'Home' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-amber-900/20">
        <Link href="/admin" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
          <Image src="/logo.jpeg" alt="Bold Gains" width={40} height={40} className="rounded-full ring-2 ring-amber-500/40" />
          <div>
            <div className="font-black text-sm gold-gradient tracking-wider">BOLD GAINS</div>
            <div className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 mt-1 w-fit">
              <Shield className="w-3 h-3" /> Admin
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {NAV.map(item => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`sidebar-item flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? 'active' : 'text-gray-400'}`}>
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {active && <ChevronRight className="w-4 h-4 ml-auto text-amber-500" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-amber-900/20">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut className="w-5 h-5" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#030300' }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 glass border-r border-amber-900/20">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/80" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 flex flex-col border-r z-10"
            style={{ background: 'rgba(6,4,0,0.98)', borderColor: 'rgba(120,53,15,0.25)' }}>
            <button onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b flex-shrink-0"
          style={{ background: 'rgba(6,4,0,0.9)', backdropFilter: 'blur(20px)', borderColor: 'rgba(120,53,15,0.2)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl transition-all"
              style={{ background: 'rgba(120,53,15,0.15)', border: '1px solid rgba(180,83,9,0.25)', color: '#fcd34d' }}>
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-bold text-white text-sm">Admin Panel</h2>
              <p className="text-gray-500 text-xs hidden sm:block">Bold Gains Control Center</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.18)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.45)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.2)'; }}>
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
            <Link href="/" title="Back to Home">
              <Image src="/logo.jpeg" alt="Bold Gains" width={36} height={36}
                className="rounded-full cursor-pointer transition-all hover:scale-110"
                style={{ boxShadow: '0 0 16px rgba(180,83,9,0.45)', border: '2px solid rgba(217,119,6,0.35)' }} />
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>

        <footer className="flex-shrink-0 px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-3 border-t"
          style={{ background: 'rgba(6,4,0,0.9)', borderColor: 'rgba(120,53,15,0.2)' }}>
          <div className="flex items-center gap-2.5">
            <Image src="/logo.jpeg" alt="Bold Gains" width={20} height={20} className="rounded-full opacity-70" />
            <span className="text-xs font-black tracking-widest gold-gradient">BOLD GAINS™</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
              Admin
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-5 text-xs" style={{ color: '#4a3520' }}>
            <Link href="/admin" className="hover:text-amber-600 transition-colors">Overview</Link>
            <Link href="/admin/users" className="hover:text-amber-600 transition-colors">Members</Link>
            <Link href="/admin/transactions" className="hover:text-amber-600 transition-colors">Transactions</Link>
            <Link href="/admin/reports" className="hover:text-amber-600 transition-colors">Reports</Link>
          </div>
          <p className="text-xs" style={{ color: '#2e1e08' }}>© {new Date().getFullYear()} Bold Gains. Admin Panel.</p>
        </footer>
      </div>
    </div>
  );
}
