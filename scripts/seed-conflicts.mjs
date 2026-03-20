import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const vehicle = await prisma.vehicle.findFirst({ where: { status: 'ACTIVE' } });
  if (!vehicle) {
    console.error('No active vehicle found');
    return;
  }

  // 1. Create a Booking with null endDate (single-day booking) for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const booking = await prisma.booking.create({
    data: {
      vehicleNo: vehicle.vehicleNo,
      customerName: 'One-Day Booking Customer',
      startDate: tomorrow,
      endDate: null,
      status: 'CONFIRMED',
    }
  });
  console.log('Created Booking:', booking.id);

  // 2. Create an ACCEPTED Quotation for the day after tomorrow
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(0, 0, 0, 0);

  const schedule = await prisma.tourSchedule.findFirst();
  if (schedule) {
    const quote = await prisma.quotation.create({
      data: {
        tourScheduleId: schedule.id,
        customerName: 'Accepted Quote Customer',
        vehicleNo: vehicle.vehicleNo,
        startDate: dayAfter,
        endDate: dayAfter,
        status: 'ACCEPTED',
        totalAmount: 5000,
        hireRatePerDay: 5000,
      }
    });
    console.log('Created Quotation:', quote.id);
  }

  console.log('Vehicle under test:', vehicle.vehicleNo);
  console.log('Booking date:', tomorrow.toLocaleDateString());
  console.log('Quote date:', dayAfter.toLocaleDateString());
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
