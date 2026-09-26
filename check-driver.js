const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'asanka@vigil.com' } });
  if (!user) {
    console.log("User not found!");
    return;
  }
  console.log("User found:", user.email, "Role:", user.role);
  
  const isValid = await bcrypt.compare('asanka123', user.password);
  console.log("Password check 'asanka123':", isValid);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
