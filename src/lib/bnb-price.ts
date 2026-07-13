let cachedPrice: number | null = null;
let cacheTime = 0;

export async function getBnbPrice(): Promise<number> {
  const now = Date.now();
  if (cachedPrice && now - cacheTime < 60_000) return cachedPrice;
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT');
    const data = await res.json();
    const price = parseFloat(data.price);
    if (!Number.isFinite(price)) throw new Error(`Bad price response: ${JSON.stringify(data)}`);
    cachedPrice = price;
    cacheTime = now;
    return cachedPrice;
  } catch (err) {
    console.error('[bnb-price] fetch failed, using fallback:', err);
    return cachedPrice || 600;
  }
}

export function usdToBnb(usd: number, bnbPrice: number): number {
  return usd / bnbPrice;
}

export function bnbToUsd(bnb: number, bnbPrice: number): number {
  return bnb * bnbPrice;
}
