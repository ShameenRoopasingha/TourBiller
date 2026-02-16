import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const tours = [
    {
        name: 'Cultural Triangle Explorer',
        description: 'Discover Sri Lanka\'s ancient kingdoms — Kandy, Sigiriya, Dambulla, and Polonnaruwa. A heritage-rich journey through UNESCO World Heritage sites.',
        days: 5,
        vehicleCategory: 'SUV',
        basePricePerPerson: 45000,
        items: [
            { dayNumber: 1, title: 'Colombo → Kandy', description: 'Airport pickup, drive to Kandy via Pinnawala Elephant Orphanage. Visit Temple of the Tooth.', distanceKm: 120, accommodation: 8000, meals: 3000, activities: 2500, otherCosts: 500 },
            { dayNumber: 2, title: 'Kandy → Dambulla', description: 'Morning visit to Royal Botanical Gardens, Peradeniya. Drive to Dambulla Cave Temple. Spice garden en route.', distanceKm: 75, accommodation: 6000, meals: 2500, activities: 2000, otherCosts: 300 },
            { dayNumber: 3, title: 'Dambulla → Sigiriya → Polonnaruwa', description: 'Climb Sigiriya Lion Rock at sunrise. Afternoon explore Polonnaruwa ancient city ruins.', distanceKm: 80, accommodation: 6000, meals: 2500, activities: 5000, otherCosts: 500 },
            { dayNumber: 4, title: 'Polonnaruwa → Minneriya → Habarana', description: 'Jeep safari at Minneriya National Park (elephant gathering). Village tour by tuk-tuk.', distanceKm: 45, accommodation: 7000, meals: 3000, activities: 6000, otherCosts: 1000 },
            { dayNumber: 5, title: 'Habarana → Colombo', description: 'Breakfast and return drive to Colombo. Drop-off at airport or hotel.', distanceKm: 180, accommodation: 0, meals: 1500, activities: 0, otherCosts: 0 },
        ],
    },
    {
        name: 'Southern Coast & Wildlife',
        description: 'Sun, surf, and safari along Sri Lanka\'s stunning southern coastline — Bentota, Galle Fort, Mirissa whale watching, and Yala National Park.',
        days: 4,
        vehicleCategory: 'Van',
        basePricePerPerson: 38000,
        items: [
            { dayNumber: 1, title: 'Colombo → Bentota', description: 'Drive along the coast. Bentota river safari, turtle hatchery visit. Evening at beach resort.', distanceKm: 95, accommodation: 9000, meals: 3500, activities: 3000, otherCosts: 500 },
            { dayNumber: 2, title: 'Bentota → Galle', description: 'Explore Galle Dutch Fort (UNESCO). Walking tour through cobblestone streets, lighthouse, and local cafés.', distanceKm: 55, accommodation: 8000, meals: 3000, activities: 1500, otherCosts: 300 },
            { dayNumber: 3, title: 'Galle → Mirissa → Tissamaharama', description: 'Early morning whale watching in Mirissa. Drive east to Tissa for Yala safari prep.', distanceKm: 140, accommodation: 7000, meals: 3000, activities: 8000, otherCosts: 500 },
            { dayNumber: 4, title: 'Yala Safari → Colombo', description: 'Dawn jeep safari at Yala National Park (leopards, elephants, crocodiles). Return to Colombo.', distanceKm: 270, accommodation: 0, meals: 2000, activities: 7000, otherCosts: 0 },
        ],
    },
    {
        name: 'Hill Country Tea Trail',
        description: 'Misty mountains, waterfalls, and tea plantations — Nuwara Eliya, Ella, and the iconic train ride through Sri Lanka\'s breathtaking hill country.',
        days: 4,
        vehicleCategory: 'SUV',
        basePricePerPerson: 35000,
        items: [
            { dayNumber: 1, title: 'Colombo → Nuwara Eliya', description: 'Scenic drive through tea country. Visit a tea factory in Ramboda. Stop at Ramboda Falls.', distanceKm: 180, accommodation: 8500, meals: 3000, activities: 1500, otherCosts: 500 },
            { dayNumber: 2, title: 'Nuwara Eliya Sightseeing', description: 'Horton Plains & World\'s End hike. Gregory Lake boating. Strawberry farm visit.', distanceKm: 40, accommodation: 8500, meals: 3000, activities: 3500, otherCosts: 500 },
            { dayNumber: 3, title: 'Nuwara Eliya → Ella (Train)', description: 'Iconic blue train ride through tea estates and Nine Arch Bridge. Evening at Ella rock viewpoint.', distanceKm: 60, accommodation: 6000, meals: 2500, activities: 2000, otherCosts: 1500 },
            { dayNumber: 4, title: 'Ella → Colombo', description: 'Visit Ravana Falls and Ravana Cave. Drive back to Colombo via Wellawaya.', distanceKm: 230, accommodation: 0, meals: 2000, activities: 1000, otherCosts: 0 },
        ],
    },
];

async function seed() {
    for (const tour of tours) {
        const { items, ...scheduleData } = tour;
        const created = await prisma.tourSchedule.create({
            data: {
                ...scheduleData,
                items: {
                    create: items,
                },
            },
            include: { items: true },
        });
        console.log(`✅ Created: ${created.name} (${created.items.length} days, ID: ${created.id})`);
    }
    console.log('\nDone! 🎉');
    await prisma.$disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
