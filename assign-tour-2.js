const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function assignTour2() {
  const driver = await prisma.user.findUnique({ where: { email: 'asanka@vigil.com' } });
  if (!driver) return console.log("Driver not found");

  const companyId = driver.companyId;

  const newBooking = await prisma.booking.create({
    data: {
      companyId,
      vehicleNo: "WP KX-9999",
      customerName: "Jane Smith (Tourist)",
      startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      destination: "Kandy & Nuwara Eliya",
      status: "CONFIRMED",
      driverId: driver.id,
      notes: "Pick up from Colombo Hotel. Needs a child seat."
    }
  });

  console.log("Assigned New Tour:", newBooking.id);
}

assignTour2().catch(console.error).finally(() => prisma.$disconnect());
