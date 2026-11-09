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
production build, smoke-tested (`vite preview` + curl) that the built app
serves correctly.

**Not verified, stated plainly:**
- No real wallet extension in this environment to click through the actual
  connect → sign-challenge → sign-payment flow end to end. Wallet signing
  is mocked in anything unit-tested; the live flow needs a human with
  Freighter/Lobstr/etc. installed.
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

`pnpm test:e2e` (Playwright) is wired up but has no spec file right now —
the old one tested a flow that no longer exists, and a meaningful spec for
the new flow needs a mocked wallet-extension harness that wasn't built in
this pass.

## License

MIT — see [LICENSE](LICENSE).
