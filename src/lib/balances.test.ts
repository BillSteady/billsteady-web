import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchBalances } from "./balances";

const { loadAccount, USDC_ISSUER } = vi.hoisted(() => ({
  loadAccount: vi.fn(),
  USDC_ISSUER: "GDLNG3YH552DJQUUKNISQMY3RVWMEQCEUTHAPJ5BGFHPFFUB4BP4NMVK",
}));

vi.mock("./stellar", () => ({ USDC_ISSUER, horizon: { loadAccount } }));

const ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Funded account holding only XLM and an unrelated asset: no USDC trustline. */
const ACCOUNT_WITHOUT_USDC_TRUSTLINE = {
  balances: [
    { asset_type: "native", balance: "5.0000000" },
    {
      asset_type: "credit_alphanum4",
      asset_code: "NGN",
      asset_issuer: "GOTHERISSUERXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      balance: "1000.0000000",
    },
  ],
};

/** Account that has established the USDC trustline but holds zero USDC. */
const ACCOUNT_WITH_ZERO_USDC = {
  balances: [
    { asset_type: "native", balance: "5.0000000" },
    {
      asset_type: "credit_alphanum4",
      asset_code: "USDC",
      asset_issuer: USDC_ISSUER,
      balance: "0.0000000",
    },
  ],
};

describe("fetchBalances", () => {
  beforeEach(() => {
    loadAccount.mockReset();
  });

  it("reports no USDC trustline for an account without one", async () => {
    loadAccount.mockResolvedValue(ACCOUNT_WITHOUT_USDC_TRUSTLINE);
    const balances = await fetchBalances(ADDRESS);
    expect(balances.usdcTrustline).toBe(false);
    expect(balances.usdc).toBe(0);
    expect(balances.xlm).toBe(5);
  });

  it("reports a trustline with a zero USDC balance distinctly", async () => {
    loadAccount.mockResolvedValue(ACCOUNT_WITH_ZERO_USDC);
    const balances = await fetchBalances(ADDRESS);
    expect(balances.usdcTrustline).toBe(true);
    expect(balances.usdc).toBe(0);
  });
});
