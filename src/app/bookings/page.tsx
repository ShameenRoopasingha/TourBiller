import { Suspense } from 'react';
import Link from 'next/link';
import { getBookings } from '@/lib/booking-actions';
import { formatAppDateTime } from '@/lib/date-utils';
import { CancelBookingButton } from '@/components/CancelBookingButton';
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
import { Plus, Clock, Eye, User, AlertTriangle, ShieldAlert } from 'lucide-react';
import { SearchInput } from '@/components/SearchInput';

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

async function BookingList({ searchQuery }: { searchQuery?: string }) {
    const { success, data: bookings } = await getBookings(searchQuery);

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

                        const latestHandoverReq = booking.tripActivities?.find(a => a.type === 'HANDOVER_REQUESTED');
                        const latestHandoverDone = booking.tripActivities?.find(a => a.type === 'HANDOVER');
                        const hasPendingHandover = !!latestHandoverReq && (!latestHandoverDone || new Date(latestHandoverReq.timestamp) > new Date(latestHandoverDone.timestamp));

                        const latestBreakdown = booking.tripActivities?.find(a => a.type === 'BREAKDOWN_REPORTED');
                        const latestSwap = booking.tripActivities?.find(a => a.type === 'VEHICLE_SWAPPED');
                        const hasPendingBreakdown = !!latestBreakdown && (!latestSwap || new Date(latestBreakdown.timestamp) > new Date(latestSwap.timestamp));

                        return (
                            <Card key={booking.id} className={`overflow-hidden ${hasPendingHandover ? 'border-amber-500/50 bg-amber-500/5' : hasPendingBreakdown ? 'border-red-500/50 bg-red-500/5' : ''}`}>
                                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-bold text-lg">{booking.vehicleNo}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${displayStatus === 'CONFIRMED' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                                displayStatus === 'ONGOING' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                                                    displayStatus === 'OVERDUE' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                                                        displayStatus === 'CANCELLED' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                                                            'bg-muted text-muted-foreground'
                                                }`}>
                                                {displayStatus}
                                            </span>

                                            {hasPendingHandover && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                                                    <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                                    Handover Requested
                                                </span>
                                            )}

                                            {hasPendingBreakdown && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/40 flex items-center gap-1 animate-pulse">
                                                    <ShieldAlert className="w-3 h-3 text-red-600 dark:text-red-400 shrink-0" />
                                                    Breakdown Reported
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Customer: <span className="font-medium text-foreground">{booking.customerName}</span>
                                        </div>
                                        {booking.driver ? (
                                            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 text-primary" />
                                                <span>Driver: <strong className="text-foreground">{booking.driver.name}</strong></span>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5" />
                                                <span className="font-medium">No Driver Assigned</span>
                                                <Link href={`/bookings/${booking.id}`} className="underline text-[11px] font-semibold text-primary hover:opacity-80 ml-1">
                                                    (Assign Driver)
                                                </Link>
                                            </div>
                                        )}
                                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatAppDateTime(booking.startDate)}
                                            </div>
                                            {booking.endDate && (
                                                <div className="flex items-center gap-1">
                                                    <span>to</span>
                                                    {formatAppDateTime(booking.endDate)}
                                                </div>
                                            )}
                                        </div>
                                        {booking.destination && (
                                            <div className="text-xs italic text-muted-foreground">
                                                Destination: {booking.destination}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap sm:flex-nowrap gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 justify-end items-center">
                                        {hasPendingHandover && (
                                            <Button variant="default" size="sm" asChild className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm animate-pulse">
                                                <Link href={`/bookings/${booking.id}#handover-section`}>
                                                    <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                                                    Review Handover
                                                </Link>
                                            </Button>
                                        )}
                                        {hasPendingBreakdown && (
                                            <Button variant="default" size="sm" asChild className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm animate-pulse">
                                                <Link href={`/bookings/${booking.id}#swap-section`}>
                                                    <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
                                                    Vehicle Swap
                                                </Link>
                                            </Button>
                                        )}
                                        {(displayStatus === 'ONGOING' || displayStatus === 'OVERDUE') && (
                                            <EndTourDialog vehicleNo={booking.vehicleNo} customerName={booking.customerName} bookingId={booking.id} />
                                        )}
                                        {booking.status === 'CONFIRMED' && (
                                            <CancelBookingButton bookingId={booking.id} customerName={booking.customerName} />
                                        )}
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/bookings/${booking.id}`}>
                                                <Eye className="w-4 h-4 mr-2" />
                                                View
                                            </Link>
                                        </Button>
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

export default async function BookingsPage(props: {
    searchParams?: Promise<{ q?: string }>;
}) {
    const searchParams = await props.searchParams;
    const query = searchParams?.q || '';

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Bookings</h1>
                    <p className="text-muted-foreground">Manage vehicle reservations</p>
                </div>
                <div className="flex w-full sm:w-auto gap-2">
                    <Button variant="outline" asChild className="flex-1 sm:flex-none">
                        <Link href="/calendar">
                            View Calendar
                        </Link>
                    </Button>
                    <Button asChild className="flex-1 sm:flex-none">
                        <Link href="/bookings/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Booking
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="mb-6">
                <SearchInput placeholder="Search by vehicle, customer, destination..." />
            </div>

            <Suspense fallback={<div>Loading bookings...</div>}>
                <BookingList searchQuery={query} />
            </Suspense>
        </div>
    );
}
