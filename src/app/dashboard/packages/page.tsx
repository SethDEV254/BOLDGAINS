'use client';

import { useEffect, useState } from 'react';
import { PACKAGES } from '@/lib/packages';
import { Check, ChevronRight, Loader2, Lock, Star } from 'lucide-react';

export default function PackagesPage() {
  const [userPkg, setUserPkg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<number | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => {
      setUserPkg(d.user?.packageLevel || 0);
    }).finally(() => setLoading(false));
  }, []);

  async function handleUpgrade(level: number) {
    setUpgrading(level);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/packages/upgrade', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageLevel: level }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setUserPkg(level);
      setSuccess(`Successfully upgraded to ${data.package.name}!`);
      setTimeout(() => setSuccess(''), 4000);
    } catch {
      setError('Upgrade failed. Try again.');
    } finally {
      setUpgrading(null);
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
      <div>
        <h1 className="text-2xl font-black text-white">Membership Packages</h1>
        <p className="text-gray-400 text-sm mt-1">Choose your tier and unlock more products & earnings</p>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3">
          <Check className="w-5 h-5 flex-shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">{error}</div>
      )}

      {currentPkg && (
        <div className="glass rounded-2xl p-6" style={{ border: `1px solid ${currentPkg.color}40` }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black"
              style={{ background: `${currentPkg.color}15`, color: currentPkg.color, border: `2px solid ${currentPkg.color}40` }}>
              {currentPkg.level}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Package</p>
              <h2 className="text-2xl font-black" style={{ color: currentPkg.color }}>{currentPkg.name}</h2>
              <p className="text-gray-400 text-sm">${currentPkg.price} · {currentPkg.products} products</p>
            </div>
            <div className="ml-auto hidden sm:flex items-center gap-2 text-amber-400">
              <Star className="w-5 h-5 fill-amber-400" />
              <span className="font-bold">Active</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {PACKAGES.map(pkg => {
          const isOwned = pkg.level === userPkg;
          const isLower = pkg.level < userPkg;
          const canUpgrade = pkg.level > userPkg;

          return (
            <div key={pkg.level}
              className="relative rounded-2xl p-5 transition-all duration-300 overflow-hidden"
              style={{
                background: isOwned ? `${pkg.color}10` : 'rgba(255,255,255,0.02)',
                border: isOwned ? `2px solid ${pkg.color}50` : isLower
                  ? '1px solid rgba(255,255,255,0.05)'
                  : `1px solid ${pkg.color}25`,
                opacity: isLower ? 0.5 : 1,
                boxShadow: isOwned ? `0 0 30px ${pkg.color}15` : 'none',
              }}>
              {isOwned && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
                  style={{ background: `${pkg.color}20`, color: pkg.color }}>
                  <Check className="w-3 h-3" /> Current
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
              </div>

              <div className="space-y-2 mb-5">
                {[
                  `${pkg.products} products`,
                  '30% direct bonus',
                  '30% upgrade bonus',
                  'Network level rewards',
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
                  Active Package
                </div>
              ) : isLower ? (
                <div className="py-3 text-center text-sm font-bold rounded-xl flex items-center justify-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.03)', color: '#4b5563' }}>
                  <Lock className="w-4 h-4" /> Downgrade N/A
                </div>
              ) : (
                <button onClick={() => handleUpgrade(pkg.level)}
                  disabled={upgrading === pkg.level}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${pkg.color}, ${pkg.color}aa)`,
                    color: '#000',
                  }}>
                  {upgrading === pkg.level
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Upgrading...</>
                    : <>Upgrade <ChevronRight className="w-4 h-4" /></>}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
