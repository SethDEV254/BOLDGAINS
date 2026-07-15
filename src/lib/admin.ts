export function isAdminAddress(address: string): boolean {
  const list = process.env.ADMIN_WALLET_ADDRESSES || '';
  const allowlist = list.split(',').map((a) => a.trim().toLowerCase()).filter(Boolean);
  return allowlist.includes(address.toLowerCase());
}
