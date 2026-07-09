'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { REORDER_PACKAGES } from '@/lib/packages';
import { ShoppingBag, Check, Loader2, Sparkles, Droplets, Zap, Star } from 'lucide-react';

const PRODUCT_IMAGES = [
  { src: '/products/product-1.jpeg', alt: 'BoldGlow Gold Mask — front view' },
  { src: '/products/product-2.jpeg', alt: 'BoldGlow Gold Mask — Be Bold variant' },
  { src: '/products/model.jpeg', alt: 'BoldGlow Gold Mask — in use' },
  { src: '/products/product-packaging.jpeg', alt: 'BoldGlow Gold Mask — full packaging' },
];

const BENEFITS = [
  'Reduces appearance of fine lines and wrinkles',
  'Firms, smooths and promotes younger-looking skin',
  'Deeply cleanses pores and removes impurities',
  'Brightens dull skin for a radiant glow',
  'Supports skin hydration and improved elasticity',
  'Refines skin texture — leaves face feeling refreshed',
];

const INGREDIENTS = [
  { icon: Zap, name: 'Retinol', desc: 'Skin renewal & anti-aging' },
  { icon: Sparkles, name: 'Snake Venom Peptides', desc: 'Firmness & smoother skin' },
  { icon: Star, name: '24K Gold', desc: 'Radiance & luxurious glow' },
  { icon: Droplets, name: 'Collagen & Agents', desc: 'Hydration & suppleness' },
];

const HOW_TO_USE = [
  'Cleanse and dry your face thoroughly',
  'Apply an even layer, avoid eyes, brows, lips & hairline',
  'Leave on 15–20 minutes until fully dry',
  'Gently peel off from the edges',
  'Rinse residue and follow with a moisturizer',
];

