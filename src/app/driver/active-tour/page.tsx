import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VehicleExpenseManager } from '@/components/VehicleExpenseManager';
import { Car, MapPin, Calendar, Clock, Contact } from 'lucide-react';

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
            <div className="space-y-6">
                <h2 className="text-2xl font-bold tracking-tight">My Active Tour</h2>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Car className="h-16 w-16 text-muted-foreground/30 mb-4" />
                        <h3 className="text-xl font-medium">No Active Tour</h3>
                        <p className="text-muted-foreground mt-2">
                            You are not currently assigned to any active tours. Check back later or contact your administrator.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">My Active Tour</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-t-4 border-t-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Tour Details
                        </CardTitle>
                        <CardDescription>
                            Current assignment information.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-sm text-muted-foreground flex items-center gap-1"><Contact className="h-3 w-3" /> Customer</span>
                                <p className="font-medium">{activeBooking.customerName}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Destination</span>
                                <p className="font-medium">{activeBooking.destination || 'N/A'}</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div className="space-y-1">
                                <span className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Start Date</span>
                                <p className="font-medium">{new Date(activeBooking.startDate).toLocaleDateString()}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> End Date</span>
                                <p className="font-medium">{activeBooking.endDate ? new Date(activeBooking.endDate).toLocaleDateString() : 'Ongoing'}</p>
                            </div>
                        </div>

                        {activeBooking.notes && (
                            <div className="pt-4 border-t">
                                <span className="text-sm text-muted-foreground">Notes</span>
                                <p className="text-sm mt-1">{activeBooking.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Car className="h-5 w-5 text-primary" />
                            Vehicle Information
                        </CardTitle>
                        <CardDescription>
                            Assigned vehicle specifications.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                            <div>
                                <h3 className="text-2xl font-bold font-mono tracking-wider">{activeBooking.vehicleNo}</h3>
                                <p className="text-muted-foreground">{assignedVehicle?.model || 'Vehicle'}</p>
                            </div>
                            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                                {assignedVehicle?.category || 'CAR'}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-1 text-sm border-l-2 border-primary/30 pl-3">
                                <span className="text-muted-foreground">Current Mileage</span>
                                <p className="font-medium">{assignedVehicle?.currentMileage || 0} km</p>
                            </div>
                            <div className="space-y-1 text-sm border-l-2 border-primary/30 pl-3">
                                <span className="text-muted-foreground">AC Type</span>
                                <p className="font-medium">{assignedVehicle?.acType || 'Standard'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="pt-4">
                <VehicleExpenseManager vehicleNo={activeBooking.vehicleNo} />
            </div>
        </div>
    );
}
