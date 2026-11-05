# BillSteady Web

The planner web app (React + Vite + TypeScript PWA) for BillSteady: a bill
planner for people short on cash in Nigeria (then Kenya, Ghana). No lending,
ever. BillSteady never holds user funds or private keys.

This repo is one of three:
- **billsteady-web** (this repo): the planner PWA
- [billsteady-backend](https://github.com/bytescape30/billsteady-backend): Supabase (Postgres, Auth, Edge Functions)
- [billsteady-contracts](https://github.com/bytescape30/billsteady-contracts): the Soroban jar contract (Rust)

## Stack
- React + Vite + TypeScript PWA, Tailwind
- Vitest for tests, ESLint + tsc for lint/typecheck

## Commands
- pnpm install | pnpm dev | pnpm build | pnpm test | pnpm lint | pnpm typecheck

## Rules
- Money is integer minor units: kobo for NGN. Never floats.
- No secrets in code, logs or the client bundle. Never read .env; use .env.example.
- UI copy: plain English, naira first, avoid the word "crypto".

## Workflow
- Plan first, write a failing test, implement, run typecheck + tests, show output, commit.

## Current phase
Phase 0: planner only, local-storage state, no backend wired up yet.
Phase 0 remaining work (Supabase sync, OTP login) lives in billsteady-backend
and is blocked on provisioning a Supabase + Termii account.
