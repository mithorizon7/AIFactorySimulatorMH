import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  html: { cspNonce: "__AI_FACTORY_REQUEST_NONCE__" },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    // Release A supports the modern browser floor used by Vite 8. Keep this
    // explicit so a future bundler upgrade cannot silently move the contract.
    target: ["chrome111", "edge111", "firefox114", "safari16.4"],
    rolldownOptions: {
      experimental: {
        // lucide-react is a side-effect-free barrel with thousands of exports.
        // Without lazy barrel traversal, Vite 8 compiles every icon even though
        // this application imports only a small subset.
        lazyBarrel: true,
      },
    },
  },
});
