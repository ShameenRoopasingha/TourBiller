'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';
import { unstable_noStore as noStore } from 'next/cache';

export async function getDashboardStats() {
    noStore();
    try {
        const authCheck = await requireAuth();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }
        const companyId = authCheck.companyId;

        const now = new Date();
        const currentYear = now.getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const ongoingBookingFilter = {
            companyId,
            status: { in: ['CONFIRMED', 'ONGOING'] as string[] },
            startDate: { lte: now },
            OR: [
                { endDate: { gte: now } },
                { endDate: null }
            ]
        };

        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        const startTime = Date.now();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const dayAfterTomorrow = new Date(todayStart);
        dayAfterTomorrow.setDate(todayStart.getDate() + 2);
        const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

        // Run ALL queries simultaneously. Prisma's internal pool will pipeline them across the 2 connections optimally.
        // This eliminates the network round-trip delays between batches.
        const [
            allVehicles,
            ongoingBookingsAll,
            yearlyResult,
            weeklyResult,
            todayResult,
            recentBills,
            relevantTours,
            recentExpenses
        ] = await Promise.all([
            // 1. All vehicles
            prisma.vehicle.findMany({
                where: { companyId, status: 'ACTIVE' },
                select: {
                    id: true, vehicleNo: true, currentMileage: true,
                    oilChangeInterval: true, lastOilChangeMileage: true,
                    filterChangeInterval: true, lastFilterChangeMileage: true,
                    washInterval: true, lastWashMileage: true,
                    insuranceExpiry: true, revenueLicenseExpiry: true,
                }
            }).catch(() => []),
            // 2. Ongoing bookings (unlimited, for both the UI and calculating occupied vehicles)
            prisma.booking.findMany({
                where: ongoingBookingFilter,
                orderBy: { startDate: 'asc' },
                select: {
                    id: true, vehicleNo: true, customerName: true,
                    startDate: true, endDate: true, destination: true, status: true,
                },
            }).catch(() => []),
            // 3. Yearly revenue
            prisma.bill.aggregate({
                _sum: { totalAmount: true },
                where: { companyId, createdAt: { gte: startOfYear, lte: endOfYear } }
            }).catch(() => ({ _sum: { totalAmount: 0 } })),
            // 4. Weekly revenue
            prisma.bill.aggregate({
                _sum: { totalAmount: true },
                where: { companyId, createdAt: { gte: startOfWeek, lte: endOfWeek } }
            }).catch(() => ({ _sum: { totalAmount: 0 } })),
            // 5. Today's revenue
            prisma.bill.aggregate({
                _sum: { totalAmount: true },
                where: { companyId, createdAt: { gte: startOfToday, lte: endOfToday } }
            }).catch(() => ({ _sum: { totalAmount: 0 } })),
            // 6. Recent bills
            prisma.bill.findMany({
                where: { companyId },
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true, billNumber: true, customerName: true, vehicleNo: true,
                    totalAmount: true, createdAt: true, route: true, startDate: true, endDate: true,
                },
            }).catch(() => []),
            // 7. Relevant tours (for alerts)
            prisma.booking.findMany({
                where: {
                    companyId,
                    OR: [
                        { status: 'COMPLETED' },
                        { status: 'CONFIRMED', startDate: { gte: todayStart, lt: dayAfterTomorrow } },
                    ],
                },
                select: { id: true, vehicleNo: true, customerName: true, startDate: true, status: true },
            }).catch(() => []),
            // 8. Recent expenses
            prisma.vehicleExpense.findMany({
                where: { companyId, createdAt: { gte: twoDaysAgo } },
                select: { id: true, vehicleNo: true, amount: true, category: true }
            }).catch(() => []),
        ]);

        // In-memory calculations
        const totalVehicles = allVehicles.length;
        const activeVehicleNos = Array.from(new Set(ongoingBookingsAll.map(b => b.vehicleNo)));
        const occupiedVehicles = allVehicles.filter(v => activeVehicleNos.includes(v.vehicleNo)).length;
        const ongoingBookings = ongoingBookingsAll.slice(0, 5); // Take top 5 for UI
        
        // Process maintenance alerts (in-memory, no DB)
        const maintenanceAlerts = allVehicles.filter(v =>
            (v.currentMileage - v.lastOilChangeMileage >= v.oilChangeInterval - 100) ||
            (v.currentMileage - v.lastFilterChangeMileage >= v.filterChangeInterval - 100) ||
            (v.currentMileage - v.lastWashMileage >= v.washInterval) ||
            (v.insuranceExpiry && (v.insuranceExpiry.getTime() - now.getTime()) / (1000 * 3600 * 24) <= 30) ||
            (v.revenueLicenseExpiry && (v.revenueLicenseExpiry.getTime() - now.getTime()) / (1000 * 3600 * 24) <= 30)
        ).map(v => {
            const alerts = [];
            if (v.currentMileage - v.lastOilChangeMileage >= v.oilChangeInterval - 100) alerts.push('Oil Change');
            if (v.currentMileage - v.lastFilterChangeMileage >= v.filterChangeInterval - 100) alerts.push('Filter Change');
            if (v.currentMileage - v.lastWashMileage >= v.washInterval) alerts.push('Wash');
            if (v.insuranceExpiry && (v.insuranceExpiry.getTime() - now.getTime()) / (1000 * 3600 * 24) <= 30) alerts.push('Insurance Expiring');
            if (v.revenueLicenseExpiry && (v.revenueLicenseExpiry.getTime() - now.getTime()) / (1000 * 3600 * 24) <= 30) alerts.push('License Expiring');
            return {
                id: `maint-${v.vehicleNo}`,
                entityId: v.id,
                title: v.vehicleNo,
                message: `Maintenance needed: ${alerts.join(", ")}`,
                type: 'MAINTENANCE'
            };
        });

        // Process alerts (in-memory, no DB)
        const billingAlerts = relevantTours.filter(t => t.status === 'COMPLETED').map(t => ({
            id: `bill-${t.id}`, title: t.vehicleNo,
            message: `Trip ended for ${t.customerName}. Bill needs to be generated.`, type: 'BILLING'
        }));

        const upcomingAlerts = relevantTours.filter(t => t.status === 'CONFIRMED').map(t => ({
            id: `upcoming-${t.id}`, title: t.vehicleNo,
            message: `Tour for ${t.customerName} starts ${t.startDate.getDate() === now.getDate() ? 'TODAY' : 'TOMORROW'}.`,
            type: 'TOUR'
        }));

        const expenseAlerts = recentExpenses.map(e => ({
            id: `exp-${e.id}`, title: e.vehicleNo,
            message: `New expense logged: Rs.${e.amount} for ${e.category}.`, type: 'EXPENSE'
        }));

        console.log(`[Dashboard] All queries finished in ${Date.now() - startTime}ms (6 batches)`);

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
                maintenanceAlerts: [...maintenanceAlerts, ...billingAlerts, ...upcomingAlerts, ...expenseAlerts],
            }
        };

    } catch (error: unknown) {
        console.error('[Dashboard] Critical Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats' };
    }
}
