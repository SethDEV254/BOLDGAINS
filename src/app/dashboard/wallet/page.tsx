'use client';

import { useEffect, useState } from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight, Loader2, AlertCircle, Check } from 'lucide-react';
import { BONUS_RATES } from '@/lib/packages';

export default function WalletPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [ref, setRef] = useState('');
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function loadData() {
    const d = await fetch('/api/wallet/transactions').then(r => r.json());
    setData(d);
  }

  useEffect(() => { loadData().finally(() => setLoading(false)); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;

    setProcessing(true);
    setMsg(null);

    const endpoint = tab === 'deposit' ? '/api/wallet/deposit' : '/api/wallet/withdraw';
    try {
      const res = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, reference: ref }),
      });
      const d = await res.json();
      if (!res.ok) { setMsg({ type: 'error', text: d.error }); return; }
      setMsg({ type: 'success', text: `${tab === 'deposit' ? 'Deposit' : 'Withdrawal'} of $${amt} processed. Net: $${d.net.toFixed(2)}` });
      setAmount('');
      setRef('');
      loadData();
    } catch {
      setMsg({ type: 'error', text: 'Transaction failed. Try again.' });
    } finally {
      setProcessing(false);
    }
  }

  const fee = parseFloat(amount) > 0
    ? parseFloat(amount) * (tab === 'deposit' ? BONUS_RATES.management_fee_deposit : BONUS_RATES.management_fee_withdrawal)
    : 0;
  const net = parseFloat(amount) > 0 ? parseFloat(amount) - fee : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Wallet</h1>
        <p className="text-gray-400 text-sm mt-1">Manage deposits and withdrawals</p>
      </div>

      {/* Balance */}
      <div className="glass rounded-2xl p-6 text-center" style={{ border: '1px solid rgba(202,138,4,0.3)', background: 'rgba(202,138,4,0.05)' }}>
        <Wallet className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <p className="text-gray-400 text-sm mb-2">Available Balance</p>
        <p className="text-5xl font-black gold-gradient">${(data?.balance || 0).toFixed(2)}</p>
        <p className="text-gray-500 text-xs mt-2">10% management fee on all transactions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Form */}
        <div className="glass rounded-2xl p-6 gold-border-glow">
          <div className="flex rounded-xl overflow-hidden mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {(['deposit', 'withdraw'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setMsg(null); }}
                className="flex-1 py-2.5 text-sm font-bold capitalize transition-all"
                style={{
                  background: tab === t ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
                  color: tab === t ? '#000' : '#6b7280',
                }}>
                {t === 'deposit' ? '↓ Deposit' : '↑ Withdraw'}
              </button>
            ))}
          </div>

          {msg && (
            <div className={`flex items-start gap-3 p-3 rounded-xl mb-4 text-sm ${msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
              {msg.type === 'success' ? <Check className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                <input type="number" min="1" step="0.01" required value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="input-dark w-full pl-8 pr-4 py-3 rounded-xl text-sm"
                  placeholder="0.00" />
              </div>
            </div>

            {tab === 'deposit' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Reference / TxID <span className="text-gray-600">(optional)</span></label>
                <input type="text" value={ref} onChange={e => setRef(e.target.value)}
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                  placeholder="Payment reference..." />
              </div>
            )}

            {parseFloat(amount) > 0 && (
              <div className="p-4 rounded-xl space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-white">${parseFloat(amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Management Fee (10%)</span>
                  <span className="text-red-400">-${fee.toFixed(2)}</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between text-sm font-bold">
                  <span className="text-gray-300">Net Amount</span>
                  <span className="text-emerald-400">${net.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button type="submit" disabled={processing}
              className="btn-gold w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2">
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> :
                tab === 'deposit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
              {processing ? 'Processing...' : tab === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
            </button>
          </form>
        </div>

        {/* Transaction history */}
        <div className="glass rounded-2xl p-6 gold-border-glow">
          <h3 className="text-white font-bold mb-4">Transaction History</h3>
          {!data?.transactions?.length ? (
            <div className="text-center py-12 text-gray-500">
              <Wallet className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              No transactions yet
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {data.transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.02)' }}>
                  <div className={`p-2 rounded-xl flex-shrink-0 ${tx.type === 'withdrawal' ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                    {tx.type === 'withdrawal'
                      ? <ArrowUpRight className="w-4 h-4 text-red-400" />
                      : <ArrowDownLeft className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white capitalize">{tx.type.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${tx.type === 'withdrawal' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {tx.type === 'withdrawal' ? '-' : '+'}${tx.net_amount.toFixed(2)}
                    </p>
                    {tx.fee > 0 && <p className="text-xs text-gray-600">fee ${tx.fee.toFixed(2)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
