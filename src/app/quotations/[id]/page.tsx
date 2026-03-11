import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, Printer } from 'lucide-react';
import { getQuotationById } from '@/lib/quotation-actions';
import { getBusinessProfile } from '@/lib/actions';
import { getVehicles } from '@/lib/vehicle-actions';
import { QuotationTemplate } from '@/components/QuotationTemplate';
import { Button } from '@/components/ui/button';

async function ViewQuotation({ id }: { id: string }) {
    const [quotationResult, profileResult] = await Promise.all([
        getQuotationById(id),
        getBusinessProfile(),
    ]);

    if (!quotationResult.success || !quotationResult.data) {
        return notFound();
    }

    const quotation = quotationResult.data;

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
            autoPrint={false}
        />
    );
}

export default async function ViewQuotationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <div className="container mx-auto py-10 max-w-[190mm]">
            <div className="flex justify-between items-center mb-6">
                <Link href="/quotations">
                    <Button variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Quotations
                    </Button>
                </Link>
                <Link href={`/quotations/${id}/print`}>
                    <Button>
                        <Printer className="h-4 w-4 mr-2" />
                        Print Quotation
                    </Button>
                </Link>
            </div>
            
            <div className="bg-white shadow border border-gray-200 p-0 sm:p-4 rounded-xl">
                <Suspense fallback={
                    <div className="flex justify-center items-center h-[50vh]">
                        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
                    </div>
                }>
                    <ViewQuotation id={id} />
                </Suspense>
            </div>
        </div>
    );
}
