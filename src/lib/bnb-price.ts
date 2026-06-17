let cachedPrice: number | null = null;
let cacheTime = 0;

export async function getBnbPrice(): Promise<number> {
  const now = Date.now();
  if (cachedPrice && now - cacheTime < 60_000) return cachedPrice;
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT');
    const data = await res.json();
    cachedPrice = parseFloat(data.price);
    cacheTime = now;
    return cachedPrice;
  } catch {
    return cachedPrice || 600;
  }
}

export function usdToBnb(usd: number, bnbPrice: number): number {
  return usd / bnbPrice;
}
