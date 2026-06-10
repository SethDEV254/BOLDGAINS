'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, UserPlus, Loader2, ChevronDown } from 'lucide-react';
import { PACKAGES } from '@/lib/packages';

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const defaultPkg = parseInt(params.get('package') || '1');

  const [form, setForm] = useState({
    name: '', email: '', password: '', referralCode: '', packageLevel: defaultPkg,
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedPkg = PACKAGES.find(p => p.level === form.packageLevel);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push('/dashboard');
    } catch {
      setError('Connection error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative" style={{ background: '#030300' }}>
      <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(120,53,15,0.2) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image src="/logo.jpeg" alt="Bold Gains" width={80} height={80}
              className="rounded-full ring-4 ring-amber-500/30 mx-auto mb-4"
              style={{ boxShadow: '0 0 40px rgba(202,138,4,0.25)' }} />
          </Link>
          <h1 className="text-3xl font-black gold-gradient">Join Bold Gains</h1>
          <p className="text-gray-400 mt-2">Create your account and start earning</p>
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <input type="text" required value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                  placeholder="John Doe" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                <input type="email" required value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                  placeholder="you@example.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} required minLength={6}
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

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Referral Code <span className="text-gray-500">(optional)</span>
                </label>
                <input type="text" value={form.referralCode}
                  onChange={e => setForm(p => ({ ...p, referralCode: e.target.value.toUpperCase() }))}
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm tracking-widest"
                  placeholder="XXXX0000" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Select Package</label>
                <div className="relative">
                  <select value={form.packageLevel}
                    onChange={e => setForm(p => ({ ...p, packageLevel: parseInt(e.target.value) }))}
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm appearance-none cursor-pointer">
                    {PACKAGES.map(pkg => (
                      <option key={pkg.level} value={pkg.level} style={{ background: '#111' }}>
                        {pkg.name} — ${pkg.price.toLocaleString()} ({pkg.products} products)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                {selectedPkg && (
                  <div className="mt-3 p-3 rounded-xl flex items-center justify-between"
                    style={{ background: `${selectedPkg.color}10`, border: `1px solid ${selectedPkg.color}30` }}>
                    <div>
                      <span className="font-bold text-sm" style={{ color: selectedPkg.color }}>{selectedPkg.name}</span>
                      <span className="text-gray-400 text-xs ml-2">{selectedPkg.products} products</span>
                    </div>
                    <span className="font-black text-white">${selectedPkg.price.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-gold w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-base">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Already a member?{' '}
              <Link href="/login" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
