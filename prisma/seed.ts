import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEMO_COMPANY_ID = 'tourbiller-demo-company';
const DEMO_ADMIN_EMAIL = 'demo-admin@tourbiller.local';
const DEMO_DRIVER_EMAIL = 'demo-driver@tourbiller.local';
const DEMO_PASSWORD = 'DemoPass123!';
const DEMO_VEHICLE_NO = 'WP-CAA-0001';
const DEMO_CUSTOMER_NAME = 'Amaya Perera';
const DEMO_SCHEDULE_NAME = 'Kandy Heritage Weekend';

async function main() {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    const tripEnd = new Date(tomorrow);
    tripEnd.setDate(tripEnd.getDate() + 2);
    const billStart = new Date(now);
    billStart.setDate(billStart.getDate() - 3);
    const billEnd = new Date(billStart);
    billEnd.setDate(billEnd.getDate() + 1);

    const company = await prisma.businessProfile.upsert({
        where: { id: DEMO_COMPANY_ID },
        update: {
            companyName: 'TourBiller Demo Transport',
            address: '18 Lake Road, Colombo',
            phone: '+94 11 555 0100',
            email: 'hello@tourbiller.local',
            website: 'https://tourbiller.local',
            usdRate: 300,
            bankName: 'Demo Bank',
            bankBranch: 'Colombo Fort',
            bankAccountNo: '0001234567',
            bankAccountName: 'TourBiller Demo Transport',
        },
        create: {
            id: DEMO_COMPANY_ID,
            companyName: 'TourBiller Demo Transport',
            address: '18 Lake Road, Colombo',
            phone: '+94 11 555 0100',
            email: 'hello@tourbiller.local',
            website: 'https://tourbiller.local',
            usdRate: 300,
            bankName: 'Demo Bank',
            bankBranch: 'Colombo Fort',
            bankAccountNo: '0001234567',
            bankAccountName: 'TourBiller Demo Transport',
        },
    });

    const admin = await prisma.user.upsert({
        where: { email: DEMO_ADMIN_EMAIL },
        update: { companyId: company.id, name: 'Demo Admin', password: passwordHash, role: 'ADMIN' },
        create: {
            companyId: company.id,
            name: 'Demo Admin',
            email: DEMO_ADMIN_EMAIL,
            password: passwordHash,
            role: 'ADMIN',
        },
    });

    const driver = await prisma.user.upsert({
        where: { email: DEMO_DRIVER_EMAIL },
        update: { companyId: company.id, name: 'Nimal Fernando', password: passwordHash, role: 'DRIVER' },
        create: {
            companyId: company.id,
            name: 'Nimal Fernando',
            email: DEMO_DRIVER_EMAIL,
            password: passwordHash,
            role: 'DRIVER',
        },
    });

    const customer = await prisma.customer.upsert({
        where: { id: 'tourbiller-demo-customer' },
        update: {
            companyId: company.id,
            name: DEMO_CUSTOMER_NAME,
            mobile: '+94 77 123 4567',
            email: 'amaya@example.test',
            address: '24 Flower Road, Colombo 07',
        },
        create: {
            id: 'tourbiller-demo-customer',
            companyId: company.id,
            name: DEMO_CUSTOMER_NAME,
            mobile: '+94 77 123 4567',
            email: 'amaya@example.test',
            address: '24 Flower Road, Colombo 07',
        },
    });

    const vehicle = await prisma.vehicle.upsert({
        where: { companyId_vehicleNo: { companyId: company.id, vehicleNo: DEMO_VEHICLE_NO } },
        update: {
            model: 'Toyota HiAce',
            category: 'VAN',
            status: 'ACTIVE',
            ratePerDay: 18500,
            kmPerDay: 100,
            excessKmRate: 120,
            extraHourRate: 900,
            seats: 12,
            acType: 'Dual AC',
            features: 'USB charging, reclining seats, luggage space',
            insuranceCoverage: 'Rs. 1,000,000 per passenger',
            currentMileage: 42800,
            oilChangeInterval: 5000,
            lastOilChangeMileage: 40000,
            filterChangeInterval: 10000,
            lastFilterChangeMileage: 40000,
            washInterval: 1000,
            lastWashMileage: 42000,
        },
        create: {
            companyId: company.id,
            vehicleNo: DEMO_VEHICLE_NO,
            model: 'Toyota HiAce',
            category: 'VAN',
            status: 'ACTIVE',
            ratePerDay: 18500,
            kmPerDay: 100,
            excessKmRate: 120,
            extraHourRate: 900,
            seats: 12,
            acType: 'Dual AC',
            features: 'USB charging, reclining seats, luggage space',
            insuranceCoverage: 'Rs. 1,000,000 per passenger',
            currentMileage: 42800,
            oilChangeInterval: 5000,
            lastOilChangeMileage: 40000,
            filterChangeInterval: 10000,
            lastFilterChangeMileage: 40000,
            washInterval: 1000,
            lastWashMileage: 42000,
        },
    });

    const schedule = await prisma.tourSchedule.upsert({
        where: { companyId_name: { companyId: company.id, name: DEMO_SCHEDULE_NAME } },
        update: {
            description: 'A three-day Colombo to Kandy cultural tour.',
            days: 3,
            basePricePerPerson: 42000,
            vehicleCategory: 'VAN',
            vehicleNo: vehicle.vehicleNo,
            ratePerDay: 18500,
            kmPerDay: 100,
            seats: 12,
            excessKmRate: 120,
            extraHourRate: 900,
            waitingCharge: 1500,
            gatePass: 1000,
        },
        create: {
            companyId: company.id,
            name: DEMO_SCHEDULE_NAME,
            description: 'A three-day Colombo to Kandy cultural tour.',
            days: 3,
            basePricePerPerson: 42000,
            vehicleCategory: 'VAN',
            vehicleNo: vehicle.vehicleNo,
            ratePerDay: 18500,
            kmPerDay: 100,
            seats: 12,
            excessKmRate: 120,
            extraHourRate: 900,
            waitingCharge: 1500,
            gatePass: 1000,
        },
    });

    await prisma.tourScheduleDayItem.deleteMany({ where: { tourScheduleId: schedule.id } });
    await prisma.tourScheduleDayItem.createMany({
        data: [
            { tourScheduleId: schedule.id, dayNumber: 1, title: 'Colombo to Kandy', description: 'Stop at the Pinnawala area before checking in.', distanceKm: 125, accommodation: 12000, meals: 4500, activities: 2500, otherCosts: 500 },
            { tourScheduleId: schedule.id, dayNumber: 2, title: 'Kandy city and hills', description: 'Visit the lake, temple district, and tea country.', distanceKm: 85, accommodation: 12000, meals: 5000, activities: 3500, otherCosts: 750 },
            { tourScheduleId: schedule.id, dayNumber: 3, title: 'Kandy to Colombo', description: 'Return via the central highlands.', distanceKm: 130, accommodation: 0, meals: 3000, activities: 0, otherCosts: 500 },
        ],
    });

    const booking = await prisma.booking.upsert({
        where: { id: 'tourbiller-demo-booking' },
        update: {
            companyId: company.id,
            vehicleNo: vehicle.vehicleNo,
            customerName: customer.name,
            startDate: tomorrow,
            endDate: tripEnd,
            destination: 'Colombo to Kandy and return',
            status: 'CONFIRMED',
            notes: 'Demo booking. Confirm pickup time with the customer.',
            advanceAmount: 10000,
            driverId: driver.id,
        },
        create: {
            id: 'tourbiller-demo-booking',
            companyId: company.id,
            vehicleNo: vehicle.vehicleNo,
            customerName: customer.name,
            startDate: tomorrow,
            endDate: tripEnd,
            destination: 'Colombo to Kandy and return',
            status: 'CONFIRMED',
            notes: 'Demo booking. Confirm pickup time with the customer.',
            advanceAmount: 10000,
            driverId: driver.id,
        },
    });

    const bill = await prisma.bill.upsert({
        where: { id: 'tourbiller-demo-bill' },
        update: {
            companyId: company.id,
            vehicleNo: vehicle.vehicleNo,
            customerName: customer.name,
            customerAddress: customer.address,
            route: 'Colombo to Kandy and return',
            startMeter: 42000,
            endMeter: 42240,
            hireRate: 18500,
            allowedKm: 200,
            waitingCharge: 1500,
            gatePass: 1000,
            packageCharge: 42000,
            advanceAmount: 10000,
            totalAmount: 53000,
            totalAmountLKR: 53000,
            paymentMethod: 'CASH',
            startDate: billStart,
            endDate: billEnd,
            scheduledDays: 2,
            itinerary: JSON.stringify([
                { dayNumber: 1, title: 'Colombo to Kandy', distanceKm: 125 },
                { dayNumber: 2, title: 'Kandy city and hills', distanceKm: 85 },
            ]),
        },
        create: {
            id: 'tourbiller-demo-bill',
            companyId: company.id,
            vehicleNo: vehicle.vehicleNo,
            customerName: customer.name,
            customerAddress: customer.address,
            route: 'Colombo to Kandy and return',
            startMeter: 42000,
            endMeter: 42240,
            hireRate: 18500,
            allowedKm: 200,
            waitingCharge: 1500,
            gatePass: 1000,
            packageCharge: 42000,
            advanceAmount: 10000,
            totalAmount: 53000,
            totalAmountLKR: 53000,
            paymentMethod: 'CASH',
            startDate: billStart,
            endDate: billEnd,
            scheduledDays: 2,
            itinerary: JSON.stringify([
                { dayNumber: 1, title: 'Colombo to Kandy', distanceKm: 125 },
                { dayNumber: 2, title: 'Kandy city and hills', distanceKm: 85 },
            ]),
        },
    });

    const quotation = await prisma.quotation.upsert({
        where: { id: 'tourbiller-demo-quotation' },
        update: {
            companyId: company.id,
            tourScheduleId: schedule.id,
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.mobile,
            vehicleNo: vehicle.vehicleNo,
            numberOfPersons: 4,
            startDate: tomorrow,
            endDate: tripEnd,
            pickupLocation: 'Colombo 07',
            dropLocation: 'Kandy',
            hireRatePerDay: 18500,
            kmPerDay: 100,
            excessKmRate: 120,
            extraHourRate: 900,
            totalDistance: 340,
            transportCost: 55500,
            accommodationTotal: 24000,
            mealsTotal: 12500,
            activitiesTotal: 6000,
            otherCostsTotal: 1750,
            markup: 10,
            discount: 2000,
            driverCostPerDay: 5000,
            advanceAmount: 10000,
            totalAmount: 110575,
            notes: 'Sample quotation for demonstration.',
            validUntil: tripEnd,
            status: 'SENT',
            driverId: driver.id,
        },
        create: {
            id: 'tourbiller-demo-quotation',
            companyId: company.id,
            tourScheduleId: schedule.id,
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.mobile,
            vehicleNo: vehicle.vehicleNo,
            numberOfPersons: 4,
            startDate: tomorrow,
            endDate: tripEnd,
            pickupLocation: 'Colombo 07',
            dropLocation: 'Kandy',
            hireRatePerDay: 18500,
            kmPerDay: 100,
            excessKmRate: 120,
            extraHourRate: 900,
            totalDistance: 340,
            transportCost: 55500,
            accommodationTotal: 24000,
            mealsTotal: 12500,
            activitiesTotal: 6000,
            otherCostsTotal: 1750,
            markup: 10,
            discount: 2000,
            driverCostPerDay: 5000,
            advanceAmount: 10000,
            totalAmount: 110575,
            notes: 'Sample quotation for demonstration.',
            validUntil: tripEnd,
            status: 'SENT',
            driverId: driver.id,
        },
    });

    const expense = await prisma.vehicleExpense.upsert({
        where: { id: 'tourbiller-demo-expense' },
        update: {
            companyId: company.id,
            vehicleNo: vehicle.vehicleNo,
            amount: 8500,
            category: 'SERVICE',
            description: 'Scheduled service and fluid check (demo)',
            date: billEnd,
            bookingId: booking.id,
            driverId: driver.id,
            expenseType: 'COMPANY',
        },
        create: {
            id: 'tourbiller-demo-expense',
            companyId: company.id,
            vehicleNo: vehicle.vehicleNo,
            amount: 8500,
            category: 'SERVICE',
            description: 'Scheduled service and fluid check (demo)',
            date: billEnd,
            bookingId: booking.id,
            driverId: driver.id,
            expenseType: 'COMPANY',
        },
    });

    await prisma.tripActivity.upsert({
        where: { id: 'tourbiller-demo-trip-activity' },
        update: {
            companyId: company.id,
            bookingId: booking.id,
            driverId: driver.id,
            type: 'NOTE',
            note: 'Demo trip activity: customer pickup confirmed.',
            expenseId: expense.id,
        },
        create: {
            id: 'tourbiller-demo-trip-activity',
            companyId: company.id,
            bookingId: booking.id,
            driverId: driver.id,
            type: 'NOTE',
            note: 'Demo trip activity: customer pickup confirmed.',
            expenseId: expense.id,
        },
    });

    await prisma.passwordResetToken.upsert({
        where: { token: 'tourbiller-demo-expired-reset-token' },
        update: { email: admin.email, expires: new Date(0) },
        create: { email: admin.email, token: 'tourbiller-demo-expired-reset-token', expires: new Date(0) },
    });

    console.log('Demo records are ready for TourBiller Demo Transport.');
    console.log(`Admin login: ${DEMO_ADMIN_EMAIL} / ${DEMO_PASSWORD}`);
    console.log(`Driver login: ${DEMO_DRIVER_EMAIL} / ${DEMO_PASSWORD}`);
    console.log(`Seeded records include bill ${bill.billNumber} and quotation ${quotation.quotationNumber}.`);
}

main()
    .catch((error) => {
        console.error('Seeding failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
