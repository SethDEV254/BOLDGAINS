'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PACKAGES } from '@/lib/packages';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/use-wallet';
import {
  ChevronRight, TrendingUp, Users, Zap, Star, Award,
  Globe, Flame, Crown, Diamond, LogOut, UserPlus, Menu, X, Sparkles,
  Wallet, Loader2,
} from 'lucide-react';

const BONUS_FEATURES = [
  { icon: TrendingUp, label: 'Upgrade Bonus', value: '30%', desc: 'Paid instantly when your referrals upgrade to higher tiers', color: '#FF8C00' },
  { icon: Users, label: 'Network Level', value: '15%', desc: 'Passive income across 10 levels of your downline', color: '#3b82f6' },
  { icon: Award, label: 'Leadership Pool', value: '15%', desc: 'Exclusive earnings pool shared by top-ranked leaders', color: '#a78bfa' },
  { icon: Star, label: 'Rank Pool', value: '10%', desc: 'Rank-based distribution to your top earners', color: '#f59e0b' },
  { icon: Zap, label: 'Product Reorder Bonus', value: '45%', desc: 'Highest payout — earn when your network reorders BoldGlow™', color: '#f43f5e' },
];

const STATS = [
  { label: 'Membership Tiers', value: '12' },
  { label: 'Network Levels', value: '10' },
  { label: 'Max Reorder Bonus', value: '45%' },
  { label: 'Countries', value: 'Global' },
];

const TIER_ICONS: Record<number, any> = { 10: Diamond, 11: Flame, 12: Crown };

