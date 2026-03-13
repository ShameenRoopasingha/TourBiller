import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getVehicles } from '@/lib/vehicle-actions';
import { getCustomers } from '@/lib/customer-actions';
import { BillCreator } from '@/components/BillCreator';

async function BillCreatorWrapper({ 
    searchParams 
}: { 
    searchParams: { [key: string]: string | string[] | undefined } 
}) {
    const sParams = await searchParams; // In Next.js 15, searchParams is a promise in some contexts, but let's be safe
    const vehicleNo = (sParams?.vehicleNo as string) || undefined;
    const customerName = (sParams?.customerName as string) || undefined;
    const bookingId = (sParams?.bookingId as string) || undefined;

    // Fetch data on server
    const [vResult, cResult] = await Promise.all([
        getVehicles(),
        getCustomers()
    ]);

    const vehicles = vResult.success && vResult.data ? vResult.data : [];
    const customers = cResult.success && cResult.data ? cResult.data : [];

    return (
        <BillCreator 
            initialVehicleNo={vehicleNo} 
            initialCustomerName={customerName} 
            initialBookingId={bookingId} 
            vehicles={vehicles}
            customers={customers}
        />
    );
}

export default function NewBillPage({ 
    searchParams 
}: { 
    searchParams: { [key: string]: string | string[] | undefined } 
}) {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <BillCreatorWrapper searchParams={searchParams} />
        </Suspense>
    );
}
