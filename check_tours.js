const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.tourSchedule.count();
    const activeCount = await prisma.tourSchedule.count({ where: { isActive: true } });

    console.log(`Total Tour Schedules: ${count}`);
    console.log(`Active Tour Schedules: ${activeCount}`);

    const tours = await prisma.tourSchedule.findMany({ select: { name: true, isActive: true } });
    console.log('Tours:', tours);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
