/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Testing Bookings Fetch...');
    try {
        const bookings = await prisma.booking.findMany({
            take: 5,
            orderBy: { startDate: 'desc' }
        });
        console.log(`✅ Successfully fetched ${bookings.length} bookings.`);
        console.log('Sample booking:', bookings[0]);
    } catch (error) {
        console.error('❌ Failed to fetch bookings:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
