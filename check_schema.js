/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Try to query the raw database schema information
        const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bills' 
      AND column_name = 'customerAddress';
    `;

        console.log('Column check result:', result);

        if (result.length > 0) {
            console.log('✅ Column customerAddress EXISTS in bills');
        } else {
            console.log('❌ Column customerAddress MISSING in bills');
        }
    } catch (error) {
        console.error('Error checking column:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
