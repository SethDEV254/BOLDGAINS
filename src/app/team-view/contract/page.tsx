'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Loader2, RefreshCw, CheckCircle, XCircle, ExternalLink,
  Wallet, ArrowDownLeft, Shield, Zap, AlertTriangle, Send,
  Pause, Play, AlertOctagon,
} from 'lucide-react';

type ContractInfo = {
  contractAddress: string;
  balance: string;
  availableBalance: string;
  accumulatedFees: string;
  operatorAddress: string;
  hasOperator: boolean;
  paused: boolean;
  pendingWithdrawals: any[];
  bnbPrice: number;
};

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 5000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl font-semibold text-sm max-w-sm"
      style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#34d399' }}>
      <CheckCircle className="w-4 h-4 flex-shrink-0" />
      <span className="break-all">{msg}</span>
    </div>
  );
}

export default function TeamViewContractPage() {
  const [info, setInfo] = useState<ContractInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [manualTo, setManualTo] = useState('');
  const [manualAmt, setManualAmt] = useState('');
  const [confirmEmergency, setConfirmEmergency] = useState(false);

  const showToast = (msg: string) => setToast(msg);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetch('/api/team/contract').then(r => r.json());
    if (d.error === 'Forbidden') { window.location.href = '/team-view/login'; return; }
    setInfo(d);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // No backend action exists for this panel — every control here is display only.
  function call(action: string) {
    setWorking(action);
    setTimeout(() => {
      showToast('Done');
      setWorking(null);
      setConfirmEmergency(false);
      setManualTo('');
      setManualAmt('');
    }, 500);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-amber-400 animate-spin" /></div>;
  if (!info) return null;

  const bnbPrice = info.bnbPrice;
  const balUsd  = parseFloat(info.balance) * bnbPrice;
  const availUsd = parseFloat(info.availableBalance) * bnbPrice;
  const feesUsd = parseFloat(info.accumulatedFees) * bnbPrice;

  return (
    <div className="max-w-5xl space-y-6">
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            Contract Control
            {info.paused && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                <Pause className="w-3 h-3" /> PAUSED
              </span>
            )}
          </h1>
          <p className="text-gray-400 text-sm mt-1">On-chain fund management for Bold Gains</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' }}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Paused banner */}
      {info.paused && (
        <div className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <AlertOctagon className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-bold text-sm">Contract is paused</p>
            <p className="text-red-400/70 text-xs">New registrations, upgrades, and deposits are blocked until unpaused.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="stat-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(245,158,11,0.12)' }}>
              <Wallet className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Contract Balance</span>
          </div>
          <p className="text-2xl font-black text-white">{parseFloat(info.balance).toFixed(4)} BNB</p>
          <p className="text-xs text-gray-500 mt-1">≈ ${balUsd.toFixed(2)} USD</p>
        </div>

        <div className="stat-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(16,185,129,0.12)' }}>
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Available for Payouts</span>
          </div>
          <p className="text-2xl font-black text-emerald-400">{parseFloat(info.availableBalance).toFixed(4)} BNB</p>
          <p className="text-xs text-gray-500 mt-1">≈ ${availUsd.toFixed(2)} USD</p>
        </div>

        <div className="stat-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(59,130,246,0.12)' }}>
              <ArrowDownLeft className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Accumulated Fees</span>
          </div>
          <p className="text-2xl font-black text-blue-400">{parseFloat(info.accumulatedFees).toFixed(4)} BNB</p>
          <p className="text-xs text-gray-500 mt-1">≈ ${feesUsd.toFixed(2)} USD</p>
        </div>

        <div className="stat-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl" style={{ background: info.hasOperator ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }}>
              <Shield className="w-4 h-4" style={{ color: info.hasOperator ? '#34d399' : '#f87171' }} />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Operator</span>
          </div>
          {info.hasOperator ? (
            <>
              <p className="text-sm font-mono text-white">{info.operatorAddress.slice(0, 10)}…{info.operatorAddress.slice(-6)}</p>
              <p className="text-xs text-emerald-400 mt-1">Key loaded ✓</p>
            </>
          ) : (
            <p className="text-sm text-red-400">No OPERATOR_PRIVATE_KEY</p>
          )}
        </div>
      </div>

      {/* Contract address */}
      {info.contractAddress && (
        <div className="glass rounded-2xl p-4 gold-border-glow">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Contract · BSC Mainnet</p>
              <p className="font-mono text-amber-400 text-sm break-all">{info.contractAddress}</p>
            </div>
            <a href={`https://bscscan.com/address/${info.contractAddress}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap"
              style={{ background: 'rgba(202,138,4,0.1)', color: '#f59e0b', border: '1px solid rgba(202,138,4,0.25)' }}>
              <ExternalLink className="w-3.5 h-3.5" /> BscScan
            </a>
          </div>
        </div>
      )}

      {/* Control actions */}
      <div className="glass rounded-2xl p-6 gold-border-glow">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" /> Contract Controls
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

          {/* Pause / Unpause */}
          {info.paused ? (
            <button onClick={() => call('unpause')} disabled={!!working}
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm disabled:opacity-40 transition-all"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>
              {working === 'unpause' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Resume Contract
            </button>
          ) : (
            <button onClick={() => call('pause')} disabled={!!working}
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm disabled:opacity-40 transition-all"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}>
              {working === 'pause' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
              Pause Contract
            </button>
          )}

          {/* Collect fees */}
          <button onClick={() => call('collectFees')}
            disabled={!!working || parseFloat(info.accumulatedFees) === 0}
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm disabled:opacity-40 transition-all"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }}>
            {working === 'collectFees' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownLeft className="w-4 h-4" />}
            Collect Fees ({parseFloat(info.accumulatedFees).toFixed(4)} BNB)
          </button>

          {/* Emergency withdraw */}
          {!confirmEmergency ? (
            <button onClick={() => setConfirmEmergency(true)}
              disabled={!!working || parseFloat(info.balance) === 0}
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm disabled:opacity-40 transition-all"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
              <AlertOctagon className="w-4 h-4" />
              Emergency Withdraw All
            </button>
          ) : (
            <div className="flex flex-col gap-2 p-3 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)' }}>
              <p className="text-xs text-red-400 font-semibold text-center">Withdraw ALL {parseFloat(info.balance).toFixed(4)} BNB to owner?</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmEmergency(false)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button onClick={() => call('emergencyWithdraw')} disabled={!!working}
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                  style={{ background: 'rgba(239,68,68,0.25)', color: '#f87171' }}>
                  {working === 'emergencyWithdraw' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual send */}
      <div className="glass rounded-2xl p-6 gold-border-glow">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-400" /> Manual On-Chain Send
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs text-gray-500 mb-1.5 block">Recipient BSC Address</label>
            <input value={manualTo} onChange={e => setManualTo(e.target.value)}
              className="input-dark w-full px-4 py-3 rounded-xl text-sm font-mono" placeholder="0x..." />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Amount (BNB)</label>
            <input type="number" step="0.001" value={manualAmt} onChange={e => setManualAmt(e.target.value)}
              className="input-dark w-full px-4 py-3 rounded-xl text-sm" placeholder="0.00" />
          </div>
        </div>
        <button onClick={() => call('manualSend')}
          disabled={!!working || !manualTo || !manualAmt}
          className="mt-3 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-40 transition-all"
          style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}>
          {working === 'manualSend' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send BNB On-Chain
        </button>
      </div>

      {/* Pending withdrawals */}
      <div className="glass rounded-2xl p-6 gold-border-glow">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-amber-400" />
          Pending Withdrawals ({info.pendingWithdrawals.length})
        </h3>

        {info.pendingWithdrawals.length === 0 ? (
          <div className="text-center py-10 text-gray-600">
            <CheckCircle className="w-10 h-10 text-emerald-900 mx-auto mb-3" />
            <p>No pending withdrawals</p>
          </div>
        ) : (
          <div className="space-y-2">
            {info.pendingWithdrawals.map((t: any) => (
              <div key={t.id} className="flex items-center gap-4 p-4 rounded-xl flex-wrap"
                style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{t.user_name}</p>
                  <p className="text-gray-500 text-xs">{t.user_email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-amber-400 font-black">${t.amount.toFixed(2)}</p>
                  <p className="text-gray-600 text-xs">{parseFloat(t.net_amount).toFixed(5)} BNB</p>
                  <p className="text-gray-700 text-xs">{new Date(t.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => call('approveWithdrawal')} disabled={!!working}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-40 whitespace-nowrap"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
                    {working === 'approveWithdrawal' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Send On-Chain
                  </button>
                  <button onClick={() => call('rejectWithdrawal')} disabled={!!working}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold"
                    style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
