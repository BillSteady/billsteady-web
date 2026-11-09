# BillSteady Web

Non-custodial Stellar/stablecoin bill-pay app: connect a Stellar wallet, pay
a real Nigerian bill (electricity, airtime, data, cable, school fees)
directly in XLM or USDC. BillSteady never holds user funds or private keys
— every payment is signed by the user's own wallet.

## Product pivot (2026-11-08)

This repo was a naira-only, explicitly no-crypto bill *planner* (save a
little daily before a bill is due). That product is gone — not extended,
replaced. Decided and reasoned through with the user:
- **Pay-now, not save-first.** Someone who already holds XLM/USDC isn't
  short on cash; they want to spend what they have on a real bill.
  `planner.ts` (running-balance/shortfall projection) had no role in that
  and was deleted, not kept around "just in case."
- **Both assets, XLM and USDC.**
- **Stay non-custodial, architecturally, not just in copy.** Every payment
  is signed by the connected wallet and calls `billsteady-contracts`'
  `BillPaymentRouter.pay()`, which moves funds straight from the payer's
  account to a vetted settlement address in one atomic call — never through
  contract-held custody.

See [billsteady-landing](https://github.com/BillSteady/billsteady-landing)'s
CLAUDE.md for the fullest account of the pivot's reasoning (why non-custodial
was a deliberate carry-over from the original PRD's regulatory strategy, not
a given).

This repo is one of four:
- **billsteady-web** (this repo): the wallet-connect + pay-bill PWA
- [billsteady-backend](https://github.com/BillSteady/billsteady-backend): Supabase backend (SEP-10 auth, bill verification, payment tracking)
- [billsteady-contracts](https://github.com/BillSteady/billsteady-contracts): the `BillPaymentRouter` Soroban contract
- [billsteady-landing](https://github.com/BillSteady/billsteady-landing): the public landing page

## Visual direction: "Sunrise Teal"
Same as billsteady-landing — tokens duplicated into `tailwind.config.js`
(this app is still Tailwind v3, the landing page is v4's CSS-first
`@theme`; same hex values, different mechanism). Brand teal, one sunrise
amber accent, warm cream background, large radii, soft colored shadows.

## Stack
- React + Vite + TypeScript PWA, Tailwind v3
- `@stellar/stellar-sdk`, Stellar Wallets Kit (JSR, mapped via `.npmrc`)
- Vitest for unit tests; Playwright for E2E (`e2e/pay-bill.spec.ts`, 4 tests,
  see README's "End-to-end tests" section for what's real vs. mocked)

## Commands
- pnpm install | pnpm dev | pnpm build | pnpm test | pnpm lint | pnpm typecheck

## Rules
- Money is integer minor units: kobo for NGN, stroops (7-decimal) on-chain. Never floats.
- No secrets in code, logs or the client bundle. Never read .env; use .env.example.
- Keep the pre-wallet-connect bundle light (currently 49.21KB gzip main
  chunk) — `@stellar/stellar-sdk` and the wallet connector SDKs are heavy
  and must stay behind a dynamic import (`lazy()` screens, `wallet.ts`'s
  lazy kit load), not in the eagerly-loaded main chunk. Check this with
  `pnpm build` after touching anything that imports `@stellar/stellar-sdk`
  or the wallets kit.
- UI copy: plain English, naira shown first alongside the crypto amount.

## Workflow
- Plan first, write a failing test, implement, run typecheck + tests, show output, commit.

## Current phase
Rebuilt for the pivot. Builds against a specified interface for
billsteady-backend and billsteady-contracts, both built in parallel — see
README.md's "Not verified" section for exactly what's a placeholder
pending those repos, and reconcile before trusting any of it end to end.

A real E2E suite now exists (`pnpm test:e2e`, 4/4 passing) and caught two
real bugs along the way: `sep10.ts`'s `requestChallenge` crashed on the
default empty `VITE_API_BASE_URL` (`new URL()` with no base), and nothing
caught a SEP-10 failure after a successful wallet connect, leaving users
stuck with no visible error. Both fixed — see README.md for detail. This
is the concrete lesson: unit tests mocked every one of these functions, so
none of them ever caught either bug. Don't treat "unit tests pass" as
"the flow works" for anything that chains multiple async steps together.
