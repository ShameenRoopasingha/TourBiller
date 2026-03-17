import { prisma } from './src/lib/prisma';

async function main() {
  try {
    const count = await prisma.customer.count();
    console.log(`Successfully connected. Customer count: ${count}`);
  } catch (error) {
    console.error('Connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
