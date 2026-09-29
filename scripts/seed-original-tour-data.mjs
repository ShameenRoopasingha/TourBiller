import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const companyId = 'cmugcc63q0000m4lcq7b1jz86';

const plans = [
    {
        name: 'Colombo City Highlights',
        description: 'A full-day city tour of Colombo landmarks.',
        days: 1,
        vehicleNo: 'WP CAA-5678',
        category: 'CAR',
        rate: 14500,
        km: 100,
        seats: 4,
        items: [
            { dayNumber: 1, title: 'Colombo landmarks', description: 'Visit the Fort, Galle Face, and Independence Square.', distanceKm: 65, accommodation: 0, meals: 3500, activities: 2000, otherCosts: 500 },
        ],
    },
    {
        name: 'Kandy Heritage Weekend',
        description: 'A three-day cultural tour through Kandy.',
        days: 3,
        vehicleNo: 'WP CAA-9012',
        category: 'VAN',
        rate: 22000,
        km: 100,
        seats: 12,
        items: [
            { dayNumber: 1, title: 'Colombo to Kandy', description: 'Travel inland with a stop en route.', distanceKm: 125, accommodation: 12000, meals: 4500, activities: 2500, otherCosts: 500 },
            { dayNumber: 2, title: 'Kandy city', description: 'Explore the lake and temple district.', distanceKm: 45, accommodation: 12000, meals: 5000, activities: 3500, otherCosts: 750 },
            { dayNumber: 3, title: 'Return to Colombo', description: 'Return via the central province.', distanceKm: 125, accommodation: 0, meals: 3000, activities: 0, otherCosts: 500 },
        ],
    },
    {
        name: 'Southern Coast Escape',
        description: 'A two-day coastal getaway to Galle and Unawatuna.',
        days: 2,
        vehicleNo: 'WP KX-3456',
        category: 'SUV',
        rate: 19500,
        km: 120,
        seats: 7,
        items: [
            { dayNumber: 1, title: 'Colombo to Galle', description: 'Coastal drive and Galle Fort visit.', distanceKm: 130, accommodation: 14000, meals: 5000, activities: 3000, otherCosts: 750 },
            { dayNumber: 2, title: 'Unawatuna and return', description: 'Beach visit followed by return to Colombo.', distanceKm: 135, accommodation: 0, meals: 3500, activities: 1500, otherCosts: 500 },
        ],
    },
    {
        name: 'Sigiriya Cultural Circuit',
        description: 'A three-day heritage tour to Dambulla and Sigiriya.',
        days: 3,
        vehicleNo: 'WP CAB-7788',
        category: 'BUS',
        rate: 32000,
        km: 120,
        seats: 25,
        items: [
            { dayNumber: 1, title: 'Colombo to Dambulla', description: 'Travel to the cultural triangle.', distanceKm: 165, accommodation: 15000, meals: 5000, activities: 1500, otherCosts: 1000 },
            { dayNumber: 2, title: 'Sigiriya and surroundings', description: 'Explore Sigiriya and nearby attractions.', distanceKm: 55, accommodation: 15000, meals: 5500, activities: 4500, otherCosts: 1000 },
            { dayNumber: 3, title: 'Return to Colombo', description: 'Return after breakfast.', distanceKm: 165, accommodation: 0, meals: 3500, activities: 0, otherCosts: 750 },
        ],
    },
    {
        name: 'Nuwara Eliya Tea Country',
        description: 'A two-day highlands trip through tea country.',
        days: 2,
        vehicleNo: 'WP CAH-2468',
        category: 'CAR',
        rate: 11000,
        km: 90,
        seats: 4,
        items: [
            { dayNumber: 1, title: 'Colombo to Nuwara Eliya', description: 'Scenic drive through the hill country.', distanceKm: 175, accommodation: 13000, meals: 4500, activities: 2500, otherCosts: 750 },
            { dayNumber: 2, title: 'Tea country and return', description: 'Visit a tea estate and return to Colombo.', distanceKm: 175, accommodation: 0, meals: 3500, activities: 2000, otherCosts: 750 },
        ],
    },
];

