import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Seeding sample tour bill with extra days and hours...');

    // 1. Ensure a customer exists
    const customer = await prisma.customer.upsert({
        where: { id: 'test-customer-id' },
        update: {},
        create: {
            id: 'test-customer-id',
            name: 'Test Customer',
            mobile: '0771234567',
            address: '123, Sample Road, Colombo',
        },
    });

    // 2. Ensure a vehicle exists
    const vehicle = await prisma.vehicle.upsert({
        where: { vehicleNo: 'WP GA-1234' },
        update: {},
        create: {
            vehicleNo: 'WP GA-1234',
            model: 'Toyota Prius',
            category: 'CAR',
            ratePerDay: 15000,
            kmPerDay: 100,
            excessKmRate: 80,
            extraHourRate: 500,
        },
    });

    // 3. Create a Tour Schedule (Route)
    const schedule = await prisma.tourSchedule.create({
        data: {
            name: '2-Day Kandy Tour (Sample)',
            days: 2,
            vehicleCategory: 'CAR',
            ratePerDay: 15000,
            kmPerDay: 100,
            excessKmRate: 80,
            extraHourRate: 500,
            waitingCharge: 1500,
            gatePass: 500,
            items: {
                create: [
                    { 
                        dayNumber: 1, 
                        title: 'Colombo to Kandy', 
                        distanceKm: 120,
                        accommodation: 8000,
                        meals: 3000,
                        activities: 2000,
                        otherCosts: 500
                    },
                    { 
                        dayNumber: 2, 
                        title: 'Kandy to Colombo', 
                        distanceKm: 120,
                        accommodation: 4000,
                        meals: 2500,
                        activities: 1000,
                        otherCosts: 500
                    },
                ]
            }
        }
    });

    // 4. Create the Bill
    // 
    // Scenario: A 2-day Kandy tour that extended by 5 extra hours.
    // 
    // Duration: 2026-03-20 08:00 to 2026-03-22 13:00 = 53 hours total
    // Scheduled days: 2 (from tour schedule)
    // Extra Hours: 53 - (2 * 24) = 5 hours
    //
    // Mileage:
    //   Start: 50000, End: 50350, Distance: 350km
    //   Included Km: 100km/day * 2 days = 200km
    //   Extra Km: 350 - 200 = 150km
    //
    // Total Amount Calculation:
    //   - Package Charge: Rs. 15,000 (per-day rate × 2 days = 30,000 stored as packageCharge)
    //   - Excess km charge: 150 * 80 = Rs. 12,000
    //   - Extra hours charge: 5 * 500 = Rs. 2,500
    //   - Total: 30,000 + 12,000 + 2,500 = Rs. 44,500

    const startDate = new Date('2026-03-20T08:00:00');
    const endDate = new Date('2026-03-22T13:00:00');
    const startMeter = 50000;
    const endMeter = 50350;
    const hireRate = 80;        // Excess Km rate
    const allowedKm = 100;      // Per day
    const packageCharge = 30000; // 2 scheduled days * 15000
    const extraHours = 5;
    const extraHourRate = 500;
    const extraKm = 150;        // 350 total - (100 * 2 scheduled days)

    // Total = excessKm * hireRate + packageCharge + extraHours * extraHourRate
    const totalAmount = (extraKm * hireRate) + packageCharge + (extraHours * extraHourRate);

    const bill = await prisma.bill.create({
        data: {
            vehicleNo: vehicle.vehicleNo,
            customerName: customer.name,
            customerAddress: customer.address,
            route: '2-Day Kandy Tour (Sample)',
            startMeter,
            endMeter,
            hireRate,
            allowedKm,
            waitingCharge: 0,
            gatePass: 0,
            packageCharge,
            startDate,
            endDate,
            scheduledDays: 2,
            extraHours,
            extraHourRate,
            extraKm,
            accommodationCharge: 12000,
            mealsCharge: 5500,
            activitiesCharge: 3000,
            otherCostsCharge: 1000,
            totalAmount,
            currency: 'LKR',
            paymentMethod: 'CASH',
        },
    });

    console.log(`✅ Created Sample Bill: #${bill.billNumber} (ID: ${bill.id})`);
    console.log(`   Customer: ${bill.customerName}`);
    console.log(`   Route: ${bill.route}`);
    console.log(`   Scheduled Days: 2 | Extra Hours: ${bill.extraHours}`);
    console.log(`   Included Km: ${bill.allowedKm} × 2 = 200km`);
    console.log(`   Total Distance: ${endMeter - startMeter}km | Extra Km: ${bill.extraKm}`);
    console.log(`   Total Amount: Rs. ${bill.totalAmount.toLocaleString()}`);
    console.log(`     - Package:   Rs. ${packageCharge.toLocaleString()}`);
    console.log(`     - Excess Km: Rs. ${(extraKm * hireRate).toLocaleString()} (${extraKm}km × ${hireRate})`);
    console.log(`     - Extra Hrs: Rs. ${(extraHours * extraHourRate).toLocaleString()} (${extraHours}hrs × ${extraHourRate})`);

    console.log('\nDone! 🎉');
    await prisma.$disconnect();
}

seed().catch((e) => {
    console.error('❌ Error seeding bill:', e);
    process.exit(1);
});
