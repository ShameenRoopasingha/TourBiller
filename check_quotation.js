const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const id = 'cmlpexaw80002nwwdyuwf2gvq';
    try {
        const quotation = await prisma.quotation.findUnique({ where: { id } });
        if (quotation) {
            console.log('RESULT: FOUND');
        } else {
            console.log('RESULT: NOT_FOUND');
        }
    } catch (error) {
        console.log('RESULT: ERROR');
    } finally {
        await prisma.$disconnect();
    }
}

main();