const customers = [
    { name: 'Kamal Perera', email: 'kamal.perera@example.test', phone: '+94 77 100 2001' },
    { name: 'Nadeesha Silva', email: 'nadeesha.silva@example.test', phone: '+94 77 100 2002' },
    { name: 'Ruwan Jayasuriya', email: 'ruwan.jayasuriya@example.test', phone: '+94 77 100 2003' },
    { name: 'Sofia Martin', email: 'sofia.martin@example.test', phone: '+94 77 100 2004' },
    { name: 'Daniel Wong', email: 'daniel.wong@example.test', phone: '+94 77 100 2005' },
];

async function main() {
    const company = await prisma.businessProfile.findUnique({ where: { id: companyId } });
    if (!company) throw new Error(`Original company not found: ${companyId}`);

    const schedules = [];
    for (const [index, plan] of plans.entries()) {
        const schedule = await prisma.tourSchedule.upsert({
            where: { companyId_name: { companyId, name: plan.name } },
            update: {
                description: plan.description,
                days: plan.days,
                basePricePerPerson: 25000,
                vehicleCategory: plan.category,
                vehicleNo: plan.vehicleNo,
                ratePerDay: plan.rate,
                kmPerDay: plan.km,
                seats: plan.seats,
                excessKmRate: 120,
                extraHourRate: 900,
                waitingCharge: 1000,
                gatePass: 500,
                isActive: true,
            },
            create: {
                id: `original-tour-schedule-${String(index + 1).padStart(3, '0')}`,
                companyId,
                name: plan.name,
                description: plan.description,
                days: plan.days,
                basePricePerPerson: 25000,
                vehicleCategory: plan.category,
                vehicleNo: plan.vehicleNo,
                ratePerDay: plan.rate,
                kmPerDay: plan.km,
                seats: plan.seats,
                excessKmRate: 120,
                extraHourRate: 900,
                waitingCharge: 1000,
                gatePass: 500,
                isActive: true,
            },
        });

        await prisma.tourScheduleDayItem.deleteMany({ where: { tourScheduleId: schedule.id } });
        await prisma.tourScheduleDayItem.createMany({
            data: plan.items.map((item) => ({ ...item, tourScheduleId: schedule.id })),
        });
        schedules.push(schedule);
    }

    const now = new Date();
    for (const [index, plan] of plans.entries()) {
        const schedule = schedules[index];
        const customer = customers[index];
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() + 14 + index * 7);
        startDate.setHours(8, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + plan.days - 1);

        const totalDistance = plan.items.reduce((sum, item) => sum + item.distanceKm, 0);
        const accommodationTotal = plan.items.reduce((sum, item) => sum + item.accommodation, 0);
        const mealsTotal = plan.items.reduce((sum, item) => sum + item.meals, 0);
        const activitiesTotal = plan.items.reduce((sum, item) => sum + item.activities, 0);
        const otherCostsTotal = plan.items.reduce((sum, item) => sum + item.otherCosts, 0);
        const transportCost = plan.days * plan.rate;
        const subtotal = transportCost + accommodationTotal + mealsTotal + activitiesTotal + otherCostsTotal;
        const id = `original-tour-quotation-${String(index + 1).padStart(3, '0')}`;
        const quotationData = {
            companyId,
            tourScheduleId: schedule.id,
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            vehicleNo: plan.vehicleNo,
            numberOfPersons: 2,
            startDate,
            endDate,
            pickupLocation: 'Colombo',
            dropLocation: plan.name,
            hireRatePerDay: plan.rate,
            kmPerDay: plan.km,
            excessKmRate: 120,
            extraHourRate: 900,
            totalDistance,
            transportCost,
            accommodationTotal,
            mealsTotal,
            activitiesTotal,
            otherCostsTotal,
            markup: 10,
            discount: 0,
            driverCostPerDay: 3500,
            advanceAmount: 5000,
            totalAmount: subtotal * 1.1,
            notes: 'Sample quotation for the original Test Company account.',
            validUntil: new Date(startDate.getTime() - 7 * 86_400_000),
            status: 'DRAFT',
        };

        await prisma.quotation.upsert({
            where: { id },
            update: quotationData,
            create: { id, ...quotationData },
        });
    }

    console.log({
        company: company.companyName,
        schedulesAdded: plans.length,
        quotationsAdded: plans.length,
        scheduleCount: await prisma.tourSchedule.count({ where: { companyId } }),
        quotationCount: await prisma.quotation.count({ where: { companyId } }),
        itineraryItemCount: await prisma.tourScheduleDayItem.count({ where: { tourSchedule: { companyId } } }),
    });
}

main()
    .catch((error) => {
        console.error('Failed to seed original account tour data:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });