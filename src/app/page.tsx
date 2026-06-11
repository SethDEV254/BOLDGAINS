'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PACKAGES } from '@/lib/packages';
import { useState, useEffect, useRef } from 'react';
import {
  ChevronRight, Shield, TrendingUp, Users, Zap, Star, Award,
  Globe, ArrowRight, Flame, Crown, Diamond, LogOut, UserPlus, Menu, X,
} from 'lucide-react';

const BONUS_FEATURES = [
  { icon: Shield, label: 'Management Fee', value: '10%', desc: 'Applied on all deposits & withdrawal pool', color: '#d97706' },
  { icon: Zap, label: 'Direct Bonus', value: '30%', desc: 'Instant reward on every direct referral', color: '#fbbf24' },
  { icon: TrendingUp, label: 'Upgrade Bonus', value: '30%', desc: 'Paid when your referrals upgrade tiers', color: '#f59e0b' },
  { icon: Award, label: 'Leadership Pool', value: '10%', desc: 'Exclusive pool shared by top leaders', color: '#b45309' },
  { icon: Users, label: 'Network Level', value: '10%', desc: 'Earn across 4 levels of your network', color: '#d97706' },
  { icon: Star, label: 'Products Bonus', value: '10%', desc: 'Allocated to product distribution rewards', color: '#fbbf24' },
];

