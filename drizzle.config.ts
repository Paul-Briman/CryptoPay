import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in .env");
}

export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./migrations",
  dialect: "postgresql", // This is correct for postgresql
  dbCredentials: {
    url: process.env.DATABASE_URL, // ✅ This should be `url`, not `connectionString`
  },
});



