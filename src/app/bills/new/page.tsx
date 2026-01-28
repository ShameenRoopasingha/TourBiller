'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BillCreator } from '@/components/BillCreator';

function BillCreatorWrapper() {
    const searchParams = useSearchParams();
    const vehicleNo = searchParams.get('vehicleNo') || undefined;
    const customerName = searchParams.get('customerName') || undefined;
    const bookingId = searchParams.get('bookingId') || undefined;

    return <BillCreator initialVehicleNo={vehicleNo} initialCustomerName={customerName} initialBookingId={bookingId} />;
}

export default function NewBillPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BillCreatorWrapper />
        </Suspense>
    );
}
