import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getQuotationById } from '@/lib/quotation-actions';
import { getBusinessProfile } from '@/lib/actions';
import { getVehicles } from '@/lib/vehicle-actions';
import { QuotationTemplate } from '@/components/QuotationTemplate';

async function PrintQuotation({ id }: { id: string }) {
    const [quotationResult, profileResult] = await Promise.all([
        getQuotationById(id),
        getBusinessProfile(),
    ]);

    if (!quotationResult.success || !quotationResult.data) {
        return notFound();
    }

    const quotation = quotationResult.data;

    // Ensure nullable fields are null instead of undefined to match QuotationData type
    const fixedQuotation = {
        ...quotation,
        customerEmail: quotation.customerEmail ?? null,
        customerPhone: quotation.customerPhone ?? null,
        vehicleNo: quotation.vehicleNo ?? null,
        pickupLocation: quotation.pickupLocation ?? null,
        dropLocation: quotation.dropLocation ?? null,
        excludedItems: quotation.excludedItems ?? null,
        notes: quotation.notes ?? null,
        startDate: quotation.startDate ?? null,
        endDate: quotation.endDate ?? null,
        validUntil: quotation.validUntil ?? null,
        tourSchedule: {
            ...quotation.tourSchedule,
            description: quotation.tourSchedule.description ?? null,
            items: quotation.tourSchedule.items.map(item => ({
                ...item,
                description: item.description ?? null,
            })),
        },
    };

    // Fetch vehicle specs if quotation has a vehicle
    let vehicleSpecs: {
        vehicleSeats?: number | null;
        vehicleAcType?: string | null;
        vehicleFeatures?: string | null;
        vehicleInsuranceCoverage?: string | null;
        vehicleExcessKmRate?: number | null;
        vehicleExtraHourRate?: number | null;
    } = {};

    if (quotation.vehicleNo) {
        const vehiclesResult = await getVehicles(quotation.vehicleNo);
        if (vehiclesResult.success && vehiclesResult.data) {
            const vehicle = vehiclesResult.data.find(v => v.vehicleNo === quotation.vehicleNo);
            if (vehicle) {
                vehicleSpecs = {
                    vehicleSeats: vehicle.seats ?? null,
                    vehicleAcType: vehicle.acType ?? null,
                    vehicleFeatures: vehicle.features ?? null,
                    vehicleInsuranceCoverage: vehicle.insuranceCoverage ?? null,
                    vehicleExcessKmRate: vehicle.excessKmRate ?? null,
                    vehicleExtraHourRate: vehicle.extraHourRate ?? null,
                };
            }
        }
    }

    return (
        <QuotationTemplate
            quotation={{ ...fixedQuotation, ...vehicleSpecs }}
            businessProfile={profileResult.success ? profileResult.data : undefined}
        />
    );
}

export default async function PrintQuotationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <div className="min-h-screen bg-gray-100 print:bg-white flex items-center justify-center print:items-start print:py-0">
            <Suspense fallback={
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            }>
                <PrintQuotation id={id} />
            </Suspense>
        </div>
    );
}
