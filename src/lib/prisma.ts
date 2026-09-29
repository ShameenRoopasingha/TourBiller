import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Limit Prisma's connection pool to avoid exhausting PgBouncer session-mode limits
const databaseUrl = process.env.DATABASE_URL || '';
const urlWithLimit = (() => {
  try {
    const url = new URL(databaseUrl);
    const configuredLimit = Number(url.searchParams.get('connection_limit'));
    const connectionLimit = Number.isFinite(configuredLimit) && configuredLimit > 0
      ? Math.min(configuredLimit, 2)
      : 2;
    url.searchParams.set('connection_limit', String(connectionLimit));
    return url.toString();
  } catch {
    return `${databaseUrl}${databaseUrl.includes('?') ? '&' : '?'}connection_limit=2`;
  }
})();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.DEBUG_PRISMA === 'true' ? ['query', 'warn', 'error'] : ['warn', 'error'],
    datasourceUrl: urlWithLimit,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma