import { defineConfig, devices } from "@playwright/test";

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
  },
});
