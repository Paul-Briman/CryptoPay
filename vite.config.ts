import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// Polyfill __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/CryptoPay/" : "/",
  root: path.resolve(__dirname, "client"), // This tells Vite where to find your frontend
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  server: {
    port: 5173, // Ensure Vite uses this port
    proxy: {
      "/api": {
        target: "http://localhost:3000", // Backend server
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist", "client"), // match server static folder
    emptyOutDir: true,
  },
});





