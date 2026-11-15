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

/**
 * Rounding policy: ALWAYS round UP (`Math.ceil`) to the next 7-decimal stroop
 * (`1e-7`) so that converting a naira bill (in integer kobo) to an on-chain
 * XLM/USDC amount never underpays the billed amount by a fractional stroop.
 *
 * Standard `Math.round` rounds down whenever the fractional stroop is < 0.5,
 * which can leave an exact-amount utility/VTpass order marginally short. Ceiling
 * at the 7th decimal place adds at most `< 1 stroop` (`< 0.0000001` XLM/USDC)
 * while guaranteeing `assetAmount * ngnPerAsset >= ngnKobo / 100`.
 */
export function ngnKoboToAsset(ngnKobo: number, ngnPerAsset: number): number {
  if (ngnKobo <= 0) return 0;
  const naira = ngnKobo / 100;
  return Math.ceil((naira / ngnPerAsset) * 1e7) / 1e7;
}
