import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Only load .env.local if DATABASE_URL is not already set (e.g., in Kubernetes)
if (!process.env.DATABASE_URL) {
  try {
    config({ path: ".env.local" });
  } catch (e) {
    // Ignore if .env.local doesn't exist (e.g., in production/Kubernetes)
  }
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./auth-schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    table: "__drizzle_migrations",
    schema: "public",
  },
});
