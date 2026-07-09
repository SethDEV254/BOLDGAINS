'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { TrendingUp, Users, Wallet, Package, Copy, Check, ArrowUpRight, Loader2, Star } from 'lucide-react';
import { PACKAGES } from '@/lib/packages';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  const refLink = data?.user?.bscAddress
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://bold-gains.vercel.app'}/register?ref=${data.user.bscAddress}`
    : null;

  function copyRef() {
    if (refLink) {
      navigator.clipboard.writeText(refLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
    </div>
  );

  if (!data) return null;

  const { user, package: pkg, earnings, network, recentTransactions, directDownlines } = data;
  const nextPkg = pkg ? PACKAGES.find(p => p.level === (pkg.level || 0) + 1) : PACKAGES[0];

  const STATS = [
    {
      label: 'Wallet Balance', value: `$${user.walletBalance.toFixed(2)}`,
      icon: Wallet, color: '#f59e0b', sub: 'Available to withdraw',
    },
    {
      label: 'Total Earned', value: `$${user.totalEarned.toFixed(2)}`,
      icon: TrendingUp, color: '#10b981', sub: 'All-time earnings',
    },
    {
      label: 'Direct Network', value: network.directCount,
      icon: Users, color: '#3b82f6', sub: `${network.totalNetwork} total in network`,
    },
    {
      label: 'Current Package', value: pkg?.name || 'None',
      icon: Package, color: pkg?.color || '#9ca3af', sub: `${pkg?.products || 0} products`,
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">
            Welcome back, <span className="gold-gradient">{user.name.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {pkg ? `${pkg.name} Member` : 'No Package Selected'} &nbsp;·&nbsp; Member since {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>

        {refLink ? (
          <div className="glass px-4 py-2.5 rounded-xl border border-amber-900/30">
            <p className="text-xs text-gray-500 mb-1">Your Referral Link</p>
            <div className="flex items-center gap-2">
              <p className="text-amber-400 text-xs font-mono truncate max-w-48">{refLink}</p>
              <button onClick={copyRef} className="flex-shrink-0 text-gray-400 hover:text-amber-400 transition-colors ml-1">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="glass px-4 py-2.5 rounded-xl border border-amber-900/30">
            <p className="text-xs text-gray-500 mb-1">Referral Link</p>
            <p className="text-xs text-amber-600">Connect your wallet to generate your referral link</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <div key={i} className="stat-card rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-6 translate-x-6"
              style={{ background: s.color }} />
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl" style={{ background: `${s.color}15` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-600" />
            </div>
            <p className="text-gray-400 text-xs mb-1">{s.label}</p>
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-xs text-gray-600 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Earnings breakdown + Upgrade */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Earnings */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 gold-border-glow">
          <h3 className="text-white font-bold mb-5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            Earnings Breakdown
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Upgrade Bonus (30%)', value: earnings.upgradeBonus, color: '#10b981' },
              { label: 'Network Level (15%)', value: earnings.networkLevel, color: '#3b82f6' },
              { label: 'Leadership Pool (15%)', value: earnings.leadershipPool, color: '#a78bfa' },
              { label: 'Rank Pool (10%)', value: earnings.rankPool, color: '#f59e0b' },
              { label: 'Product Reorder (45%)', value: earnings.productReorder, color: '#f43f5e' },
            ].map((e, i) => {
              const pct = earnings.total > 0 ? (e.value / earnings.total) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-300">{e.label}</span>
                    <span className="text-sm font-bold text-white">${e.value.toFixed(2)}</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%`, background: e.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upgrade CTA */}
        <div className="glass rounded-2xl p-6 flex flex-col gold-border-glow">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            {pkg ? 'Upgrade Package' : 'Get a Package'}
          </h3>
          {pkg && (
            <div className="mb-4 p-3 rounded-xl text-center"
              style={{ background: `${pkg.color}10`, border: `1px solid ${pkg.color}30` }}>
              <p className="text-xs text-gray-400 mb-1">Current</p>
              <p className="font-black text-xl" style={{ color: pkg.color }}>{pkg.name}</p>
              <p className="text-xs text-gray-500">${pkg.price} · {pkg.products} products</p>
            </div>
          )}
          {nextPkg && (
            <div className="flex-1 flex flex-col">
              <div className="p-3 rounded-xl mb-4 text-center"
                style={{ background: `${nextPkg.color}10`, border: `1px solid ${nextPkg.color}30` }}>
                <p className="text-xs text-gray-400 mb-1">Next Level</p>
                <p className="font-black text-xl" style={{ color: nextPkg.color }}>{nextPkg.name}</p>
                <p className="text-xs text-gray-500">${nextPkg.price} · {nextPkg.products} products</p>
              </div>
              <a href="/dashboard/packages"
                className="btn-gold py-3 rounded-xl font-bold text-sm text-center mt-auto">
                Upgrade Now →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity + Direct Downlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass rounded-2xl p-6 gold-border-glow">
          <h3 className="text-white font-bold mb-4">Recent Transactions</h3>
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <p className="text-sm text-white font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.type === 'withdrawal' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {tx.type === 'withdrawal' ? '-' : '+'}${tx.net_amount.toFixed(2)}
                    </p>
                    {tx.fee > 0 && <p className="text-xs text-gray-600">Fee: ${tx.fee.toFixed(2)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-6 gold-border-glow">
          <h3 className="text-white font-bold mb-4 flex items-center justify-between">
            Direct Referrals
            <a href="/dashboard/network" className="text-xs text-amber-400 hover:text-amber-300">View all →</a>
          </h3>
          {directDownlines.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No referrals yet</p>
              <p className="text-gray-600 text-xs mt-1 cursor-pointer hover:text-amber-500 transition-colors" onClick={copyRef}>
                Click to copy your referral link
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {directDownlines.map((d: any) => {
                const dpkg = PACKAGES.find(p => p.level === d.package_level);
                return (
                  <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: dpkg ? `${dpkg.color}20` : '#1a1a1a', color: dpkg?.color || '#666' }}>
                      {d.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{d.name}</p>
                      <p className="text-xs text-gray-500">{dpkg?.name || 'No package'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-emerald-400">${d.total_earned.toFixed(0)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
