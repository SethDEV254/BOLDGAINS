'use client';

import { useEffect, useState } from 'react';
import { Copy, Check, Users, TrendingUp, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { PACKAGES } from '@/lib/packages';

function NetworkNode({ node, depth = 0 }: { node: any; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const pkg = PACKAGES.find(p => p.level === node.package_level);

  return (
    <div className="relative">
      <div className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer glass-hover`}
        style={{
          marginLeft: `${depth * 24}px`,
          border: `1px solid ${pkg ? pkg.color + '30' : 'rgba(255,255,255,0.05)'}`,
          background: depth === 0 ? 'rgba(202,138,4,0.05)' : 'rgba(255,255,255,0.02)',
        }}
        onClick={() => node.children?.length && setExpanded(!expanded)}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: pkg ? `${pkg.color}20` : '#1a1a1a', color: pkg?.color || '#666' }}>
          {node.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{node.name}</p>
          <p className="text-xs" style={{ color: pkg?.color || '#6b7280' }}>
            {pkg?.name || 'No Package'} · {node.referral_code}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-emerald-400">${(node.total_earned || 0).toFixed(0)}</p>
          <p className="text-xs text-gray-600">{node.children?.length || 0} refs</p>
        </div>
        {node.children?.length > 0 && (
          <button className="text-gray-500 hover:text-amber-400 transition-colors ml-1">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
      </div>

      {expanded && node.children?.map((child: any) => (
        <NetworkNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function NetworkPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/network').then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  function copy() {
    navigator.clipboard.writeText(data.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
    </div>
  );

  if (!data) return null;

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">My Network</h1>
        <p className="text-gray-400 text-sm mt-1">Track your referral network and downline performance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Direct Referrals', value: data.stats.directCount, icon: Users, color: '#f59e0b' },
          { label: 'Total Network', value: data.stats.totalNetwork, icon: TrendingUp, color: '#10b981' },
          { label: 'Network Depth', value: '10 levels', icon: ChevronDown, color: '#3b82f6' },
        ].map((s, i) => (
          <div key={i} className="stat-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl" style={{ background: `${s.color}15` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-3xl font-black text-white">{s.value}</p>
            <p className="text-gray-400 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div className="glass rounded-2xl p-6 gold-border-glow">
        <h3 className="text-white font-bold mb-4">Your Referral Code</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 flex items-center gap-3 glass px-4 py-3 rounded-xl border border-amber-900/30">
            <span className="text-gray-400 text-sm">Code:</span>
            <span className="font-mono font-black text-amber-400 text-lg tracking-widest">{data.referralCode}</span>
          </div>
          <button onClick={copy}
            className="btn-gold flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm">
            {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Code</>}
          </button>
        </div>
        <p className="text-gray-500 text-xs mt-3">
          Share this code to earn network level bonuses across 10 levels
        </p>
      </div>

      {/* Network Tree */}
      <div className="glass rounded-2xl p-6 gold-border-glow">
        <h3 className="text-white font-bold mb-5">Network Tree</h3>
        {data.tree.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">No referrals yet</p>
            <p className="text-gray-600 text-sm mt-1">Share your referral code to start building your network</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.tree.map((node: any) => (
              <NetworkNode key={node.id} node={node} />
            ))}
          </div>
        )}
      </div>

      {/* Bonus info */}
      <div className="glass rounded-2xl p-6 gold-border-glow">
        <h3 className="text-white font-bold mb-4">Network Level Bonuses</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { level: 'Level 1', rate: '4%', desc: 'Direct referrals' },
            { level: 'Level 2', rate: '3%', desc: 'Their referrals' },
            { level: 'Level 3', rate: '2%', desc: 'Third tier' },
            { level: 'Level 4', rate: '1%', desc: 'Fourth tier' },
          ].map((l, i) => (
            <div key={i} className="text-center p-4 rounded-xl"
              style={{ background: 'rgba(202,138,4,0.05)', border: '1px solid rgba(202,138,4,0.15)' }}>
              <p className="text-2xl font-black gold-gradient">{l.rate}</p>
              <p className="text-white text-sm font-semibold mt-1">{l.level}</p>
              <p className="text-gray-500 text-xs">{l.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
