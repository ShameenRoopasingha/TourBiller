import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@tourbiller.com' },
        update: {},
        create: {
            name: 'Admin',
            email: 'admin@tourbiller.com',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });

    console.log(`Admin user created: ${admin.email}`);
    console.log('Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