const TIER_ICONS: Record<number, any> = { 9: Diamond, 10: Crown, 11: Flame };

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
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#030300' }}>

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: scrollY > 40 || menuOpen ? 'rgba(3,3,0,0.95)' : 'transparent',
          backdropFilter: scrollY > 40 || menuOpen ? 'blur(24px)' : 'none',
          borderBottom: scrollY > 40 || menuOpen ? '1px solid rgba(180,83,9,0.2)' : 'none',
          transition: 'all 0.4s ease',
        }}>
        <div className="flex items-center justify-between px-5 lg:px-12 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <Image src="/logo.jpeg" alt="Bold Gains" width={40} height={40}
                className="rounded-full relative z-10"
                style={{ boxShadow: '0 0 20px rgba(180,83,9,0.6), 0 0 40px rgba(120,53,15,0.3)' }} />
              <div className="absolute inset-0 rounded-full animate-ping"
                style={{ background: 'rgba(180,83,9,0.3)', animationDuration: '3s' }} />
            </div>
            <div>
              <span className="font-black text-base sm:text-lg tracking-widest gold-gradient">BOLD GAINS</span>
              <span className="text-amber-900/60 text-xs font-medium block -mt-1">™</span>
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
              style={{ background: 'rgba(120,53,15,0.18)', border: '1px solid rgba(180,83,9,0.45)', color: '#fcd34d' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(120,53,15,0.35)'; (e.currentTarget as HTMLElement).style.borderColor = '#d97706'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(120,53,15,0.18)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(180,83,9,0.45)'; }}>
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
              style={{ background: 'rgba(120,53,15,0.2)', border: '1px solid rgba(180,83,9,0.3)', color: '#fcd34d' }}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="md:hidden px-5 pb-5 space-y-2"
            style={{ borderTop: '1px solid rgba(180,83,9,0.15)' }}>
            <Link href="/login" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all w-full"
              style={{ background: 'rgba(120,53,15,0.15)', border: '1px solid rgba(180,83,9,0.3)', color: '#fcd34d' }}>
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
        {/* Deep background layers */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(170deg, #0a0500 0%, #030300 40%, #000200 100%)' }} />

        {/* Grid */}
        <div className="absolute inset-0 grid-bg opacity-70" style={{ transform: `translateY(${parallax * 0.3}px)` }} />

        {/* Ambient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute" style={{
            top: '15%', left: '8%', width: '500px', height: '500px',
            background: 'radial-gradient(circle, rgba(180,83,9,0.18) 0%, rgba(120,53,15,0.08) 40%, transparent 70%)',
            transform: `translateY(${parallax * 0.5}px)`,
          }} />
          <div className="absolute" style={{
            top: '25%', right: '5%', width: '400px', height: '400px',
            background: 'radial-gradient(circle, rgba(120,53,15,0.14) 0%, transparent 65%)',
            transform: `translateY(${parallax * 0.3}px)`,
          }} />
          <div className="absolute" style={{
            bottom: '10%', left: '30%', width: '600px', height: '300px',
            background: 'radial-gradient(ellipse, rgba(217,119,6,0.08) 0%, transparent 70%)',
          }} />
          {/* Horizontal light streak */}
          <div className="absolute top-1/2 left-0 right-0 h-px opacity-20"
            style={{ background: 'linear-gradient(90deg, transparent, #d97706, #fbbf24, #d97706, transparent)' }} />
        </div>

        {/* Diagonal lines decoration */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #b45309 0px, #b45309 1px, transparent 1px, transparent 80px)',
          }} />

        {/* Content */}
        <div className="relative z-10 text-center max-w-6xl mx-auto px-6 pt-28 pb-16">
          {/* Logo */}
          <div className="float inline-block mb-10">
            <div className="relative inline-block">
              <Image src="/logo.jpeg" alt="Bold Gains" width={130} height={130}
                className="rounded-full relative z-10"
                style={{
                  boxShadow: '0 0 60px rgba(180,83,9,0.5), 0 0 120px rgba(120,53,15,0.25), 0 0 200px rgba(120,53,15,0.1)',
                  border: '2px solid rgba(217,119,6,0.3)',
                }} />
              <div className="absolute inset-0 rounded-full pulse-gold" />
            </div>
          </div>

          {/* Label */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full mb-8 text-sm font-semibold"
            style={{
              background: 'rgba(120,53,15,0.2)',
              border: '1px solid rgba(180,83,9,0.4)',
              color: '#fcd34d',
              boxShadow: '0 0 20px rgba(120,53,15,0.2)',
            }}>
            <Globe className="w-4 h-4" />
            Global Network Marketing Platform
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          </div>

          {/* Headline */}
          <h1 className="font-black leading-none mb-6" style={{ fontSize: 'clamp(3.5rem, 10vw, 7.5rem)' }}>
            <span className="block gold-gradient" style={{ letterSpacing: '-0.02em' }}>BUILD YOUR</span>
            <span className="block text-white" style={{ letterSpacing: '-0.03em', textShadow: '0 0 80px rgba(180,83,9,0.3)' }}>EMPIRE</span>
          </h1>

          {/* Sub */}
          <p className="text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed" style={{ color: '#c4b08a' }}>
            Join thousands building generational wealth through our premium{' '}
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>11-tier network</span>. Earn up to{' '}
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>30% direct bonus</span>{' '}
            on every single referral — no cap.
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

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden w-full max-w-sm sm:max-w-none sm:inline-grid"
            style={{ border: '1px solid rgba(180,83,9,0.25)', boxShadow: '0 0 40px rgba(120,53,15,0.15)' }}>
            {[
              { value: '10K+', label: 'Active Members' },
              { value: '$2M+', label: 'Total Paid Out' },
              { value: '50+', label: 'Countries' },
            ].map((s, i) => (
              <div key={i} className="px-4 sm:px-8 py-4 sm:py-5"
                style={{ background: i === 1 ? 'rgba(120,53,15,0.18)' : 'rgba(15,9,2,0.7)' }}>
                <div className="text-xl sm:text-2xl font-black gold-gradient">{s.value}</div>
                <div className="text-xs mt-0.5 whitespace-nowrap" style={{ color: '#8a6a3a' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #030300)' }} />
      </section>

      {/* ── Bonus Features ── */}
      <section className="py-28 px-6 relative" style={{ background: '#030300' }}>
        <div className="radial-glow-top absolute inset-0 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-20">
            <p className="text-xs font-bold tracking-[0.25em] mb-4 uppercase" style={{ color: '#b45309' }}>Revenue Streams</p>
            <h2 className="font-black mb-5" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
              <span className="gold-gradient">Six Ways</span>
              <span className="text-white"> to Earn</span>
            </h2>
            <div className="gold-divider max-w-xs mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {BONUS_FEATURES.map((f, i) => (
              <div key={i}
                className="group relative rounded-2xl p-6 overflow-hidden cursor-default transition-all duration-400"
                style={{
                  background: 'rgba(10,6,1,0.8)',
                  border: `1px solid rgba(180,83,9,0.18)`,
                  transition: 'all 0.35s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.border = `1px solid ${f.color}55`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 40px ${f.color}18, 0 16px 40px rgba(0,0,0,0.5)`;
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.border = '1px solid rgba(180,83,9,0.18)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}>
                {/* Subtle bg glow */}
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle, ${f.color}18, transparent)`, transform: 'translate(30%, -30%)' }} />

                <div className="flex items-start justify-between mb-5">
                  <div className="p-3 rounded-xl" style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}>
                    <f.icon className="w-6 h-6" style={{ color: f.color }} />
                  </div>
                  <span className="text-4xl font-black" style={{
                    background: `linear-gradient(135deg, ${f.color}, #78350f)`,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>{f.value}</span>
                </div>
                <h3 className="text-white font-black text-lg mb-2 tracking-tight">{f.label}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#7a5c35' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Packages ── */}
      <section className="py-28 px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #030300 0%, #060400 50%, #030300 100%)' }}>
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(120,53,15,0.12) 0%, transparent 70%)' }} />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-xs font-bold tracking-[0.25em] mb-4 uppercase" style={{ color: '#b45309' }}>Membership Tiers</p>
            <h2 className="font-black mb-5" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
              <span className="text-white">Choose Your</span>
              <span className="gold-gradient"> Package</span>
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: '#7a5c35' }}>
              11 tiers of power. Start anywhere, grow everywhere.
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
                    backdropFilter: isHovered ? 'blur(24px)' : 'blur(12px)',
                    WebkitBackdropFilter: isHovered ? 'blur(24px)' : 'blur(12px)',
                    background: isHovered
                      ? `linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(${pkg.color === '#f59e0b' ? '245,158,11' : '255,255,255'},0.04) 50%, rgba(0,0,0,0.6) 100%)`
                      : 'rgba(255,255,255,0.03)',
                    border: isHovered
                      ? `1px solid ${pkg.color}55`
                      : '1px solid rgba(255,255,255,0.07)',
                    boxShadow: isHovered
                      ? `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${pkg.color}22, inset 0 1px 0 rgba(255,255,255,0.1), 0 0 60px ${pkg.color}18`
                      : '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
                    transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                    transition: 'all 0.4s cubic-bezier(0.23,1,0.32,1)',
                  }}>

                  {/* Glass inner top highlight */}
                  <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                    style={{ background: isHovered ? `linear-gradient(90deg, transparent, ${pkg.color}60, transparent)` : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

                  {/* Ambient color orb on hover */}
                  <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle, ${pkg.color}25, transparent 70%)`, opacity: isHovered ? 1 : 0 }} />
                  <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full pointer-events-none transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle, ${pkg.color}15, transparent 70%)`, opacity: isHovered ? 1 : 0 }} />

                  {/* Badge */}
                  {pkg.level === 5 && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-black rounded-b-xl tracking-widest"
                      style={{ background: `linear-gradient(135deg, #d97706, #b45309)`, color: '#fef3c7', boxShadow: '0 4px 12px rgba(180,83,9,0.4)' }}>
                      POPULAR
                    </div>
                  )}
                  {pkg.level === 11 && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-black rounded-b-xl flex items-center gap-1 tracking-widest"
                      style={{ background: `linear-gradient(135deg, ${pkg.color}, #92400e)`, color: '#000', boxShadow: `0 4px 12px ${pkg.color}50` }}>
                      <Flame className="w-3 h-3" /> ELITE
                    </div>
                  )}

                  <div className="p-5 pt-6">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300"
                          style={{
                            background: isHovered ? `${pkg.color}25` : `${pkg.color}12`,
                            border: `1px solid ${pkg.color}${isHovered ? '50' : '25'}`,
                          }}>
                          {TierIcon
                            ? <TierIcon className="w-4 h-4" style={{ color: pkg.color }} />
                            : <span className="text-xs font-black" style={{ color: pkg.color }}>{pkg.level}</span>}
                        </div>
                        <span className="text-xs font-bold tracking-wider uppercase" style={{ color: isHovered ? pkg.color : '#6a4a25' }}>
                          Tier {pkg.level}
                        </span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#5a3f1f', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {pkg.products}+ items
                      </span>
                    </div>

                    {/* Name & Price */}
                    <h3 className="font-black text-xl tracking-tight mb-1 transition-all duration-300"
                      style={{ color: isHovered ? pkg.color : '#e8d5b0' }}>
                      {pkg.name}
                    </h3>
                    <div className="flex items-end gap-1 mb-4">
                      <span className="text-4xl font-black text-white" style={{ letterSpacing: '-0.03em', lineHeight: 1 }}>
                        ${pkg.price.toLocaleString()}
                      </span>
                      <span className="text-xs mb-1" style={{ color: '#4a3520' }}>USD</span>
                    </div>

                    {/* Divider */}
                    <div className="h-px mb-4 transition-all duration-300"
                      style={{ background: isHovered ? `linear-gradient(90deg, transparent, ${pkg.color}40, transparent)` : 'rgba(255,255,255,0.05)' }} />

                    {/* Features */}
                    <div className="space-y-2 mb-5">
                      {[
                        `${pkg.products}+ products`,
                        '30% direct bonus',
                        '10% network bonus',
                      ].map((f, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-300"
                            style={{ background: isHovered ? pkg.color : '#4a3520', boxShadow: isHovered ? `0 0 6px ${pkg.color}` : 'none' }} />
                          <span className="text-xs" style={{ color: isHovered ? '#c4a060' : '#4a3520' }}>{f}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <Link href={`/register?package=${pkg.level}`}
                      className="flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm tracking-wide transition-all duration-300"
                      style={{
                        background: isHovered
                          ? `linear-gradient(135deg, ${pkg.color}, ${pkg.color}bb)`
                          : `${pkg.color}18`,
                        color: isHovered ? '#000' : pkg.color,
                        border: `1px solid ${pkg.color}${isHovered ? 'cc' : '35'}`,
                        boxShadow: isHovered ? `0 6px 24px ${pkg.color}45` : 'none',
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
        style={{ background: '#030300' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(120,53,15,0.2) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-bold tracking-widest uppercase"
            style={{ background: 'rgba(120,53,15,0.2)', border: '1px solid rgba(180,83,9,0.35)', color: '#d97706' }}>
            <Flame className="w-3.5 h-3.5" /> Don&apos;t Wait. Build Now.
          </div>

          <h2 className="font-black mb-6" style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', lineHeight: 1.05 }}>
            <span className="gold-gradient">Ready to Earn</span>
            <br />
            <span className="text-white">Without Limits?</span>
          </h2>

          <p className="text-base mb-12 max-w-lg mx-auto" style={{ color: '#7a5c35' }}>
            Join Bold Gains. Refer people. Watch your network grow. Collect real money.
          </p>

          <Link href="/register"
            className="btn-gold inline-flex items-center gap-3 px-12 py-5 rounded-2xl font-black tracking-wide"
            style={{ fontSize: '1.1rem' }}>
            Create Free Account
            <ChevronRight className="w-6 h-6" />
          </Link>

          <p className="mt-5 text-xs" style={{ color: '#4a3520' }}>No hidden fees · Instant setup · Earn from day one</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative" style={{ borderTop: '1px solid rgba(120,53,15,0.25)', background: '#020200' }}>
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.jpeg" alt="Bold Gains" width={32} height={32}
              className="rounded-full opacity-70"
              style={{ filter: 'sepia(30%) saturate(200%)' }} />
            <span className="font-black tracking-widest gold-gradient text-sm">BOLD GAINS™</span>
          </div>
          <p className="text-xs" style={{ color: '#3a2a10' }}>
            © {new Date().getFullYear()} Bold Gains. All rights reserved. Build your empire.
          </p>
          <div className="flex items-center gap-5 text-xs" style={{ color: '#4a3520' }}>
            <Link href="/login" className="hover:text-amber-600 transition-colors">Login</Link>
            <Link href="/register" className="hover:text-amber-600 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