export default function ProductsPage() {
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<number | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => setWalletBalance(d.user?.walletBalance || 0))
      .finally(() => setLoading(false));
  }, []);

  async function handleReorder(packageId: number) {
    setWorking(packageId);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/products/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setWalletBalance(prev => prev - (REORDER_PACKAGES.find(p => p.id === packageId)?.price || 0));
      setSuccess(`Order placed! ${data.qty} BoldGlow™ unit${data.qty > 1 ? 's' : ''} ordered successfully.`);
      setTimeout(() => setSuccess(''), 5000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setWorking(null);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">BoldGlow™ Products</h1>
        <p className="text-gray-400 text-sm mt-1">Retinol Snake Venom Gold Peel-Off Mask — reorder for you and your team</p>
      </div>

      {/* Alerts */}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3">
          <Check className="w-5 h-5 flex-shrink-0" /> {success}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">{error}</div>
      )}

      {/* Wallet balance */}
      <div className="glass rounded-2xl p-5 flex items-center justify-between"
        style={{ border: '1px solid rgba(202,138,4,0.25)', background: 'rgba(202,138,4,0.04)' }}>
        <div>
          <p className="text-gray-400 text-xs mb-1">Wallet Balance</p>
          <p className="text-2xl font-black text-white">${walletBalance.toFixed(2)}</p>
        </div>
        <div className="p-3 rounded-xl" style={{ background: 'rgba(202,138,4,0.1)' }}>
          <ShoppingBag className="w-6 h-6 text-amber-400" />
        </div>
      </div>

      {/* Product Info */}
      <div className="glass rounded-2xl p-6 gold-border-glow">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image gallery */}
          <div className="space-y-3">
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden"
              style={{ background: '#0a0600', border: '1px solid rgba(255,184,0,0.15)' }}>
              <Image
                src={PRODUCT_IMAGES[activeImg].src}
                alt={PRODUCT_IMAGES[activeImg].alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {PRODUCT_IMAGES.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className="relative aspect-square rounded-xl overflow-hidden transition-all"
                  style={{
                    border: activeImg === i ? '2px solid #FFB800' : '2px solid rgba(255,255,255,0.06)',
                    opacity: activeImg === i ? 1 : 0.6,
                  }}>
                  <Image src={img.src} alt={img.alt} fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          </div>

          {/* Product details */}
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: '#FF8C00' }}>BoldGlow™ by Boldgains International</p>
              <h2 className="text-2xl font-black text-white mb-3">Retinol Snake Venom Gold Peel-Off Mask</h2>
              <p className="text-sm leading-relaxed" style={{ color: '#888' }}>
                Premium anti-aging beauty mask designed to rejuvenate, firm, and brighten the skin
                while delivering a luxurious spa-like skincare experience.
              </p>
              <p className="text-sm mt-4 font-bold italic" style={{ color: '#FFB800' }}>
                "Be Bold. Gain Power. Reveal Your Golden Glow."
              </p>

              <div className="mt-5 space-y-2">
                {BENEFITS.map((b, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                      style={{ background: 'rgba(255,184,0,0.15)', border: '1px solid rgba(255,184,0,0.3)' }}>
                      <div className="w-1 h-1 rounded-full bg-amber-400" />
                    </div>
                    <p className="text-sm text-gray-300">{b}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="h-px my-6" style={{ background: 'rgba(255,255,255,0.06)' }} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ingredients */}
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#FF8C00' }}>Hero Ingredients</p>
            <div className="space-y-2">
              {INGREDIENTS.map((ing, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl"
                  style={{ background: 'rgba(255,184,0,0.04)', border: '1px solid rgba(255,184,0,0.1)' }}>
                  <ing.icon className="w-4 h-4 flex-shrink-0 text-amber-400" />
                  <div>
                    <p className="text-sm font-semibold text-white">{ing.name}</p>
                    <p className="text-xs" style={{ color: '#666' }}>{ing.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How to use */}
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#FF8C00' }}>How to Use</p>
            <div className="space-y-1.5">
              {HOW_TO_USE.map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-xs font-black flex-shrink-0 mt-0.5"
                    style={{ color: '#FF8C00' }}>{String(i + 1).padStart(2, '0')}</span>
                  <p className="text-xs text-gray-400">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reorder Packages */}
      <div>
        <div className="mb-6">
          <h2 className="text-lg font-black text-white">Product Reorder Packages</h2>
          <p className="text-gray-500 text-sm mt-1">
            Purchase from your wallet balance. 30% is distributed across all 10 upline levels instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REORDER_PACKAGES.map(pkg => {
            const canAfford = walletBalance >= pkg.price;
            const isWorking = working === pkg.id;
            const pricePerUnit = (pkg.price / pkg.qty).toFixed(2);

            return (
              <div key={pkg.id}
                className="rounded-2xl p-5 transition-all"
                style={{
                  background: canAfford ? 'rgba(255,184,0,0.04)' : 'rgba(255,255,255,0.02)',
                  border: canAfford ? '1px solid rgba(255,184,0,0.2)' : '1px solid rgba(255,255,255,0.06)',
                }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-3xl font-black text-white">{pkg.qty}</p>
                    <p className="text-sm text-gray-400">unit{pkg.qty > 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black" style={{ color: '#FFB800' }}>${pkg.price}</p>
                    <p className="text-xs text-gray-600">${pricePerUnit}/unit</p>
                  </div>
                </div>

                <div className="h-px mb-4" style={{ background: 'rgba(255,255,255,0.05)' }} />

                <div className="space-y-1.5 mb-5 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Network levels L1–L10 (30%)</span>
                    <span className="text-emerald-400 font-semibold">${(pkg.price * 0.30).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Leadership pool (15%)</span>
                    <span style={{ color: '#a78bfa' }}>${(pkg.price * 0.15).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rank pool (10%)</span>
                    <span style={{ color: '#f59e0b' }}>${(pkg.price * 0.10).toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleReorder(pkg.id)}
                  disabled={!canAfford || isWorking}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: canAfford
                      ? 'linear-gradient(135deg, #FF8C00, #FFB800)'
                      : 'rgba(255,255,255,0.04)',
                    color: canAfford ? '#000' : '#444',
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                  }}>
                  {isWorking
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                    : canAfford
                      ? <><ShoppingBag className="w-4 h-4" /> Order Now</>
                      : 'Insufficient Balance'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Bonus breakdown info */}
        <div className="mt-6 p-4 rounded-xl"
          style={{ background: 'rgba(255,184,0,0.03)', border: '1px solid rgba(255,184,0,0.1)' }}>
          <p className="text-xs font-bold text-amber-400 mb-2">Product Reorder Bonus Distribution</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Network Levels (L1–L10)', value: '30%', color: '#10b981' },
              { label: 'Leadership Pool', value: '15%', color: '#a78bfa' },
              { label: 'Rank Pool', value: '10%', color: '#f59e0b' },
            ].map((b, i) => (
              <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <p className="text-xl font-black" style={{ color: b.color }}>{b.value}</p>
                <p className="text-xs text-gray-500 mt-1">{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
