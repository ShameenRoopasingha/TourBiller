import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { DriverTourTabs } from '@/components/DriverTourTabs';

export const metadata = {
    title: 'My Active Tour - VIRGIL',
};

export default async function DriverActiveTourPage() {
    const authCheck = await requireAuth();

    if (!authCheck.authorized || authCheck.role !== 'DRIVER') {
        redirect('/');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Active booking
    const activeBooking = await prisma.booking.findFirst({
        where: {
            driverId: authCheck.userId,
            status: 'CONFIRMED',
            startDate: { lte: new Date() },
            OR: [
                { endDate: null },
                { endDate: { gte: today } }
            ]
        },
        orderBy: { startDate: 'desc' }
    });

    let assignedVehicle = null;
    if (activeBooking?.vehicleNo) {
        assignedVehicle = await prisma.vehicle.findUnique({
            where: { vehicleNo: activeBooking.vehicleNo },
            select: { model: true, category: true, seats: true, acType: true, currentMileage: true }
        });
    }

    // Upcoming bookings
    const upcomingBookings = await prisma.booking.findMany({
        where: {
            driverId: authCheck.userId,
            status: 'CONFIRMED',
            startDate: { gt: new Date() }
        },
        orderBy: { startDate: 'asc' },
        take: 20,
    });

    // Completed bookings
    const completedBookings = await prisma.booking.findMany({
        where: {
            driverId: authCheck.userId,
            status: 'COMPLETED',
        },
        orderBy: { startDate: 'desc' },
        take: 20,
    });

    // Serialize dates
    const serializeBooking = (b: typeof activeBooking) => b ? ({
        id: b.id,
        vehicleNo: b.vehicleNo,
        customerName: b.customerName,
        destination: b.destination || null,
        startDate: b.startDate.toISOString(),
        endDate: b.endDate?.toISOString() || null,
        status: b.status,
        notes: b.notes || null,
    }) : null;

    return (
        <div className="max-w-lg mx-auto px-1 py-4">
            <DriverTourTabs
                activeBooking={serializeBooking(activeBooking)}
                vehicle={assignedVehicle}
                upcomingBookings={upcomingBookings.map(b => serializeBooking(b)!)}
                completedBookings={completedBookings.map(b => serializeBooking(b)!)}
            />
        </div>
    );
}
