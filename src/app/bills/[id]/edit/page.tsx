import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getVehicles } from '@/lib/vehicle-actions';
import { getCustomers } from '@/lib/customer-actions';
import { getTourSchedules } from '@/lib/tour-schedule-actions';
import { getBillById } from '@/lib/actions';
import { BillCreator } from '@/components/BillCreator';
import { auth } from '@/lib/auth';

async function EditBillForm({ id }: { id: string }) {
    // Check auth
    const session = await auth();
    const userRole = (session?.user as { role?: string })?.role;
    if (userRole !== 'ADMIN') {
        return (
            <div className="p-8 text-center text-destructive bg-destructive/10 rounded-lg max-w-lg mx-auto mt-12">
                <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                <p>Only administrators can edit bills.</p>
            </div>
        );
    }

    // Fetch bill and lookup data
    const [billResult, vResult, cResult, sResult] = await Promise.all([
        getBillById(id),
        getVehicles(),
        getCustomers(),
        getTourSchedules(),
    ]);

    if (!billResult.success || !billResult.data) {
        return notFound();
    }

    const billData = billResult.data;
    const vehicles = vResult.success && vResult.data ? vResult.data : [];
    const customers = cResult.success && cResult.data ? cResult.data : [];
    const schedules = sResult.success && sResult.data ? sResult.data.map(s => ({
        id: s.id,
        name: s.name,
        days: s.days,
        vehicleNo: s.vehicleNo,
        ratePerDay: s.ratePerDay,
        kmPerDay: s.kmPerDay,
        excessKmRate: s.excessKmRate,
        extraHourRate: s.extraHourRate,
        waitingCharge: s.waitingCharge,
        gatePass: s.gatePass,
        items: s.items.map(item => ({
            dayNumber: item.dayNumber,
            title: item.title,
            distanceKm: item.distanceKm,
            accommodation: item.accommodation,
            meals: item.meals,
            activities: item.activities,
            otherCosts: item.otherCosts
        }))
    })) : [];

    return (
        <BillCreator
            initialData={billData}
            vehicles={vehicles}
            customers={customers}
            schedules={schedules}
        />
    );
}

export default async function EditBillPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <EditBillForm id={id} />
        </Suspense>
    );
}
