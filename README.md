# BillSteady Web

Pay real Nigerian bills (electricity, airtime, data, cable, school fees)
straight from your Stellar wallet, in XLM or USDC. Non-custodial, always —
BillSteady never holds your funds; every payment is signed by your own
wallet and moves directly to the biller.

## Status (as of 2026-11-08)

This repo pivoted from a naira-only "no crypto" bill planner to this
non-custodial Stellar/stablecoin bill-pay app — see CLAUDE.md for the full
reasoning. The old planner UI (PlannerScreen/BillsScreen/AskForTimeScreen,
`planner.ts`) has been removed entirely, not extended.

**Built:**
- Wallet connect via Stellar Wallets Kit (Freighter, Lobstr, xBull, Albedo,
  Rabet — hand-picked, not the kit's full default set; see `src/lib/wallet.ts`
  for why) and SEP-10 Web Authentication (client side) against a backend
  that's being built in parallel.
- Three screens: **Wallet** (real XLM/USDC balances via Horizon), **Pay a
  bill** (verify → see the naira amount and live XLM/USDC equivalent → sign
  & pay, invoking `billsteady-contracts`' `BillPaymentRouter.pay()`),
  **History** (past payments).
- Live, working XLM/USDC → NGN rates from CoinGecko's free public API
  (verified reachable, not a placeholder).
- Code-split so the initial bundle (before connecting a wallet) stays
  **49.21KB gzip** — under this product's 200KB first-load budget. The
  heavy pieces (`@stellar/stellar-sdk`, the wallet connector SDKs) only
  load once the user taps "Connect wallet," not before. This needed real
  restructuring, not just hoping Vite would tree-shake it away — see
  `src/App.tsx`'s `lazy()` screen imports and `src/lib/wallet.ts`'s
  dynamic-imported kit.

**Genuinely verified:** 23/23 Vitest tests, clean typecheck/lint, clean
production build, 4/4 Playwright E2E tests (see "End-to-end tests" below),
smoke-tested (`vite preview` + curl) that the built app serves correctly.

**Two real bugs were found and fixed while building the E2E suite — not
hypothetical, both would have shipped silently:**
1. `src/lib/sep10.ts`'s `requestChallenge` did `new URL(relativePath)` with
   no base, which throws in this app's default `VITE_API_BASE_URL=""`
   config. Every unit test mocked `requestChallenge` entirely, so none of
   them ever executed this line. Fixed by passing `window.location.origin`
   as the base.
2. Nothing caught a failure in any SEP-10 step after a successful wallet
   connect (the challenge request, `validateChallenge`'s real
   cryptographic checks, signing, the token exchange). A failure there —
   which will happen in production for ordinary reasons: a network
   hiccup, a misconfigured server key, a malformed challenge — left the
   user stuck on the connect screen with no visible error and an
   unhandled promise rejection in the console. `src/lib/useAuth.ts` now
   wraps the whole `signIn` flow in a try/catch with its own error state,
   not just `wallet.ts`'s connect-specific one.

Both were caught by the E2E suite asserting no uncaught page error
occurred during each flow, not by any unit test — see the comment at the
top of `e2e/pay-bill.spec.ts`.

**Not verified, stated plainly:**
- No real wallet browser extension in this environment to click through
  the actual connect → sign-challenge → sign-payment flow with a real
  Freighter/Lobstr/etc. The E2E suite proves the UI's state machine and
  API-calling logic work correctly through a test-only mock seam (see
  below) — it does not prove a real wallet extension behaves the same way.
- The backend this app talks to (`billsteady-backend`) and the contract it
  calls (`billsteady-contracts`' `router/`) were being built in parallel by
  separate work and may not exist yet, or may not exactly match the
  interface assumed here. Placeholders, clearly marked `TODO`, pending
  reconciliation:
  - `VITE_API_BASE_URL`, and the endpoint paths in `src/lib/api.ts`
    (`/auth`, `/bills/verify`, `/payment-orders`, …) — reasonable
    REST-ish defaults, not a confirmed contract.
  - `VITE_ROUTER_CONTRACT_ID`, `VITE_USDC_ISSUER` — empty until
    `billsteady-contracts/router/README.md` publishes real addresses.
  - `order_ref` format (`src/lib/orderRef.ts`): 32 random bytes, generated
    client-side, sent to the backend with the quote, hex-encoded for
    transport. A reasonable default, not confirmed against the backend.
  - `VITE_SEP10_SERVER_SIGNING_KEY`: this app pins the expected server
    signing key via env var rather than fetching it from a
    `<home-domain>/.well-known/stellar.toml` (which the full SEP-10 spec
    describes) — a deliberate simplification for a backend that's a
    Supabase Edge Function, not a domain hosting its own stellar.toml. The
    actual security-relevant check (verifying the challenge's signature
    against a known, trusted key before signing anything) still happens;
    it's just sourced from config instead of a TOML fetch.

## Related repos

- [billsteady-backend](https://github.com/BillSteady/billsteady-backend) — Supabase backend
- [billsteady-contracts](https://github.com/BillSteady/billsteady-contracts) — the `BillPaymentRouter` Soroban contract
- [billsteady-landing](https://github.com/BillSteady/billsteady-landing) — the public landing page (live, reflects this same pivot)

## Development

```bash
pnpm install
pnpm dev        # start the dev server
pnpm test       # unit test suite (Vitest)
pnpm lint       # eslint
pnpm typecheck  # tsc
pnpm build      # production build
```

## End-to-end tests

`pnpm test:e2e` runs 4 real Playwright tests against a built + previewed
app: the full connect → balances → pick a bill → verify → confirm → sign &
pay → history flow, a bill-verification failure, a wallet-connect failure,
and a SEP-10 challenge that fails real validation — each asserting the UI
shows something honest and that no uncaught page error occurred (see the
two bugs above, both caught exactly this way).

**What's real vs. mocked**, since there's no real wallet extension or live
backend in this environment:
- **Real**: `src/lib/sep10.ts`'s `validateChallenge` runs its actual
  cryptographic/structural checks against a genuinely signed challenge
  transaction built in `e2e/fixtures/sep10Challenge.ts` (using a fixed,
  published, test-only keypair in `e2e/fixtures/testServerKeypair.ts` —
  never funded, never meaningful outside this fixture). The UI's full
  state machine runs for real: every screen transition, every API call's
  arguments, every error path.
- **Mocked via a test-only code seam**: `src/lib/wallet.ts`'s wallet kit
  and `src/lib/payment.ts`'s `payBill` each have a branch gated behind
  `VITE_E2E_MOCK === "true"` (only ever set by `playwright.config.ts`'s
  `webServer.env` — dead code in any real build, dev, or prod
  environment). The wallet mock reads test-configured behavior from
  `window.__E2E__`, set per-test via `page.addInitScript`. The payment
  mock deliberately does NOT try to fake Soroban RPC's JSON-RPC traffic —
  that's `billsteady-contracts`' own job, already proven on testnet there
  (see that repo). It still calls the real `signTransaction` callback, so
  the UI → wallet wiring is genuinely exercised.
- **Mocked via network interception**: the backend API
  (`src/lib/api.ts`'s endpoints), Horizon account balances, and
  CoinGecko's rate lookup are all mocked with `page.route`, since the real
  services either don't exist yet (`billsteady-backend` isn't deployed)
  or would make the suite flaky/slow for no good reason (CoinGecko,
  Horizon).

**What this does not prove**: that a real wallet browser extension, the
real deployed `billsteady-backend`, or the real `billsteady-contracts`
router behave the same way as these mocks assume. Reconcile against those
repos' real interfaces before trusting this end to end.

## License

MIT — see [LICENSE](LICENSE).
