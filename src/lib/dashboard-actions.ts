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

        console.log('[Dashboard] Diagnostic: Running single query (count)...');
        const startTime = Date.now();

        const totalVehicles = await prisma.vehicle.count({ where: { status: 'ACTIVE' } });

        console.log(`[Dashboard] Diagnostic: Query finished in ${Date.now() - startTime}ms`);

        return {
            success: true,
            data: {
                totalVehicles,
                occupiedVehicles: 0,
                availableVehicles: totalVehicles,
                revenueYearly: 0,
                revenueWeekly: 0,
                revenueToday: 0,
                recentBills: [],
                ongoingBookings: [],
            }
        };

    } catch (error) {
        console.error('[Dashboard] Diagnostic Critical Error:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Diagnostic failed'
        };
    }
}
