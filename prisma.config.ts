import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Fallback keeps `prisma generate` (postinstall) working in CI/Vercel
    // builds before env vars are configured. CLI commands that touch the
    // database (db push, migrate, seed) require DATABASE_URL.
    url:
      process.env.DATABASE_URL ??
      "postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public",
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});