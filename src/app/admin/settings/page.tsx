'use client';

import { useState } from 'react';
import {
  Settings, DollarSign, Percent, Shield, Copy, Check,
  ExternalLink, Info, Package, Wallet,
} from 'lucide-react';
import {
  PACKAGES, REGISTRATION_FEE, REGISTRATION_FEE_GROSS, BONUS_RATES, NETWORK_LEVEL_DISTRIBUTION,
  REGISTRATION_REFERRAL_DIRECT_RATE, REGISTRATION_REFERRAL_INDIRECT_RATE,
} from '@/lib/packages';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div>
      <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">{label}</label>
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="flex-1 text-sm font-mono text-gray-300 truncate">{value || '—'}</p>
        {value && (
          <button onClick={copy} className="text-gray-500 hover:text-amber-400 transition-colors flex-shrink-0">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, color = '#9ca3af' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-semibold" style={{ color }}>{value}</span>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Platform Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Configuration reference for Bold Gains</p>
      </div>

      {/* Contract */}
      <div className="glass rounded-2xl p-6 gold-border-glow">
        <h3 className="text-white font-bold mb-5 flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" /> Smart Contract
        </h3>
        <div className="space-y-3">
          <CopyField label="Contract Address (BSC Mainnet)" value={CONTRACT_ADDRESS} />
          <CopyField label="Deployer / Owner Wallet" value="0xAf6c12e51A09376F448F3301d027b6A7bd76962A" />
        </div>
        <div className="mt-4 flex gap-3 flex-wrap">
          {CONTRACT_ADDRESS && (
            <a href={`https://bscscan.com/address/${CONTRACT_ADDRESS}#code`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-colors"
              style={{ background: 'rgba(202,138,4,0.1)', color: '#f59e0b', border: '1px solid rgba(202,138,4,0.25)' }}>
              <ExternalLink className="w-3.5 h-3.5" /> View Contract on BscScan
            </a>
          )}
          <a href="https://sourcify.dev/#/lookup/0xEF58925c73bE24cb5DC52D5029BAc9653B5B5344"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-colors"
            style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)' }}>
            <ExternalLink className="w-3.5 h-3.5" /> Sourcify Verification
          </a>
        </div>
      </div>

      {/* Fee structure */}
      <div className="glass rounded-2xl p-6 gold-border-glow">
        <h3 className="text-white font-bold mb-5 flex items-center gap-2">
          <Percent className="w-5 h-5 text-amber-400" /> Fee Structure
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Platform Rates</p>
            <InfoRow label="Registration Fee (gross)" value={`$${REGISTRATION_FEE_GROSS} USD`} color="#f59e0b" />
            <InfoRow label="Registration Base" value={`$${REGISTRATION_FEE} USD`} color="#9ca3af" />
            <InfoRow label="Referral Direct" value={`${(REGISTRATION_REFERRAL_DIRECT_RATE * 100).toFixed(0)}%`} color="#22d3ee" />
            <InfoRow label="Referral Indirect" value={`${(REGISTRATION_REFERRAL_INDIRECT_RATE * 100).toFixed(0)}%`} color="#ec4899" />
            <InfoRow label="Platform Fee (deposit)" value={`${(BONUS_RATES.management_fee_deposit * 100).toFixed(0)}%`} color="#f87171" />
            <InfoRow label="Withdrawal Fee" value="None" color="#34d399" />
            <InfoRow label="Upgrade Bonus" value={`${(BONUS_RATES.upgrade_bonus * 100).toFixed(0)}%`} color="#34d399" />
            <InfoRow label="Leadership Pool" value={`${(BONUS_RATES.leadership_pool * 100).toFixed(0)}%`} color="#a78bfa" />
            <InfoRow label="Rank Pool" value={`${(BONUS_RATES.rank_pool * 100).toFixed(0)}%`} color="#fbbf24" />
            <InfoRow label="Product Reorder Bonus" value="45%" color="#fb7185" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Network Level Distribution</p>
            {NETWORK_LEVEL_DISTRIBUTION.map((rate, i) => (
              <InfoRow key={i} label={`Level ${i + 1}`} value={`${(rate * 100).toFixed(1)}%`} color="#60a5fa" />
            ))}
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl flex items-start gap-2"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <Info className="w-4 h-4 text-amber-500/70 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-500/70">
            Fee rates are set in <code className="text-amber-400">src/lib/packages.ts</code> and enforced on-chain in <code className="text-amber-400">BoldGainsWallet.sol</code>.
            Changing them requires redeploying the contract.
          </p>
        </div>
      </div>

      {/* Packages */}
      <div className="glass rounded-2xl p-6 gold-border-glow">
        <h3 className="text-white font-bold mb-5 flex items-center gap-2">
          <Package className="w-5 h-5 text-amber-400" /> Package Tiers
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Level', 'Name', 'Price (USD)', 'Products'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PACKAGES.map(pkg => (
                <tr key={pkg.level} className="border-t border-white/[0.03]">
                  <td className="py-2.5 px-3 text-gray-500 text-xs">{pkg.level}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-xs font-bold px-2 py-1 rounded-full"
                      style={{ color: pkg.color, background: `${pkg.color}15`, border: `1px solid ${pkg.color}30` }}>
                      {pkg.name}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-white font-semibold">${pkg.price.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-gray-400">{pkg.products}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin credentials */}
      <div className="glass rounded-2xl p-6 gold-border-glow">
        <h3 className="text-white font-bold mb-5 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-amber-400" /> Admin Access
        </h3>
        <div className="space-y-3">
          <CopyField label="Admin Login Email" value="admin@boldgains.com" />
        </div>
        <div className="mt-4 p-3 rounded-xl flex items-start gap-2"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <Info className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">Admin password is set via the <code>ADMIN_DEFAULT_PASSWORD</code> environment variable. Never display or log credentials here.</p>
        </div>
      </div>

      {/* Environment */}
      <div className="glass rounded-2xl p-6 gold-border-glow">
        <h3 className="text-white font-bold mb-5 flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-400" /> Environment Variables
        </h3>
        <p className="text-xs text-gray-500 mb-4">Set in Vercel → Project → Settings → Environment Variables</p>
        <div className="space-y-2">
          {[
            { key: 'NEXT_PUBLIC_CONTRACT_ADDRESS', desc: 'Deployed contract address' },
            { key: 'JWT_SECRET', desc: 'Session signing key' },
            { key: 'OPERATOR_PRIVATE_KEY', desc: 'Wallet that owns the contract (for fee collection & payouts)' },
            { key: 'BSCSCAN_API_KEY', desc: 'Optional — BscScan API for contract verification' },
          ].map(v => (
            <div key={v.key} className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <code className="text-amber-400 text-xs font-mono flex-shrink-0 mt-0.5">{v.key}</code>
              <p className="text-gray-500 text-xs">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
