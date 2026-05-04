
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Dashboard } from '@/components/Dashboard';
import { DriverDashboard } from '@/components/DriverDashboard';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const session = await auth();
  const userRole = (session?.user as { role?: string })?.role || 'ADMIN';
  const userName = session?.user?.name || 'Driver';

  if (userRole === 'DRIVER') {
    // Find the user's ID
    const user = await prisma.user.findUnique({
      where: { email: session?.user?.email || '' },
      select: { id: true },
    });

    let activeTourData = null;

    if (user) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activeBooking = await prisma.booking.findFirst({
        where: {
          driverId: user.id,
          status: 'CONFIRMED',
          startDate: { lte: new Date() },
          OR: [
            { endDate: null },
            { endDate: { gte: today } },
          ],
        },
        orderBy: { startDate: 'desc' },
      });

      if (activeBooking) {
        const vehicle = await prisma.vehicle.findUnique({
          where: { vehicleNo: activeBooking.vehicleNo },
          select: { model: true, category: true },
        });

        activeTourData = {
          bookingId: activeBooking.id,
          vehicleNo: activeBooking.vehicleNo,
          vehicleModel: vehicle?.model || undefined,
          vehicleCategory: vehicle?.category || undefined,
          customerName: activeBooking.customerName,
          destination: activeBooking.destination || undefined,
          startDate: activeBooking.startDate.toISOString(),
          endDate: activeBooking.endDate?.toISOString() || undefined,
          notes: activeBooking.notes || undefined,
        };
      }
    }

    return (
      <main className="min-h-screen max-w-lg mx-auto">
        <DriverDashboard activeTour={activeTourData} driverName={userName} />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent">
              VIGIL
            </span>
            <span className="text-foreground invisible sm:visible"> </span>
            <span className="text-foreground">Precision Billing</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto font-medium">
            Smart travel management and intelligent invoicing infrastructure for modern fleets.
          </p>
        </div>

        <Suspense fallback={
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <Dashboard />
        </Suspense>
      </div>
    </main>
  );
}