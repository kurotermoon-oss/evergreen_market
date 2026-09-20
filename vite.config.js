import { readonlyPreview } from "./scripts/readonlyPreview.mjs";
import { supplyPreview } from "./scripts/supplyPreview.mjs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [readonlyPreview(), supplyPreview(), react(), tailwindcss()],
  server: {
    host: true,
    allowedHosts: ["localhost", ".trycloudflare.com"],
    watch: {
      ignored: ["**/server/data/**"],
    },
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
