import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Use async function to handle await
export default (async () => {
  const cartographerPlugin =
    process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? [(await import("@replit/vite-plugin-cartographer")).cartographer()]
      : [];

  return defineConfig({
    base: "/CryptoPay/",

    plugins: [react(), runtimeErrorOverlay(), ...cartographerPlugin],

    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },

    root: path.resolve(import.meta.dirname, "client"),

    build: {
      outDir: path.resolve(import.meta.dirname, "dist/client"),
      emptyOutDir: true,
    },

    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  });
})();
