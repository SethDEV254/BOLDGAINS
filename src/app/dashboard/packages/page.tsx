'use client';

import { useEffect, useState } from 'react';
import { PACKAGES } from '@/lib/packages';
import { getBnbPrice, usdToBnb } from '@/lib/bnb-price';
import { Check, ChevronRight, Loader2, Lock, Star, Link2, ExternalLink } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';

export default function PackagesPage() {
  const [userPkg, setUserPkg] = useState(0);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<number | null>(null);
  const [success, setSuccess] = useState<{ text: string; hash?: string } | null>(null);
  const [error, setError] = useState('');
  const [bnbPrice, setBnbPrice] = useState<number | null>(null);
  const wallet = useWallet();

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => {
      setUserPkg(d.user?.packageLevel || 0);
      setUserId(d.user?.id?.toString() || '');
    }).finally(() => setLoading(false));
    getBnbPrice().then(setBnbPrice);
  }, []);

  async function handleBuy(level: number, priceUsd: number) {
    setWorking(level);
    setError('');
    setSuccess(null);
    const pkg = PACKAGES.find(p => p.level === level)!;

    try {
      let txHash: string | undefined;

      if (wallet.isReady) {
        if (!wallet.address) await wallet.open();
        const price = bnbPrice || await getBnbPrice();
        const bnbAmount = usdToBnb(priceUsd, price);
        txHash = await wallet.payUpgradeFee(bnbAmount, userId, level);
      }

      const res = await fetch('/api/packages/upgrade', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageLevel: level, txHash }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }

      setUserPkg(level);
      setSuccess({
        text: `${userPkg === 0 ? 'Activated' : 'Upgraded to'} ${pkg.name}! 30% bonus sent instantly to your sponsor's wallet.`,
        hash: txHash,
      });
      setTimeout(() => setSuccess(null), 6000);
    } catch (e: any) {
      setError(e?.message || 'Transaction failed. Try again.');
    } finally {
      setWorking(null);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
    </div>
  );

  const currentPkg = PACKAGES.find(p => p.level === userPkg);

  return (
    <div className="max-w-7xl space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">Packages</h1>
          <p className="text-gray-400 text-sm mt-1">
            {userPkg === 0
              ? 'You are a registered member. Activate a package to unlock earnings.'
              : 'Upgrade your package to unlock higher rewards. Paid in BNB at live rate.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live BNB price */}
          {bnbPrice && (
            <div className="text-xs px-3 py-2 rounded-xl"
              style={{ background: 'rgba(202,138,4,0.08)', border: '1px solid rgba(202,138,4,0.2)', color: '#fbbf24' }}>
              BNB = ${bnbPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
          )}

          {wallet.isReady && (
            <div>
              {wallet.address
                ? <span className="flex items-center gap-1.5 text-xs text-emerald-400 glass px-3 py-2 rounded-xl border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
                  </span>
                : <button onClick={() => wallet.open()} disabled={wallet.connecting}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{ background: 'rgba(202,138,4,0.12)', color: '#fbbf24', border: '1px solid rgba(202,138,4,0.3)' }}>
                    {wallet.connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                    Connect Wallet
                  </button>}
            </div>
          )}
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-start gap-3">
          <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            {success.text}
            {success.hash && (
              <a href={`https://bscscan.com/tx/${success.hash}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs mt-1 opacity-70 hover:opacity-100">
                View on BscScan <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}
      {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">{error}</div>}

      {currentPkg && (
        <div className="glass rounded-2xl p-6" style={{ border: `1px solid ${currentPkg.color}40` }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black"
              style={{ background: `${currentPkg.color}15`, color: currentPkg.color, border: `2px solid ${currentPkg.color}40` }}>
              {currentPkg.level}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Active Package</p>
              <h2 className="text-2xl font-black" style={{ color: currentPkg.color }}>{currentPkg.name}</h2>
              <p className="text-gray-400 text-sm">${currentPkg.price.toLocaleString()} · {currentPkg.products} products</p>
            </div>
            <div className="ml-auto hidden sm:flex items-center gap-2 text-amber-400">
              <Star className="w-5 h-5 fill-amber-400" />
              <span className="font-bold">Active</span>
            </div>
          </div>
        </div>
      )}

      {userPkg === 0 && (
        <div className="p-4 rounded-xl text-sm"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <p className="text-amber-300 font-bold mb-1">You're registered but have no active package.</p>
          <p className="text-amber-600">Choose a package below. USD price is paid in BNB at the live rate. Your sponsor gets 30% instantly.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {PACKAGES.map(pkg => {
          const isOwned  = pkg.level === userPkg;
          const isLower  = pkg.level < userPkg;
          const isFirst  = userPkg === 0;
          const bnbEq    = bnbPrice ? usdToBnb(pkg.price, bnbPrice) : null;

          const btnLabel = working === pkg.level
            ? 'Processing…'
            : isFirst ? `Activate — $${pkg.price.toLocaleString()}`
            : `Upgrade — $${pkg.price.toLocaleString()}`;

          return (
            <div key={pkg.level}
              className="relative rounded-2xl p-5 transition-all duration-300 overflow-hidden"
              style={{
                background: isOwned ? `${pkg.color}10` : 'rgba(255,255,255,0.02)',
                border: isOwned ? `2px solid ${pkg.color}50` : isLower
                  ? '1px solid rgba(255,255,255,0.05)'
                  : `1px solid ${pkg.color}25`,
                opacity: isLower ? 0.45 : 1,
                boxShadow: isOwned ? `0 0 30px ${pkg.color}15` : 'none',
              }}>
              {isOwned && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
                  style={{ background: `${pkg.color}20`, color: pkg.color }}>
                  <Check className="w-3 h-3" /> Active
                </div>
              )}
              {pkg.level === 5 && !isOwned && !isLower && (
                <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold bg-amber-500 text-black">
                  Popular
                </div>
              )}

              <div className="mb-4">
                <div className="text-xs font-bold px-2 py-1 rounded-full inline-flex items-center mb-3"
                  style={{ color: pkg.color, background: `${pkg.color}15`, border: `1px solid ${pkg.color}30` }}>
                  Level {pkg.level}
                </div>
                <h3 className="text-xl font-black mb-1" style={{ color: pkg.color }}>{pkg.name}</h3>
                <div className="text-3xl font-black text-white">${pkg.price.toLocaleString()}</div>
                {bnbEq && (
                  <p className="text-xs text-gray-500 mt-0.5">{bnbEq.toFixed(4)} BNB</p>
                )}
              </div>

              <div className="space-y-2 mb-5">
                {[
                  `${pkg.products} products`,
                  '30% upgrade bonus (instant)',
                  '15% network (10 levels)',
                  'Leadership & Rank pools',
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: pkg.color }} />
                    {f}
                  </div>
                ))}
              </div>

              {isOwned ? (
                <div className="py-3 text-center text-sm font-bold rounded-xl"
                  style={{ background: `${pkg.color}20`, color: pkg.color }}>
                  Current Package
                </div>
              ) : isLower ? (
                <div className="py-3 text-center text-sm font-bold rounded-xl flex items-center justify-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.03)', color: '#374151' }}>
                  <Lock className="w-4 h-4" /> Already Passed
                </div>
              ) : (
                <button onClick={() => handleBuy(pkg.level, pkg.price)}
                  disabled={working === pkg.level}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{ background: `linear-gradient(135deg, ${pkg.color}, ${pkg.color}aa)`, color: '#000' }}>
                  {working === pkg.level
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> {btnLabel}</>
                    : <>{btnLabel} <ChevronRight className="w-4 h-4" /></>}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
