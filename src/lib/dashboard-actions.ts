'use server';

import { prisma } from '@/lib/prisma';


export async function getDashboardStats() {
    try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

        // Weekly (Start of week - Monday)
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Common booking filter for "ongoing"
        const ongoingBookingFilter = {
            status: 'CONFIRMED' as const,
            startDate: { lte: now },
            OR: [
                { endDate: { gte: now } },
                { endDate: null }
            ]
        };

        // Calculate "Today" for revenue
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        // Run ALL queries in parallel to speed up dashboard loading
        // Removed prisma.$transaction as it's not needed for reads and can cause connection pooler issues
        const [
            totalVehicles,
            occupiedVehicles,
            yearlyResult,
            weeklyResult,
            todayResult,
            recentBills,
            ongoingBookings
        ] = await Promise.all([
            prisma.vehicle.count({ where: { status: 'ACTIVE' } }),
            prisma.booking.count({ where: ongoingBookingFilter }),
            prisma.bill.aggregate({
                _sum: { totalAmount: true },
                where: { createdAt: { gte: startOfYear, lte: endOfYear } }
            }),
            prisma.bill.aggregate({
                _sum: { totalAmount: true },
                where: { createdAt: { gte: startOfWeek, lte: endOfWeek } }
            }),
            prisma.bill.aggregate({
                _sum: { totalAmount: true },
                where: { createdAt: { gte: startOfToday, lte: endOfToday } }
            }),
            prisma.bill.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    billNumber: true,
                    customerName: true,
                    vehicleNo: true,
                    totalAmount: true,
                    createdAt: true,
                    route: true,
                    startDate: true,
                    endDate: true,
                },
            }),
            prisma.booking.findMany({
                where: ongoingBookingFilter,
                orderBy: { startDate: 'asc' },
                take: 5,
                select: {
                    id: true,
                    vehicleNo: true,
                    customerName: true,
                    startDate: true,
                    endDate: true,
                    destination: true,
                    status: true,
                },
            }),
        ]);

        return {
            success: true,
            data: {
                totalVehicles,
                occupiedVehicles,
                availableVehicles: Math.max(0, totalVehicles - occupiedVehicles),
                revenueYearly: yearlyResult._sum.totalAmount || 0,
                revenueWeekly: weeklyResult._sum.totalAmount || 0,
                revenueToday: todayResult._sum.totalAmount || 0,
                recentBills,
                ongoingBookings,
            }
        };

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return { success: false, error: 'Failed to fetch dashboard stats' };
    }
}
