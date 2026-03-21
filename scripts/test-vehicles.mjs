import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Fetching vehicles...");
        const vehicles = await prisma.vehicle.findMany();
        console.log(`Found ${vehicles.length} vehicles.`);
    } catch (e) {
        console.error("Prisma error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
