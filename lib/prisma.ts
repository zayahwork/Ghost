import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/app/generated/prisma/client";

/** Scheme Prisma Postgres uses for its Accelerate-backed connection strings. */
const ACCELERATE_SCHEME = "prisma+postgres://";

/**
 * Prisma 7 has no query engine binary, so a connection is made one of exactly
 * two ways: over HTTP through Accelerate, or directly through a driver adapter.
 * The connection string says which, so the branch is on its scheme rather than
 * on a separate flag that could drift out of sync with the URL.
 */
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local.");
  }

  if (connectionString.startsWith(ACCELERATE_SCHEME)) {
    return new PrismaClient({ accelerateUrl: connectionString });
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

// Next.js discards module state on every hot reload in development, which would
// open a new pool per edit and exhaust the database's connection limit. Pinning
// the client to globalThis keeps one instance across reloads; production builds
// load the module once, so the global is deliberately left unset there.
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
