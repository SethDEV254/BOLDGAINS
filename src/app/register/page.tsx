'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, Check, Wallet, ShieldCheck } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { REGISTRATION_FEE, REGISTRATION_FEE_GROSS } from '@/lib/packages';
import { getBnbPrice, usdToBnb } from '@/lib/bnb-price';

type Step = 'form' | 'connecting' | 'confirm' | 'paying';

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const wallet = useWallet();

  const refWallet = params.get('ref') || '';

  const [form, setForm] = useState({ name: '' });
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bnbPrice, setBnbPrice] = useState<number | null>(null);
  const [bnbAmount, setBnbAmount] = useState<number | null>(null);

  const pendingForm = useRef<typeof form | null>(null);

  useEffect(() => { getBnbPrice().then(p => { setBnbPrice(p); setBnbAmount(usdToBnb(REGISTRATION_FEE_GROSS, p)); }); }, []);

  async function proceedToConfirm() {
    const price = bnbPrice || await getBnbPrice();
    setBnbAmount(usdToBnb(REGISTRATION_FEE_GROSS, price));

    const res = await fetch('/api/auth/check-availability', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bscAddress: wallet.address }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); setStep('form'); return; }

    setStep('confirm');
  }

  // After wallet connects during 'connecting' step, move to confirm
  useEffect(() => {
    if (wallet.address && step === 'connecting' && pendingForm.current) {
      proceedToConfirm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.address, step]);

  function validate() {
    if (!form.name.trim()) { setError('Username is required'); return false; }
    return true;
  }

  async function handleConnectClick() {
    setError('');
    if (!validate()) return;

    setLoading(true);
    const res = await fetch('/api/auth/check-availability', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name }),
    });
    setLoading(false);
    if (!res.ok) { const d = await res.json(); setError(d.error); return; }

    pendingForm.current = { ...form };

    if (wallet.address) {
      await proceedToConfirm();
      return;
    }

    setStep('connecting');
    wallet.open();
  }

  async function handleConfirmPay() {
    const saved = pendingForm.current ?? form;
    const walletAddr = wallet.address!;
    setStep('paying');
    setLoading(true);
    setError('');

    try {
      if (!wallet.isReady) {
        setError('Wallet connection still finalizing — wait a moment and try again.');
        setStep('confirm');
        setLoading(false);
        return;
      }

      const price = bnbPrice || await getBnbPrice();
      const hash = await wallet.payRegistrationFee(usdToBnb(REGISTRATION_FEE_GROSS, price), walletAddr, refWallet || undefined);

      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: saved.name, bscAddress: walletAddr, refWallet, txHash: hash }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); setStep('form'); return; }

      router.push('/dashboard');
    } catch (e: any) {
      const isInsufficientFunds =
        e?.code === 'INSUFFICIENT_FUNDS' ||
        e?.info?.error?.code === -32000 ||
        /insufficient funds/i.test(e?.message || e?.shortMessage || '');
      setError(
        isInsufficientFunds
          ? `Insufficient BNB. Top up your wallet to cover the $${REGISTRATION_FEE} fee and try again.`
          : e?.shortMessage || e?.message || 'Payment or registration failed',
      );
      setStep('form');
    } finally {
      setLoading(false);
    }
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
          <p className="text-gray-400 mt-2">Pay ${REGISTRATION_FEE_GROSS} registration fee · Instant access after payment</p>
          <Link href="/" className="inline-flex items-center gap-1.5 mt-3 text-xs text-gray-500 hover:text-amber-500 transition-colors">
            ← Back to Home
          </Link>
        </div>

        <div className="flex items-center justify-between px-5 py-3 rounded-2xl mb-5"
          style={{ background: 'rgba(255,140,0,0.07)', border: '1px solid rgba(255,140,0,0.22)' }}>
          <div className="text-sm">
            <span className="text-gray-400">Registration Fee</span>
            <span className="text-white font-black ml-3">${REGISTRATION_FEE_GROSS} USD</span>
          </div>
          <div className="text-xs text-right">
            <p className="text-gray-500">10% fee · net ${REGISTRATION_FEE.toFixed(2)} · paid in BNB</p>
            <p className="text-amber-500/70">Instant access after payment</p>
          </div>
        </div>

        <div className="glass rounded-3xl p-8 gold-border-glow">

          {step === 'confirm' ? (
            /* ── CONFIRMATION MODAL ── */
            <div>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(255,140,0,0.1)', border: '1px solid rgba(255,140,0,0.3)' }}>
                  <ShieldCheck className="w-7 h-7 text-amber-400" />
                </div>
                <p className="text-white font-black text-lg">Confirm Payment</p>
                <p className="text-gray-500 text-sm mt-1">Review before your wallet sends BNB</p>
              </div>

              <div className="rounded-xl overflow-hidden mb-6"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {[
                  ['Username', form.name],
                  ['Wallet', `${wallet.address?.slice(0, 10)}…${wallet.address?.slice(-6)}`],
                  ['Base registration', `$${REGISTRATION_FEE} USD`],
                  ['Platform fee (10%)', `$${(REGISTRATION_FEE * 0.1).toFixed(2)} USD`],
                  ['Total (net)', `$${REGISTRATION_FEE_GROSS} USD`],
                  ...(refWallet ? [['Referral split', '50% sent on-chain to your referrer, instantly']] : []),
                  ['You will pay', bnbAmount ? `${bnbAmount.toFixed(6)} BNB` : 'calculating…'],
                ].map(([label, val], i, arr) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className={`text-sm font-semibold ${i === arr.length - 1 ? 'text-amber-400' : 'text-white'}`}>{val}</span>
                  </div>
                ))}
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => { setStep('form'); setError(''); }}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>
                  Cancel
                </button>
                <button onClick={handleConfirmPay} disabled={isBusy || !wallet.isReady}
                  className="btn-gold flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                  {isBusy
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Paying…</>
                    : !wallet.isReady
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Finalizing wallet…</>
                    : <><Check className="w-4 h-4" /> Confirm &amp; Pay</>}
                </button>
              </div>
            </div>

          ) : (
            /* ── MAIN FORM ── */
            <>
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                  <input type="text" value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. boldearner99" />
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
                  {wallet.connecting || step === 'connecting' ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Connecting Wallet…</>
                  ) : wallet.address ? (
                    <><Check className="w-5 h-5" /> Review &amp; Pay ${REGISTRATION_FEE_GROSS}</>
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
