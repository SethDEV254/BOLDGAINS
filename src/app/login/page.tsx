'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Wallet, Loader2, Check } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';

type Step = 'idle' | 'connecting' | 'signing';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const wallet = useWallet();

  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);

  // wagmi's isConnecting can flip true on the client during auto-reconnect before the
  // server ever sees it — gate on mount so the first client render matches SSR exactly.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const connecting = mounted && wallet.connecting;

  // Already holding a valid session cookie (signed in within the last 7 days) —
  // skip the wallet/signature flow entirely and go straight in.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (cancelled) return;
      if (d.authenticated) {
        const redirect = params.get('redirect');
        router.replace(redirect ? `/${redirect}` : d.role === 'admin' ? '/admin' : '/dashboard');
        return;
      }
      setCheckingSession(false);
    }).catch(() => { if (!cancelled) setCheckingSession(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wallet already reconnected in the background (wagmi's persisted cookie storage) —
  // go straight to the signature prompt instead of waiting for another click.
  const autoSignAttempted = useRef(false);
  useEffect(() => {
    if (checkingSession || autoSignAttempted.current) return;
    if (wallet.address && wallet.isReady && step === 'idle') {
      autoSignAttempted.current = true;
      handleSignIn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingSession, wallet.address, wallet.isReady, step]);

  async function handleSignIn() {
    setError('');
    setStep('signing');
    try {
      const address = wallet.address!;

      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const nonceData = await nonceRes.json();
      if (!nonceRes.ok) { setError(nonceData.error || 'Failed to start sign-in'); setStep('idle'); return; }

      const signature = await wallet.signMessage(nonceData.message);

      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) { setError(verifyData.error || 'Sign-in failed'); setStep('idle'); return; }

      const redirect = params.get('redirect');
      if (redirect) { router.push(`/${redirect}`); return; }
      router.push(verifyData.role === 'admin' ? '/admin' : '/dashboard');
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || 'Sign-in failed');
      setStep('idle');
    }
  }

  function handleConnectClick() {
    setError('');
    if (wallet.address && wallet.isReady) { handleSignIn(); return; }
    setStep('connecting');
    wallet.open();
  }

  // Once the wallet finishes connecting after a click, trigger the signature step.
  useEffect(() => {
    if (wallet.address && wallet.isReady && step === 'connecting') handleSignIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.address, wallet.isReady, step]);

  const isBusy = step !== 'idle' || connecting;

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000000' }}>
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: '#000000' }}>
      <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,100,0,0.1) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image src="/logo.jpeg" alt="Bold Gains" width={80} height={80}
              className="rounded-full mx-auto mb-4"
              style={{ boxShadow: '0 0 40px rgba(255,140,0,0.3)', border: '2px solid rgba(255,140,0,0.25)' }} />
          </Link>
          <h1 className="text-3xl font-black gold-gradient">Welcome Back</h1>
          <p className="text-gray-400 mt-2">Sign in with your BSC wallet</p>
          <Link href="/" className="inline-flex items-center gap-1.5 mt-3 text-xs text-gray-500 hover:text-amber-500 transition-colors">
            ← Back to Home
          </Link>
        </div>

        <div className="glass rounded-3xl p-8 gold-border-glow">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button type="button" onClick={handleConnectClick} disabled={isBusy}
            className="btn-gold w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-base">
            {step === 'connecting' || connecting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Connecting Wallet…</>
            ) : step === 'signing' ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Confirm in Wallet…</>
            ) : wallet.address ? (
              <><Check className="w-5 h-5" /> Sign In</>
            ) : (
              <><Wallet className="w-5 h-5" /> Connect Wallet to Sign In</>
            )}
          </button>

          {wallet.address && (
            <p className="text-center text-xs text-emerald-400 mt-4">
              Connected: {wallet.address.slice(0, 8)}…{wallet.address.slice(-6)}
            </p>
          )}

          <p className="text-center text-xs text-gray-600 mt-4">
            Supports MetaMask, WalletConnect, Trust Wallet &amp; 400+ wallets
          </p>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              No account yet?{' '}
              <Link href="/register" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
                Join Bold Gains
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
