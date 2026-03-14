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
        <BookingCreator
            vehicles={vehicles}
            customers={customers}
            schedules={schedules}
        />
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
