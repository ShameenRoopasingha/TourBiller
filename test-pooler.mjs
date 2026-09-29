
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient({
    datasourceUrl: "postgresql://postgres.gexvbazypjrdwvwolohc:199824900278Dsr@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
});
async function main() {
    console.log("Connecting...");
    const count = await prisma.vehicle.count();
    console.log("Count:", count);
}
main().catch(console.error).finally(()=>prisma.$disconnect());

