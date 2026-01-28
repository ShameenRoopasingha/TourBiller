const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBookings() {
    const bookings = await prisma.booking.findMany();
    const now = new Date();

    console.log("Current Time:", now.toLocaleString());
    console.log("Total Bookings:", bookings.length);

    bookings.forEach(b => {
        let status = b.status;
        let computed = "FUTURE";

        if (b.status === 'CONFIRMED') {
            const start = new Date(b.startDate);
            const end = b.endDate ? new Date(b.endDate) : null;

            if (end && now > end) {
                computed = "OVERDUE";
            } else if (now >= start) {
                computed = "ONGOING";
            }
        }

        console.log(`- [${b.vehicleNo}] ${b.customerName}: DB=${status} | Computed=${computed} | Start=${b.startDate.toLocaleString()} | End=${b.endDate?.toLocaleString()}`);
    });
}

checkBookings()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
