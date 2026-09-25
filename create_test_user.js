const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    console.log('Creating dummy business profile...');
    const business = await prisma.businessProfile.create({
        data: {
            companyName: 'Test Company',
        }
    });

    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    console.log('Creating dummy user...');
    const user = await prisma.user.create({
        data: {
            email: 'admin@testcompany.com',
            name: 'Test Admin',
            password: hashedPassword,
            role: 'ADMIN',
            companyId: business.id
        }
    });

    console.log('User created successfully:');
    console.log('Email:', user.email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
