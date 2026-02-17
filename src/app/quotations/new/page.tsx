import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getTourSchedules } from '@/lib/tour-schedule-actions';
import { getCustomers } from '@/lib/customer-actions';
import { getVehicles } from '@/lib/vehicle-actions';
import { QuotationCreator } from '@/components/QuotationCreator';

async function NewQuotationForm() {
    // Fetch all needed data in parallel
    const [schedulesResult, customersResult, vehiclesResult] = await Promise.all([
        getTourSchedules(),
        getCustomers(),
        getVehicles(),
    ]);

    const schedules = schedulesResult.success && schedulesResult.data
        ? schedulesResult.data
        : [];
    const customers = (customersResult.success && customersResult.data
        ? customersResult.data
        : []).map(c => ({
            id: c.id,
            name: c.name,
            mobile: c.mobile ?? null,
            email: c.email ?? null,
        }));
    const vehicles = (vehiclesResult.success && vehiclesResult.data
        ? vehiclesResult.data.filter(v => v.status === 'ACTIVE')
        : []).map(v => ({
            id: v.id,
            vehicleNo: v.vehicleNo,
            model: v.model ?? null,
            category: v.category,
            ratePerDay: v.ratePerDay,
            kmPerDay: v.kmPerDay,
            excessKmRate: v.excessKmRate,
            extraHourRate: v.extraHourRate,
            seats: v.seats ?? null,
            acType: v.acType ?? null,
            features: v.features ?? null,
            insuranceCoverage: v.insuranceCoverage ?? null,
        }));

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Generate Quotation</h1>
            <QuotationCreator
                schedules={schedules}
                customers={customers}
                vehicles={vehicles}
            />
        </div>
    );
}

export default function NewQuotationPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <NewQuotationForm />
        </Suspense>
    );
}
