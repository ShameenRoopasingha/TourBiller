import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Limit Prisma's connection pool to avoid exhausting PgBouncer session-mode limits
const databaseUrl = process.env.DATABASE_URL || '';
const urlWithLimit = databaseUrl.includes('connection_limit')
  ? databaseUrl
  : `${databaseUrl}${databaseUrl.includes('?') ? '&' : '?'}connection_limit=5`;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.DEBUG_PRISMA === 'true' ? ['query', 'warn', 'error'] : ['warn', 'error'],
    datasourceUrl: urlWithLimit,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma