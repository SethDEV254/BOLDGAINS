export const NONCE_COOKIE = 'bg_nonce';
export const NONCE_TTL_MS = 5 * 60 * 1000;

export function buildSignInMessage(
  address: string, nonce: string, issuedAt: number, origin: string,
): string {
  return `Bold Gains wants you to sign in with your BSC wallet:
${address}

Sign this message to verify wallet ownership. This request will not trigger a blockchain transaction or cost any gas.

URI: ${origin}
Version: 1
Chain ID: 56
Nonce: ${nonce}
Issued At: ${new Date(issuedAt).toISOString()}`;
}

export async function verifyWalletSignature(
  cookieValue: string | undefined,
  address: string,
  signature: string,
  origin: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!cookieValue) return { ok: false, error: 'Nonce expired or missing. Try connecting again.' };

  const [nonce, cookieAddress, issuedAtStr] = cookieValue.split(':');
  if (!nonce || !cookieAddress || !issuedAtStr) return { ok: false, error: 'Invalid nonce' };
  if (cookieAddress !== address.toLowerCase()) return { ok: false, error: 'Address mismatch' };

  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > NONCE_TTL_MS)
    return { ok: false, error: 'Nonce expired. Try connecting again.' };

  const message = buildSignInMessage(address, nonce, issuedAt, origin);

  const { verifyMessage } = await import('ethers');
  let recovered: string;
  try {
    recovered = verifyMessage(message, signature);
  } catch {
    return { ok: false, error: 'Invalid signature' };
  }

  if (recovered.toLowerCase() !== address.toLowerCase())
    return { ok: false, error: 'Signature does not match address' };

  return { ok: true };
}
