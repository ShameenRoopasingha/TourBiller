import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { VehicleExpenseManager } from '@/components/VehicleExpenseManager';
import { Car, MapPin, Calendar, ArrowRight } from 'lucide-react';

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
        orderBy: {
            startDate: 'desc'
        }
    });

    let assignedVehicle = null;
    if (activeBooking && activeBooking.vehicleNo) {
        assignedVehicle = await prisma.vehicle.findUnique({
            where: { vehicleNo: activeBooking.vehicleNo }
        });
    }

    if (!activeBooking) {
        return (
            <div className="px-1 py-4 max-w-lg mx-auto">
                <h2 className="text-xl font-bold mb-4">My Active Tour</h2>
                <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Car className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                        <h3 className="text-lg font-semibold">No Active Tour</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">
                            You are not currently assigned to any active tours. Check back later or contact your administrator.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const startDate = new Date(activeBooking.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const endDate = activeBooking.endDate
        ? new Date(activeBooking.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        : 'Ongoing';

    return (
        <div className="px-1 py-4 max-w-lg mx-auto space-y-5">
            {/* Compact Tour Status Banner */}
            <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary/90 to-primary dark:from-primary/80 dark:to-primary/60">
                <CardContent className="p-4 text-primary-foreground">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
                            🟢 Active Tour
                        </span>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-14 h-14 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                            <Car className="h-7 w-7" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-2xl font-bold font-mono tracking-wider leading-none">{activeBooking.vehicleNo}</h3>
                            <p className="text-sm opacity-80 mt-0.5">
                                {assignedVehicle?.model || assignedVehicle?.category || 'Vehicle'}
                                {assignedVehicle?.seats ? ` • ${assignedVehicle.seats} Seats` : ''}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-white/15 text-sm">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 opacity-70 shrink-0" />
                            <span className="truncate">{activeBooking.customerName}</span>
                            {activeBooking.destination && (
                                <>
                                    <ArrowRight className="h-3 w-3 opacity-50 shrink-0" />
                                    <span className="truncate">{activeBooking.destination}</span>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 opacity-70 shrink-0" />
                            <span>{startDate} → {endDate}</span>
                        </div>
                    </div>

                    {activeBooking.notes && (
                        <p className="text-xs opacity-70 mt-3 pt-2 border-t border-white/10 italic">
                            {activeBooking.notes}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Expense Manager — mobile mode */}
            <VehicleExpenseManager
                vehicleNo={activeBooking.vehicleNo}
                bookingId={activeBooking.id}
                userRole="DRIVER"
            />
        </div>
    );
}
