import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Car, Calendar, MapPin, CreditCard, AlignLeft, CalendarX } from 'lucide-react';
import { getBookingById, cancelBooking } from '@/lib/booking-actions';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { formatCurrency } from '@/lib/calculations';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { requireAuth } from '@/lib/auth-guard';

function EndTourDialog({ vehicleNo, customerName, bookingId }: { vehicleNo: string, customerName: string, bookingId: string }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                    End Tour
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>End Tour & Create Bill?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will mark the tour as completed and take you to the bill creation page for <b>{vehicleNo}</b>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild className="bg-green-600 hover:bg-green-700">
                        <Link href={`/bills/new?vehicleNo=${encodeURIComponent(vehicleNo)}&customerName=${encodeURIComponent(customerName)}&bookingId=${bookingId}`}>
                            Confirm & Create Bill
                        </Link>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default async function BookingDetailsPage(props: {
    params: Promise<{ id: string }>;
}) {
    const auth = await requireAuth();
    if (!auth.authorized) {
        redirect('/login');
    }

    const params = await props.params;
    const { success, data: booking } = await getBookingById(params.id);

    if (!success || !booking) {
        notFound();
    }

    // Determine display status based on booking status and dates
    let displayStatus = booking.status;
    if (booking.status === 'CONFIRMED') {
        const now = new Date();
        const startDate = new Date(booking.startDate);
        const endDate = booking.endDate ? new Date(booking.endDate) : null;

        if (now >= startDate && (!endDate || now <= endDate)) {
            displayStatus = 'ONGOING';
        } else if (endDate && now > endDate) {
            displayStatus = 'OVERDUE';
        }
    }

    const isOngoing = displayStatus === 'ONGOING' || displayStatus === 'OVERDUE';

    return (
        <div className="container mx-auto py-10 max-w-3xl">
            <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" asChild className="pl-0 hover:bg-transparent">
                    <Link href="/bookings" className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Bookings
                    </Link>
                </Button>
                
                <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                    displayStatus === 'CONFIRMED' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                    displayStatus === 'ONGOING' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                    displayStatus === 'OVERDUE' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                    displayStatus === 'CANCELLED' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                    displayStatus === 'COMPLETED' ? 'bg-gray-500/10 text-gray-600 dark:text-gray-400' :
                    'bg-muted text-muted-foreground'
                }`}>
                    {displayStatus}
                </span>
            </div>

            <Card className="shadow-lg border-primary/10">
                <CardHeader className="bg-muted/30 border-b pb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-3xl font-bold flex items-center gap-2">
                                <Car className="h-6 w-6 text-primary" />
                                {booking.vehicleNo}
                            </CardTitle>
                            <CardDescription className="text-base mt-2">
                                Booked by <span className="font-semibold text-foreground">{booking.customerName}</span>
                            </CardDescription>
                        </div>
                        
                        <div className="flex flex-col sm:items-end gap-2">
                            {isOngoing && (
                                <EndTourDialog 
                                    vehicleNo={booking.vehicleNo} 
                                    customerName={booking.customerName} 
                                    bookingId={booking.id} 
                                />
                            )}
                            
                            {booking.status === 'CONFIRMED' && (
                                <form action={async () => {
                                    'use server';
                                    await cancelBooking(booking.id);
                                    redirect('/bookings');
                                }}>
                                    <Button variant="destructive" type="submit">
                                        <CalendarX className="w-4 h-4 mr-2" />
                                        Cancel Booking
                                    </Button>
                                </form>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-8">
                    {/* Timeframe */}
                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" /> Tour Schedule
                            </h3>
                            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Start Date & Time</p>
                                    <p className="font-medium text-lg">{new Date(booking.startDate).toLocaleString('en-GB')}</p>
                                </div>
                                {booking.endDate && (
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Expected End Date & Time</p>
                                        <p className="font-medium text-lg">{new Date(booking.endDate).toLocaleString('en-GB')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Location & Financials */}
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2 text-muted-foreground">
                                <CreditCard className="h-4 w-4" /> Booking Details
                            </h3>
                            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                                {booking.destination && (
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> Destination / Route
                                        </p>
                                        <p className="font-medium">{booking.destination}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Advance Amount Collected</p>
                                    <p className="font-bold text-xl text-primary">
                                        {formatCurrency(booking.advanceAmount)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Notes */}
                    {booking.notes && (
                        <div className="space-y-2 pt-4 border-t">
                            <h3 className="font-semibold flex items-center gap-2 text-muted-foreground">
                                <AlignLeft className="h-4 w-4" /> Additional Notes
                            </h3>
                            <div className="bg-muted/30 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                                {booking.notes}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
