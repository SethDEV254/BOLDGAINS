'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PACKAGES } from '@/lib/packages';
import { useState, useEffect, useRef } from 'react';
import {
  ChevronRight, TrendingUp, Users, Zap, Star, Award,
  Globe, ArrowRight, Flame, Crown, Diamond, LogOut, UserPlus, Menu, X,
} from 'lucide-react';

const BONUS_FEATURES = [
  { icon: TrendingUp, label: 'Upgrade Bonus', value: '30%', desc: 'Paid when your referrals upgrade tiers', color: '#FF8C00' },
  { icon: Users, label: 'Network Level', value: '15%', desc: 'Earn across 10 levels of your network', color: '#3b82f6' },
  { icon: Award, label: 'Leadership Pool', value: '15%', desc: 'Exclusive pool shared by top leaders', color: '#a78bfa' },
  { icon: Star, label: 'Rank Pool', value: '10%', desc: 'Distributed by rank to top earners', color: '#FFB800' },
  { icon: Zap, label: 'Product Reorder Bonus', value: '45%', desc: 'Earn when your network reorders BoldGlow™ products', color: '#f43f5e' },
];

const TIER_ICONS: Record<number, any> = { 10: Diamond, 11: Flame, 12: Crown };

export default function LandingPage() {
  const [hoveredPkg, setHoveredPkg] = useState<number | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard').then(r => { if (r.ok) setLoggedIn(true); });
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setLoggedIn(false);
  }

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const parallax = scrollY * 0.4;

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#000000' }}>

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: scrollY > 40 || menuOpen ? 'rgba(0,0,0,0.94)' : 'transparent',
          backdropFilter: scrollY > 40 || menuOpen ? 'blur(28px)' : 'none',
          borderBottom: scrollY > 40 || menuOpen ? '1px solid rgba(255,140,0,0.15)' : 'none',
          transition: 'all 0.4s ease',
        }}>
        <div className="flex items-center justify-between px-5 lg:px-12 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <Image src="/logo.jpeg" alt="Bold Gains" width={40} height={40}
                className="rounded-full relative z-10"
                style={{ boxShadow: '0 0 20px rgba(255,140,0,0.55), 0 0 40px rgba(255,100,0,0.2)' }} />
              <div className="absolute inset-0 rounded-full animate-ping"
                style={{ background: 'rgba(255,140,0,0.25)', animationDuration: '3s' }} />
            </div>
            <div>
              <span className="font-black text-base sm:text-lg tracking-widest gold-gradient">BOLD GAINS</span>
              <span className="text-xs font-medium block -mt-1" style={{ color: 'rgba(255,140,0,0.4)' }}>™</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            {loggedIn && (
              <button onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.18)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.45)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.2)'; }}>
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            )}
            <Link href="/login"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all"
              style={{ background: 'rgba(255,140,0,0.08)', border: '1px solid rgba(255,140,0,0.3)', color: '#FFB800' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,140,0,0.16)'; (e.currentTarget as HTMLElement).style.borderColor = '#FF8C00'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,140,0,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,140,0,0.3)'; }}>
              <Users className="w-4 h-4" /> Member Login
            </Link>
            <Link href="/register" className="btn-gold flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide">
              Register <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile right side */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/register" className="btn-gold flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold">
              Register <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button onClick={() => setMenuOpen(v => !v)}
              className="p-2 rounded-xl transition-all"
              style={{ background: 'rgba(255,140,0,0.1)', border: '1px solid rgba(255,140,0,0.25)', color: '#FFB800' }}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="md:hidden px-5 pb-5 space-y-2"
            style={{ borderTop: '1px solid rgba(255,140,0,0.1)' }}>
            <Link href="/login" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all w-full"
              style={{ background: 'rgba(255,140,0,0.08)', border: '1px solid rgba(255,140,0,0.22)', color: '#FFB800' }}>
              <Users className="w-4 h-4" /> Member Login
            </Link>
            {loggedIn && (
              <button onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold w-full transition-all"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            )}
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Base black */}
        <div className="absolute inset-0" style={{ background: '#000000' }} />

        {/* Subtle vignette depth */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 120% 80% at 50% -10%, rgba(255,100,0,0.07) 0%, transparent 55%)',
        }} />

        {/* Grid */}
        <div className="absolute inset-0 grid-bg opacity-60" style={{ transform: `translateY(${parallax * 0.3}px)` }} />

        {/* Ambient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute" style={{
            top: '10%', left: '5%', width: '560px', height: '560px',
            background: 'radial-gradient(circle, rgba(255,120,0,0.16) 0%, rgba(255,80,0,0.06) 40%, transparent 70%)',
            transform: `translateY(${parallax * 0.5}px)`,
          }} />
          <div className="absolute" style={{
            top: '20%', right: '3%', width: '440px', height: '440px',
            background: 'radial-gradient(circle, rgba(255,184,0,0.1) 0%, transparent 65%)',
            transform: `translateY(${parallax * 0.3}px)`,
          }} />
          <div className="absolute" style={{
            bottom: '8%', left: '28%', width: '640px', height: '320px',
            background: 'radial-gradient(ellipse, rgba(255,140,0,0.07) 0%, transparent 70%)',
          }} />
          {/* Horizontal light streak */}
          <div className="absolute top-1/2 left-0 right-0 h-px opacity-25"
            style={{ background: 'linear-gradient(90deg, transparent, #FF8C00, #FFD700, #FF8C00, transparent)' }} />
        </div>

        {/* Fine diagonal overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,100,0,0.018) 0px, rgba(255,100,0,0.018) 1px, transparent 1px, transparent 80px)',
          }} />

        {/* Content */}
        <div className="relative z-10 text-center max-w-6xl mx-auto px-6 pt-28 pb-16">
          {/* Logo */}
          <div className="float inline-block mb-10">
            <div className="relative inline-block">
              <Image src="/logo.jpeg" alt="Bold Gains" width={130} height={130}
                className="rounded-full relative z-10"
                style={{
                  boxShadow: '0 0 60px rgba(255,140,0,0.45), 0 0 120px rgba(255,100,0,0.2), 0 0 200px rgba(255,80,0,0.08)',
                  border: '2px solid rgba(255,184,0,0.25)',
                }} />
              <div className="absolute inset-0 rounded-full pulse-gold" />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full mb-8 text-sm font-semibold"
            style={{
              background: 'rgba(255,140,0,0.08)',
              border: '1px solid rgba(255,140,0,0.3)',
              color: '#FFB800',
              boxShadow: '0 0 24px rgba(255,100,0,0.12)',
            }}>
            <Globe className="w-4 h-4" />
            Global Network Marketing Platform
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#FFB800' }} />
          </div>

          {/* Headline */}
          <h1 className="font-black leading-none mb-6" style={{ fontSize: 'clamp(3.5rem, 10vw, 7.5rem)' }}>
            <span className="block gold-gradient" style={{ letterSpacing: '-0.02em' }}>BUILD YOUR</span>
            <span className="block text-white" style={{ letterSpacing: '-0.03em', textShadow: '0 0 80px rgba(255,140,0,0.2)' }}>EMPIRE</span>
          </h1>

          {/* Sub */}
          <p className="text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed" style={{ color: '#AAAAAA' }}>
            Join thousands building generational wealth through our premium{' '}
            <span style={{ color: '#FFB800', fontWeight: 700 }}>12-tier network</span>. Earn up to{' '}
            <span style={{ color: '#FFB800', fontWeight: 700 }}>30% upgrade bonus</span>{' '}
            across 10 levels — no cap.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/register"
              className="btn-gold flex items-center gap-3 px-9 py-4 rounded-2xl text-base font-black w-full sm:w-auto justify-center tracking-wide"
              style={{ fontSize: '1.05rem' }}>
              Start Earning Today
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link href="/login"
              className="btn-ghost flex items-center gap-3 px-9 py-4 rounded-2xl text-base font-bold w-full sm:w-auto justify-center tracking-wide">
              Member Login
            </Link>
          </div>

        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #000000)' }} />
      </section>

      {/* ── Bonus Features ── */}
      <section className="py-28 px-6 relative" style={{ background: '#000000' }}>
        <div className="radial-glow-top absolute inset-0 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-20">
            <p className="text-xs font-bold tracking-[0.25em] mb-4 uppercase" style={{ color: '#FF8C00' }}>Revenue Streams</p>
            <h2 className="font-black mb-5" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
              <span className="gold-gradient">Five Ways</span>
              <span className="text-white"> to Earn</span>
            </h2>
            <div className="gold-divider max-w-xs mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {BONUS_FEATURES.map((f, i) => (
              <div key={i}
                className="group relative rounded-2xl p-6 overflow-hidden cursor-default"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  transition: 'all 0.35s cubic-bezier(0.23,1,0.32,1)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                  (e.currentTarget as HTMLElement).style.border = `1px solid ${f.color}44`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 48px ${f.color}14, 0 20px 48px rgba(0,0,0,0.6)`;
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)';
                  (e.currentTarget as HTMLElement).style.border = '1px solid rgba(255,255,255,0.07)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}>
                {/* Corner glow */}
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle, ${f.color}18, transparent)`, transform: 'translate(30%, -30%)' }} />
                {/* Bottom-left glow */}
                <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full pointer-events-none opacity-0 group-hover:opacity-60 transition-opacity duration-700"
                  style={{ background: `radial-gradient(circle, ${f.color}10, transparent)`, transform: 'translate(-30%, 30%)' }} />

                <div className="flex items-start justify-between mb-5 relative z-10">
                  <div className="p-3 rounded-xl" style={{ background: `${f.color}14`, border: `1px solid ${f.color}28` }}>
                    <f.icon className="w-6 h-6" style={{ color: f.color }} />
                  </div>
                  <span className="text-4xl font-black" style={{
                    background: `linear-gradient(135deg, ${f.color}, ${f.color}88)`,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>{f.value}</span>
                </div>
                <h3 className="text-white font-black text-lg mb-2 tracking-tight relative z-10">{f.label}</h3>
                <p className="text-sm leading-relaxed relative z-10" style={{ color: '#777777' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BoldGlow Product ── */}
      <section className="py-28 px-6 relative overflow-hidden" style={{ background: '#000000' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(255,184,0,0.06) 0%, transparent 70%)' }} />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-xs font-bold tracking-[0.25em] mb-4 uppercase" style={{ color: '#FF8C00' }}>Our Product</p>
            <h2 className="font-black mb-5" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
              <span className="gold-gradient">BoldGlow™</span>
              <span className="text-white"> Gold Mask</span>
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: '#777777' }}>
              Retinol · Snake Venom Peptides · 24K Gold — in one premium peel-off formula.
            </p>
            <div className="gold-divider max-w-xs mx-auto mt-5" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Left — product visual */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(255,184,0,0.08) 0%, transparent 70%)' }} />
              <div className="relative rounded-3xl overflow-hidden flex items-center justify-center p-8"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,184,0,0.15)', maxWidth: 420 }}>
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center text-5xl font-black"
                    style={{ background: 'linear-gradient(135deg, #FFD700, #FF8C00)', color: '#000', boxShadow: '0 0 60px rgba(255,184,0,0.4)' }}>
                    B
                  </div>
                  <p className="font-black text-2xl gold-gradient tracking-wider mb-1">BOLDGLOW™</p>
                  <p className="text-sm font-semibold" style={{ color: '#888' }}>RETINOL SNAKE VENOM</p>
                  <p className="text-lg font-black text-white mt-1">GOLD PEEL-OFF MASK</p>
                  <p className="text-xs mt-4 px-4" style={{ color: '#555' }}>
                    Be Bold. Gain Power. Reveal Your Golden Glow.
                  </p>
                  <div className="flex items-center justify-center gap-4 mt-6">
                    {['Retinol', 'Snake Venom', '24K Gold'].map((ing, i) => (
                      <div key={i} className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.25)', color: '#FFB800' }}>
                        {ing}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right — benefits */}
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#FF8C00' }}>Key Benefits</p>
                <div className="space-y-3">
                  {[
                    'Reduces appearance of fine lines and wrinkles',
                    'Firms, smooths and promotes younger-looking skin',
                    'Deeply cleanses pores and removes impurities',
                    'Brightens dull skin for a radiant glow',
                    'Supports skin hydration and improved elasticity',
                    'Refines skin texture — leaves face feeling refreshed',
                  ].map((b, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                        style={{ background: 'rgba(255,184,0,0.12)', border: '1px solid rgba(255,184,0,0.3)' }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#FFB800' }} />
                      </div>
                      <p className="text-sm" style={{ color: '#BBBBBB' }}>{b}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

              <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#FF8C00' }}>Hero Ingredients</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Retinol', desc: 'Skin renewal & anti-aging' },
                    { name: 'Snake Venom Peptides', desc: 'Firmness & smoother skin' },
                    { name: '24K Gold', desc: 'Radiance & luxurious glow' },
                    { name: 'Collagen & Agents', desc: 'Hydration & suppleness' },
                  ].map((ing, i) => (
                    <div key={i} className="p-3 rounded-xl"
                      style={{ background: 'rgba(255,184,0,0.04)', border: '1px solid rgba(255,184,0,0.12)' }}>
                      <p className="text-sm font-bold text-white">{ing.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#666' }}>{ing.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* How to use */}
          <div className="rounded-3xl p-8 md:p-12"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,184,0,0.12)' }}>
            <p className="text-xs font-bold tracking-widest uppercase mb-6 text-center" style={{ color: '#FF8C00' }}>How to Use</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {[
                { step: '01', text: 'Cleanse and dry your face thoroughly' },
                { step: '02', text: 'Apply an even layer, avoid eyes, brows, lips & hairline' },
                { step: '03', text: 'Leave on 15–20 min until fully dry' },
                { step: '04', text: 'Gently peel off from the edges' },
                { step: '05', text: 'Rinse residue, follow with moisturizer' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center text-sm font-black"
                    style={{ background: 'linear-gradient(135deg, rgba(255,140,0,0.2), rgba(255,184,0,0.08))', border: '1px solid rgba(255,184,0,0.3)', color: '#FFB800' }}>
                    {s.step}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: '#888' }}>{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Packages ── */}
      <section className="py-28 px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #000000 0%, #050505 50%, #000000 100%)' }}>
        <div className="absolute inset-0 grid-bg opacity-35 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,100,0,0.08) 0%, transparent 70%)' }} />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-xs font-bold tracking-[0.25em] mb-4 uppercase" style={{ color: '#FF8C00' }}>Membership Tiers</p>
            <h2 className="font-black mb-5" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
              <span className="text-white">Choose Your</span>
              <span className="gold-gradient"> Package</span>
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: '#777777' }}>
              12 tiers of power. Start anywhere, grow everywhere.
            </p>
            <div className="gold-divider max-w-xs mx-auto mt-5" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {PACKAGES.map((pkg) => {
              const isHovered = hoveredPkg === pkg.level;
              const TierIcon = TIER_ICONS[pkg.level];

              return (
                <div key={pkg.level}
                  onMouseEnter={() => setHoveredPkg(pkg.level)}
                  onMouseLeave={() => setHoveredPkg(null)}
                  className="relative rounded-3xl cursor-pointer overflow-hidden group"
                  style={{
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    background: isHovered
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(255,255,255,0.028)',
                    border: isHovered
                      ? `1px solid ${pkg.color}44`
                      : '1px solid rgba(255,255,255,0.07)',
                    boxShadow: isHovered
                      ? `0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px ${pkg.color}18, inset 0 1px 0 rgba(255,255,255,0.08), 0 0 80px ${pkg.color}14`
                      : '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
                    transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                    transition: 'all 0.4s cubic-bezier(0.23,1,0.32,1)',
                  }}>

                  {/* Top highlight line */}
                  <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                    style={{ background: isHovered ? `linear-gradient(90deg, transparent, ${pkg.color}55, transparent)` : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />

                  {/* Ambient orbs */}
                  <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle, ${pkg.color}22, transparent 70%)`, opacity: isHovered ? 1 : 0 }} />
                  <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full pointer-events-none transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle, ${pkg.color}12, transparent 70%)`, opacity: isHovered ? 1 : 0 }} />

                  {/* Badge */}
                  {pkg.level === 5 && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-black rounded-b-xl tracking-widest"
                      style={{ background: 'linear-gradient(135deg, #FF8C00, #CC5500)', color: '#FFF8E1', boxShadow: '0 4px 12px rgba(255,140,0,0.35)' }}>
                      POPULAR
                    </div>
                  )}
                  {pkg.level === 12 && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-black rounded-b-xl flex items-center gap-1 tracking-widest"
                      style={{ background: `linear-gradient(135deg, ${pkg.color}, #994D00)`, color: '#000', boxShadow: `0 4px 12px ${pkg.color}45` }}>
                      <Crown className="w-3 h-3" /> ELITE
                    </div>
                  )}

                  <div className="p-5 pt-6">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300"
                          style={{
                            background: isHovered ? `${pkg.color}22` : `${pkg.color}10`,
                            border: `1px solid ${pkg.color}${isHovered ? '44' : '20'}`,
                          }}>
                          {TierIcon
                            ? <TierIcon className="w-4 h-4" style={{ color: pkg.color }} />
                            : <span className="text-xs font-black" style={{ color: pkg.color }}>{pkg.level}</span>}
                        </div>
                        <span className="text-xs font-bold tracking-wider uppercase" style={{ color: isHovered ? pkg.color : '#555555' }}>
                          Tier {pkg.level}
                        </span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: 'rgba(255,255,255,0.04)', color: '#555555', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {pkg.products}+ items
                      </span>
                    </div>

                    {/* Name & Price */}
                    <h3 className="font-black text-xl tracking-tight mb-1 transition-all duration-300"
                      style={{ color: isHovered ? pkg.color : '#EEEEEE' }}>
                      {pkg.name}
                    </h3>
                    <div className="flex items-end gap-1 mb-4">
                      <span className="text-4xl font-black text-white" style={{ letterSpacing: '-0.03em', lineHeight: 1 }}>
                        ${pkg.price.toLocaleString()}
                      </span>
                      <span className="text-xs mb-1" style={{ color: '#555555' }}>USD</span>
                    </div>

                    {/* Divider */}
                    <div className="h-px mb-4 transition-all duration-300"
                      style={{ background: isHovered ? `linear-gradient(90deg, transparent, ${pkg.color}35, transparent)` : 'rgba(255,255,255,0.05)' }} />

                    {/* Features */}
                    <div className="space-y-2 mb-5">
                      {[
                        `${pkg.products}+ products`,
                        '30% upgrade bonus',
                        '15% network bonus',
                      ].map((f, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-300"
                            style={{ background: isHovered ? pkg.color : '#444444', boxShadow: isHovered ? `0 0 6px ${pkg.color}` : 'none' }} />
                          <span className="text-xs" style={{ color: isHovered ? '#CCCCCC' : '#555555' }}>{f}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <Link href={`/register?package=${pkg.level}`}
                      className="flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm tracking-wide transition-all duration-300"
                      style={{
                        background: isHovered
                          ? `linear-gradient(135deg, ${pkg.color}, ${pkg.color}bb)`
                          : `${pkg.color}14`,
                        color: isHovered ? '#000' : pkg.color,
                        border: `1px solid ${pkg.color}${isHovered ? 'bb' : '28'}`,
                        boxShadow: isHovered ? `0 6px 24px ${pkg.color}40` : 'none',
                        letterSpacing: '0.05em',
                      }}>
                      <UserPlus className="w-4 h-4" />
                      Register
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-6 relative overflow-hidden text-center"
        style={{ background: '#000000' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,100,0,0.12) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 grid-bg opacity-25 pointer-events-none" />

        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-bold tracking-widest uppercase"
            style={{ background: 'rgba(255,140,0,0.08)', border: '1px solid rgba(255,140,0,0.28)', color: '#FF8C00' }}>
            <Flame className="w-3.5 h-3.5" /> Don&apos;t Wait. Build Now.
          </div>

          <h2 className="font-black mb-6" style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', lineHeight: 1.05 }}>
            <span className="gold-gradient">Ready to Earn</span>
            <br />
            <span className="text-white">Without Limits?</span>
          </h2>

          <p className="text-base mb-12 max-w-lg mx-auto" style={{ color: '#777777' }}>
            Join Bold Gains. Refer people. Watch your network grow. Collect real money.
          </p>

          <Link href="/register"
            className="btn-gold inline-flex items-center gap-3 px-12 py-5 rounded-2xl font-black tracking-wide"
            style={{ fontSize: '1.1rem' }}>
            Create Free Account
            <ChevronRight className="w-6 h-6" />
          </Link>

          <p className="mt-5 text-xs" style={{ color: '#444444' }}>No hidden fees · Instant setup · Earn from day one</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative" style={{ borderTop: '1px solid rgba(255,140,0,0.12)', background: '#000000' }}>
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.jpeg" alt="Bold Gains" width={32} height={32}
              className="rounded-full opacity-60" />
            <span className="font-black tracking-widest gold-gradient text-sm">BOLD GAINS™</span>
          </div>
          <p className="text-xs" style={{ color: '#333333' }}>
            © {new Date().getFullYear()} Bold Gains. All rights reserved. Build your empire.
          </p>
          <div className="flex items-center gap-5 text-xs" style={{ color: '#444444' }}>
            <Link href="/login" className="transition-colors hover:text-orange-500">Login</Link>
            <Link href="/register" className="transition-colors hover:text-orange-500">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
