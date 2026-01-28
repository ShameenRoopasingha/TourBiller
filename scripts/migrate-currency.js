const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting migration...');

    // Find all bills where totalAmountLKR is 0 but totalAmount is not 0 (legacy records)
    const legacyBills = await prisma.bill.findMany({
        where: {
            totalAmountLKR: 0,
            totalAmount: { gt: 0 }
        }
    });

    console.log(`Found ${legacyBills.length} legacy bills to update.`);

    for (const bill of legacyBills) {
        await prisma.bill.update({
            where: { id: bill.id },
            data: {
                totalAmountLKR: bill.totalAmount, // Assume LKR 1:1 for legacy
                currency: 'LKR',
                exchangeRate: 1.0
            }
        });
    }

    console.log('Migration completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
