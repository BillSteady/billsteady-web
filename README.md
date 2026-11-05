# BillSteady Web

Helping people who are short on cash pay every bill on time: plan ahead,
save small amounts daily into bill "jars", and pay billers from those jars.
Launching in Nigeria, then Kenya and Ghana.

This is the planner web app — a React + Vite + TypeScript PWA. It is free,
works without any crypto, and never holds user funds.

## Status

**Phase 0** of 7. The planner (running-balance projection, shortfall
warnings, daily set-aside, Ask-for-time messages) is built and tested.
State is local-storage only; there is no backend or account sync yet.

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full build plan and what's
blocked on external accounts versus what's just not built yet.

## Related repos

- [billsteady-backend](https://github.com/bytescape30/billsteady-backend) — Supabase backend (Postgres, Auth, Edge Functions)
- [billsteady-contracts](https://github.com/bytescape30/billsteady-contracts) — the Soroban jar smart contract

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
