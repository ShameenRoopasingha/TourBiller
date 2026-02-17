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
                    vehicleSeats: vehicle.seats,
                    vehicleAcType: vehicle.acType,
                    vehicleFeatures: vehicle.features,
                    vehicleInsuranceCoverage: vehicle.insuranceCoverage,
                    vehicleExcessKmRate: vehicle.excessKmRate,
                    vehicleExtraHourRate: vehicle.extraHourRate,
                };
            }
        }
    }

    return (
        <QuotationTemplate
            quotation={{ ...quotation, ...vehicleSpecs }}
            businessProfile={profileResult.success ? profileResult.data : undefined}
        />
    );
}

export default async function PrintQuotationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <div className="min-h-screen bg-gray-100 print:bg-white py-8 print:py-0">
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
