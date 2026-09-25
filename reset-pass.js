const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
    const hash = await bcrypt.hash("password123", 10);
    await prisma.user.updateMany({
        where: { email: "admin@vigil.com" },
        data: { password: hash }
    });
    console.log("Password reset to password123");
}
main().finally(() => prisma.$disconnect());
