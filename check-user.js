const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
    const user = await prisma.user.findFirst({ where: { email: "admin@vigil.com" } });
    console.log("User exists:", !!user);
    console.log("Role:", user?.role);
}
main().finally(() => prisma.$disconnect());
