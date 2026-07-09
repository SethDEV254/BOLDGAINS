'use client';

import { useEffect, useState } from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight, Loader2, AlertCircle, Check, Link2, Link2Off, ExternalLink } from 'lucide-react';
import { BONUS_RATES, MIN_WITHDRAWAL_NET_USD } from '@/lib/packages';
import { getBnbPrice, usdToBnb } from '@/lib/bnb-price';
import { useWallet } from '@/hooks/use-wallet';

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function WalletPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [tab, setTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string; hash?: string } | null>(null);

  const wallet = useWallet();
  const [bnbPrice, setBnbPrice] = useState<number | null>(null);

  async function loadData() {
    const d = await fetch('/api/wallet/transactions').then(r => r.json());
    setData(d);
  }

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => {
      setUserId(d.user?.id?.toString() || '');
    });
    loadData().finally(() => setLoading(false));
    getBnbPrice().then(p => setBnbPrice(p));
  }, []);

  useEffect(() => {
    if (wallet.address && !walletAddress) setWalletAddress(wallet.address);
  }, [wallet.address]);

  const amt = parseFloat(amount) || 0;
  const fee = amt > 0 ? amt * (tab === 'deposit' ? BONUS_RATES.management_fee_deposit : BONUS_RATES.management_fee_withdrawal) : 0;
  const net = amt - fee;
  const minWithdrawBnb = bnbPrice ? usdToBnb(MIN_WITHDRAWAL_NET_USD, bnbPrice) : null;
  const netBelowMin = tab === 'withdraw' && amt > 0 && minWithdrawBnb !== null && net < minWithdrawBnb;

  async function handleOnChainDeposit() {
    if (!wallet.address) { wallet.open(); return; }
    if (!amt || amt <= 0) return;
    setProcessing(true);
    setMsg(null);
    try {
      const txHash = await wallet.deposit(amt, userId);
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash }),
      });
      const d = await res.json();
      if (!res.ok) { setMsg({ type: 'error', text: d.error }); return; }
      setMsg({
        type: 'success',
        text: `Deposited ${d.amount.toFixed(4)} BNB. Net credited: ${d.net.toFixed(4)} BNB`,
        hash: txHash,
      });
      setAmount('');
      loadData();
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.message || 'Transaction failed' });
    } finally {
      setProcessing(false);
    }
  }

  async function handleWithdraw() {
    if (!amt || amt <= 0) return;
    if (!walletAddress) { setMsg({ type: 'error', text: 'Enter your BSC wallet address to receive BNB' }); return; }
    setProcessing(true);
    setMsg(null);
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, walletAddress }),
      });
      const d = await res.json();
      if (!res.ok) { setMsg({ type: 'error', text: d.error }); return; }
      setMsg({ type: 'success', text: `Withdrawal of ${amt} BNB submitted. ${d.net.toFixed(4)} BNB is being sent to your wallet on-chain.` });
      setAmount('');
      loadData();
    } catch {
      setMsg({ type: 'error', text: 'Withdrawal failed. Try again.' });
    } finally {
      setProcessing(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Wallet</h1>
        <p className="text-gray-400 text-sm mt-1">Deposit & withdraw BNB on BNB Smart Chain</p>
      </div>

      {/* Wrong chain warning */}
      {wallet.isWrongChain && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">Wrong network — switch to BNB Smart Chain to deposit.</p>
          </div>
          <button onClick={() => wallet.switchToBSC()}
            className="text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
            Switch to BSC
          </button>
        </div>
      )}

      {/* Balance + MetaMask row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-6 text-center" style={{ border: '1px solid rgba(202,138,4,0.3)', background: 'rgba(202,138,4,0.05)' }}>
          <Wallet className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <p className="text-gray-400 text-xs mb-1">Platform Balance</p>
          <p className="text-4xl font-black gold-gradient">{(data?.balance || 0).toFixed(4)}</p>
          <p className="text-gray-500 text-xs mt-1">BNB · 10% fee on deposits · no fee on withdrawals</p>
        </div>

        {/* MetaMask connect card */}
        <div className="glass rounded-2xl p-5 flex flex-col justify-between"
          style={{ border: wallet.address ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-white">MetaMask Wallet</p>
            {wallet.address
              ? <span className="flex items-center gap-1 text-xs text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Connected</span>
              : <span className="text-xs text-gray-500">Disconnected</span>}
          </div>

          {wallet.address ? (
            <>
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-0.5">Address</p>
                <p className="font-mono text-sm text-amber-400 font-bold">{shortAddr(wallet.address)}</p>
              </div>
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-0.5">BNB Balance</p>
                <p className="text-2xl font-black text-white">{wallet.bnbBalance} <span className="text-sm text-gray-400">BNB</span></p>
              </div>
              <button onClick={wallet.disconnect}
                className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                <Link2Off className="w-3.5 h-3.5" /> Disconnect
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-500 text-xs mb-4">Connect your wallet to deposit BNB directly on BSC.</p>
              <button onClick={() => wallet.open()} disabled={wallet.connecting}
                className="btn-gold flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold w-full">
                {wallet.connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                {wallet.connecting ? 'Connecting…' : 'Connect Wallet'}
              </button>
            </>
          )}
        </div>
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
              <div className="flex-1">
                {msg.text}
                {msg.hash && (
                  <a href={`https://bscscan.com/tx/${msg.hash}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs mt-1 opacity-70 hover:opacity-100">
                    View on BscScan <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Amount (BNB)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 font-bold text-xs">BNB</span>
                <input type="number" min="0.001" step="0.001" value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="input-dark w-full pl-14 pr-4 py-3 rounded-xl text-sm"
                  placeholder="0.0000" />
              </div>
            </div>

            {tab === 'withdraw' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  BSC Wallet Address <span className="text-gray-500">(to receive BNB)</span>
                </label>
                <input type="text" value={walletAddress}
                  onChange={e => setWalletAddress(e.target.value.trim())}
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm font-mono"
                  placeholder="0x…" />
                {!walletAddress && wallet.address && (
                  <button onClick={() => setWalletAddress(wallet.address!)}
                    className="text-xs text-amber-400 mt-1 hover:text-amber-300 transition-colors">
                    Use connected wallet ({shortAddr(wallet.address)})
                  </button>
                )}
              </div>
            )}

            {tab === 'deposit' && !wallet.address && (
              <div className="p-3 rounded-xl text-xs text-gray-400"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                Connect MetaMask above to deposit BNB directly on-chain.
              </div>
            )}

            {amt > 0 && (
              <div className="p-4 rounded-xl space-y-2"
                style={{ background: netBelowMin ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.03)', border: netBelowMin ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-white">{amt.toFixed(4)} BNB</span>
                </div>
                {fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Platform Fee (10%)</span>
                    <span className="text-red-400">-{fee.toFixed(4)} BNB</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-2 flex justify-between text-sm font-bold">
                  <span className="text-gray-300">Net {tab === 'deposit' ? 'Credited' : 'Received'}</span>
                  <span className={netBelowMin ? 'text-red-400' : 'text-emerald-400'}>{net.toFixed(4)} BNB</span>
                </div>
                {netBelowMin && minWithdrawBnb !== null && (
                  <div className="flex items-center gap-2 pt-1">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-400">
                      Minimum net is ${MIN_WITHDRAWAL_NET_USD} USD (~{minWithdrawBnb.toFixed(5)} BNB). Increase your amount.
                    </p>
                  </div>
                )}
              </div>
            )}

            {tab === 'deposit' ? (
              <button
                onClick={handleOnChainDeposit}
                disabled={processing || (!!wallet.address && amt <= 0)}
                className="btn-gold w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2">
                {processing
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
                  : wallet.address
                    ? <><ArrowDownLeft className="w-5 h-5" /> Deposit BNB</>
                    : <><Link2 className="w-5 h-5" /> Connect Wallet to Deposit</>}
              </button>
            ) : (
              <button
                onClick={handleWithdraw}
                disabled={processing || amt <= 0 || netBelowMin}
                className="btn-gold w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2">
                {processing
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
                  : <><ArrowUpRight className="w-5 h-5" /> Request Withdrawal</>}
              </button>
            )}

            {tab === 'withdraw' && (
              <p className="text-xs text-gray-600 text-center">
                Minimum withdrawal: ${MIN_WITHDRAWAL_NET_USD} USD
                {minWithdrawBnb !== null ? ` (~${minWithdrawBnb.toFixed(5)} BNB)` : ''}
                {' · '}No fee · processed instantly on-chain.
              </p>
            )}
          </div>
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
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {data.transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.02)' }}>
                  <div className={`p-2 rounded-xl flex-shrink-0 ${tx.type === 'withdrawal' ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                    {tx.type === 'withdrawal'
                      ? <ArrowUpRight className="w-4 h-4 text-red-400" />
                      : <ArrowDownLeft className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white capitalize">{tx.type.replace('_', ' ')}</p>
                      {tx.status === 'pending' && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>pending</span>
                      )}
                    </div>
                    {tx.reference && tx.reference.startsWith('0x') && tx.reference.length > 42 && (
                      <a href={`https://bscscan.com/tx/${tx.reference}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-amber-500/60 hover:text-amber-400 flex items-center gap-1">
                        BscScan <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${tx.type === 'withdrawal' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {tx.type === 'withdrawal' ? '-' : '+'}{tx.net_amount.toFixed(4)} BNB
                    </p>
                    {tx.fee > 0 && <p className="text-xs text-gray-600">fee {tx.fee.toFixed(4)}</p>}
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
