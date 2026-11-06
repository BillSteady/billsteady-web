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

30 Vitest tests passing, plus a real Playwright E2E suite covering the
add-bill and edit-bill flows end to end (type, submit, see it land in the
Bills list and the Planner projection) — see "E2E stability" below for why
this exists. State is still local-storage only; there is no backend or
account sync yet (see billsteady-backend).

### E2E stability

An earlier verification pass found that automated browser testing stalled
indefinitely trying to locate the Amount field. Root cause: that field (and
the bill-name field) used `placeholder` text with no `<label>` — Chromium
derives an accessible name from `placeholder` for text inputs but not for
`type="number"` (role `spinbutton`) inputs, so the field was genuinely
unnamed in the accessibility tree, not just awkward for automation. That's
also a real accessibility bug on its own (placeholder-as-label is a known
anti-pattern: it vanishes once the user starts typing). Fixed by giving both
fields proper `<label>` elements, matching every other field in the form.
A Playwright suite (`pnpm test:e2e`) now exercises the real flow — confirmed
the fix live, confirmed via Chromium's own accessibility tree, not just
"tests pass."

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full build plan and what's
blocked on external accounts versus what's just not built yet.

## Related repos

- [billsteady-backend](https://github.com/BillSteady/billsteady-backend) — Supabase backend (Postgres, Auth, Edge Functions)
- [billsteady-contracts](https://github.com/BillSteady/billsteady-contracts) — the Soroban jar smart contract

## Development

```bash
pnpm install
pnpm dev        # start the dev server
pnpm test       # run the unit test suite (Vitest)
pnpm test:e2e   # run the browser end-to-end suite (Playwright, uses system Chrome)
pnpm lint       # eslint
pnpm typecheck  # tsc
pnpm build      # production build
```

## License

MIT — see [LICENSE](LICENSE).
