import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          const isPkg = (pkg: string) => id.includes(`/node_modules/${pkg}/`);

          if (isPkg("react") || isPkg("react-dom") || isPkg("scheduler") || isPkg("wouter")) {
            return "react-core";
          }

          if (isPkg("@tanstack/react-query")) {
            return "react-query";
          }

          if (isPkg("recharts") || id.includes("/node_modules/d3-") || isPkg("victory-vendor")) {
            return "charts";
          }

          if (isPkg("react-icons") || isPkg("lucide-react")) {
            return "icons";
          }

          if (isPkg("framer-motion")) {
            return "motion";
          }

          if (isPkg("date-fns")) {
            return "date-utils";
          }
        },
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
