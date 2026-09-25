const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Updating user email...');
    const user = await prisma.user.update({
        where: { email: 'admin@testcompany.com' },
        data: { email: 'admin@vigil.com' }
    });

    console.log('User email updated successfully!');
    console.log('New Email:', user.email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
