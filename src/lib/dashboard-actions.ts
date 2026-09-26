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
            companyId,
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
        console.log('[Dashboard] Starting sequential queries for stability...');
        const startTime = Date.now();

        // Run queries sequentially instead of parallel to save connections on 5432 port
        const totalVehicles = await prisma.vehicle.count({ where: { companyId, status: 'ACTIVE' } }).catch(e => { console.error('Error totalVehicles:', e); return 0; });
        const occupiedVehicles = await prisma.booking.count({ where: ongoingBookingFilter }).catch(e => { console.error('Error occupiedVehicles:', e); return 0; });
        
        const yearlyResult = await prisma.bill.aggregate({
            _sum: { totalAmount: true },
            where: { companyId, createdAt: { gte: startOfYear, lte: endOfYear } }
        }).catch(e => { console.error('Error yearlyResult:', e); return { _sum: { totalAmount: 0 } }; });
        
        const weeklyResult = await prisma.bill.aggregate({
            _sum: { totalAmount: true },
            where: { companyId, createdAt: { gte: startOfWeek, lte: endOfWeek } }
        }).catch(e => { console.error('Error weeklyResult:', e); return { _sum: { totalAmount: 0 } }; });
        
        const todayResult = await prisma.bill.aggregate({
            _sum: { totalAmount: true },
            where: { companyId, createdAt: { gte: startOfToday, lte: endOfToday } }
        }).catch(e => { console.error('Error todayResult:', e); return { _sum: { totalAmount: 0 } }; });
        
        const recentBills = await prisma.bill.findMany({
            where: { companyId },
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
        }).catch(e => { console.error('Error recentBills:', e); return []; });
        
        const allVehicles = await prisma.vehicle.findMany({ where: { companyId, status: 'ACTIVE' }, select: { vehicleNo: true, currentMileage: true, oilChangeInterval: true, lastOilChangeMileage: true, filterChangeInterval: true, lastFilterChangeMileage: true, washInterval: true, lastWashMileage: true, insuranceExpiry: true, revenueLicenseExpiry: true } }).catch(() => []);

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
                title: v.vehicleNo, 
                message: `Maintenance needed: ${alerts.join(", ")}`,
                type: 'MAINTENANCE' 
            };
        });

        const pendingTours = await prisma.booking.findMany({
            where: { companyId, status: 'COMPLETED' },
            select: { id: true, vehicleNo: true, customerName: true }
        }).catch(() => []);

        const billingAlerts = pendingTours.map(t => ({
            id: `bill-${t.id}`,
            title: t.vehicleNo,
            message: `Trip ended for ${t.customerName}. Bill needs to be generated.`,
            type: 'BILLING'
        }));

        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const dayAfterTomorrow = new Date(todayStart);
        dayAfterTomorrow.setDate(todayStart.getDate() + 2);

        const upcomingTours = await prisma.booking.findMany({
            where: { 
                companyId, 
                status: 'CONFIRMED',
                startDate: {
                    gte: todayStart,
                    lt: dayAfterTomorrow
                }
            },
            select: { id: true, vehicleNo: true, customerName: true, startDate: true }
        }).catch(() => []);

        const upcomingAlerts = upcomingTours.map(t => {
            const isToday = t.startDate.getDate() === now.getDate();
            return {
                id: `upcoming-${t.id}`,
                title: t.vehicleNo,
                message: `Tour for ${t.customerName} starts ${isToday ? 'TODAY' : 'TOMORROW'}.`,
                type: 'TOUR'
            };
        });

        const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        const recentExpenses = await prisma.vehicleExpense.findMany({
            where: {
                companyId,
                createdAt: { gte: twoDaysAgo }
            },
            select: { id: true, vehicleNo: true, amount: true, category: true }
        }).catch(() => []);

        const expenseAlerts = recentExpenses.map(e => ({
            id: `exp-${e.id}`,
            title: e.vehicleNo,
            message: `New expense logged: Rs.${e.amount} for ${e.category}.`,
            type: 'EXPENSE'
        }));

        const allNotifications = [...maintenanceAlerts, ...billingAlerts, ...upcomingAlerts, ...expenseAlerts];

        const ongoingBookings = await prisma.booking.findMany({
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
        }).catch(e => { console.error('Error ongoingBookings:', e); return []; });

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
                maintenanceAlerts: allNotifications,
            }
        };

    } catch (error) {
        console.error('[Dashboard] Critical Error:', error);
        return { success: false, error: 'Failed to fetch dashboard stats' };
    }
}
