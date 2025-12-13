const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Check if we can select the new fields
        // We don't need to actually find a record, just check if the query builds
        // But to be sure, let's try to find one order and select the fields
        const order = await prisma.order.findFirst({
            select: {
                id: true,
                invoiceId: true,
                invoiceUrl: true,
            },
        });
        console.log('Prisma Client verification successful. Fields exist.');
    } catch (error) {
        console.error('Prisma Client verification failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
