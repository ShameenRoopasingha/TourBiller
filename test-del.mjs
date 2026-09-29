
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    try {
        const authCheck = { authorized: true, companyId: "some-company-id" };
        const vehicle = await prisma.vehicle.findFirst({ where: { vehicleNo: "WP CBA-5678" }});
        if (!vehicle) {
            console.log("Not found");
            return;
        }
        
        console.log("Deleting vehicle ID:", vehicle.id, "Company ID:", vehicle.companyId);
        
        const _res = await prisma.vehicle.deleteMany({
            where: { id: vehicle.id, companyId: vehicle.companyId },
        });
        console.log("Deleted count:", _res.count);
    } catch(e) {
        console.error("Error:", e);
    }
}
main().catch(console.error).finally(()=>prisma.$disconnect());

