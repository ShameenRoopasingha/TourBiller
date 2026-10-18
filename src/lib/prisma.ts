import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Limit Prisma's connection pool to avoid exhausting PgBouncer session-mode limits
// and set explicit connection & pool timeouts to prevent unreleased socket leaks
const databaseUrl = process.env.DATABASE_URL || '';
const urlWithLimit = (() => {
  try {
    const url = new URL(databaseUrl);
    const configuredLimit = Number(url.searchParams.get('connection_limit'));
    const connectionLimit = Number.isFinite(configuredLimit) && configuredLimit > 0
      ? Math.min(configuredLimit, 2)
      : 2;
    url.searchParams.set('connection_limit', String(connectionLimit));
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', '15');
    }
    if (!url.searchParams.has('connect_timeout')) {
      url.searchParams.set('connect_timeout', '15');
    }
    return url.toString();
  } catch {
    const separator = databaseUrl.includes('?') ? '&' : '?';
    return `${databaseUrl}${separator}connection_limit=2&pool_timeout=15&connect_timeout=15`;
  }
})();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.DEBUG_PRISMA === 'true' ? ['query', 'warn', 'error'] : ['warn', 'error'],
    datasourceUrl: urlWithLimit,
  });

// Always store on globalThis to prevent multiple pool instantiations across chunk evaluations
globalForPrisma.prisma = prisma;

// Gracefully close connection pool on process termination to prevent unreleased sockets
if (typeof process !== 'undefined' && typeof process.on === 'function') {
  const disconnect = async () => {
    try {
      await prisma.$disconnect();
    } catch {
      // ignore during shutdown
    }
  };
  process.once('SIGINT', disconnect);
  process.once('SIGTERM', disconnect);
}