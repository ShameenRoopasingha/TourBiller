import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Car, Calendar, MapPin, CreditCard, AlignLeft, User, Phone, Mail, Activity, AlertTriangle, ShieldAlert } from 'lucide-react';
import { getBookingById } from '@/lib/booking-actions';
import { formatAppDateTime } from '@/lib/date-utils';
import { getDrivers } from '@/lib/user-actions';
import { getActiveVehicles } from '@/lib/vehicle-actions';
import { CancelBookingButton } from '@/components/CancelBookingButton';
import { BookingDriverAssigner } from '@/components/BookingDriverAssigner';
import { BookingVehicleSwapper } from '@/components/BookingVehicleSwapper';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    const [bookingResult, driversResult, vehiclesResult] = await Promise.all([
        getBookingById(params.id),
        getDrivers(),
        getActiveVehicles(),
    ]);

    if (!bookingResult.success || !bookingResult.data) {
        notFound();
    }

    const booking = bookingResult.data;
    const drivers = driversResult.success && driversResult.data ? driversResult.data : [];
    const fleetVehicles = vehiclesResult.success && vehiclesResult.data ? vehiclesResult.data : [];

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
    const isTourActive = ['CONFIRMED', 'ONGOING', 'OVERDUE'].includes(booking.status) || isOngoing;

    // Check if there is an unresolved handover request from the driver
    const handoverReqActivity = booking.tripActivities?.find(a => a.type === 'HANDOVER_REQUESTED');
    const handoverDoneActivity = booking.tripActivities?.find(a => a.type === 'HANDOVER');
    const isHandoverPending = handoverReqActivity && (!handoverDoneActivity || new Date(handoverReqActivity.timestamp) > new Date(handoverDoneActivity.timestamp));

    let pendingHandoverRequest: { reason: string; meterReading: string; location: string; note: string; timestamp: Date | string } | null = null;
    if (isHandoverPending && isTourActive && handoverReqActivity) {
        const noteText = handoverReqActivity.note || '';
        const reasonMatch = noteText.match(/Reason:\s*([^|]+)/i);
        const meterMatch = noteText.match(/Meter:\s*([0-9.]+)/i);
        const locMatch = noteText.match(/Location:\s*([^|]+)/i);
        const notesMatch = noteText.match(/Notes:\s*(.+)/i) || (!locMatch ? noteText.match(/(?:Location\/Note|Note):\s*(.+)/i) : null);

        pendingHandoverRequest = {
            reason: reasonMatch ? reasonMatch[1].trim() : 'Driver Request',
            meterReading: meterMatch ? meterMatch[1].trim() : '',
            location: locMatch ? locMatch[1].trim() : '',
            note: notesMatch ? notesMatch[1].trim() : '',
            timestamp: handoverReqActivity.timestamp,
        };
    }

    // Check if there is an unresolved vehicle breakdown report from the driver
    const breakdownReqActivity = booking.tripActivities?.find(a => a.type === 'BREAKDOWN_REPORTED');
    const swappedActivity = booking.tripActivities?.find(a => a.type === 'VEHICLE_SWAPPED');
    const isBreakdownPending = breakdownReqActivity && (!swappedActivity || new Date(breakdownReqActivity.timestamp) > new Date(swappedActivity.timestamp));

    let pendingBreakdownReport: { reason: string; meterReading: string; location: string; note: string; timestamp: Date | string } | null = null;
    if (isBreakdownPending && isTourActive && breakdownReqActivity) {
        const noteText = breakdownReqActivity.note || '';
        const issueMatch = noteText.match(/Issue:\s*([^|]+)/i);
        const meterMatch = noteText.match(/Meter:\s*([0-9.]+)/i);
        const locMatch = noteText.match(/Location:\s*([^|]+)/i);
        const notesMatch = noteText.match(/Notes:\s*(.+)/i);

        pendingBreakdownReport = {
            reason: issueMatch ? issueMatch[1].trim() : 'Vehicle Breakdown',
            meterReading: meterMatch ? meterMatch[1].trim() : '',
            location: locMatch ? locMatch[1].trim() : '',
            note: notesMatch ? notesMatch[1].trim() : '',
            timestamp: breakdownReqActivity.timestamp,
        };
    }

    return (
        <div className="container mx-auto py-10 max-w-3xl">
            {/* Emergency Vehicle Breakdown Alert Banner */}
            {pendingBreakdownReport && (
                <div className="bg-red-600/10 border-2 border-red-600/40 rounded-xl p-4 mb-4 shadow-sm flex items-start gap-3">
                    <div className="p-2 bg-red-600/20 rounded-lg text-red-600 dark:text-red-400">
                        <ShieldAlert className="h-6 w-6" />
                    </div>
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-red-700 dark:text-red-400 text-base">
                                🚨 Emergency Vehicle Breakdown Reported
                            </h3>
                            <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                                {new Date(pendingBreakdownReport.timestamp).toLocaleTimeString('en-GB')}
                            </span>
                        </div>
                        <p className="text-sm text-foreground">
                            Driver <strong>{booking.driver?.name}</strong> reported a vehicle defect on <strong>{booking.vehicleNo}</strong>: 
                            <span className="font-semibold text-red-600 dark:text-red-400"> {pendingBreakdownReport.reason}</span>
                            {pendingBreakdownReport.location && ` at ${pendingBreakdownReport.location}`}.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Reported Meter: <strong className="text-foreground">{pendingBreakdownReport.meterReading || 'N/A'} km</strong>
                            {pendingBreakdownReport.note && ` • Notes: ${pendingBreakdownReport.note}`}
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-300 font-medium pt-1">
                            👇 Use the Assigned Vehicle card below to dispatch a replacement fleet vehicle or outsource a third-party hire.
                        </p>
                    </div>
                </div>
            )}

            {/* Driver Handover Alert Banner */}
            {pendingHandoverRequest && (
                <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-xl p-4 mb-6 shadow-sm flex items-start gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-amber-700 dark:text-amber-400 text-base">
                                ⚠️ Driver Handover Requested
                            </h3>
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                {new Date(pendingHandoverRequest.timestamp).toLocaleTimeString('en-GB')}
                            </span>
                        </div>
                        <p className="text-sm text-foreground">
                            Driver <strong>{booking.driver?.name}</strong> requested a mid-tour handover: 
                            <span className="font-semibold text-amber-600 dark:text-amber-400"> {pendingHandoverRequest.reason}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Reported Meter: <strong className="text-foreground">{pendingHandoverRequest.meterReading || 'N/A'} km</strong>
                            {pendingHandoverRequest.note && ` • Location/Note: ${pendingHandoverRequest.note}`}
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 font-medium pt-1">
                            👇 Use the Assigned Driver card below to confirm the replacement driver. The meter reading and reason have been pre-filled.
                        </p>
                    </div>
                </div>
            )}


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
                                    <CancelBookingButton bookingId={booking.id} customerName={booking.customerName} redirectAfterSuccess />
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
                                    <p className="font-medium text-lg">{formatAppDateTime(booking.startDate)}</p>
                                </div>
                                {booking.endDate && (
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Expected End Date & Time</p>
                                        <p className="font-medium text-lg">{formatAppDateTime(booking.endDate)}</p>
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

                    {/* Assigned Vehicle & Emergency Swap */}
                    <div id="swap-section" className="scroll-mt-6">
                        <BookingVehicleSwapper
                            bookingId={booking.id}
                            currentVehicleNo={booking.vehicleNo}
                            bookingStatus={displayStatus}
                            fleetVehicles={fleetVehicles}
                            isAdmin={auth.role === 'ADMIN' || auth.role === 'OWNER'}
                            pendingBreakdownReport={pendingBreakdownReport}
                        />
                    </div>

                    {/* Assigned Driver */}
                    <div id="handover-section" className="scroll-mt-6">
                        <BookingDriverAssigner
                            bookingId={booking.id}
                            bookingStatus={displayStatus}
                            currentDriver={booking.driver || null}
                            drivers={drivers}
                            isAdmin={auth.role === 'ADMIN' || auth.role === 'OWNER'}
                            pendingHandoverRequest={pendingHandoverRequest}
                        />
                    </div>

                    {/* Trip Activities & Handover Audit */}
                    {booking.tripActivities && booking.tripActivities.length > 0 && (
                        <div className="space-y-3 pt-4 border-t">
                            <h3 className="font-semibold flex items-center gap-2 text-muted-foreground">
                                <Activity className="h-4 w-4" /> Trip Activity, Handover & Breakdown History
                            </h3>
                            <div className="space-y-2">
                                {booking.tripActivities.map((act) => {
                                    const isHandover = act.type === 'HANDOVER';
                                    const isTakeover = act.type === 'TAKEOVER';
                                    const isStart = act.type === 'START';
                                    const isEnd = act.type === 'END';
                                    const isBreakdown = act.type === 'BREAKDOWN_REPORTED' || act.type === 'BREAKDOWN';
                                    const isVehicleSwapped = act.type === 'VEHICLE_SWAPPED';

                                    const badgeClass = isBreakdown ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30' :
                                        isVehicleSwapped ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30' :
                                        isHandover ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30' :
                                        isTakeover ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30' :
                                        isStart ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30' :
                                        isEnd ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30' :
                                        'bg-muted text-muted-foreground';

                                    return (
                                        <div key={act.id} className="p-3 bg-muted/20 border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className={`font-bold text-[10px] uppercase ${badgeClass}`}>
                                                        {act.type}
                                                    </Badge>
                                                    {act.driver?.name && (
                                                        <span className="text-muted-foreground font-medium">
                                                            by <strong className="text-foreground">{act.driver.name}</strong>
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-foreground text-sm font-medium">{act.note}</p>
                                            </div>
                                            <span className="text-muted-foreground shrink-0">
                                                {formatAppDateTime(act.timestamp)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}


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
