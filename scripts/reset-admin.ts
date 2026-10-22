import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);
    const email = args[0]?.trim().toLowerCase();
    const newPassword = args[1]?.trim();

    if (!email || !newPassword) {
        console.log('===========================================================');
        console.log('       VIGIL - Open-Source Emergency Admin Recovery        ');
        console.log('===========================================================');
        console.log('Usage:');
        console.log('  npx tsx scripts/reset-admin.ts <email> <newPassword>');
        console.log('Example:');
        console.log('  npx tsx scripts/reset-admin.ts shameenroopasingha@gmail.com MyNewPassword123!');
        console.log('===========================================================');
        process.exit(1);
    }

    if (newPassword.length < 6) {
        console.error('Error: Password must be at least 6 characters long.');
        process.exit(1);
    }

    console.log(`[VIGIL RECOVERY] Searching for user with email: ${email}...`);
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.error(`[VIGIL RECOVERY] ERROR: No account found for email "${email}".`);
        process.exit(1);
    }

    console.log(`[VIGIL RECOVERY] Found user: ${user.name} (Role: ${user.role})`);
    console.log(`[VIGIL RECOVERY] Hashing new password with bcrypt (10 salt rounds)...`);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { email },
        data: {
            password: hashedPassword,
            emailVerified: user.emailVerified || new Date(), // Auto-verify email upon emergency reset
        },
    });

    // Clear any pending reset tokens
    await prisma.passwordResetToken.deleteMany({
        where: { email },
    });

    console.log('===========================================================');
    console.log('  SUCCESS! Password reset completed.');
    console.log(`  User:     ${user.name} (${user.email})`);
    console.log(`  Role:     ${user.role}`);
    console.log('  Status:   Account active and verified.');
    console.log('===========================================================');
}

main()
    .catch((err) => {
        console.error('[VIGIL RECOVERY] Unhandled error during password reset:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
