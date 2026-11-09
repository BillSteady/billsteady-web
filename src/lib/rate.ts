/**
 * Live XLM/USDC -> NGN rates from CoinGecko's free, unauthenticated public
 * API (verified reachable and returning real NGN quotes during development -
 * not a placeholder). No API key, no account needed. If CoinGecko ever
 * rate-limits or changes this endpoint, the caller sees a thrown error
 * rather than a silently wrong number - never fabricate a rate.
 */

const ENDPOINT = "https://api.coingecko.com/api/v3/simple/price?ids=stellar,usd-coin&vs_currencies=ngn";

export interface NgnRates {
  xlmToNgn: number;
  usdcToNgn: number;
}

export async function fetchNgnRates(): Promise<NgnRates> {
  const res = await fetch(ENDPOINT);
  if (!res.ok) {
    throw new Error(`Rate lookup failed: ${res.status}`);
  }
  const data = await res.json();
  const xlmToNgn = data?.stellar?.ngn;
  const usdcToNgn = data?.["usd-coin"]?.ngn;
  if (typeof xlmToNgn !== "number" || typeof usdcToNgn !== "number") {
    throw new Error("Rate lookup returned an unexpected shape");
  }
  return { xlmToNgn, usdcToNgn };
}

/** naira amount (integer kobo) -> asset amount needed at the given rate, rounded to 7 decimals (Stellar's precision). */
export function ngnKoboToAsset(ngnKobo: number, ngnPerAsset: number): number {
  const naira = ngnKobo / 100;
  return Math.round((naira / ngnPerAsset) * 1e7) / 1e7;
}
