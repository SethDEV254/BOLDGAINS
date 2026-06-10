'use client';

import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, Users, DollarSign, Package, BarChart2, PieChart as PieIcon } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import { PACKAGES } from '@/lib/packages';

const EARNING_LABELS: Record<string, string> = {
  direct_bonus: 'Direct Bonus', upgrade_bonus: 'Upgrade Bonus',
  leadership_pool: 'Leadership Pool', network_level: 'Network Level', products: 'Products',
};
const EARNING_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#a78bfa', '#f43f5e'];

const TX_COLORS: Record<string, string> = {
  deposit: '#10b981', withdrawal: '#f59e0b', registration: '#3b82f6',
  upgrade: '#a78bfa', admin_adjustment: '#f43f5e',
};

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/reports').then(r => r.json()).then(d => {
      if (d.error) { window.location.href = '/login'; return; }
      setData(d);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-amber-400 animate-spin" /></div>;
  if (!data) return null;

  const { growth, stats } = data;
  const earningsPie = (growth.earningsByType || []).map((e: any, i: number) => ({
    name: EARNING_LABELS[e.type] || e.type, value: parseFloat(e.total.toFixed(2)), color: EARNING_COLORS[i % EARNING_COLORS.length],
  }));
  const txBar = (growth.txByType || []).map((t: any) => ({
    name: t.type.replace('_', ' '), count: t.count, total: parseFloat((t.total || 0).toFixed(2)),
    color: TX_COLORS[t.type] || '#9ca3af',
  }));

  const SUMMARY = [
    { label: 'Total Members', value: stats.totalUsers, icon: Users, color: '#f59e0b' },
    { label: 'Total Volume', value: `$${(stats.totalVolume || 0).toLocaleString()}`, icon: DollarSign, color: '#10b981' },
    { label: 'Earnings Paid', value: `$${(stats.totalEarnings || 0).toFixed(0)}`, icon: TrendingUp, color: '#3b82f6' },
    { label: 'Active Packages', value: stats.activePackages, icon: Package, color: '#a78bfa' },
    { label: 'Suspended', value: stats.suspended || 0, icon: Users, color: '#ef4444' },
    { label: 'Pending Withdrawals', value: stats.pendingWithdrawals || 0, icon: DollarSign, color: '#fbbf24' },
  ];

  return (
    <div className="max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Reports & Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Platform-wide performance overview</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {SUMMARY.map((s, i) => (
          <div key={i} className="stat-card rounded-2xl p-4">
            <div className="p-2 rounded-xl w-fit mb-3" style={{ background: `${s.color}15` }}>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <p className="text-gray-500 text-xs mb-1">{s.label}</p>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Member growth chart */}
      <div className="glass rounded-2xl p-6 gold-border-glow">
        <h3 className="text-white font-bold mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-400" /> Member Growth (Last 30 days)
        </h3>
        {growth.byDay?.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={growth.byDay}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d97706" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }}
                tickFormatter={v => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#0a0600', border: '1px solid rgba(180,83,9,0.4)', borderRadius: 12, color: '#fff' }}
                labelFormatter={v => new Date(v).toLocaleDateString()}
              />
              <Area type="monotone" dataKey="count" name="New Members" stroke="#d97706" strokeWidth={2} fill="url(#goldGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-600">No growth data yet</div>
        )}
      </div>

      {/* Earnings distribution + TX volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass rounded-2xl p-6 gold-border-glow">
          <h3 className="text-white font-bold mb-6 flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-amber-400" /> Earnings by Type
          </h3>
          {earningsPie.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={earningsPie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" strokeWidth={0}>
                    {earningsPie.map((e: any, i: number) => <Cell key={i} fill={e.color} opacity={0.9} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0a0600', border: '1px solid rgba(180,83,9,0.4)', borderRadius: 12, color: '#fff' }}
                    formatter={(v: any) => [`$${v}`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {earningsPie.map((e: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
                    <span className="text-gray-400 truncate">{e.name}</span>
                    <span className="text-white font-semibold ml-auto">${e.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="h-48 flex items-center justify-center text-gray-600">No earnings data</div>}
        </div>

        <div className="glass rounded-2xl p-6 gold-border-glow">
          <h3 className="text-white font-bold mb-6 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-amber-400" /> Transaction Volume by Type
          </h3>
          {txBar.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={txBar} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#0a0600', border: '1px solid rgba(180,83,9,0.4)', borderRadius: 12, color: '#fff' }} />
                <Bar dataKey="total" name="Volume ($)" radius={[6, 6, 0, 0]}>
                  {txBar.map((t: any, i: number) => <Cell key={i} fill={t.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-gray-600">No transaction data</div>}
        </div>
      </div>

      {/* Package distribution */}
      <div className="glass rounded-2xl p-6 gold-border-glow">
        <h3 className="text-white font-bold mb-5">Package Distribution</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {PACKAGES.map(pkg => {
            const count = (growth.txByType || []).find((t: any) => t.type === 'registration')?.count || 0;
            return (
              <div key={pkg.level} className="text-center p-4 rounded-xl transition-all hover:scale-105"
                style={{ background: `${pkg.color}08`, border: `1px solid ${pkg.color}20` }}>
                <p className="text-xs font-semibold mb-2" style={{ color: pkg.color }}>{pkg.name}</p>
                <p className="text-2xl font-black text-white">${pkg.price.toLocaleString()}</p>
                <p className="text-xs mt-1" style={{ color: `${pkg.color}80` }}>{pkg.products} products</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
