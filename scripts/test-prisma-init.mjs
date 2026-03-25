import { PrismaClient } from '@prisma/client';
try {
  new PrismaClient({ datasourceUrl: '?connection_limit=5' });
  console.log('No error on init');
} catch (e) {
  console.log('Error on init:', e.message);
}