export default function LandingPage() {
  const router = useRouter();
  const wallet = useWallet();
  const [hoveredPkg, setHoveredPkg] = useState<number | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const pendingJoin = useRef(false);

  useEffect(() => {
    fetch('/api/dashboard').then(r => { if (r.ok) setLoggedIn(true); });
  }, []);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Redirect as soon as any wallet connects — no chain check required
  useEffect(() => {
    if (wallet.address && pendingJoin.current) {
      pendingJoin.current = false;
      setConnecting(false);
      router.push('/register');
    }
  }, [wallet.address, router]);

  function handleJoin() {
    if (wallet.address) {
      router.push('/register');
      return;
    }
    pendingJoin.current = true;
    setConnecting(true);
    wallet.open();
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setLoggedIn(false);
  }

  const parallax = scrollY * 0.35;

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#000' }}>

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrollY > 50 || menuOpen ? 'rgba(0,0,0,0.92)' : 'transparent',
          backdropFilter: scrollY > 50 || menuOpen ? 'blur(32px) saturate(180%)' : 'none',
          borderBottom: scrollY > 50 || menuOpen ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}>
        {(scrollY > 50 || menuOpen) && (
          <div className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,140,0,0.4) 30%, rgba(255,215,0,0.6) 50%, rgba(255,140,0,0.4) 70%, transparent 100%)' }} />
        )}

        <div className="flex items-center justify-between px-5 lg:px-14 py-4">
          <Link href="/" className="flex items-center gap-3 group">
            <Image src="/logo.jpeg" alt="Bold Gains" width={38} height={38}
              className="rounded-full transition-transform duration-300 group-hover:scale-105"
              style={{ boxShadow: '0 0 16px rgba(255,140,0,0.5)', border: '1.5px solid rgba(255,184,0,0.3)' }} />
            <div className="leading-none">
              <span className="font-black text-sm sm:text-base tracking-[0.18em] gold-gradient">BOLD GAINS</span>
              <span className="text-xs font-medium block" style={{ color: 'rgba(255,140,0,0.35)', letterSpacing: '0.05em' }}>INTERNATIONAL™</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {loggedIn && (
              <button onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
                style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171' }}>
                <LogOut className="w-3.5 h-3.5" /> Log Out
              </button>
            )}
            <Link href="/login"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#CCCCCC' }}>
              Member Login
            </Link>
            <button onClick={handleJoin} disabled={connecting}
              className="btn-gold flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold">
              {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              {connecting ? 'Connecting…' : 'Get Started'}
            </button>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button onClick={handleJoin} disabled={connecting}
              className="btn-gold flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold">
              {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Join'}
              {!connecting && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => setMenuOpen(v => !v)}
              className="p-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#999' }}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden px-5 pb-5 pt-2 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Link href="/login" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold w-full"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#CCC' }}>
              Member Login
            </Link>
            {loggedIn && (
              <button onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold w-full"
                style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171' }}>
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            )}
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ background: '#000' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 140% 70% at 50% -5%, rgba(255,100,0,0.09) 0%, transparent 60%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 80% at 15% 60%, rgba(255,80,0,0.06) 0%, transparent 55%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 60% at 85% 40%, rgba(255,160,0,0.05) 0%, transparent 55%)' }} />
        <div className="absolute inset-0 grid-bg opacity-40" style={{ transform: `translateY(${parallax * 0.25}px)` }} />
        <div className="absolute left-0 right-0 pointer-events-none" style={{ top: '52%' }}>
          <div className="h-px opacity-20" style={{ background: 'linear-gradient(90deg, transparent 0%, #FF8C00 25%, #FFD700 50%, #FF8C00 75%, transparent 100%)' }} />
        </div>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute rounded-full" style={{ top: '8%', left: '2%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(255,100,0,0.12) 0%, transparent 65%)', transform: `translateY(${parallax * 0.4}px)` }} />
          <div className="absolute rounded-full" style={{ top: '15%', right: '0%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(255,180,0,0.07) 0%, transparent 65%)', transform: `translateY(${parallax * 0.25}px)` }} />
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto px-6 pt-32 pb-20">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full mb-10 text-xs font-semibold tracking-widest uppercase"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#999', letterSpacing: '0.15em' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            Global Network Marketing Platform
            <Globe className="w-3.5 h-3.5 opacity-60" />
          </div>

          <div className="float inline-block mb-10">
            <div className="relative inline-block">
              <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,140,0,0.35) 0%, transparent 70%)', transform: 'scale(1.8)' }} />
              <Image src="/logo.jpeg" alt="Bold Gains" width={120} height={120} className="rounded-full relative z-10"
                style={{ boxShadow: '0 0 40px rgba(255,140,0,0.4), 0 0 80px rgba(255,100,0,0.15)', border: '2px solid rgba(255,184,0,0.2)' }} />
            </div>
          </div>

          <h1 className="font-black leading-[0.92] mb-7 tracking-tight" style={{ fontSize: 'clamp(3.8rem, 11vw, 8rem)' }}>
            <span className="block gold-gradient">BUILD YOUR</span>
            <span className="block text-white" style={{ textShadow: '0 0 120px rgba(255,140,0,0.15)' }}>EMPIRE</span>
          </h1>

          <p className="text-base md:text-lg mb-12 max-w-xl mx-auto leading-relaxed font-light" style={{ color: '#888' }}>
            Join a premium <span style={{ color: '#FFB800', fontWeight: 600 }}>12-tier network</span> with
            up to <span style={{ color: '#FFB800', fontWeight: 600 }}>45% product reorder bonus</span> — paid instantly across 10 levels.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <button onClick={handleJoin} disabled={connecting}
              className="btn-gold flex items-center gap-3 px-10 py-4 rounded-2xl text-sm font-black w-full sm:w-auto justify-center"
              style={{ letterSpacing: '0.04em' }}>
              {connecting
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Connecting…</>
                : <><Wallet className="w-5 h-5" /> Connect Wallet &amp; Join</>}
            </button>
            <Link href="/login" className="btn-ghost flex items-center gap-3 px-10 py-4 rounded-2xl text-sm font-semibold w-full sm:w-auto justify-center">
              Member Login
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden rounded-2xl"
            style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
            {STATS.map((s, i) => (
              <div key={i} className="px-6 py-5 text-center" style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <p className="text-2xl sm:text-3xl font-black text-white mb-1">{s.value}</p>
                <p className="text-xs font-medium" style={{ color: '#555', letterSpacing: '0.08em' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #000)' }} />
      </section>

      {/* ── Bonus Features ── */}
      <section className="py-32 px-6 relative" style={{ background: '#000' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(255,140,0,0.05) 0%, transparent 60%)' }} />
        <div className="max-w-7xl mx-auto relative">
          <div className="mb-20">
            <p className="text-xs font-bold tracking-[0.3em] mb-3 uppercase" style={{ color: '#FF8C00' }}>Revenue Streams</p>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <h2 className="font-black" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', lineHeight: 1 }}>
                <span className="gold-gradient">Five Ways</span><span className="text-white"> to Earn</span>
              </h2>
              <p className="text-sm max-w-xs pb-1" style={{ color: '#555' }}>Multiple income streams working for you — simultaneously, 24/7.</p>
            </div>
            <div className="mt-6 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BONUS_FEATURES.map((f, i) => (
              <div key={i} className={`group relative rounded-2xl overflow-hidden cursor-default transition-all duration-500 ${i === 4 ? 'md:col-span-2 lg:col-span-1' : ''}`}
                style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.07)' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.05)'; el.style.border = `1px solid ${f.color}33`; el.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.022)'; el.style.border = '1px solid rgba(255,255,255,0.07)'; el.style.transform = 'translateY(0)'; }}>
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${f.color}88, transparent)`, opacity: 0.5 }} />
                <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, transparent, ${f.color}, transparent)` }} />
                <div className="p-7">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${f.color}12`, border: `1px solid ${f.color}22` }}>
                        <f.icon className="w-5 h-5" style={{ color: f.color }} />
                      </div>
                      <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#444' }}>0{i + 1}</span>
                    </div>
                    <span className="text-4xl font-black tabular-nums" style={{ background: `linear-gradient(135deg, ${f.color} 0%, ${f.color}66 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{f.value}</span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2 tracking-tight">{f.label}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#555' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BoldGlow Product ── */}
      <section className="py-32 px-6 relative overflow-hidden" style={{ background: '#000' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,184,0,0.04) 0%, transparent 70%)' }} />
        <div className="relative max-w-7xl mx-auto">
          <div className="mb-20">
            <p className="text-xs font-bold tracking-[0.3em] mb-3 uppercase" style={{ color: '#FF8C00' }}>Our Product</p>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <h2 className="font-black" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', lineHeight: 1 }}>
                <span className="gold-gradient">BoldGlow™</span><span className="text-white"> Gold Mask</span>
              </h2>
              <p className="text-sm max-w-xs pb-1" style={{ color: '#555' }}>Retinol · Snake Venom Peptides · 24K Gold</p>
            </div>
            <div className="mt-6 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16">
            <div className="flex flex-col gap-3">
              <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden"
                style={{ border: '1px solid rgba(255,184,0,0.15)', boxShadow: '0 0 60px rgba(255,184,0,0.08)' }}>
                <Image src="/products/model.jpeg" alt="BoldGlow Gold Mask" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
                <div className="absolute bottom-0 left-0 right-0 p-5" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
                  <p className="font-black text-lg gold-gradient tracking-widest">BOLDGLOW™</p>
                  <p className="text-xs text-gray-400">Retinol Snake Venom Gold Peel-Off Mask</p>
                </div>
              </div>
            </div>
            <div className="space-y-8">
              <div>
                <p className="text-xs font-bold tracking-[0.25em] uppercase mb-4" style={{ color: '#FF8C00' }}>Key Benefits</p>
                <div className="space-y-3">
                  {['Reduces appearance of fine lines & wrinkles', 'Firms, smooths and promotes younger-looking skin', 'Deeply cleanses pores and removes impurities', 'Brightens dull skin for a radiant glow', 'Supports hydration and improved elasticity', 'Refines texture — leaves face feeling refreshed'].map((b, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.25)' }}>
                        <Sparkles className="w-2.5 h-2.5" style={{ color: '#FFB800' }} />
                      </div>
                      <p className="text-sm" style={{ color: '#BBBBBB' }}>{b}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <div>
                <p className="text-xs font-bold tracking-[0.25em] uppercase mb-4" style={{ color: '#FF8C00' }}>Hero Ingredients</p>
                <div className="grid grid-cols-2 gap-2">
                  {[{ name: 'Retinol', desc: 'Skin renewal & anti-aging' }, { name: 'Snake Venom Peptides', desc: 'Firmness & smoother skin' }, { name: '24K Gold', desc: 'Radiance & luxurious glow' }, { name: 'Collagen & Agents', desc: 'Hydration & suppleness' }].map((ing, i) => (
                    <div key={i} className="p-3.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-sm font-semibold text-white mb-0.5">{ing.name}</p>
                      <p className="text-xs" style={{ color: '#555' }}>{ing.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl p-8 md:p-10 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,184,0,0.4), transparent)' }} />
            <p className="text-xs font-bold tracking-[0.25em] uppercase mb-8 text-center" style={{ color: '#FF8C00' }}>How to Use</p>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
              {['Cleanse and dry your face thoroughly', 'Apply an even layer — avoid eyes, brows, lips & hairline', 'Leave on 15–20 min until fully dry', 'Gently peel off from the edges', 'Rinse residue and follow with moisturizer'].map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black" style={{ background: 'linear-gradient(135deg, rgba(255,140,0,0.18), rgba(255,184,0,0.06))', border: '1px solid rgba(255,184,0,0.25)', color: '#FFB800' }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: '#666' }}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Packages ── */}
      <section className="py-32 px-6 relative overflow-hidden" style={{ background: '#000' }}>
        <div className="absolute inset-0 grid-bg opacity-25 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(255,80,0,0.05) 0%, transparent 70%)' }} />
        <div className="relative max-w-7xl mx-auto">
          <div className="mb-20">
            <p className="text-xs font-bold tracking-[0.3em] mb-3 uppercase" style={{ color: '#FF8C00' }}>Membership Tiers</p>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <h2 className="font-black" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', lineHeight: 1 }}>
                <span className="text-white">Choose Your</span><span className="gold-gradient"> Package</span>
              </h2>
              <p className="text-sm max-w-xs pb-1" style={{ color: '#555' }}>12 tiers of power. Start anywhere, grow everywhere.</p>
            </div>
            <div className="mt-6 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {PACKAGES.map((pkg) => {
              const isHovered = hoveredPkg === pkg.level;
              const TierIcon = TIER_ICONS[pkg.level];
              return (
                <div key={pkg.level} onMouseEnter={() => setHoveredPkg(pkg.level)} onMouseLeave={() => setHoveredPkg(null)}
                  className="relative rounded-2xl cursor-pointer overflow-hidden"
                  style={{ background: isHovered ? `${pkg.color}08` : 'rgba(255,255,255,0.022)', border: isHovered ? `1px solid ${pkg.color}40` : '1px solid rgba(255,255,255,0.07)', boxShadow: isHovered ? `0 20px 60px rgba(0,0,0,0.8)` : '0 4px 20px rgba(0,0,0,0.4)', transform: isHovered ? 'translateY(-6px)' : 'translateY(0)', transition: 'all 0.4s cubic-bezier(0.23,1,0.32,1)' }}>
                  <div className="absolute top-0 left-0 right-0 h-px" style={{ background: isHovered ? `linear-gradient(90deg, transparent, ${pkg.color}, transparent)` : `linear-gradient(90deg, transparent, ${pkg.color}44, transparent)` }} />
                  {pkg.level === 5 && <div className="absolute top-0 right-4 px-3 py-1 text-xs font-black rounded-b-lg" style={{ background: 'linear-gradient(135deg, #FF8C00, #CC5500)', color: '#fff' }}>POPULAR</div>}
                  {pkg.level === 12 && <div className="absolute top-0 right-4 px-3 py-1 text-xs font-black rounded-b-lg flex items-center gap-1" style={{ background: `linear-gradient(135deg, ${pkg.color}, #994D00)`, color: '#000' }}><Crown className="w-3 h-3" /> ELITE</div>}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${pkg.color}14`, border: `1px solid ${pkg.color}25` }}>
                          {TierIcon ? <TierIcon className="w-3.5 h-3.5" style={{ color: pkg.color }} /> : <span className="text-xs font-black" style={{ color: pkg.color }}>{pkg.level}</span>}
                        </div>
                        <span className="text-xs font-bold tracking-wider uppercase" style={{ color: isHovered ? pkg.color : '#444' }}>Tier {pkg.level}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', color: '#444', border: '1px solid rgba(255,255,255,0.05)' }}>{pkg.products}+</span>
                    </div>
                    <h3 className="font-black text-lg tracking-tight mb-1" style={{ color: isHovered ? pkg.color : '#EEE' }}>{pkg.name}</h3>
                    <div className="flex items-baseline gap-1 mb-5">
                      <span className="text-3xl font-black text-white" style={{ letterSpacing: '-0.03em' }}>${pkg.price.toLocaleString()}</span>
                      <span className="text-xs" style={{ color: '#444' }}>USD</span>
                    </div>
                    <div className="h-px mb-4" style={{ background: isHovered ? `linear-gradient(90deg, transparent, ${pkg.color}30, transparent)` : 'rgba(255,255,255,0.05)' }} />
                    <div className="space-y-1.5 mb-5">
                      {[`${pkg.products}+ products`, '30% upgrade bonus', '15% network bonus'].map((f, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full" style={{ background: isHovered ? pkg.color : '#333' }} />
                          <span className="text-xs" style={{ color: isHovered ? '#BBB' : '#444' }}>{f}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={handleJoin}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm w-full transition-all duration-300"
                      style={{ background: isHovered ? `linear-gradient(135deg, ${pkg.color}, ${pkg.color}bb)` : `${pkg.color}10`, color: isHovered ? '#000' : pkg.color, border: `1px solid ${pkg.color}${isHovered ? 'aa' : '22'}` }}>
                      <UserPlus className="w-3.5 h-3.5" /> Register
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-6 relative overflow-hidden" style={{ background: '#000' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(255,100,0,0.08) 0%, transparent 70%)' }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-10 text-xs font-bold tracking-widest uppercase"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#666' }}>
            <Flame className="w-3.5 h-3.5 text-orange-500" /> Don&apos;t Wait. Build Now.
          </div>
          <h2 className="font-black mb-6 leading-tight" style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)' }}>
            <span className="gold-gradient">Ready to Earn</span><br /><span className="text-white">Without Limits?</span>
          </h2>
          <p className="text-base mb-12 max-w-md mx-auto font-light" style={{ color: '#666' }}>
            Join Bold Gains. Refer people. Watch your network grow. Collect real money.
          </p>
          <button onClick={handleJoin} disabled={connecting}
            className="btn-gold inline-flex items-center gap-3 px-12 py-5 rounded-2xl font-black"
            style={{ fontSize: '1rem', letterSpacing: '0.04em' }}>
            {connecting
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Connecting…</>
              : <><Wallet className="w-5 h-5" /> Connect Wallet &amp; Join</>}
          </button>
          <p className="mt-5 text-xs" style={{ color: '#333', letterSpacing: '0.08em' }}>NO HIDDEN FEES · INSTANT SETUP · EARN FROM DAY ONE</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: '#000' }}>
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.jpeg" alt="Bold Gains" width={30} height={30} className="rounded-full opacity-50" />
            <span className="font-black tracking-[0.15em] gold-gradient text-sm">BOLD GAINS™</span>
          </div>
          <p className="text-xs" style={{ color: '#2a2a2a', letterSpacing: '0.05em' }}>© {new Date().getFullYear()} BOLD GAINS INTERNATIONAL. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center gap-6 text-xs" style={{ color: '#333' }}>
            <Link href="/login" className="transition-colors hover:text-amber-500 tracking-wide">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
