/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking latest bill...');
    try {
        const latestBill = await prisma.bill.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        if (!latestBill) {
            console.log('No bills found.');
            return;
        }

        console.log('--- LATEST BILL ---');
        console.log('ID:', latestBill.id);
        console.log('Customer Name:', latestBill.customerName);
        console.log('Customer Address (Raw):', latestBill.customerAddress);
        console.log('Has Address?', !!latestBill.customerAddress);
        console.log('Created At:', latestBill.createdAt);
        console.log('-------------------');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
