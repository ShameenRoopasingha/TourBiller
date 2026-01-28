'use server';

import { prisma } from '@/lib/prisma';


export async function getDashboardStats() {
    try {
        // 1. Vehicle Counts
        const totalVehicles = await prisma.vehicle.count({
            where: { status: 'ACTIVE' }
        });

        // 2. Active Bookings (Occupied Vehicles)
        // Check for bookings that overlap with NOW
        const now = new Date();
        const occupiedVehicles = await prisma.booking.count({
            where: {
                status: 'CONFIRMED',
                startDate: { lte: now },
                OR: [
                    { endDate: { gte: now } }, // End date is in future
                    { endDate: null }          // Or ongoing (no end date)
                ]
            }
        });

        const availableVehicles = Math.max(0, totalVehicles - occupiedVehicles);

        // 3. Revenue Calculations
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

        // Weekly (Start of week - Monday)
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay(); // 0 (Sun) - 6 (Sat)
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const [yearlyResult, weeklyResult] = await Promise.all([
            prisma.bill.aggregate({
                _sum: { totalAmount: true },
                where: { createdAt: { gte: startOfYear, lte: endOfYear } }
            }),
            prisma.bill.aggregate({
                _sum: { totalAmount: true },
                where: { createdAt: { gte: startOfWeek, lte: endOfWeek } }
            })
        ]);

        // 4. Recent Bills
        const recentBills = await prisma.bill.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
        });

        return {
            success: true,
            data: {
                totalVehicles,
                occupiedVehicles,
                availableVehicles,
                revenueYearly: yearlyResult._sum.totalAmount || 0,
                revenueWeekly: weeklyResult._sum.totalAmount || 0,
                revenueToday: yearlyResult._sum.totalAmount || 0, // Legacy support to prevent break
                recentBills,
                ongoingBookings: await prisma.booking.findMany({
                    where: {
                        status: 'CONFIRMED',
                        startDate: { lte: now },
                        OR: [
                            { endDate: { gte: now } },
                            { endDate: null }
                        ]
                    },
                    orderBy: { startDate: 'asc' },
                    take: 5
                })
            }
        };

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return { success: false, error: 'Failed to fetch dashboard stats' };
    }
}
