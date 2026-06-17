'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, ExternalLink, AlertCircle, Check, Wallet } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { REGISTRATION_FEE } from '@/lib/packages';
import { getBnbPrice, usdToBnb } from '@/lib/bnb-price';

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const wallet = useWallet();

  const refWallet = params.get('ref') || '';

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [step, setStep] = useState<'form' | 'connecting' | 'paying' | 'done'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [bnbPrice, setBnbPrice] = useState<number | null>(null);

  const pendingForm = useRef<typeof form | null>(null);

  useEffect(() => { getBnbPrice().then(setBnbPrice); }, []);

  // Auto-proceed once wallet connects during the 'connecting' step
  useEffect(() => {
    if (wallet.address && step === 'connecting' && pendingForm.current) {
      const saved = pendingForm.current;
      pendingForm.current = null;
      register(saved, wallet.address);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.address, step]);

  async function register(data: typeof form, walletAddr: string) {
    setStep('paying');
    setLoading(true);
    setError('');
    try {
      let hash: string | undefined;

      if (wallet.isReady) {
        const price = bnbPrice || await getBnbPrice();
        hash = await wallet.payRegistrationFee(usdToBnb(REGISTRATION_FEE, price), data.email);
        setTxHash(hash);
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, bscAddress: walletAddr, refWallet, txHash: hash }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); setStep('form'); return; }

      setStep('done');
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (e: any) {
      const isInsufficientFunds =
        e?.code === 'INSUFFICIENT_FUNDS' ||
        e?.info?.error?.code === -32000 ||
        /insufficient funds/i.test(e?.message || e?.shortMessage || '');
      setError(
        isInsufficientFunds
          ? `Insufficient BNB balance. Top up your wallet to cover the $${REGISTRATION_FEE} activation fee, then try again.`
          : e?.shortMessage || e?.message || 'Payment or registration failed',
      );
      setStep('form');
    } finally {
      setLoading(false);
    }
  }

  function validate() {
    if (!form.name.trim()) { setError('Full name is required'); return false; }
    if (!form.email.trim()) { setError('Email address is required'); return false; }
    if (!form.password || form.password.length < 6) { setError('Password must be at least 6 characters'); return false; }
    return true;
  }

  async function handleConnectClick() {
    setError('');
    if (!validate()) return;

    // Already connected — proceed straight to payment + registration
    if (wallet.address) {
      await register(form, wallet.address);
      return;
    }

    // Open Web3Modal — once user connects, the useEffect above fires
    pendingForm.current = { ...form };
    setStep('connecting');
    wallet.open();
  }

  const isBusy = loading || step === 'paying' || wallet.connecting;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative" style={{ background: '#000000' }}>
      <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,100,0,0.1) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/"><Image src="/logo.jpeg" alt="Bold Gains" width={72} height={72}
            className="rounded-full mx-auto mb-4"
            style={{ boxShadow: '0 0 40px rgba(255,140,0,0.3)', border: '2px solid rgba(255,140,0,0.25)' }} /></Link>
          <h1 className="text-3xl font-black gold-gradient">Join Bold Gains</h1>
          <p className="text-gray-400 mt-2">Pay ${REGISTRATION_FEE} registration fee · Start earning instantly</p>
          <Link href="/" className="inline-flex items-center gap-1.5 mt-3 text-xs text-gray-500 hover:text-amber-500 transition-colors">
            ← Back to Home
          </Link>
        </div>

        <div className="flex items-center justify-between px-5 py-3 rounded-2xl mb-5"
          style={{ background: 'rgba(255,140,0,0.07)', border: '1px solid rgba(255,140,0,0.22)' }}>
          <div className="text-sm">
            <span className="text-gray-400">Registration Fee</span>
            <span className="text-white font-black ml-3">${REGISTRATION_FEE} USD</span>
          </div>
          <div className="text-xs text-right">
            <p className="text-gray-500">10% fee · net ${(REGISTRATION_FEE * 0.9).toFixed(2)} · paid in BNB</p>
            <p className="text-amber-500/70">No package · upgrade anytime</p>
          </div>
        </div>

        <div className="glass rounded-3xl p-8 gold-border-glow">
          {step === 'done' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-xl font-black text-white mb-2">Welcome to Bold Gains!</p>
              <p className="text-gray-400 text-sm mb-4">Account created · Redirecting to dashboard…</p>
              {txHash && (
                <a href={`https://bscscan.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300">
                  View tx on BscScan <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <p className="text-gray-500 text-xs mt-3 flex items-center justify-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Going to dashboard…
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                  <input type="text" value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm" placeholder="John Doe" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                  <input type="email" value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm" placeholder="you@example.com" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      className="input-dark w-full px-4 py-3 pr-12 rounded-xl text-sm"
                      placeholder="Min. 6 characters" />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-400 transition-colors">
                      {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {refWallet && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                    style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <span className="text-emerald-400">Referred by </span>
                    <span className="text-gray-400 font-mono truncate">{refWallet.slice(0, 10)}…{refWallet.slice(-6)}</span>
                  </div>
                )}

                <button type="button" onClick={handleConnectClick} disabled={isBusy}
                  className="btn-gold w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-base mt-2">
                  {step === 'paying' ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Paying ${REGISTRATION_FEE}…</>
                  ) : wallet.connecting || step === 'connecting' ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Connecting Wallet…</>
                  ) : wallet.address ? (
                    <><Check className="w-5 h-5" /> Create Account</>
                  ) : (
                    <><Wallet className="w-5 h-5" /> Connect Wallet &amp; Register</>
                  )}
                </button>

                {(step === 'connecting' || wallet.connecting) && (
                  <button type="button"
                    onClick={() => { setStep('form'); pendingForm.current = null; }}
                    className="w-full py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{ color: '#888888', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    Cancel
                  </button>
                )}

                {wallet.address && (
                  <p className="text-center text-xs text-emerald-400">
                    Connected: {wallet.address.slice(0, 8)}…{wallet.address.slice(-6)}
                    {' · '}{wallet.bnbBalance} BNB
                  </p>
                )}

                <p className="text-center text-xs text-gray-600">
                  Supports MetaMask, WalletConnect, Trust Wallet &amp; 400+ wallets
                </p>
              </div>

              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm">
                  Already a member?{' '}
                  <Link href="/login" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
                    Sign In
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
