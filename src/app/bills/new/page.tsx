import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getVehicles } from '@/lib/vehicle-actions';
import { getCustomers } from '@/lib/customer-actions';
import { BillCreator } from '@/components/BillCreator';

async function NewBillForm({ searchParams }: { searchParams: Promise<{ vehicleNo?: string; customerName?: string; bookingId?: string }> }) {
    const params = await searchParams;
    const vehicleNo = params.vehicleNo || undefined;
    const customerName = params.customerName || undefined;
    const bookingId = params.bookingId || undefined;

    // Fetch vehicles and customers on the server so dropdowns are instantly available
    const [vResult, cResult] = await Promise.all([
        getVehicles(),
        getCustomers(),
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

export default function NewBillPage({ searchParams }: { searchParams: Promise<{ vehicleNo?: string; customerName?: string; bookingId?: string }> }) {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <NewBillForm searchParams={searchParams} />
        </Suspense>
    );
}
