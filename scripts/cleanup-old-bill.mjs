import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
await p.bill.deleteMany({ where: { route: '2-Day Kandy Tour (Sample)' } });
const schedules = await p.tourSchedule.findMany({ where: { name: '2-Day Kandy Tour (Sample)' } });
for (const s of schedules) {
    await p.tourScheduleDayItem.deleteMany({ where: { tourScheduleId: s.id } });
}
await p.tourSchedule.deleteMany({ where: { name: '2-Day Kandy Tour (Sample)' } });
await p.$disconnect();
console.log('Cleanup done');
