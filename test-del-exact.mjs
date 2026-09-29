
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    try {
        const vehicle = await prisma.vehicle.findFirst({ 
            where: { vehicleNo: "NW PK-9012" } 
        });
        if (!vehicle) {
            console.log("Not found");
            return;
        }
        
        console.log("Checking relations...");
        const expenseCount = await prisma.vehicleExpense.count({ where: { vehicleNo: vehicle.vehicleNo, companyId: vehicle.companyId } });
        const billCount = await prisma.bill.count({ where: { vehicleNo: vehicle.vehicleNo, companyId: vehicle.companyId } });
        const bookingCount = await prisma.booking.count({ where: { vehicleNo: vehicle.vehicleNo, companyId: vehicle.companyId } });
        const quotationCount = await prisma.quotation.count({ where: { vehicleNo: vehicle.vehicleNo, companyId: vehicle.companyId } });
        const tourScheduleCount = await prisma.tourSchedule.count({ where: { vehicleNo: vehicle.vehicleNo, companyId: vehicle.companyId } });
        
        console.log({ expenseCount, billCount, bookingCount, quotationCount, tourScheduleCount });
        
        // Let us not actually delete it yet, just to see if the queries work
        console.log("Simulating delete...");
    } catch(e) {
        console.error("Error:", e);
    }
}
main().catch(console.error).finally(()=>prisma.$disconnect());

