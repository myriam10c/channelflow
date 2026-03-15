import { PrismaClient } from "@prisma/client";

/**
 * Instantiates a single instance of PrismaClient and save it on the global object.
 * Next.js hot reloads the code when files change on save. Multiple instances of Prisma Client are created
 * if not handled correctly. This is used to keep a single instance of Prisma Client across hot reloads.
 *
 * @see https://www.prisma.io/docs/support/help-center/nextjs-help-center#solution
 */
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
