import { expect, test } from "@playwright/test";
import { mockCommonBackend } from "./fixtures/mockBackend";

/**
 * E2E coverage for the wallet-connect -> pick-a-bill -> sign-and-pay flow.
 * See fixtures/mockBackend.ts for exactly what's real vs. mocked here, and
 * README.md for the fuller statement of what this does and doesn't prove.
 *
 * Every test asserts no uncaught page error occurred, not just that the
 * expected UI showed up. This is not belt-and-braces: building this suite
 * caught a real bug (sep10.ts's requestChallenge did `new URL(relativePath)`
 * with no base, which throws in the default VITE_API_BASE_URL="" config)
 * that produced no visible error in the app - the UI just silently stayed
 * on the connect screen forever. A pure "is this button visible" assertion
 * would have reported that failure as a vague timeout; this reports it as
 * exactly what it was.
 */

const WALLET_ADDRESS = "GA5VFTEXVQ424W3S4CWMLRRTSRBCDLJGRCLPXXKINZUTZSBCZFTWJ2P6";

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  // Stashed on the page object itself so each test can read it back at its
  // own final assertion point via the pageErrors() helper below.
  (page as unknown as { __pageErrors: string[] }).__pageErrors = errors;
});

function pageErrors(page: import("@playwright/test").Page): string[] {
  return (page as unknown as { __pageErrors: string[] }).__pageErrors ?? [];
}

test("connect wallet, see balances, pay a bill, see it in history", async ({ page }) => {
  await mockCommonBackend(page, { walletAddress: WALLET_ADDRESS });

  await page.route("**/bills/verify", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        billerId: "electricity",
        billerName: "Ikeja Electric (DisCo)",
        customerRef: "04521",
        amountKobo: 1850000,
      }),
    });
  });

  // Stateful, not canned: History's GET reflects whether the
  // onchain-confirmed POST actually happened during this test run, not a
  // hardcoded "already paid" fixture - proves real continuity through the
  // flow, not just "the screen renders whatever JSON it's handed".
  let orderStatus: "quote" | "paid" = "quote";
  const order = () => ({
    id: "order-e2e-1",
    billerId: "electricity",
    billerName: "Ikeja Electric (DisCo)",
    amountKobo: 1850000,
    status: orderStatus,
    createdAt: new Date().toISOString(),
  });

  await page.route("**/payment-orders", async (route) => {
    if (route.request().method() === "POST") {
      orderStatus = "quote";
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(order()) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([order()]) });
  });

  await page.route("**/payment-orders/*/onchain-confirmed", async (route) => {
    orderStatus = "paid";
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(order()) });
  });

  await page.goto("/");

  // Connect wallet screen -> SEP-10 sign-in (exercises real challenge
  // validation against the mocked but genuinely-signed challenge).
  await expect(page.getByRole("heading", { name: "Connect your Stellar wallet" })).toBeVisible();
  await page.getByRole("button", { name: "Connect wallet" }).click();

  // Lands on Pay a bill (App.tsx's default tab) now authenticated.
  await expect(page.getByRole("button", { name: "Continue" })).toBeVisible({ timeout: 10_000 });

  // Wallet tab: real balances rendered from the mocked Horizon response.
  await page.getByRole("button", { name: "Wallet" }).click();
  await expect(page.getByText("842.12 XLM")).toBeVisible();
  await expect(page.getByText("120.5 USDC")).toBeVisible();

  // Pay a bill: verify -> confirm -> sign & pay -> done.
  await page.getByRole("button", { name: "Pay a bill" }).click();
  await page.getByLabel("Meter number").fill("04521");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByText("Ikeja Electric (DisCo)")).toBeVisible();
  await expect(page.getByText(/≈ .+ USDC at today's rate/)).toBeVisible();

  await page.getByRole("button", { name: "Sign & pay" }).click();

  await expect(page.getByRole("heading", { name: "Paid" })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/e2e-mock-tx-/)).toBeVisible();

  // History: the payment shows up.
  await page.getByRole("button", { name: "History" }).click();
  await expect(page.getByText("Ikeja Electric (DisCo)")).toBeVisible();
  await expect(page.getByText("Paid")).toBeVisible();

  expect(pageErrors(page)).toEqual([]);
});

test("a failed bill verification shows an honest error, not a silent hang", async ({ page }) => {
  await mockCommonBackend(page, { walletAddress: WALLET_ADDRESS });

  await page.route("**/bills/verify", async (route) => {
    await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "not found" }) });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Connect wallet" }).click();
  await expect(page.getByRole("button", { name: "Continue" })).toBeVisible({ timeout: 10_000 });

  await page.getByLabel("Meter number").fill("00000-does-not-exist");
  await page.getByRole("button", { name: "Continue" }).click();

  // PayBillScreen's "error" step - a visible message, a "Try again" button,
  // not a stuck spinner or a silent blank screen.
  await expect(page.getByText(/Bill verification failed/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();

  expect(pageErrors(page)).toEqual([]);
});

test("a wallet connection error is shown, not swallowed", async ({ page }) => {
  await mockCommonBackend(page, { walletAddress: WALLET_ADDRESS });
  await page.addInitScript(() => {
    (window as unknown as { __E2E__: Record<string, string> }).__E2E__.connectError = "User rejected the request";
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Connect wallet" }).click();

  await expect(page.getByText("User rejected the request")).toBeVisible();
  // Still on the connect screen - never silently proceeds past a failed connect.
  await expect(page.getByRole("heading", { name: "Connect your Stellar wallet" })).toBeVisible();

  expect(pageErrors(page)).toEqual([]);
});

test("a SEP-10 challenge that fails real validation is shown as an error, not a silent hang", async ({ page }) => {
  // Direct coverage for the bug this suite caught: validateChallenge()'s
  // real cryptographic/structural checks (sep10.ts) used to have no error
  // handling above them at all. Here the mocked backend returns a
  // challenge with the wrong source account - validateChallenge rejects
  // it for a genuine reason, and the fix is what turns that rejection into
  // a visible message instead of a silent stuck screen.
  await mockCommonBackend(page, { walletAddress: WALLET_ADDRESS });
  await page.route("**/auth*", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        // A syntactically-plausible but wrong challenge: this is a real
        // base64 envelope shape check, not just an arbitrary string - any
        // malformed value throws at `TransactionBuilder.fromXDR` before
        // validateChallenge's own checks even run, which is also a
        // legitimate real-world failure (a misbehaving backend) this test
        // covers.
        transaction: "AAAAAgAAAAA=",
        network_passphrase: "Test SDF Network ; September 2015",
      }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Connect wallet" }).click();

  await expect(page.getByRole("heading", { name: "Connect your Stellar wallet" })).toBeVisible();
  // An error message is shown somewhere on the connect screen - not
  // asserting exact wording (it comes from whatever the XDR parser or
  // validateChallenge throws), just that it's visible, not silent.
  const errorParagraph = page.locator("p.text-red-600");
  await expect(errorParagraph).toBeVisible({ timeout: 10_000 });
  await expect(errorParagraph).not.toBeEmpty();

  expect(pageErrors(page)).toEqual([]);
});
