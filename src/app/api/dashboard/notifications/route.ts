import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
    try {
        const authCheck = await requireAuth();
        if (!authCheck.authorized) {
            return NextResponse.json({ success: false, error: authCheck.error }, { status: 401 });
        }

        const now = new Date();
        const companyId = authCheck.companyId;
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const dayAfterTomorrow = new Date(todayStart);
        dayAfterTomorrow.setDate(todayStart.getDate() + 2);
        const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

        const [vehicles, pendingTours] = await Promise.all([
            prisma.vehicle.findMany({
                where: { companyId, status: 'ACTIVE' },
                select: {
                    id: true,
                    vehicleNo: true,
                    currentMileage: true,
                    oilChangeInterval: true,
                    lastOilChangeMileage: true,
                    filterChangeInterval: true,
                    lastFilterChangeMileage: true,
                    washInterval: true,
                    lastWashMileage: true,
                    insuranceExpiry: true,
                    revenueLicenseExpiry: true,
                },
            }),
            prisma.booking.findMany({
                where: { companyId, status: 'COMPLETED' },
                select: { id: true, vehicleNo: true, customerName: true },
            }),
        ]);

        const [upcomingTours, recentExpenses] = await Promise.all([
            prisma.booking.findMany({
                where: { companyId, status: 'CONFIRMED', startDate: { gte: todayStart, lt: dayAfterTomorrow } },
                select: { id: true, vehicleNo: true, customerName: true, startDate: true },
            }),
            prisma.vehicleExpense.findMany({
                where: { companyId, createdAt: { gte: twoDaysAgo } },
                select: { id: true, vehicleNo: true, amount: true, category: true },
            }),
        ]);

        const maintenanceAlerts = vehicles.flatMap((vehicle) => {
            const alerts = [];
            if (vehicle.currentMileage - vehicle.lastOilChangeMileage >= vehicle.oilChangeInterval - 100) alerts.push('Oil Change');
            if (vehicle.currentMileage - vehicle.lastFilterChangeMileage >= vehicle.filterChangeInterval - 100) alerts.push('Filter Change');
            if (vehicle.currentMileage - vehicle.lastWashMileage >= vehicle.washInterval) alerts.push('Wash');
            if (vehicle.insuranceExpiry && (vehicle.insuranceExpiry.getTime() - now.getTime()) / 86_400_000 <= 30) alerts.push('Insurance Expiring');
            if (vehicle.revenueLicenseExpiry && (vehicle.revenueLicenseExpiry.getTime() - now.getTime()) / 86_400_000 <= 30) alerts.push('License Expiring');
            return alerts.length ? [{
                id: `maint-${vehicle.vehicleNo}`,
                entityId: vehicle.id,
                title: vehicle.vehicleNo,
                message: `Maintenance needed: ${alerts.join(', ')}`,
                type: 'MAINTENANCE',
            }] : [];
        });

        const billingAlerts = pendingTours.map((tour) => ({
            id: `bill-${tour.id}`,
            title: tour.vehicleNo,
            message: `Trip ended for ${tour.customerName}. Bill needs to be generated.`,
            type: 'BILLING',
        }));
        const upcomingAlerts = upcomingTours.map((tour) => ({
            id: `upcoming-${tour.id}`,
            title: tour.vehicleNo,
            message: `Tour for ${tour.customerName} starts ${tour.startDate.toDateString() === now.toDateString() ? 'TODAY' : 'TOMORROW'}.`,
            type: 'TOUR',
        }));
        const expenseAlerts = recentExpenses.map((expense) => ({
            id: `exp-${expense.id}`,
            title: expense.vehicleNo,
            message: `New expense logged: Rs.${expense.amount} for ${expense.category}.`,
            type: 'EXPENSE',
        }));

        return NextResponse.json({ success: true, data: { maintenanceAlerts: [...maintenanceAlerts, ...billingAlerts, ...upcomingAlerts, ...expenseAlerts] } });
    } catch (error) {
        console.error('API error fetching notifications:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch notifications' }, { status: 500 });
    }
}