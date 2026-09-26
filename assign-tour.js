const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function assignTour() {
  const driver = await prisma.user.findUnique({ where: { email: 'asanka@vigil.com' } });
  if (!driver) return console.log("Driver not found");

  const companyId = driver.companyId;

  // Let's create a new active booking for him
  const newBooking = await prisma.booking.create({
    data: {
      companyId,
      vehicleNo: "WP CAB-1234",
      customerName: "John Doe (Tourist)",
      startDate: new Date(),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      destination: "Galle & Mirissa",
      status: "CONFIRMED",
      driverId: driver.id,
      notes: "VIP Guest. Pick up from Airport."
    }
  });

  console.log("Assigned Tour:", newBooking.id);
}

assignTour().catch(console.error).finally(() => prisma.$disconnect());
