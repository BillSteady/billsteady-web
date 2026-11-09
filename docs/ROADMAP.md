# Roadmap

The original PRD (`BillSteady-on-Stellar-PRD-and-Build-Plan.pdf`, Nov 4,
2026) described a naira-only planner with Stellar jars deferred to v2/v3.
That phased plan no longer applies — BillSteady pivoted to a non-custodial
Stellar/stablecoin bill-pay app on 2026-11-08 (see CLAUDE.md). This
roadmap reflects the pivot, not the old PRD's phase numbering.

## Done, this repo
- Wallet connect (Freighter/Lobstr/xBull/Albedo/Rabet via Stellar Wallets Kit)
- SEP-10 Web Authentication, client side
- Wallet balances (real XLM/USDC via Horizon)
- Pay-a-bill flow: verify → naira + live crypto amount → sign → on-chain
  `pay()` call → notify backend
- Payment history screen
- Live XLM/USDC → NGN rates (CoinGecko public API)
- Bundle kept under the 200KB-gzip-before-connecting budget via code-splitting

## Blocked on other repos reaching the same point
- `billsteady-backend`: SEP-10 server, bill verification (VTpass), payment
  tracking — being built in parallel; this repo's API calls are against a
  specified-but-unconfirmed interface until that repo's README exists.
- `billsteady-contracts`: `BillPaymentRouter` deployed to testnet — this
  repo's `VITE_ROUTER_CONTRACT_ID`/`VITE_USDC_ISSUER` stay empty
  placeholders until that repo publishes real addresses.

## Not started, real next steps once the above reconcile
- End-to-end verification with a real wallet extension (Freighter/Lobstr)
  against real testnet contracts and a real deployed backend — nothing in
  this repo has been clicked through live yet, only unit-tested and built.
- A Playwright spec for the new flow (needs a mocked wallet-extension
  harness, not built in this pass — `pnpm test:e2e` has no current spec).
- i18n (Pidgin, Hausa, Yoruba, Igbo) and low-data/Opera Mini handling —
  carried over from the old roadmap as still-valid future work, now
  applying to this flow instead of the old planner (see GitHub issues #4, #5).
