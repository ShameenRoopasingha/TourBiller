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
        console.log('[Dashboard] Starting parallel queries...');
        const startTime = Date.now();

        // Run queries with individual error catching so one failure doesn't hang the whole dashboard
        const [
            totalVehicles,
            occupiedVehicles,
            yearlyResult,
            weeklyResult,
            todayResult,
            recentBills,
            ongoingBookings
        ] = await Promise.all([
            prisma.vehicle.count({ where: { status: 'ACTIVE' } }).catch(e => { console.error('Error totalVehicles:', e); return 0; }),
            prisma.booking.count({ where: ongoingBookingFilter }).catch(e => { console.error('Error occupiedVehicles:', e); return 0; }),
            prisma.bill.aggregate({
                _sum: { totalAmount: true },
                where: { createdAt: { gte: startOfYear, lte: endOfYear } }
            }).catch(e => { console.error('Error yearlyResult:', e); return { _sum: { totalAmount: 0 } }; }),
            prisma.bill.aggregate({
                _sum: { totalAmount: true },
                where: { createdAt: { gte: startOfWeek, lte: endOfWeek } }
            }).catch(e => { console.error('Error weeklyResult:', e); return { _sum: { totalAmount: 0 } }; }),
            prisma.bill.aggregate({
                _sum: { totalAmount: true },
                where: { createdAt: { gte: startOfToday, lte: endOfToday } }
            }).catch(e => { console.error('Error todayResult:', e); return { _sum: { totalAmount: 0 } }; }),
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
            }).catch(e => { console.error('Error recentBills:', e); return []; }),
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
            }).catch(e => { console.error('Error ongoingBookings:', e); return []; }),
        ]);

        console.log(`[Dashboard] All queries finished in ${Date.now() - startTime}ms`);

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
        console.error('[Dashboard] Critical Error:', error);
        return { success: false, error: 'Failed to fetch dashboard stats' };
    }
}
