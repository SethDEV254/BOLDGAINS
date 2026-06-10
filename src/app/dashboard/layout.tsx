'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, Network, TrendingUp, Wallet,
  LogOut, Menu, X, Copy, Check, ChevronRight, Home,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/packages', icon: Package, label: 'Packages' },
  { href: '/dashboard/network', icon: Network, label: 'My Network' },
  { href: '/dashboard/earnings', icon: TrendingUp, label: 'Earnings' },
  { href: '/dashboard/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/', icon: Home, label: 'Home' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refCode, setRefCode] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => {
      if (d.user) {
        setRefCode(d.user.referralCode);
        setUserName(d.user.name);
      }
    });
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  function copyReferral() {
    if (refCode) {
      navigator.clipboard.writeText(refCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-amber-900/20">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image src="/logo.jpeg" alt="Bold Gains" width={40} height={40}
            className="rounded-full ring-2 ring-amber-500/40" />
          <div>
            <div className="font-black text-sm gold-gradient tracking-wider">BOLD GAINS</div>
            <div className="text-gray-500 text-xs">Member Portal</div>
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
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
              {active && <ChevronRight className="w-4 h-4 ml-auto text-amber-500" />}
            </Link>
          );
        })}
      </nav>

      {refCode && (
        <div className="px-4 pb-4">
          <div className="p-3 rounded-xl" style={{ background: 'rgba(202,138,4,0.06)', border: '1px solid rgba(202,138,4,0.2)' }}>
            <p className="text-gray-500 text-xs mb-1">Your Referral Code</p>
            <div className="flex items-center justify-between">
              <span className="font-mono font-black text-amber-400 text-sm tracking-widest">{refCode}</span>
              <button onClick={copyReferral} className="text-gray-500 hover:text-amber-400 transition-colors">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-amber-900/20">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#030300' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 border-r"
        style={{ background: 'rgba(6,4,0,0.95)', borderColor: 'rgba(120,53,15,0.25)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/80" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 flex flex-col border-r z-10"
            style={{ background: 'rgba(6,4,0,0.98)', borderColor: 'rgba(120,53,15,0.25)' }}>
            <button onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b"
          style={{ background: 'rgba(6,4,0,0.9)', backdropFilter: 'blur(20px)', borderColor: 'rgba(120,53,15,0.2)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="font-bold text-white text-sm">
                {NAV.find(n => n.href === pathname)?.label || 'Dashboard'}
              </h2>
              <p className="text-gray-500 text-xs">Bold Gains Member Area</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.18)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.45)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.2)';
              }}>
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
            <Link href="/" title="Back to Home">
              <Image src="/logo.jpeg" alt="Bold Gains" width={38} height={38}
                className="rounded-full cursor-pointer transition-all hover:scale-110"
                style={{ boxShadow: '0 0 16px rgba(180,83,9,0.45)', border: '2px solid rgba(217,119,6,0.35)' }} />
            </Link>
            {userName && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border"
                style={{ background: 'rgba(15,9,1,0.7)', borderColor: 'rgba(120,53,15,0.3)' }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(180,83,9,0.25)', color: '#fbbf24' }}>
                  {userName[0]}
                </div>
                <span className="text-sm font-medium" style={{ color: '#c4a060' }}>{userName}</span>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>

        <footer className="flex-shrink-0 px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-3 border-t"
          style={{ background: 'rgba(6,4,0,0.9)', borderColor: 'rgba(120,53,15,0.2)' }}>
          <div className="flex items-center gap-2.5">
            <Image src="/logo.jpeg" alt="Bold Gains" width={22} height={22}
              className="rounded-full opacity-70" />
            <span className="text-xs font-black tracking-widest gold-gradient">BOLD GAINS™</span>
          </div>
          <div className="hidden sm:flex items-center gap-5 text-xs" style={{ color: '#4a3520' }}>
            <Link href="/" className="hover:text-amber-600 transition-colors">Home</Link>
            <Link href="/dashboard/packages" className="hover:text-amber-600 transition-colors">Packages</Link>
            <Link href="/dashboard/wallet" className="hover:text-amber-600 transition-colors">Wallet</Link>
            <Link href="/dashboard/network" className="hover:text-amber-600 transition-colors">Network</Link>
          </div>
          <p className="text-xs" style={{ color: '#2e1e08' }}>© {new Date().getFullYear()} Bold Gains. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
