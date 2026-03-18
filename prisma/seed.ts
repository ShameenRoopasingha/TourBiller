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

    // Create Tour Schedules
    console.log('Creating tour schedules...');

    // Create Vehicles
    console.log('Creating vehicles...');
    const vehicles = [
        {
            vehicleNo: 'CAS-1234',
            model: 'Toyota Prius',
            category: 'CAR',
            ratePerDay: 5000,
            kmPerDay: 100,
            excessKmRate: 60,
            extraHourRate: 400,
            seats: 4,
            acType: 'Dual AC',
            features: 'Bluetooth, Touch Screen, Reclining Seats',
            insuranceCoverage: 'Full Comprehensive - Rs. 500,000 per passenger',
        },
        {
            vehicleNo: 'WP-VAN-5678',
            model: 'Toyota KDH',
            category: 'VAN',
            ratePerDay: 8000,
            kmPerDay: 100,
            excessKmRate: 80,
            extraHourRate: 600,
            seats: 14,
            acType: 'Line AC',
            features: 'Adjustable Seats, DVD/Audio System, Luggage Space',
            insuranceCoverage: 'Full Comprehensive - Rs. 500,000 per passenger',
        },
        {
            vehicleNo: 'SUV-9012',
            model: 'Mitsubishi Montero',
            category: 'SUV',
            ratePerDay: 15000,
            kmPerDay: 100,
            excessKmRate: 120,
            extraHourRate: 1000,
            seats: 7,
            acType: 'Dual AC',
            features: '4WD, Leather Interior, Panoramic Sunroof, Premium Sound',
            insuranceCoverage: 'Full Comprehensive - Rs. 1,000,000 per passenger',
        }
    ];

    for (const vehicle of vehicles) {
        await prisma.vehicle.upsert({
            where: { vehicleNo: vehicle.vehicleNo },
            update: {},
            create: vehicle,
        });
    }

    const tourSchedules = [
        {
            name: 'Cultural Triangle Tour',
            description: 'Explore the ancient cities and cultural heritage of Sri Lanka.',
            days: 5,
            vehicleCategory: 'VAN',
            excessKmRate: 80,
            extraHourRate: 500,
            items: {
                create: [
                    { dayNumber: 1, title: 'Arrival & Colombo', distanceKm: 40, accommodation: 8000, meals: 3500, activities: 2000, otherCosts: 1000 },
                    { dayNumber: 2, title: 'Colombo to Sigiriya (Via Dambulla)', distanceKm: 175, accommodation: 12000, meals: 4000, activities: 5500, otherCosts: 1500 },
                    { dayNumber: 3, title: 'Sigiriya to Polonnaruwa & Back', distanceKm: 110, accommodation: 12000, meals: 4000, activities: 6500, otherCosts: 1500 },
                    { dayNumber: 4, title: 'Sigiriya to Kandy', distanceKm: 95, accommodation: 10000, meals: 3500, activities: 3500, otherCosts: 1000 },
                    { dayNumber: 5, title: 'Kandy to Airport', distanceKm: 120, accommodation: 0, meals: 2500, activities: 1500, otherCosts: 1000 },
                ]
            }
        },
        {
            name: 'Emerald Highlands',
            description: 'Journey through tea estates, waterfalls, and misty mountains.',
            days: 4,
            vehicleCategory: 'CAR',
            excessKmRate: 70,
            extraHourRate: 400,
            items: {
                create: [
                    { dayNumber: 1, title: 'Kandy City Tour', distanceKm: 30, accommodation: 9000, meals: 3000, activities: 2500, otherCosts: 500 },
                    { dayNumber: 2, title: 'Kandy to Nuwara Eliya', distanceKm: 80, accommodation: 15000, meals: 4500, activities: 3000, otherCosts: 1000 },
                    { dayNumber: 3, title: 'Nuwara Eliya to Ella', distanceKm: 60, accommodation: 11000, meals: 4000, activities: 4500, otherCosts: 1000 },
                    { dayNumber: 4, title: 'Ella to Kandy/Colombo', distanceKm: 210, accommodation: 0, meals: 3500, activities: 1500, otherCosts: 1000 },
                ]
            }
        },
        {
            name: 'Southern Coast Relaxation',
            description: 'Sun, sand, and serenity along the pristine southern beaches.',
            days: 3,
            vehicleCategory: 'CAR',
            excessKmRate: 70,
            extraHourRate: 400,
            items: {
                create: [
                    { dayNumber: 1, title: 'Colombo to Galle Fort', distanceKm: 130, accommodation: 15000, meals: 5000, activities: 3000, otherCosts: 1000 },
                    { dayNumber: 2, title: 'Galle to Mirissa & Whale Watching', distanceKm: 45, accommodation: 15000, meals: 5000, activities: 8000, otherCosts: 2000 },
                    { dayNumber: 3, title: 'Mirissa to Colombo (Via Bentota)', distanceKm: 160, accommodation: 0, meals: 4000, activities: 3500, otherCosts: 1000 },
                ]
            }
        },
        {
            name: 'Wildlife & Nature Safari',
            description: 'Discover the exotic wildlife of Yala and Udawalawe national parks.',
            days: 3,
            vehicleCategory: 'SUV',
            excessKmRate: 100,
            extraHourRate: 600,
            items: {
                create: [
                    { dayNumber: 1, title: 'Colombo to Udawalawe', distanceKm: 180, accommodation: 10000, meals: 3000, activities: 1500, otherCosts: 1000 },
                    { dayNumber: 2, title: 'Udawalawe to Yala Safari', distanceKm: 90, accommodation: 18000, meals: 5000, activities: 12000, otherCosts: 3000 },
                    { dayNumber: 3, title: 'Yala to Colombo/Airport', distanceKm: 260, accommodation: 0, meals: 4000, activities: 2000, otherCosts: 1000 },
                ]
            }
        }
    ];

    for (const schedule of tourSchedules) {
        const existing = await prisma.tourSchedule.findFirst({
            where: { name: schedule.name }
        });

        if (existing) {
            // Delete existing items to ensure clean state for seed update
            await prisma.tourScheduleDayItem.deleteMany({
                where: { tourScheduleId: existing.id }
            });
            
            await prisma.tourSchedule.update({
                where: { id: existing.id },
                data: {
                    ...schedule,
                    items: schedule.items
                }
            });
            console.log(`Updated tour: ${schedule.name}`);
        } else {
            await prisma.tourSchedule.create({
                data: schedule,
            });
            console.log(`Created tour: ${schedule.name}`);
        }
    }

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
