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
        description: "Plan ahead, save daily, pay every bill on time.",
        theme_color: "#0f766e",
        background_color: "#ffffff",
        display: "standalone",
        icons: [],
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
  },
});
