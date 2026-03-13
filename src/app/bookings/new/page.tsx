import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getVehicles } from '@/lib/vehicle-actions';
import { getCustomers } from '@/lib/customer-actions';
import { getTourSchedules } from '@/lib/tour-schedule-actions';
import { BookingCreator } from '@/components/BookingCreator';

async function NewBookingForm() {
    // Fetch all needed data in parallel on server
    const [vResult, cResult, sResult] = await Promise.all([
        getVehicles(),
        getCustomers(),
        getTourSchedules()
    ]);

    const vehicles = vResult.success && vResult.data ? vResult.data : [];
    const customers = cResult.success && cResult.data ? cResult.data : [];
    const schedules = sResult.success && sResult.data ? sResult.data.map(s => ({ id: s.id, name: s.name })) : [];

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8">New Booking</h1>
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
