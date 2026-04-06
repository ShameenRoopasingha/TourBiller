import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const v = await prisma.vehicle.findFirst();
  console.log(JSON.stringify(v, null, 2));
}
main().finally(() => prisma.$disconnect());
