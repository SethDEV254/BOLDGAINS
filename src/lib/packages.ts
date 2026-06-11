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
  { level: 1, name: 'Starter', price: 15, products: 1, color: '#9ca3af', gradient: 'from-gray-400 to-gray-600', badge: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
  { level: 2, name: 'Iron', price: 20, products: 2, color: '#6b7280', gradient: 'from-gray-500 to-gray-700', badge: 'bg-gray-600/20 text-gray-300 border-gray-600/30' },
  { level: 3, name: 'Copper', price: 40, products: 4, color: '#b45309', gradient: 'from-amber-700 to-orange-800', badge: 'bg-amber-900/30 text-amber-300 border-amber-700/30' },
  { level: 4, name: 'Silver', price: 80, products: 8, color: '#d1d5db', gradient: 'from-gray-300 to-gray-500', badge: 'bg-gray-400/20 text-gray-200 border-gray-400/30' },
  { level: 5, name: 'Gold', price: 160, products: 16, color: '#f59e0b', gradient: 'from-amber-400 to-yellow-600', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { level: 6, name: 'Sapphire', price: 320, products: 32, color: '#3b82f6', gradient: 'from-blue-400 to-blue-700', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { level: 7, name: 'Ruby', price: 640, products: 64, color: '#ef4444', gradient: 'from-red-400 to-red-700', badge: 'bg-red-500/20 text-red-300 border-red-500/30' },
  { level: 8, name: 'Emerald', price: 1000, products: 100, color: '#10b981', gradient: 'from-emerald-400 to-emerald-700', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { level: 9, name: 'Diamond', price: 2000, products: 200, color: '#a78bfa', gradient: 'from-violet-400 to-purple-700', badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  { level: 10, name: 'Diamond Rep', price: 5000, products: 500, color: '#67e8f9', gradient: 'from-cyan-300 to-blue-600', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { level: 11, name: 'Super Diamond Rep', price: 10000, products: 1000, color: '#fbbf24', gradient: 'from-amber-300 via-yellow-400 to-amber-600', badge: 'bg-amber-400/20 text-amber-200 border-amber-400/30' },
];

export const BONUS_RATES = {
  management_fee_deposit: 0.10,
  management_fee_withdrawal: 0.10,
  direct_bonus: 0.30,
  upgrade_bonus: 0.30,
  leadership_pool: 0.10,
  network_level: 0.10,
  products: 0.10,
};

export const NETWORK_LEVEL_DISTRIBUTION = [0.04, 0.03, 0.02, 0.01]; // levels 1-4

export function getPackageByLevel(level: number): Package | undefined {
  return PACKAGES.find(p => p.level === level);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}
