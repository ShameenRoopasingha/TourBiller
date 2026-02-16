const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Testing Customer Fetch...');
    try {
        const count = await prisma.customer.count();
        console.log(`Total Customers: ${count}`);

        const customers = await prisma.customer.findMany({ take: 5 });
        console.log('Sample Customers:', customers);
    } catch (error) {
        console.error('ERROR FETCHING CUSTOMERS:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
