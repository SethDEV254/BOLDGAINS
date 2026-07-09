'use client';

import { useEffect, useState } from 'react';
import { Users, Loader2, Search, ChevronDown, Ban, CheckCircle, Wallet, Package, Trash2, X, Check, AlertTriangle, UserPlus, Eye, EyeOff } from 'lucide-react';
import { PACKAGES } from '@/lib/packages';

type User = {
  id: number; name: string; email: string; referral_code: string;
  package_level: number; wallet_balance: number; total_earned: number;
  status: string; role: string; sponsor_name?: string; bsc_address?: string; created_at: string;
};

type Modal =
  | { type: 'register' }
  | { type: 'balance'; user: User }
  | { type: 'package'; user: User }
  | { type: 'delete'; user: User }
  | null;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPkg, setFilterPkg] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');
  const [modal, setModal] = useState<Modal>(null);
  const [balanceAmt, setBalanceAmt] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [newPkg, setNewPkg] = useState(0);
  const [working, setWorking] = useState(false);
  const [toast, setToast] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '', referralCode: '', packageLevel: 1, bscAddress: '' });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function load() {
    const d = await fetch('/api/admin/users').then(r => r.json());
    if (d.error === 'Forbidden') { window.location.href = '/login?redirect=admin/users'; return; }
    setUsers(d.users ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setWorking(true);
    const r = await fetch('/api/admin/users/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regForm),
    });
    const d = await r.json();
    if (!r.ok) { showToast(`Error: ${d.error}`); setWorking(false); return; }
    showToast(`Member "${regForm.name}" registered — Code: ${d.referralCode}`);
    setRegForm({ name: '', email: '', password: '', referralCode: '', packageLevel: 1, bscAddress: '' });
    await load();
    setModal(null);
    setWorking(false);
  }

  async function patchUser(id: number, body: object, successMsg: string) {
    setWorking(true);
    const r = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (r.ok) { showToast(successMsg); await load(); setModal(null); }
    setWorking(false);
  }

  async function deleteUser(id: number) {
    setWorking(true);
    const r = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (r.ok) { showToast('Member deleted.'); await load(); setModal(null); }
    setWorking(false);
  }

  const filtered = users.filter(u => {
    const s = search.toLowerCase();
    const matchSearch = u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.referral_code.toLowerCase().includes(s);
    const matchPkg = filterPkg === 0 || u.package_level === filterPkg;
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchSearch && matchPkg && matchStatus;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-amber-400 animate-spin" /></div>;

  return (
    <div className="max-w-7xl space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl font-semibold text-sm"
          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#34d399' }}>
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Members</h1>
          <p className="text-gray-400 text-sm mt-1">{users.filter(u => u.role !== 'admin').length} registered members</p>
        </div>
        <button onClick={() => setModal({ type: 'register' })}
          className="btn-gold flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm">
          <UserPlus className="w-4 h-4" /> Register Member
        </button>
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
              placeholder="Name, email or referral code..." />
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
                {['Member', 'Package', 'Balance', 'Earned', 'Status', 'Sponsor', 'BSC Wallet', 'Joined', 'Actions'].map(h => (
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
                          <p className="text-gray-600 text-xs">{u.email}</p>
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
                    <td className="py-3 px-3 text-xs font-mono">
                      {u.bsc_address
                        ? <span className="text-amber-400" title={u.bsc_address}>{u.bsc_address.slice(0, 6)}…{u.bsc_address.slice(-4)}</span>
                        : <span className="text-gray-700">—</span>}
                    </td>
                    <td className="py-3 px-3 text-gray-500 text-xs whitespace-nowrap">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-3">
                      {u.role !== 'admin' && (
                        <div className="flex items-center gap-1.5">
                          {isPending ? (
                            <button title="Approve — activate this account"
                              onClick={() => patchUser(u.id, { action: 'activate' }, `${u.name} approved`)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all hover:scale-105"
                              style={{ background: 'rgba(16,185,129,0.18)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                          ) : (
                            <button title={isSuspended ? 'Activate' : 'Suspend'}
                              onClick={() => patchUser(u.id, { action: isSuspended ? 'activate' : 'suspend' }, isSuspended ? `${u.name} activated` : `${u.name} suspended`)}
                              className="p-1.5 rounded-lg transition-colors hover:scale-110"
                              style={{ background: isSuspended ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: isSuspended ? '#34d399' : '#f87171' }}>
                              {isSuspended ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          <button title="Adjust Balance" onClick={() => { setModal({ type: 'balance', user: u }); setBalanceAmt(''); setBalanceReason(''); }}
                            className="p-1.5 rounded-lg transition-colors hover:scale-110"
                            style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}>
                            <Wallet className="w-3.5 h-3.5" />
                          </button>
                          <button title="Set Package" onClick={() => { setModal({ type: 'package', user: u }); setNewPkg(u.package_level); }}
                            className="p-1.5 rounded-lg transition-colors hover:scale-110"
                            style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>
                            <Package className="w-3.5 h-3.5" />
                          </button>
                          <button title="Delete Member" onClick={() => setModal({ type: 'delete', user: u })}
                            className="p-1.5 rounded-lg transition-colors hover:scale-110"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
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

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="glass gold-border-glow rounded-2xl p-6 w-full max-w-md relative" style={{ background: '#0a0600' }}>
            <button onClick={() => setModal(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            {/* Register Modal */}
            {modal.type === 'register' && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.12)' }}>
                    <UserPlus className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg leading-none">Register Member</h3>
                    <p className="text-gray-500 text-xs mt-0.5">Create a new account manually</p>
                  </div>
                </div>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Full Name</label>
                    <input required value={regForm.name} onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))}
                      className="input-dark w-full px-4 py-3 rounded-xl text-sm" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Email Address</label>
                    <input required type="email" value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                      className="input-dark w-full px-4 py-3 rounded-xl text-sm" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Password</label>
                    <div className="relative">
                      <input required type={showPw ? 'text' : 'password'} value={regForm.password}
                        onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                        className="input-dark w-full px-4 py-3 pr-11 rounded-xl text-sm" placeholder="Min. 6 characters" />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">BSC Wallet Address (optional)</label>
                    <input value={regForm.bscAddress} onChange={e => setRegForm(f => ({ ...f, bscAddress: e.target.value }))}
                      className="input-dark w-full px-4 py-3 rounded-xl text-sm font-mono" placeholder="0x..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Referral Code (optional)</label>
                      <input value={regForm.referralCode} onChange={e => setRegForm(f => ({ ...f, referralCode: e.target.value }))}
                        className="input-dark w-full px-4 py-3 rounded-xl text-sm font-mono tracking-wider" placeholder="XXXX0000" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Starting Package</label>
                      <div className="relative">
                        <select value={regForm.packageLevel} onChange={e => setRegForm(f => ({ ...f, packageLevel: parseInt(e.target.value) }))}
                          className="input-dark w-full px-4 py-3 rounded-xl text-sm appearance-none cursor-pointer">
                          {PACKAGES.map(p => <option key={p.level} value={p.level} style={{ background: '#0f0801' }}>{p.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setModal(null)} className="btn-ghost flex-1 py-3 rounded-xl font-bold text-sm">Cancel</button>
                    <button type="submit" disabled={working}
                      className="btn-gold flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                      {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Register
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Balance Modal */}
            {modal.type === 'balance' && (
              <>
                <h3 className="text-white font-black text-lg mb-1">Adjust Balance</h3>
                <p className="text-gray-400 text-sm mb-5">{modal.user.name} — Current: <span className="text-amber-400">${modal.user.wallet_balance.toFixed(2)}</span></p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Amount (use negative to deduct)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input type="number" step="0.01" value={balanceAmt}
                        onChange={e => setBalanceAmt(e.target.value)}
                        className="input-dark w-full pl-7 pr-4 py-3 rounded-xl text-sm"
                        placeholder="e.g. 50 or -20" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Reason</label>
                    <input type="text" value={balanceReason} onChange={e => setBalanceReason(e.target.value)}
                      className="input-dark w-full px-4 py-3 rounded-xl text-sm" placeholder="Reason for adjustment..." />
                  </div>
                  <button disabled={!balanceAmt || working}
                    onClick={() => patchUser(modal.user.id, { action: 'adjust_balance', amount: parseFloat(balanceAmt), reason: balanceReason || 'Admin adjustment' }, 'Balance updated')}
                    className="btn-gold w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                    {working ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Apply Adjustment
                  </button>
                </div>
              </>
            )}

            {/* Package Modal */}
            {modal.type === 'package' && (
              <>
                <h3 className="text-white font-black text-lg mb-1">Set Package</h3>
                <p className="text-gray-400 text-sm mb-5">{modal.user.name}</p>
                <div className="space-y-4">
                  <div className="relative">
                    <select value={newPkg} onChange={e => setNewPkg(parseInt(e.target.value))}
                      className="input-dark w-full px-4 py-3 rounded-xl text-sm appearance-none cursor-pointer">
                      <option value={0} style={{ background: '#0f0801' }}>No Package</option>
                      {PACKAGES.map(p => <option key={p.level} value={p.level} style={{ background: '#0f0801' }}>{p.name} — ${p.price.toLocaleString()}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <button disabled={working}
                    onClick={() => patchUser(modal.user.id, { action: 'set_package', packageLevel: newPkg }, 'Package updated')}
                    className="btn-gold w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                    {working ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Apply Package
                  </button>
                </div>
              </>
            )}

            {/* Delete Modal */}
            {modal.type === 'delete' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-red-500/15"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
                  <h3 className="text-white font-black text-lg">Delete Member</h3>
                </div>
                <p className="text-gray-300 mb-2">Are you sure you want to delete <span className="text-white font-bold">{modal.user.name}</span>?</p>
                <p className="text-red-400 text-sm mb-6">This will permanently remove their account, earnings, and all transaction history.</p>
                <div className="flex gap-3">
                  <button onClick={() => setModal(null)} className="btn-ghost flex-1 py-3 rounded-xl font-bold text-sm">Cancel</button>
                  <button disabled={working} onClick={() => deleteUser(modal.user.id)}
                    className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                    style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171' }}>
                    {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
