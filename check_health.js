/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkModel(name, modelDelegate) {
    try {
        const count = await modelDelegate.count();
        console.log(`✅ ${name}: ${count} records found.`);
        return true;
    } catch (error) {
        console.error(`❌ ${name}: Failed to fetch. Error: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('--- STARTING SYSTEM HEALTH CHECK ---');

    const results = await Promise.all([
        checkModel('Bill', prisma.bill),
        checkModel('Vehicle', prisma.vehicle),
        checkModel('Customer', prisma.customer),
        checkModel('Booking', prisma.booking),
        checkModel('TourSchedule', prisma.tourSchedule),
        checkModel('BusinessProfile', prisma.businessProfile),
    ]);

    console.log('--- HEALTH CHECK COMPLETE ---');

    const allPassed = results.every(r => r === true);
    if (allPassed) {
        console.log('🎉 System is HEALTHY. Database is accessible.');
    } else {
        console.log('⚠️ Some checks FAILED. Please check the logs above.');
    }

    await prisma.$disconnect();
}

main();
