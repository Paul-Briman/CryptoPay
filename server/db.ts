
import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../shared/schema"; // Adjust if your schema path differs

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

console.log("Loaded DB URL:", process.env.DATABASE_URL);

// Create connection pool instead of single connection (recommended)
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
});

// Export drizzle client with required `mode`
export const db = drizzle(pool, {
  schema,
  mode: "default", // This is required for TypeScript compatibility
});
