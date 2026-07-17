'use client';

import { useEffect, useState } from 'react';
import { Users, TrendingUp, DollarSign, Package, Loader2, Search } from 'lucide-react';
import { PACKAGES } from '@/lib/packages';

export default function TeamViewOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load(isInitial: boolean) {
      const d = await fetch('/api/team/users').then(r => r.json());
      if (cancelled) return;
      if (d.error === 'Forbidden') {
        window.location.href = '/team-view/login';
        return;
      }
      setData(d);
      if (isInitial) setLoading(false);
    }
    load(true);
    const interval = setInterval(() => load(false), 45000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
    </div>
  );

  if (!data || data.error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="text-red-400 font-semibold">{data?.error || 'Access denied'}</div>
      <a href="/team-view/login" className="btn-gold px-6 py-2.5 rounded-xl text-sm font-bold">Sign in</a>
    </div>
  );

  const users: any[] = data.users ?? [];
  const stats = data.stats ?? {};
  const filtered = users.filter((u: any) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const STAT_CARDS = [
    { label: 'Total Members', value: stats.totalUsers, icon: Users, color: '#f59e0b' },
    { label: 'Total Volume', value: `$${(stats.totalVolume || 0).toLocaleString()}`, icon: DollarSign, color: '#10b981' },
    { label: 'Total Earnings Paid', value: `$${(stats.totalEarnings || 0).toFixed(2)}`, icon: TrendingUp, color: '#3b82f6' },
    { label: 'Active Packages', value: stats.activePackages, icon: Package, color: '#a78bfa' },
  ];

  return (
    <div className="max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Admin Overview</h1>
        <p className="text-gray-400 text-sm mt-1">Platform-wide statistics and member management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS.map((s, i) => (
          <div key={i} className="stat-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl" style={{ background: `${s.color}15` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-1">{s.label}</p>
            <p className="text-2xl font-black text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Package distribution */}
      <div className="glass rounded-2xl p-6 gold-border-glow">
        <h3 className="text-white font-bold mb-4">Package Distribution</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {PACKAGES.map(pkg => {
            const count = users.filter((u: any) => u.package_level === pkg.level).length;
            return (
              <div key={pkg.level} className="text-center p-3 rounded-xl"
                style={{ background: `${pkg.color}08`, border: `1px solid ${pkg.color}20` }}>
                <p className="text-xl font-black" style={{ color: pkg.color }}>{count}</p>
                <p className="text-gray-400 text-xs">{pkg.name}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Members table */}
      <div className="glass rounded-2xl p-6 gold-border-glow">
        <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
          <h3 className="text-white font-bold">All Members ({users.length})</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              className="input-dark pl-9 pr-4 py-2 rounded-xl text-sm w-64"
              placeholder="Search members..." />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Member', 'Email', 'Package', 'Sponsor', 'Balance', 'Earned', 'Joined'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u: any) => {
                const pkg = PACKAGES.find(p => p.level === u.package_level);
                return (
                  <tr key={u.id} className="border-t border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: pkg ? `${pkg.color}20` : '#1a1a1a', color: pkg?.color || '#666' }}>
                          {u.name[0]}
                        </div>
                        <span className="text-white font-medium whitespace-nowrap">{u.name}</span>
                        {u.role === 'admin' && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">admin</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-400">{u.email || '—'}</td>
                    <td className="py-3 px-3">
                      {pkg ? (
                        <span className="text-xs font-bold px-2 py-1 rounded-full"
                          style={{ color: pkg.color, background: `${pkg.color}15`, border: `1px solid ${pkg.color}30` }}>
                          {pkg.name}
                        </span>
                      ) : <span className="text-gray-600 text-xs">None</span>}
                    </td>
                    <td className="py-3 px-3 text-gray-400 text-xs">{u.sponsor_name || '—'}</td>
                    <td className="py-3 px-3 text-amber-400 font-semibold">${(u.wallet_balance || 0).toFixed(2)}</td>
                    <td className="py-3 px-3 text-emerald-400">${(u.total_earned || 0).toFixed(2)}</td>
                    <td className="py-3 px-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-500">No members found</div>
          )}
        </div>
      </div>
    </div>
  );
}
