/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "BillSteady",
        short_name: "BillSteady",
        description: "Pay Nigerian bills with XLM or USDC — non-custodial, straight from your wallet.",
        theme_color: "#0f766e",
        background_color: "#fffbf2",
        display: "standalone",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  build: {
    target: "es2020",
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // e2e/ holds Playwright specs (run via `pnpm test:e2e`), not Vitest ones.
    exclude: ["**/node_modules/**", "e2e/**"],
  },
});
