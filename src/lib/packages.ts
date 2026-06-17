export interface Package {
  level: number;
  name: string;
  price: number;
  products: number;
  color: string;
  gradient: string;
  badge: string;
}

export const PACKAGES: Package[] = [
  { level: 1, name: 'Signature', price: 20, products: 2, color: '#cbd5e1', gradient: 'from-slate-300 to-gray-400', badge: 'bg-slate-400/20 text-slate-200 border-slate-400/30' },
  { level: 2, name: 'Bronze', price: 40, products: 4, color: '#92400e', gradient: 'from-amber-700 to-yellow-900', badge: 'bg-amber-800/30 text-amber-400 border-amber-700/30' },
  { level: 3, name: 'Copper', price: 80, products: 8, color: '#c2410c', gradient: 'from-orange-500 to-amber-700', badge: 'bg-orange-900/30 text-orange-300 border-orange-700/30' },
  { level: 4, name: 'Silver', price: 160, products: 16, color: '#d1d5db', gradient: 'from-gray-300 to-gray-500', badge: 'bg-gray-400/20 text-gray-200 border-gray-400/30' },
  { level: 5, name: 'Gold', price: 320, products: 32, color: '#f59e0b', gradient: 'from-amber-400 to-yellow-600', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { level: 6, name: 'Pearl', price: 640, products: 64, color: '#e9d5ff', gradient: 'from-pink-200 to-purple-300', badge: 'bg-pink-300/20 text-pink-200 border-pink-300/30' },
  { level: 7, name: 'Sapphire', price: 1000, products: 100, color: '#3b82f6', gradient: 'from-blue-400 to-blue-700', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { level: 8, name: 'Ruby', price: 1500, products: 150, color: '#ef4444', gradient: 'from-red-400 to-red-700', badge: 'bg-red-500/20 text-red-300 border-red-500/30' },
  { level: 9, name: 'Emerald', price: 3000, products: 300, color: '#10b981', gradient: 'from-emerald-400 to-emerald-700', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { level: 10, name: 'Diamond', price: 5000, products: 500, color: '#a78bfa', gradient: 'from-violet-400 to-purple-700', badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  { level: 11, name: 'Black Diamond', price: 10000, products: 1000, color: '#94a3b8', gradient: 'from-zinc-600 to-gray-900', badge: 'bg-zinc-700/40 text-zinc-300 border-zinc-600/40' },
  { level: 12, name: 'Crown Diamond', price: 15000, products: 1500, color: '#fbbf24', gradient: 'from-amber-300 via-yellow-400 to-orange-500', badge: 'bg-amber-400/20 text-amber-200 border-amber-400/30' },
];

// Fixed one-time fee paid at registration (no package assigned)
export const REGISTRATION_FEE = 10; // $10 USD

export const BONUS_RATES = {
  management_fee_deposit: 0.10,
  management_fee_withdrawal: 0.10,
  upgrade_bonus: 0.30,
  leadership_pool: 0.15,
  rank_pool: 0.10,
  network_level: 0.15,
};

export interface ReorderPackage {
  id: number;
  qty: number;
  price: number;
}

export const REORDER_PACKAGES: ReorderPackage[] = [
  { id: 1, qty: 2, price: 14 },
  { id: 2, qty: 5, price: 35 },
  { id: 3, qty: 10, price: 70 },
  { id: 4, qty: 25, price: 175 },
  { id: 5, qty: 50, price: 350 },
];

export const REORDER_BONUS_RATES = {
  products: 0.45,
  network_level: 0.30,
  leadership_pool: 0.15,
  rank_pool: 0.10,
};

// 10 levels: 3+2+2+2+1+1+1+1+1+1 = 15%
export const NETWORK_LEVEL_DISTRIBUTION = [0.03, 0.02, 0.02, 0.02, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01];

export function getPackageByLevel(level: number): Package | undefined {
  return PACKAGES.find(p => p.level === level);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}
