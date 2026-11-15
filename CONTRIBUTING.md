# Contributing to BillSteady Web

Thank you for contributing to **BillSteady Web** — our non-custodial Stellar/stablecoin bill-pay PWA for Nigeria.

This guide walks through setting up a fresh clone, the required JSR (JavaScript Registry) `.npmrc` configuration for `@creit-tech/stellar-wallets-kit`, and the engineering rules that keep the app non-custodial and under its first-load bundle budget.

---

## 1. Prerequisites

- **Node.js:** v20+ (LTS recommended)
- **Package manager:** `pnpm` (v9+). Verify with `pnpm --version`.
- **Git:** Standard Git CLI

---

## 2. Step-by-Step Setup from a Fresh Clone

### Step 1: Clone the repository

```bash
git clone https://github.com/BillSteady/billsteady-web.git
cd billsteady-web
```

### Step 2: Verify the `.npmrc` JSR registry mapping (Required before `pnpm install`)

This project depends on `@jsr/creit-tech__stellar-wallets-kit`, which is hosted on **JSR (JavaScript Registry)** rather than the default npm registry.

Before running `pnpm install`, confirm that the repository root contains `.npmrc` with the `@jsr` scope mapped to `https://npm.jsr.io`:

```ini
@jsr:registry=https://npm.jsr.io
```

> **Troubleshooting `ERR_PNPM_FETCH_404` on `@jsr/creit-tech__stellar-wallets-kit`:**
> If `pnpm install` fails with a `404 Not Found` against `https://registry.npmjs.org/@jsr%2fcreit-tech__stellar-wallets-kit`, either:
> 1. Your local or global `~/.npmrc` is overriding the project-level `.npmrc`, or
> 2. You ran `npm` / `pnpm` from outside the repo root without the `@jsr:registry` mapping.
>
> Verify what `pnpm` resolves with:
> ```bash
> pnpm config get @jsr:registry
> # Expected output: https://npm.jsr.io
> ```

### Step 3: Install dependencies

```bash
pnpm install --frozen-lockfile
```

### Step 4: Configure environment variables (Optional for local UI/mocked dev)

Inspect `.env.example` (if present) or the `VITE_*` variables consumed across `src/lib/`:

| Variable | Default in dev | Purpose |
|---|---|---|
| `VITE_STELLAR_NETWORK` | `"testnet"` | `"testnet"` or `"mainnet"` |
| `VITE_API_BASE_URL` | `""` (relative to origin) | Base URL for `billsteady-backend` (`/auth`, `/bills/verify`, `/payment-orders`) |
| `VITE_SEP10_HOME_DOMAIN` | `"billsteady.app"` | Expected SEP-10 `home_domain` in challenge `manage_data` operations |
| `VITE_SEP10_SERVER_SIGNING_KEY` | `""` | Public Stellar key (`G...`) of the SEP-10 auth server |
| `VITE_ROUTER_CONTRACT_ID` | `""` | Deployed `BillPaymentRouter` Soroban contract ID (`C...`) |
| `VITE_USDC_ISSUER` | Testnet default | Stellar issuer address (`G...`) for USDC |

> **Security rule:** Never commit `.env` files or real secrets, and never embed private keys in client code or logs.

### Step 5: Run the development server and test suites

```bash
pnpm dev        # Start Vite dev server at http://localhost:5173
pnpm test       # Run Vitest unit tests once
pnpm lint       # Run ESLint with --max-warnings 0
pnpm typecheck  # Run TypeScript project-reference check (tsc -b)
pnpm build      # Build production bundle into dist/
```

### Step 6: Run End-to-End (Playwright) tests

```bash
pnpm exec playwright install --with-deps chromium
pnpm test:e2e
```

`pnpm test:e2e` builds and previews the app with `VITE_E2E_MOCK=true` (configured automatically in `playwright.config.ts`) and exercises the full connect → SEP-10 challenge validation → bill verify → quote → sign & pay → history flow.

---

## 3. Core Engineering Rules

1. **Integer minor units for money — never floats:**
   - NGN amounts are represented in integer **kobo** (`100 kobo = ₦1`).
   - On-chain Stellar amounts are represented in 7-decimal **stroops** (`10^7 stroops = 1 XLM` or `1 USDC`, converted via `BigInt` in `toStroops`).
   - When converting kobo to a 7-decimal asset display/quote amount (`ngnKoboToAsset` in `src/lib/rate.ts`), always round **up** (`Math.ceil`) to the next whole stroop so a biller is never short-paid.
2. **Protect the pre-connect first-load bundle budget (< 200KB gzip, currently ~49KB gzip):**
   - `@stellar/stellar-sdk` (~623KB raw) and `@jsr/creit-tech__stellar-wallets-kit` (~250KB gzip) **must remain behind dynamic imports** (`React.lazy()` screen boundaries in `src/App.tsx` and dynamic `import()` inside `loadKit()` in `src/lib/wallet.ts`).
   - Never add a static top-level `import ... from "@stellar/stellar-sdk"` or `@jsr/creit-tech__stellar-wallets-kit` to any file reachable from the initial `ConnectWalletScreen` entry path.
   - Always run `pnpm build` after touching imports and verify that the main `index-*.js` chunk stays around ~49KB gzipped.
3. **Stay strictly non-custodial:**
   - Every transaction must be constructed client-side and signed by the user's connected wallet via `signTransaction`.

---

## 4. Pull Request Checklist

Before opening a pull request:

1. Write or update a failing unit/E2E test first that reproduces the bug or verifies the new behavior.
2. Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` locally and ensure all four pass with zero warnings.
3. Reference the issue being resolved (`Closes #<issue-number>`) in the PR description.
