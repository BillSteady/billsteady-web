# BillSteady Web

Helping people who are short on cash pay every bill on time: plan ahead,
save small amounts daily into bill "jars", and pay billers from those jars.
Launching in Nigeria, then Kenya and Ghana.

This is the planner web app — a React + Vite + TypeScript PWA. It is free,
works without any crypto, and never holds user funds.

## Status

**Phase 0** of 7, frontend feature-complete. The planner engine
(running-balance projection, shortfall warnings, daily set-aside) and all
three screens are built, tested, and have had a real design pass:

- Monthly **and** one-off bills (a date picker for the latter)
- Recording and editing a partial payment already saved toward a bill
- Editing an existing bill in place, not just add/remove
- Installable PWA with real icons (192/512/maskable + favicons)
- A design pass: clear visual hierarchy for the shortfall warning (the
  moment that matters most), a real empty state with a call to action,
  tabular-nums on every money figure so columns of numbers actually align,
  and cheap press-state feedback on buttons — all pure CSS, no new
  dependencies
- Fixed a real bug found during this pass: `todayIso()` now reads the
  viewer's local calendar date instead of `toISOString()`'s UTC date, which
  silently reported "tomorrow" for part of the day in any timezone west of
  UTC — this fed directly into shortfall and daily-set-aside math

30 Vitest tests passing. State is still local-storage only; there is no
backend or account sync yet (see billsteady-backend).

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full build plan and what's
blocked on external accounts versus what's just not built yet.

## Related repos

- [billsteady-backend](https://github.com/BillSteady/billsteady-backend) — Supabase backend (Postgres, Auth, Edge Functions)
- [billsteady-contracts](https://github.com/BillSteady/billsteady-contracts) — the Soroban jar smart contract

## Development

```bash
pnpm install
pnpm dev        # start the dev server
pnpm test       # run the test suite
pnpm lint       # eslint
pnpm typecheck  # tsc
pnpm build      # production build
```

## License

MIT — see [LICENSE](LICENSE).
