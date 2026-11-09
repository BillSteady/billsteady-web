import type { Page } from "@playwright/test";
import { buildSep10Challenge } from "./sep10Challenge";

/**
 * Registers the backend/network mocks every test needs regardless of what
 * it's specifically testing: wallet-connect init script, SEP-10 challenge +
 * token exchange, Horizon account balances, and the CoinGecko rate lookup.
 * Bill-verification and payment-order mocks are deliberately NOT included
 * here - those vary per test (success vs. failure paths) and are set up
 * in each test itself, closer to what it's actually asserting.
 *
 * What this proves: the UI's state machine and API-calling logic work
 * correctly end to end through these mocked boundaries - SEP-10 challenge
 * validation is exercised for real (buildSep10Challenge produces a
 * genuinely signed, correctly-structured transaction that
 * src/lib/sep10.ts's validateChallenge() must accept on its own merits).
 * What it does NOT prove: that a real wallet browser extension or the real
 * deployed billsteady-backend/billsteady-contracts behave the same way -
 * those interfaces are specified, not yet reconciled against running
 * services.
 */
export async function mockCommonBackend(page: Page, opts: { walletAddress: string }) {
  await page.addInitScript((address) => {
    (window as unknown as { __E2E__: Record<string, string> }).__E2E__ = {
      walletAddress: address,
    };
  }, opts.walletAddress);

  await page.route("**/auth*", async (route) => {
    const request = route.request();
    if (request.method() === "GET") {
      const url = new URL(request.url());
      const account = url.searchParams.get("account") ?? opts.walletAddress;
      const transaction = buildSep10Challenge(account);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ transaction, network_passphrase: "Test SDF Network ; September 2015" }),
      });
      return;
    }
    if (request.method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ token: "e2e-session-token" }),
      });
      return;
    }
    await route.continue();
  });

  await page.route("**/accounts/*", async (route) => {
    const address = route.request().url().split("/accounts/")[1];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: address,
        account_id: address,
        sequence: "123456789",
        subentry_count: 1,
        balances: [
          { balance: "842.1234567", asset_type: "native" },
          {
            balance: "120.5000000",
            asset_type: "credit_alphanum4",
            asset_code: "USDC",
            asset_issuer: "GDLNG3YH552DJQUUKNISQMY3RVWMEQCEUTHAPJ5BGFHPFFUB4BP4NMVK",
          },
        ],
      }),
    });
  });

  await page.route("https://api.coingecko.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ stellar: { ngn: 850.5 }, "usd-coin": { ngn: 1550.25 } }),
    });
  });
}
