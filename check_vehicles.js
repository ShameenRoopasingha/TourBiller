/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Testing Vehicle Fetch...');
    try {
        const count = await prisma.vehicle.count();
        console.log(`Total Vehicles: ${count}`);

        const vehicles = await prisma.vehicle.findMany({ take: 5 });
        console.log('Sample Vehicles:', vehicles);
    } catch (error) {
        console.error('ERROR FETCHING VEHICLES:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
