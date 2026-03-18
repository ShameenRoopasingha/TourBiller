import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getVehicles } from '@/lib/vehicle-actions';
import { getCustomers } from '@/lib/customer-actions';
import { getTourSchedules } from '@/lib/tour-schedule-actions';
import { BookingCreator } from '@/components/BookingCreator';

async function NewBookingForm() {
    // Fetch all needed data on the server so dropdowns are instantly available
    const [vResult, cResult, sResult] = await Promise.all([
        getVehicles(),
        getCustomers(),
        getTourSchedules(),
    ]);

    const vehicles = vResult.success && vResult.data ? vResult.data : [];
    const customers = cResult.success && cResult.data ? cResult.data : [];
    const schedules = sResult.success && sResult.data ? sResult.data : [];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">New Booking</h1>
                <p className="text-muted-foreground">Reserve a vehicle for a future trip.</p>
            </div>
            <BookingCreator
                vehicles={vehicles}
                customers={customers}
                schedules={schedules}
            />
        </div>
    );
}

export default function NewBookingPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <NewBookingForm />
        </Suspense>
    );
}
