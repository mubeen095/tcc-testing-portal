import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createClient() {
  const connectionString =
    process.env.DATABASE_URL ??
    "postgresql://tcc:tcc_dev_password@localhost:5433/tcc_portal?schema=public";
  const useSsl =
    process.env.DATABASE_SSL === "true" ||
    (!process.env.DATABASE_SSL &&
      new URL(connectionString).hostname.includes("supabase"));
  const adapter = new PrismaPg({
    connectionString,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;