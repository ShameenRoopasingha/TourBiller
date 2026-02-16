/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const latestBill = await prisma.bill.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        console.log('--- LATEST BILL ---');
        console.log('ID:', latestBill.id);
        console.log('Customer Name:', latestBill.customerName);
        console.log('Customer Address:', latestBill.customerAddress);
        console.log('-------------------');
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
