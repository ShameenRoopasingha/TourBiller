import { Suspense } from 'react';
import Link from 'next/link';
import { getBookings, cancelBooking } from '@/lib/booking-actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
} from "@/components/ui/alert-dialog"
import { Plus, CalendarX, Clock } from 'lucide-react';

function EndTourDialog({ vehicleNo, customerName, bookingId }: { vehicleNo: string, customerName: string, bookingId: string }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
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
                    <AlertDialogAction asChild>
                        <Link href={`/bills/new?vehicleNo=${encodeURIComponent(vehicleNo)}&customerName=${encodeURIComponent(customerName)}&bookingId=${bookingId}`}>
                            Confirm & Create Bill
                        </Link>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

async function BookingList() {
    const { success, data: bookings } = await getBookings();

    if (!success || !bookings) {
        return <div className="p-4 text-red-500">Failed to load bookings</div>;
    }

    return (
        <div className="space-y-4">
            {bookings.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-lg">
                    No bookings found. Create one to get started.
                </div>
            ) : (
                <div className="grid gap-4">
                    {bookings.map((booking) => {
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

                        return (
                            <Card key={booking.id} className="overflow-hidden">
                                <div className="p-4 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg">{booking.vehicleNo}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${displayStatus === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                                                displayStatus === 'ONGOING' ? 'bg-green-100 text-green-700' :
                                                    displayStatus === 'OVERDUE' ? 'bg-yellow-100 text-yellow-700' :
                                                        displayStatus === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                            'bg-gray-100 text-gray-700'
                                                }`}>
                                                {displayStatus}
                                            </span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Customer: <span className="font-medium text-foreground">{booking.customerName}</span>
                                        </div>
                                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(booking.startDate).toLocaleString()}
                                            </div>
                                            {booking.endDate && (
                                                <div className="flex items-center gap-1">
                                                    <span>to</span>
                                                    {new Date(booking.endDate).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                        {booking.destination && (
                                            <div className="text-xs italic text-muted-foreground">
                                                Destination: {booking.destination}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        {(displayStatus === 'ONGOING' || displayStatus === 'OVERDUE') && (
                                            <EndTourDialog vehicleNo={booking.vehicleNo} customerName={booking.customerName} bookingId={booking.id} />
                                        )}
                                        {booking.status === 'CONFIRMED' && (
                                            <form action={async () => {
                                                'use server';
                                                await cancelBooking(booking.id);
                                            }}>
                                                <Button variant="destructive" size="sm" type="submit">
                                                    <CalendarX className="w-4 h-4 mr-2" />
                                                    Cancel
                                                </Button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function BookingsPage() {
    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Bookings</h1>
                    <p className="text-muted-foreground">Manage vehicle reservations</p>
                </div>
                <Button asChild>
                    <Link href="/bookings/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Booking
                    </Link>
                </Button>
            </div>

            <Suspense fallback={<div>Loading bookings...</div>}>
                <BookingList />
            </Suspense>
        </div>
    );
}
