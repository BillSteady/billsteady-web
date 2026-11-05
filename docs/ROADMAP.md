# Roadmap

Source of truth: `BillSteady-on-Stellar-PRD-and-Build-Plan.pdf` (Nov 4, 2026).

This repo (billsteady-web) owns Phase 0's frontend. Backend work (Phase 0.4+,
1, 2) lives in [billsteady-backend](https://github.com/bytescape30/billsteady-backend).
Contract work (Phase 3) lives in [billsteady-contracts](https://github.com/bytescape30/billsteady-contracts).

## Phase 0 — real app (done, frontend half)
- React + Vite + TS + Tailwind PWA
- planner.ts: paydays (weekly/biweekly/monthly), running-balance projection,
  shortfall warnings, daily set-aside, 19 passing Vitest tests
- Planner / Bills / Ask-for-time screens, mobile-first, naira-first copy
- State is local-only (localStorage) — no backend wired up yet

## Phase 0 remaining (blocked on accounts, not code — tracked in billsteady-backend)
- Supabase project (Postgres + RLS + Auth + Edge Functions)
- Phone OTP login via Termii — needs a Termii account + API key
- Prompt 0.5 sync (import localStorage bills into Supabase on first login) —
  the web-side half of this (the sync client code) lands here once the
  backend exists

## Phase 1 — reminders (blocked, billsteady-backend)
Needs Supabase + Termii + WhatsApp Business Cloud API approval.

## Phase 2 — naira bill pay, no crypto (blocked, billsteady-backend)
Needs VTpass sandbox account, Paystack test mode, and a licensed partner to
be merchant of record before any real money moves.

## Phase 3 — Stellar testnet (blocked, billsteady-contracts)
Needs an anchor with SEP-45 support confirmed, and OpenZeppelin Stellar
Channels testnet access, before the deposit/payout flow in this app can be
wired end to end. This repo's passkey wallet and jar UI are not started.

## Phase 4 — partner + legal (not code)
Licensed anchor agreement, KYC flow, Nigerian fintech lawyer's written
opinion. Must complete before Phase 5.

## Phase 5 — mainnet pilot (blocked on Phase 4)
External audit, ₦50k per-user cap, kill switch, 3 months with zero lost
funds before scaling past the pilot.

## Next smallest slice
Provision Supabase + Termii (billsteady-backend) and ship Prompt 0.4
(DB schema + RLS + OTP login) + Prompt 0.5 (sync). This repo's job then is
to wire the login screen and replace the localStorage store with the
Supabase client.
