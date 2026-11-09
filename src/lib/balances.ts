import { NotFoundError } from "@stellar/stellar-sdk";
import { horizon, USDC_ISSUER } from "./stellar";

export interface WalletBalances {
  xlm: number;
  usdc: number;
}

/** Reads real balances for a connected account from Horizon. Returns zeros for an unfunded account. */
export async function fetchBalances(address: string): Promise<WalletBalances> {
  try {
    const account = await horizon.loadAccount(address);
    const xlmBalance = account.balances.find((b) => b.asset_type === "native");
    const usdcBalance = account.balances.find(
      (b) =>
        (b.asset_type === "credit_alphanum4" || b.asset_type === "credit_alphanum12") &&
        "asset_code" in b &&
        b.asset_code === "USDC" &&
        "asset_issuer" in b &&
        b.asset_issuer === USDC_ISSUER,
    );
    return {
      xlm: xlmBalance ? parseFloat(xlmBalance.balance) : 0,
      usdc: usdcBalance ? parseFloat(usdcBalance.balance) : 0,
    };
  } catch (err) {
    if (err instanceof NotFoundError) {
      return { xlm: 0, usdc: 0 };
    }
    throw err;
  }
}
