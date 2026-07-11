'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Award, Users, Star, Zap, Package, Loader2, UserPlus, GitBranch, History, Link2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useLiveUpdates } from '@/hooks/use-live-updates';

const EARNING_TYPES: Record<string, { label: string; icon: any; color: string; desc: string }> = {
  upgrade_bonus: { label: 'Upgrade Bonus', icon: TrendingUp, color: '#10b981', desc: '30% when referrals upgrade' },
  network_level: { label: 'Network Level', icon: Users, color: '#3b82f6', desc: '15% across 10 levels' },
  leadership_pool: { label: 'Leadership Pool', icon: Award, color: '#a78bfa', desc: '15% distributed to leaders' },
  rank_pool: { label: 'Rank Pool', icon: Star, color: '#f59e0b', desc: '10% distributed by rank' },
  product_reorder: { label: 'Product Reorder Bonus', icon: Package, color: '#f43f5e', desc: '45% on BoldGlow™ reorders' },
  referral_direct: { label: 'Referral Direct', icon: UserPlus, color: '#22d3ee', desc: '30% on direct registrations' },
  referral_indirect: { label: 'Referral Indirect', icon: GitBranch, color: '#ec4899', desc: '15% on level-2 registrations' },
  referral_bonus: { label: 'Referral Bonus (Legacy)', icon: History, color: '#9ca3af', desc: 'Paid under the prior 50% rule' },
};

export default function EarningsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load(isInitial: boolean) {
      const d = await fetch('/api/earnings').then(r => r.json());
      if (cancelled) return;
      setData(d);
      if (isInitial) setLoading(false);
    }
    load(true);
    const interval = setInterval(() => load(false), 45000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  useLiveUpdates(() => {
    fetch('/api/earnings').then(r => r.json()).then(setData);
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
    </div>
  );

  if (!data) return null;

  const pieData = Object.entries(data.summary)
    .filter(([_, v]) => (v as number) > 0)
    .map(([key, value]) => ({
      name: EARNING_TYPES[key]?.label || key,
      value: value as number,
      color: EARNING_TYPES[key]?.color || '#9ca3af',
    }));

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">My Earnings</h1>
        <p className="text-gray-400 text-sm mt-1">Complete breakdown of all your income streams</p>
      </div>

      {/* Total */}
      <div className="glass rounded-2xl p-6 text-center" style={{ border: '1px solid rgba(202,138,4,0.3)', background: 'rgba(202,138,4,0.05)' }}>
        <p className="text-gray-400 text-sm mb-2">Total Earnings</p>
        <p className="text-5xl font-black gold-gradient">${data.total.toFixed(2)}</p>
        <p className="text-gray-500 text-sm mt-2">Across all bonus types</p>
      </div>

      {/* Chart + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass rounded-2xl p-6 gold-border-glow">
          <h3 className="text-white font-bold mb-4">Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                  dataKey="value" strokeWidth={0}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} opacity={0.9} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#111', border: '1px solid rgba(202,138,4,0.3)', borderRadius: '12px', color: '#fff' }}
                  formatter={(v: any) => [`$${v.toFixed(2)}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-600">
              No earnings data yet
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-6 gold-border-glow space-y-3">
          <h3 className="text-white font-bold mb-4">By Type</h3>
          {Object.entries(EARNING_TYPES).map(([key, config]) => {
            const amount = data.summary[key] || 0;
            const pct = data.total > 0 ? (amount / data.total) * 100 : 0;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <config.icon className="w-4 h-4" style={{ color: config.color }} />
                    <span className="text-sm text-gray-300">{config.label}</span>
                  </div>
                  <span className="text-sm font-bold text-white">${amount.toFixed(2)}</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${pct}%`, background: config.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History */}
      <div className="glass rounded-2xl p-6 gold-border-glow">
        <h3 className="text-white font-bold mb-5">Earnings History</h3>
        {data.history.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">No earnings yet</p>
            <p className="text-gray-600 text-sm mt-1">Start referring to unlock your first bonus</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.history.map((e: any) => {
              const config = EARNING_TYPES[e.type];
              return (
                <div key={e.id} className="flex items-center gap-4 p-3 rounded-xl transition-all hover:bg-white/[0.02]"
                  style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${config?.color || '#666'}15` }}>
                    {config?.icon && <config.icon className="w-4 h-4" style={{ color: config.color }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-white font-medium">{e.description || config?.label}</p>
                      <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                        style={e.on_chain
                          ? { background: 'rgba(16,185,129,0.15)', color: '#34d399' }
                          : { background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}>
                        {e.on_chain ? <><Link2 className="w-2.5 h-2.5" /> Sent to Wallet</> : 'Platform Credit'}
                      </span>
                    </div>
                    {e.source_name && <p className="text-xs text-gray-500">From {e.source_name}</p>}
                    <p className="text-xs text-gray-600">{new Date(e.created_at).toLocaleString()}</p>
                  </div>
                  <span className="font-bold text-emerald-400 flex-shrink-0">+${e.amount.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
