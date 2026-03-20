import { notFound } from 'next/navigation';
import { getQuotationById } from '@/lib/quotation-actions';
import { getTourSchedules } from '@/lib/tour-schedule-actions';
import { getCustomers } from '@/lib/customer-actions';
import { getVehicles } from '@/lib/vehicle-actions';
import { QuotationCreator } from '@/components/QuotationCreator';
import { getSafeItems } from '@/lib/utils';
import { type Customer, type Vehicle } from '@/lib/validations';
import { type TourScheduleWithItems } from '@/lib/tour-schedule-actions';

export default async function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const [quotationResult, schedulesResult, customersResult, vehiclesResult] = await Promise.all([
        getQuotationById(id),
        getTourSchedules(),
        getCustomers(),
        getVehicles()
    ]);

    if (!quotationResult.success || !quotationResult.data) {
        notFound();
    }

    const schedules = getSafeItems(schedulesResult);
    const customers = getSafeItems(customersResult);
    const vehicles = getSafeItems(vehiclesResult);

    return (
        <main className="container py-8 max-w-5xl">
            <QuotationCreator
                initialData={quotationResult.data}
                schedules={schedules.map((s: TourScheduleWithItems) => ({
                    id: s.id,
                    name: s.name,
                    days: s.days,
                    vehicleCategory: s.vehicleCategory,
                    vehicleNo: s.vehicleNo || null,
                    ratePerDay: s.ratePerDay,
                    kmPerDay: s.kmPerDay,
                    excessKmRate: s.excessKmRate || null,
                    extraHourRate: s.extraHourRate || null,
                    items: s.items || []
                }))}
                customers={customers.map((c: Customer) => ({
                    id: c.id,
                    name: c.name,
                    email: c.email || null,
                    mobile: c.mobile || null
                }))}
                vehicles={vehicles.map((v: Vehicle) => ({
                    id: v.id,
                    vehicleNo: v.vehicleNo,
                    model: v.model || null,
                    category: v.category,
                    ratePerDay: v.ratePerDay,
                    kmPerDay: v.kmPerDay,
                    excessKmRate: v.excessKmRate,
                    extraHourRate: v.extraHourRate,
                    seats: v.seats || null,
                    acType: v.acType || null,
                    features: v.features || null,
                    insuranceCoverage: v.insuranceCoverage || null
                }))}
            />
        </main>
    );
}
