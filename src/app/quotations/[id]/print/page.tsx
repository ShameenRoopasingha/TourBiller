import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getQuotationById } from '@/lib/quotation-actions';
import { getBusinessProfile } from '@/lib/actions';
import { getVehicles } from '@/lib/vehicle-actions';
import { calculateRouteOSRM, type RoutePoint } from '@/lib/osrm-actions';
import { QuotationTemplate } from '@/components/QuotationTemplate';

function extractRouteStops(quotation: {
    pickupLocation?: string | null;
    dropLocation?: string | null;
    notes?: string | null;
    tourSchedule?: {
        items?: Array<{ title: string }>;
    } | null;
}): string[] {
    // 1. From notes (e.g., "Route: Katunayake → Pinnawala → Yala" or "Map Route: ...")
    if (quotation.notes) {
        const line = quotation.notes.split('\n').find((l) =>
            l.trim().startsWith('Route:') || l.trim().startsWith('Map Route:')
        );
        if (line) {
            const clean = line.replace(/^(Route|Map Route):\s*/i, '').trim();
            const parts = clean.split(/➔|→|->|\bto\b/i).map((s) => s.trim()).filter(Boolean);
            if (parts.length >= 2) return parts;
        }
    }

    // 2. From items[0].title if single day / transfer
    if (quotation.tourSchedule?.items && quotation.tourSchedule.items.length === 1) {
        const title = quotation.tourSchedule.items[0]?.title || '';
        const parts = title.split(/➔|→|->|\bto\b/i).map((s) => s.trim()).filter(Boolean);
        if (parts.length >= 2) return parts;
    }

    // 3. From multi-day items
    if (quotation.tourSchedule?.items && quotation.tourSchedule.items.length > 1) {
        const stops: string[] = [];
        quotation.tourSchedule.items.forEach((item, idx) => {
            const parts = (item.title || '').split(/➔|→|->|\bto\b/i).map((s) => s.trim()).filter(Boolean);
            if (parts.length > 0) {
                if (idx === 0) stops.push(parts[0]);
                if (parts.length > 1) stops.push(parts[parts.length - 1]);
            }
        });
        if (stops.length >= 2) return stops;
    }

    // 4. From pickup and drop locations
    if (quotation.pickupLocation && quotation.dropLocation) {
        return [quotation.pickupLocation, quotation.dropLocation];
    }

    return [];
}

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
        driver: quotation.driver ?? null,
        tourSchedule: quotation.tourSchedule ? {
            ...quotation.tourSchedule,
            description: quotation.tourSchedule.description ?? null,
            items: (quotation.tourSchedule.items || []).map(item => ({
                ...item,
                description: item.description ?? null,
            })),
        } : null,
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

    // Precalculate route map coordinates for print preview
    let routeCoordinates: [number, number][] = [];
    let routeWaypoints: RoutePoint[] = [];

    const stops = extractRouteStops(quotation);
    if (stops.length >= 2) {
        try {
            const origin = stops[0];
            const destination = stops[stops.length - 1];
            const waypoints = stops.slice(1, -1).map((name) => ({ name }));
            const routeRes = await calculateRouteOSRM(origin, destination, { waypoints });
            if (routeRes.success && routeRes.coordinates) {
                routeCoordinates = routeRes.coordinates;
                routeWaypoints = routeRes.waypoints || [];
            }
        } catch (err) {
            console.error('Failed to precompute print route map:', err);
        }
    }

    return (
        <QuotationTemplate
            quotation={{ ...fixedQuotation, ...vehicleSpecs }}
            businessProfile={profileResult.success ? profileResult.data : undefined}
            routeCoordinates={routeCoordinates}
            routeWaypoints={routeWaypoints}
        />
    );
}

export default async function PrintQuotationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <div className="min-h-screen bg-gray-100 print:bg-white flex items-center justify-center print:block print:min-h-0 print:h-auto print:p-0 print:m-0">
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
