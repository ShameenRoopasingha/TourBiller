/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkModel(name, modelDelegate) {
    try {
        const count = await modelDelegate.count();
        console.log(`✅ ${name}: ${count} records found.`);
        return true;
    } catch (error) {
        // Log brief error to avoid truncation
        console.log(`❌ ${name}: ERR: ${error.message.split('\n')[0].substring(0, 100)}`);
        return false;
    }
}

async function main() {
    console.log('START HEALTH CHECK');

    // Check models sequentially needed to see errors clearly
    await checkModel('Bill', prisma.bill);
    await checkModel('Vehicle', prisma.vehicle);
    await checkModel('Customer', prisma.customer);
    await checkModel('Booking', prisma.booking);
    await checkModel('TourSchedule', prisma.tourSchedule);
    await checkModel('BusinessProfile', prisma.businessProfile);

    console.log('END HEALTH CHECK');
    await prisma.$disconnect();
}

main();
