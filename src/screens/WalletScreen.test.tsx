import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WalletScreen } from "./WalletScreen";

const { loadAccount, USDC_ISSUER } = vi.hoisted(() => ({
  loadAccount: vi.fn(),
  USDC_ISSUER: "GDLNG3YH552DJQUUKNISQMY3RVWMEQCEUTHAPJ5BGFHPFFUB4BP4NMVK",
}));

vi.mock("../lib/stellar", () => ({ USDC_ISSUER, horizon: { loadAccount } }));

const ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Funded account with no USDC trustline: cannot receive or hold USDC yet. */
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

/** Account with a USDC trustline and a genuine zero USDC balance. */
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

describe("WalletScreen USDC trustline state", () => {
  beforeEach(() => {
    loadAccount.mockReset();
  });

  it("shows an actionable trustline prompt when the account has no USDC trustline", async () => {
    loadAccount.mockResolvedValue(ACCOUNT_WITHOUT_USDC_TRUSTLINE);
    render(<WalletScreen address={ADDRESS} onDisconnect={() => {}} />);
    expect(await screen.findByText("Set up a USDC trustline to use USDC.")).toBeInTheDocument();
    expect(screen.queryByText("0 USDC")).not.toBeInTheDocument();
  });

  it("shows 0 USDC without the prompt when the trustline exists", async () => {
    loadAccount.mockResolvedValue(ACCOUNT_WITH_ZERO_USDC);
    render(<WalletScreen address={ADDRESS} onDisconnect={() => {}} />);
    expect(await screen.findByText("0 USDC")).toBeInTheDocument();
    expect(screen.queryByText("Set up a USDC trustline to use USDC.")).not.toBeInTheDocument();
  });
});
