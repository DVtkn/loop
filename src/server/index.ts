import express from "express";
import path from "path";
import fs from "fs";

import app, {
  initDatabase,
  ensureDatabaseInitialized,
  logger,
  callGroqChat,
} from "./app";
import { config } from "./core/config";

export { logger, callGroqChat, ensureDatabaseInitialized, initDatabase };

const PORT = Number(process.env.PORT) || 3000;

// 4. VITE / STATIC SPA SERVING (Standalone Server Entry)
export async function startServer() {
  await initDatabase();

  const isProd = config.nodeEnv === "production";
  if (!isProd) {
    // Isolated dynamic import: Vite & Rollup will NEVER be bundled into production Serverless Functions
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");

    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    }
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      logger.info(`Loop backend listening on port ${PORT} [${config.nodeEnv}]`);
    });
  }
}

export default app;
