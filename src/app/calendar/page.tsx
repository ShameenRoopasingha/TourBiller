import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { VehicleCalendar } from './VehicleCalendar';

export const metadata = {
  title: 'Booking Calendar | TourBiller',
  description: 'Visual calendar of vehicle bookings',
};

export default async function CalendarPage() {
    const session = await auth();

    if (!session || !session.user || !session.user.email) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        redirect('/login');
    }

    const companyId = user.companyId;

    // Fetch active vehicles
    const vehicles = await prisma.vehicle.findMany({
        where: { companyId, status: 'ACTIVE' },
        select: { vehicleNo: true, category: true },
        orderBy: { vehicleNo: 'asc' }
    });

    // Fetch current and future bookings (or recently past ones for context)
    // We fetch a 3-month window for the calendar to render
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 1); // 1 month ago
    
    const bookings = await prisma.booking.findMany({
        where: { 
            companyId, 
            status: { not: 'CANCELLED' },
            startDate: { gte: threeMonthsAgo }
        },
        select: { 
            id: true, 
            vehicleNo: true, 
            customerName: true, 
            startDate: true, 
            endDate: true,
            status: true,
            destination: true
        },
        orderBy: { startDate: 'asc' }
    });

    return (
        <div className="container mx-auto py-10 px-4 md:px-6 max-w-full">
            <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Booking Calendar</h1>
                    <p className="text-muted-foreground mt-1">Gantt-chart view to visually track vehicle availability and prevent double bookings.</p>
                </div>
            </div>
            
            <VehicleCalendar vehicles={vehicles} bookings={bookings} />
        </div>
    );
}
