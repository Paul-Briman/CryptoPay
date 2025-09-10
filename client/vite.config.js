import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
// Polyfill __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export default defineConfig({
    root: __dirname, // Points to client directory
    base: "/",
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
            "@shared": path.resolve(__dirname, "../shared"),
        },
    },
    server: {
        proxy: {
            "/api": {
                target: process.env.VITE_API_BASE_URL || "http://localhost:3000",
                changeOrigin: true,
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
    build: {
        outDir: path.resolve(__dirname, "../dist/client"),
        assetsDir: "assets", // Add this line
        manifest: true, // Add this line
        emptyOutDir: true,
        rollupOptions: {
            input: path.resolve(__dirname, "index.html"), // Explicit entry point
        },
    },
    optimizeDeps: {
        include: ["tailwind.config.ts"], // Critical for CSS scanning
    },
    // Add this to your existing config
    css: {
        postcss: path.resolve(__dirname, "postcss.config.js"),
    },
});
