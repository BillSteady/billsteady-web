import { defineConfig, devices } from "@playwright/test";
import { TEST_SERVER_KEYPAIR } from "./e2e/fixtures/testServerKeypair";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    // vite preview binds "localhost" to IPv6 (::1) only on some machines;
    // 127.0.0.1 (IPv4) then silently refuses connections. Use "localhost"
    // so this resolves to whatever vite actually bound.
    baseURL: "http://localhost:4176",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Pixel 7"], channel: "chrome" },
    },
  ],
  webServer: {
    command: "pnpm build && pnpm preview --port 4176",
    url: "http://localhost:4176",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      // VITE_* vars are baked into the build at build time (not runtime),
      // so this is the one place that matters - the build step inside the
      // command above, not anything set later in a test. See
      // e2e/fixtures/testServerKeypair.ts for why the public key used here
      // must be the exact same keypair e2e/fixtures/sep10Challenge.ts signs
      // with at request time.
      VITE_E2E_MOCK: "true",
      VITE_SEP10_SERVER_SIGNING_KEY: TEST_SERVER_KEYPAIR.publicKey(),
      VITE_USDC_ISSUER: TEST_SERVER_KEYPAIR.publicKey(), // stand-in issuer; only used to compute an Asset's contract id locally, never queried over the network in E2E mode
      VITE_ROUTER_CONTRACT_ID: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", // placeholder shape; the E2E payment mock never actually calls the router
    },
  },
});
