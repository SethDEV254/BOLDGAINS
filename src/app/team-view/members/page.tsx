'use client';

import { useEffect, useState } from 'react';
import { Users, Loader2, Search } from 'lucide-react';
import { PACKAGES } from '@/lib/packages';

type User = {
  id: number; name: string; email: string | null;
  package_level: number; wallet_balance: number; total_earned: number;
  status: string; role: string; sponsor_name?: string; created_at: string;
};

export default function TeamViewMembersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPkg, setFilterPkg] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');

  async function load() {
    const d = await fetch('/api/team/users').then(r => r.json());
    if (d.error === 'Forbidden') { window.location.href = '/team-view/login'; return; }
    setUsers(d.users ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u => {
    const s = search.toLowerCase();
    const matchSearch = u.name.toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s);
    const matchPkg = filterPkg === 0 || u.package_level === filterPkg;
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchSearch && matchPkg && matchStatus;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-amber-400 animate-spin" /></div>;

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Members</h1>
        <p className="text-gray-400 text-sm mt-1">{users.filter(u => u.role !== 'admin').length} registered members</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: users.filter(u => u.role !== 'admin').length, color: '#f59e0b' },
          { label: 'Active', value: users.filter(u => u.status === 'active' && u.role !== 'admin').length, color: '#10b981' },
          { label: 'Pending Approval', value: users.filter(u => u.status === 'pending').length, color: '#f59e0b' },
          { label: 'Suspended', value: users.filter(u => u.status === 'suspended').length, color: '#ef4444' },
        ].map((s, i) => (
          <div key={i} className="stat-card rounded-2xl p-4 cursor-pointer"
            onClick={() => i === 2 ? setFilterStatus('pending') : i === 1 ? setFilterStatus('active') : i === 3 ? setFilterStatus('suspended') : setFilterStatus('all')}>
            <p className="text-gray-500 text-xs mb-1">{s.label}</p>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass rounded-2xl p-6 gold-border-glow">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="input-dark w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
              placeholder="Name or email..." />
          </div>
          <select value={filterPkg} onChange={e => setFilterPkg(parseInt(e.target.value))}
            className="input-dark px-4 py-2.5 rounded-xl text-sm cursor-pointer">
            <option value={0} style={{ background: '#0f0801' }}>All Packages</option>
            {PACKAGES.map(p => <option key={p.level} value={p.level} style={{ background: '#0f0801' }}>{p.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="input-dark px-4 py-2.5 rounded-xl text-sm cursor-pointer">
            <option value="all" style={{ background: '#0f0801' }}>All Status</option>
            <option value="active" style={{ background: '#0f0801' }}>Active</option>
            <option value="pending" style={{ background: '#0f0801' }}>Pending</option>
            <option value="suspended" style={{ background: '#0f0801' }}>Suspended</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Member', 'Package', 'Balance', 'Earned', 'Status', 'Sponsor', 'Joined'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const pkg = PACKAGES.find(p => p.level === u.package_level);
                const isSuspended = u.status === 'suspended';
                const isPending = u.status === 'pending';
                return (
                  <tr key={u.id} className="border-t border-white/[0.03] transition-colors"
                    style={{ background: isSuspended ? 'rgba(239,68,68,0.03)' : isPending ? 'rgba(245,158,11,0.03)' : undefined }}>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: pkg ? `${pkg.color}20` : '#1a0a00', color: pkg?.color || '#666' }}>
                          {u.name[0]}
                        </div>
                        <div>
                          <p className="text-white font-medium whitespace-nowrap">{u.name}</p>
                          <p className="text-gray-600 text-xs">{u.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {pkg
                        ? <span className="text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap"
                            style={{ color: pkg.color, background: `${pkg.color}15`, border: `1px solid ${pkg.color}30` }}>{pkg.name}</span>
                        : <span className="text-gray-600 text-xs">None</span>}
                    </td>
                    <td className="py-3 px-3 text-amber-400 font-semibold">${(u.wallet_balance || 0).toFixed(2)}</td>
                    <td className="py-3 px-3 text-emerald-400">${(u.total_earned || 0).toFixed(2)}</td>
                    <td className="py-3 px-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        isSuspended ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                        : isPending ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {isSuspended ? 'Suspended' : isPending ? 'Pending' : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-400 text-xs">{u.sponsor_name || '—'}</td>
                    <td className="py-3 px-3 text-gray-500 text-xs whitespace-nowrap">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />No members found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
