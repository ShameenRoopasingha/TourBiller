
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    try {
        const vehicles = await prisma.vehicle.findMany();
        for (const v of vehicles) {
            const expenseCount = await prisma.vehicleExpense.count({ where: { vehicleNo: v.vehicleNo } });
            const billCount = await prisma.bill.count({ where: { vehicleNo: v.vehicleNo } });
            const bookingCount = await prisma.booking.count({ where: { vehicleNo: v.vehicleNo } });
            const quotationCount = await prisma.quotation.count({ where: { vehicleNo: v.vehicleNo } });
            const tourScheduleCount = await prisma.tourSchedule.count({ where: { vehicleNo: v.vehicleNo } });
            
            console.log(v.vehicleNo, { expenseCount, billCount, bookingCount, quotationCount, tourScheduleCount });
        }
    } catch(e) {
        console.error("Error:", e);
    }
}
main().catch(console.error).finally(()=>prisma.$disconnect());

