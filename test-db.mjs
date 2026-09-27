
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    try {
        const vehicles = await prisma.vehicle.findMany();
        console.log("Vehicles:", vehicles.length);
    } catch(e) {
        console.error("Error:", e);
    }
}
main().catch(console.error).finally(()=>prisma.$disconnect());

