import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url"; // <-- Added this import
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import { nanoid } from "nanoid";
import viteConfig from "../client/vite.config";

// Add these 2 lines at the top (only change needed)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(
  app: Express,
  server: Server
) {
  if (process.env.NODE_ENV === 'production') return;

  const vite = await createViteServer({
    ...viteConfig,
    server: { 
      middlewareMode: true, 
      hmr: { server }, 
      strictPort: true 
    },
    appType: "custom",
  });

  // Vite middleware
  app.use(vite.middlewares);

  // Serve index.html for non-API requests only
  app.use("*", async (req, res, next) => {
    // Skip API requests (hardcoded to /api)
    if (req.path.startsWith("/api")) return next();

    try {
      const indexPath = path.resolve(__dirname, "..", "client", "index.html");
      let template = await fs.promises.readFile(indexPath, "utf-8");

      template = template.replace(
        /src="src\/main\.tsx"/,
        `src="src/main.tsx?v=${nanoid()}"`
      );

      const html = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (err) {
      vite.ssrFixStacktrace(err as Error);
      next(err);
    }
  });
}

export function serveStatic(app: Express) {
  const clientDistPath = path.resolve(__dirname, "../dist/client");
  if (!fs.existsSync(clientDistPath)) {
    throw new Error(`Could not find client build directory: ${clientDistPath}`);
  }
  app.use(express.static(clientDistPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}