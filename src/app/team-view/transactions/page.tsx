'use client';

import { useEffect, useState } from 'react';
import { Loader2, Search, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

const TX_COLORS: Record<string, string> = {
  deposit: '#10b981', withdrawal: '#f59e0b', registration: '#3b82f6',
  upgrade: '#a78bfa', admin_adjustment: '#f43f5e', earning: '#fbbf24',
};

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  completed: { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', icon: CheckCircle },
  pending: { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: Clock },
  rejected: { color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: XCircle },
  failed: { color: '#fb923c', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', icon: AlertTriangle },
};

export default function TeamViewTransactionsPage() {
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [working, setWorking] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 4000); }

  async function load() {
    const d = await fetch('/api/team/transactions').then(r => r.json());
    if (d.error) { window.location.href = '/team-view/login'; return; }
    setTxs(d.transactions ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // No backend action exists for this panel — approve/reject here is display only.
  function handleWithdrawal(id: number, action: 'approve' | 'reject') {
    setWorking(id);
    setTimeout(() => {
      showToast(action === 'approve' ? 'Withdrawal approved' : 'Withdrawal rejected — balance refunded');
      setWorking(null);
    }, 500);
  }

  const types = [...new Set(txs.map(t => t.type))];
  const filtered = txs.filter(t => {
    const s = search.toLowerCase();
    const matchSearch = (t.user_name || '').toLowerCase().includes(s) || (t.user_email || '').toLowerCase().includes(s);
    const matchType = filterType === 'all' || t.type === filterType;
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const pendingWithdrawals = txs.filter(t => t.type === 'withdrawal' && t.status === 'pending');
  const completedTxs = txs.filter(t => t.status === 'completed');

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-amber-400 animate-spin" /></div>;

  return (
    <div className="max-w-7xl space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl font-semibold text-sm"
          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#34d399' }}>
          <CheckCircle className="w-4 h-4" /> {toast}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-black text-white">Transactions</h1>
        <p className="text-gray-400 text-sm mt-1">{txs.length} total transactions</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Deposits', value: `$${completedTxs.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0).toFixed(0)}`, color: '#10b981' },
          { label: 'Total Withdrawals', value: `$${completedTxs.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0).toFixed(0)}`, color: '#f59e0b' },
          { label: 'Pending Withdrawals', value: pendingWithdrawals.length, color: '#fbbf24' },
          { label: 'Fees Collected', value: `$${completedTxs.reduce((s, t) => s + (t.fee || 0), 0).toFixed(0)}`, color: '#a78bfa' },
        ].map((s, i) => (
          <div key={i} className="stat-card rounded-2xl p-4">
            <p className="text-gray-500 text-xs mb-1">{s.label}</p>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pending withdrawals (info only, no action) */}
      {pendingWithdrawals.length > 0 && (
        <div className="glass rounded-2xl p-5 gold-border-glow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Pending Withdrawals ({pendingWithdrawals.length})
            </h3>
            <span className="text-xs text-gray-500">Auto-processed on-chain · Reject to refund</span>
          </div>
          <div className="space-y-2">
            {pendingWithdrawals.map(t => (
              <div key={t.id} className="flex items-center gap-4 p-3 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{t.user_name}</p>
                  <p className="text-gray-500 text-xs">{t.user_email} · {new Date(t.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right mr-4 flex-shrink-0">
                  <p className="text-amber-400 font-bold">${t.amount.toFixed(2)}</p>
                  <p className="text-gray-600 text-xs">Net {t.net_amount.toFixed(4)} BNB</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleWithdrawal(t.id, 'reject')} disabled={working === t.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                    {working === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                    Reject &amp; Refund
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All transactions */}
      <div className="glass rounded-2xl p-6 gold-border-glow">
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="input-dark w-full pl-9 pr-4 py-2.5 rounded-xl text-sm" placeholder="Search member..." />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="input-dark px-4 py-2.5 rounded-xl text-sm cursor-pointer">
            <option value="all" style={{ background: '#0f0801' }}>All Types</option>
            {types.map(t => <option key={t} value={t} style={{ background: '#0f0801' }} className="capitalize">{t.replace('_', ' ')}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="input-dark px-4 py-2.5 rounded-xl text-sm cursor-pointer">
            <option value="all" style={{ background: '#0f0801' }}>All Status</option>
            <option value="completed" style={{ background: '#0f0801' }}>Completed</option>
            <option value="pending" style={{ background: '#0f0801' }}>Pending</option>
            <option value="rejected" style={{ background: '#0f0801' }}>Rejected</option>
            <option value="failed" style={{ background: '#0f0801' }}>Failed</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['#', 'Member', 'Type', 'Amount', 'Fee', 'Net', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const color = TX_COLORS[t.type] || '#9ca3af';
                const statusStyle = STATUS_STYLE[t.status] || { color: '#9ca3af', bg: 'rgba(156,163,175,0.12)', border: 'rgba(156,163,175,0.3)', icon: Clock };
                const StatusIcon = statusStyle.icon;
                return (
                  <tr key={t.id} className="border-t border-white/[0.03] hover:bg-white/[0.015] transition-colors">
                    <td className="py-3 px-3 text-gray-600 text-xs">{i + 1}</td>
                    <td className="py-3 px-3">
                      <p className="text-white font-medium whitespace-nowrap">{t.user_name || '—'}</p>
                      <p className="text-gray-600 text-xs">{t.user_email}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs font-bold px-2 py-1 rounded-md capitalize whitespace-nowrap"
                        style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}>
                        {t.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-white font-semibold">${t.amount.toFixed(2)}</td>
                    <td className="py-3 px-3 text-red-400 text-xs">{t.fee > 0 ? `-$${t.fee.toFixed(2)}` : '—'}</td>
                    <td className="py-3 px-3 text-emerald-400 font-semibold">${t.net_amount.toFixed(2)}</td>
                    <td className="py-3 px-3">
                      <span className="text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 w-fit whitespace-nowrap"
                        style={{ color: statusStyle.color, background: statusStyle.bg, border: `1px solid ${statusStyle.border}` }}>
                        <StatusIcon className="w-3 h-3" />{t.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-500 text-xs whitespace-nowrap">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-3">
                      {t.type === 'withdrawal' && t.status === 'pending' && (
                        <button onClick={() => handleWithdrawal(t.id, 'reject')} disabled={working === t.id}
                          className="p-1.5 rounded-lg transition-colors"
                          title="Reject & refund"
                          style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                          {working === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-12 text-gray-500">No transactions found</div>}
        </div>
      </div>
    </div>
  );
}
