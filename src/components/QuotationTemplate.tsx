'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PrintButton } from '@/components/PrintButton';
import { formatCurrency } from '@/lib/calculations';
import { type RoutePoint } from '@/lib/osrm-actions';

const OSRMRouteMap = dynamic(
    () => import('./OSRMRouteMap').then((mod) => mod.OSRMRouteMap),
    {
        ssr: false,
        loading: () => (
            <div className="h-44 flex items-center justify-center bg-gray-50 border rounded text-xs text-gray-400">
                Loading Route Map...
            </div>
        ),
    }
);

interface QuotationData {
    id: string;
    quotationNumber: number;
    customerName: string;
    customerEmail: string | null;
    customerPhone: string | null;
    vehicleNo: string | null;
    numberOfPersons: number;
    driver?: {
        id: string;
        name: string;
        email?: string;
    } | null;
    startDate: Date | null;
    endDate: Date | null;
    pickupLocation: string | null;
    dropLocation: string | null;
    hireRatePerDay: number;
    kmPerDay: number;
    totalDistance: number;
    excessKmRate: number;
    extraHourRate: number;
    transportCost: number;
    accommodationTotal: number;
    mealsTotal: number;
    activitiesTotal: number;
    otherCostsTotal: number;
    markup: number;
    discount: number;
    driverCostPerDay: number;
    advanceAmount: number;
    excludedItems: string | null;
    totalAmount: number;
    notes: string | null;
    validUntil: Date | null;
    status: string;
    createdAt: Date;
    tourSchedule?: {
        name: string;
        description: string | null;
        days: number;
        vehicleCategory: string;
        items: {
            dayNumber: number;
            title: string;
            description: string | null;
            distanceKm: number;
            accommodation: number;
            meals: number;
            activities: number;
            otherCosts: number;
        }[];
    } | null;
    // Vehicle specs (optional, fetched from vehicle record)
    vehicleSeats?: number | null;
    vehicleAcType?: string | null;
    vehicleFeatures?: string | null;
    vehicleInsuranceCoverage?: string | null;
    vehicleExcessKmRate?: number | null;
    vehicleExtraHourRate?: number | null;
}

interface BusinessProfileData {
    companyName: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    logoUrl?: string | null;
    bankName?: string | null;
    bankBranch?: string | null;
    bankAccountNo?: string | null;
    bankAccountName?: string | null;
    usdRate?: number | null;
    currency?: string | null;
}

interface QuotationTemplateProps {
    quotation: QuotationData;
    businessProfile?: BusinessProfileData;
    routeCoordinates?: [number, number][];
    routeWaypoints?: RoutePoint[];
}

export function QuotationTemplate({
    quotation,
    businessProfile,
    routeCoordinates = [],
    routeWaypoints = [],
}: QuotationTemplateProps) {
    useEffect(() => {
        // Allow Leaflet map tiles and polyline adequate time to render before invoking print
        const waitMs = routeCoordinates.length > 0 ? 1200 : 500;
        const timer = setTimeout(() => {
            window.print();
        }, waitMs);
        return () => clearTimeout(timer);
    }, [routeCoordinates]);

    const companyName = businessProfile?.companyName || 'VIGILTransport';
    const address = businessProfile?.address || '';
    const phone = businessProfile?.phone || '';
    const email = businessProfile?.email || '';

    const fmt = formatCurrency;

    const finalExcessKmRate = quotation.excessKmRate || quotation.vehicleExcessKmRate || 0;
    const finalExtraHourRate = quotation.extraHourRate || quotation.vehicleExtraHourRate || 0;

    const subtotal =
        quotation.transportCost +
        quotation.accommodationTotal +
        quotation.mealsTotal +
        quotation.activitiesTotal +
        quotation.otherCostsTotal;

    const calculatedDays = (quotation.startDate && quotation.endDate)
        ? Math.max(1, Math.round((new Date(quotation.endDate).getTime() - new Date(quotation.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)
        : 1;

    const totalDays = quotation.tourSchedule?.days || calculatedDays;

    // Extract stops for route title & day-by-day distribution
    const rawStops: string[] = routeWaypoints.length > 0
        ? routeWaypoints.map(w => w.name)
        : (() => {
            if (quotation.notes) {
                const line = quotation.notes.split('\n').find(l => l.trim().startsWith('Route:') || l.trim().startsWith('Map Route:'));
                if (line) {
                    const clean = line.replace(/^(Route|Map Route):\s*/i, '').trim();
                    const parts = clean.split(/➔|→|->|\bto\b/i).map(s => s.trim()).filter(Boolean);
                    if (parts.length >= 2) return parts;
                }
            }
            if (quotation.pickupLocation && quotation.dropLocation) {
                return [quotation.pickupLocation, quotation.dropLocation];
            }
            return [];
        })();

    const effectiveDistance = quotation.totalDistance > 0
        ? quotation.totalDistance
        : (() => {
            if (quotation.notes) {
                const distMatch = quotation.notes.match(/Est\.\s*Distance:\s*([0-9.]+)\s*km/i);
                if (distMatch && parseFloat(distMatch[1]) > 0) {
                    return parseFloat(distMatch[1]);
                }
            }
            return 0;
        })();

    let scheduleItems = quotation.tourSchedule?.items && quotation.tourSchedule.items.length >= totalDays
        ? quotation.tourSchedule.items
        : [];

    if (scheduleItems.length < totalDays) {
        const generatedItems = [];
        const stops = rawStops.length >= 2
            ? rawStops
            : [quotation.pickupLocation || 'Start', quotation.dropLocation || quotation.pickupLocation || 'End'];
        const N = stops.length;
        const isCircuit = stops[0].toLowerCase().trim() === stops[N - 1].toLowerCase().trim();
        const avgDailyKm = totalDays > 0 ? Math.round(effectiveDistance / totalDays) : 0;

        for (let d = 0; d < totalDays; d++) {
            const dayNumber = d + 1;
            let title = '';
            let description = '';

            if (N >= 3) {
                const startIdx = Math.round(d * (N - 1) / totalDays);
                const endIdx = Math.round((d + 1) * (N - 1) / totalDays);
                const dayStops = stops.slice(startIdx, endIdx + 1);

                if (startIdx === endIdx) {
                    title = `Explore ${stops[startIdx]} & Surroundings`;
                    description = `Local excursions, sightseeing and leisure in ${stops[startIdx]}`;
                } else if (dayStops.length === 2) {
                    title = `${dayStops[0]} → ${dayStops[1]}`;
                    description = `Scenic road transfer and local sightseeing`;
                } else {
                    title = `${dayStops[0]} → ${dayStops[dayStops.length - 1]}`;
                    const via = dayStops.slice(1, -1).join(', ');
                    description = `Via ${via} with planned tour highlights & stops`;
                }
            } else if (isCircuit) {
                const baseLoc = stops[0];
                if (d === 0) {
                    title = `${baseLoc} Departure & Excursions`;
                    description = `Commence tour from ${baseLoc}, scenic travel and day excursions`;
                } else if (d === totalDays - 1) {
                    title = `Return Journey to ${baseLoc}`;
                    description = `Final sightseeing stops & safe return drop-off at ${baseLoc}`;
                } else {
                    title = `Regional Sightseeing & Day Excursions`;
                    description = `Full day guided tour activities, attractions & transit`;
                }
            } else {
                const origin = stops[0];
                const dest = stops[N - 1];
                if (d === 0) {
                    title = `Departure from ${origin}`;
                    description = `Commence journey towards ${dest} with en-route touring`;
                } else if (d === totalDays - 1) {
                    title = `Arrival & Drop at ${dest}`;
                    description = `Final tour leg, sightseeing and scheduled drop-off at ${dest}`;
                } else {
                    title = `En-Route Exploration & Touring`;
                    description = `Mid-tour travel, cultural attractions & scenic sightseeing`;
                }
            }

            const distanceKm = d === totalDays - 1
                ? Math.max(0, effectiveDistance - (avgDailyKm * (totalDays - 1)))
                : avgDailyKm;

            generatedItems.push({
                dayNumber,
                title,
                description,
                distanceKm: Math.round(distanceKm),
                accommodation: quotation.accommodationTotal ? Math.round(quotation.accommodationTotal / totalDays) : 0,
                meals: quotation.mealsTotal ? Math.round(quotation.mealsTotal / totalDays) : 0,
                activities: quotation.activitiesTotal ? Math.round(quotation.activitiesTotal / totalDays) : 0,
                otherCosts: quotation.otherCostsTotal ? Math.round(quotation.otherCostsTotal / totalDays) : 0,
            });
        }
        scheduleItems = generatedItems;
    }

    const tourScheduleName = quotation.tourSchedule?.name || (
        rawStops.length >= 2
            ? (rawStops[0].toLowerCase().trim() === rawStops[rawStops.length - 1].toLowerCase().trim()
                ? `${rawStops[0]} Round Trip (${totalDays} Days)`
                : `${rawStops[0]} to ${rawStops[rawStops.length - 1]}`)
            : (quotation.pickupLocation && quotation.dropLocation
                ? (quotation.pickupLocation.toLowerCase().trim() === quotation.dropLocation.toLowerCase().trim()
                    ? `${quotation.pickupLocation} Round Trip (${totalDays} Days)`
                    : `${quotation.pickupLocation} to ${quotation.dropLocation}`)
                : 'Tour Itinerary')
    );

    const tourSchedule = {
        name: tourScheduleName,
        description: quotation.tourSchedule?.description || null,
        days: totalDays,
        vehicleCategory: quotation.tourSchedule?.vehicleCategory || 'Vehicle',
        items: scheduleItems,
    };

    const driverTotal = tourSchedule.days * (quotation.driverCostPerDay || 0);
    const subtotalWithDriver = subtotal + driverTotal;
    const markupAmount = subtotalWithDriver * (quotation.markup / 100);

    return (
        <div className="w-full flex flex-col items-center mx-auto font-sans text-sm text-black leading-relaxed bg-slate-100 dark:bg-zinc-950 print:bg-transparent min-h-screen py-3 sm:py-6 md:py-8 px-2 sm:px-4 print:p-0 print:m-0 print:block">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 6mm 8mm;
                    }
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .leaflet-tile-pane,
                    .leaflet-tile {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .leaflet-control-zoom,
                    .leaflet-control-attribution {
                        display: none !important;
                    }
                    /* Content-friendly page break controls */
                    .print-avoid-break {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                    .print-heading {
                        break-after: avoid !important;
                        page-break-after: avoid !important;
                    }
                    table {
                        break-inside: auto !important;
                        page-break-inside: auto !important;
                    }
                    tr {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                    thead {
                        display: table-header-group !important;
                    }
                    tfoot {
                        display: table-footer-group !important;
                    }
                }
            `}</style>

            {/* Top Action Bar (Hidden on Print) */}
            <div className="w-full max-w-[190mm] mb-3 sm:mb-4 print:hidden">
                <PrintButton
                    label="Print / Save Quotation PDF"
                    showBack={true}
                    elementId="printable-document"
                    filename={`Quotation-${quotation.quotationNumber}`}
                    title={`Quotation #${quotation.quotationNumber}`}
                    recipientPhone={quotation.customerPhone}
                />
            </div>

            <div id="printable-document" className="w-full max-w-[190mm] mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-between shadow-md sm:shadow-lg print:shadow-none border border-gray-200 print:border-none print:p-0 print:m-0 print:w-full print:max-w-none bg-white rounded-lg sm:rounded-md print:rounded-none overflow-hidden print:overflow-visible print:block">

                {/* ── Header - 3 Column Layout on Desktop/Print, Stacked on Mobile ── */}
                <div className="flex flex-col sm:grid sm:grid-cols-[auto_1fr_auto] print:grid print:grid-cols-[auto_1fr_auto] items-start gap-3 sm:gap-4 border-b-2 border-black pb-2.5 mb-2.5 print:pb-2 print:mb-2 print-avoid-break">
                    {/* Top Row on mobile: Logo + Company Name */}
                    <div className="flex items-start gap-3 sm:contents">
                        {/* Column 1: Logo */}
                        <div className="flex items-start pt-0.5 sm:pt-1 shrink-0">
                            {businessProfile?.logoUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={businessProfile.logoUrl}
                                    alt="Company Logo"
                                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover"
                                />
                            ) : (
                                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-sm print:hidden">
                                    V
                                </div>
                            )}
                        </div>

                        {/* Column 2: Company Name & Contact */}
                        <div className="flex-1">
                            <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider">{companyName}</h1>
                            <p className="text-xs text-gray-600 mt-0.5 sm:mt-1 whitespace-pre-wrap">
                                {address && <>{address}<br /></>}
                                {phone && <>Tel: {phone}</>}
                                {email && <> | Email: {email}</>}
                            </p>
                        </div>
                    </div>

                    {/* Column 3: Quotation Details */}
                    <div className="w-full sm:w-auto text-left sm:text-right print:text-right flex sm:flex-col justify-between items-end sm:items-end border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                        <div>
                            <div className="text-2xl sm:text-3xl font-bold text-blue-700">
                                QUOTATION
                            </div>
                            <div className="text-base sm:text-lg font-bold mt-0.5">
                                NO: {quotation.quotationNumber}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                Date: {new Date(quotation.createdAt).toLocaleDateString('en-GB')}
                            </div>
                            <div className="mt-1">
                                <span className={`font-bold border px-2.5 py-0.5 sm:py-1 text-xs uppercase rounded-sm inline-block ${quotation.status === 'CONVERTED' ? 'border-emerald-600 text-emerald-700 bg-emerald-50' :
                                    quotation.status === 'ACCEPTED' ? 'border-green-600 text-green-700' :
                                    quotation.status === 'SENT' ? 'border-blue-600 text-blue-700' :
                                        quotation.status === 'EXPIRED' ? 'border-red-600 text-red-700' :
                                            'border-black text-black'
                                    }`}>
                                    {quotation.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Customer & Tour Details ── */}
                <div className="flex flex-col sm:flex-row print:flex-row gap-2.5 sm:gap-3 mb-2.5 print:mb-2 print-avoid-break">
                    <div className="w-full sm:w-1/2 print:w-1/2 bg-gray-50 p-2.5 sm:p-3 print:p-2 border border-gray-200 rounded">
                        <div className="grid grid-cols-[70px_1fr] gap-y-1 sm:gap-y-1.5 print:gap-y-0.5 gap-x-2 text-xs sm:text-sm print:text-xs">
                            <span className="font-medium text-gray-500">Customer:</span>
                            <span className="font-semibold break-words">{quotation.customerName}</span>
                            {quotation.customerPhone && (
                                <>
                                    <span className="font-medium text-gray-500">Phone:</span>
                                    <span className="break-words">{quotation.customerPhone}</span>
                                </>
                            )}
                            {quotation.customerEmail && (
                                <>
                                    <span className="font-medium text-gray-500">Email:</span>
                                    <span className="break-words">{quotation.customerEmail}</span>
                                </>
                            )}
                            <span className="font-medium text-gray-500">Persons:</span>
                            <span>{quotation.numberOfPersons}</span>
                        </div>
                    </div>
                    <div className="w-full sm:w-1/2 print:w-1/2 bg-gray-50 p-2.5 sm:p-3 print:p-2 border border-gray-200 rounded">
                        <div className="grid grid-cols-[70px_1fr] gap-y-1 sm:gap-y-1.5 print:gap-y-0.5 gap-x-2 text-xs sm:text-sm print:text-xs">
                            <span className="font-medium text-gray-500">Tour:</span>
                            <span className="font-semibold break-words">{tourSchedule.name}</span>
                            <span className="font-medium text-gray-500">Duration:</span>
                            <span>{tourSchedule.days} days</span>
                            {effectiveDistance > 0 && (
                                <>
                                    <span className="font-medium text-gray-500">Distance:</span>
                                    <span className="font-semibold text-blue-700">{effectiveDistance.toFixed(1)} km</span>
                                </>
                            )}
                            <span className="font-medium text-gray-500">Vehicle:</span>
                            <span className="break-words">{quotation.vehicleNo || '—'} ({tourSchedule.vehicleCategory})</span>
                            {quotation.driver && (
                                <>
                                    <span className="font-medium text-gray-500">Driver:</span>
                                    <span className="font-semibold text-gray-800 break-words">
                                        {quotation.driver.name}
                                    </span>
                                </>
                            )}
                            {quotation.startDate && (
                                <>
                                    <span className="font-medium text-gray-500">Period:</span>
                                    <span className="break-words">
                                        {new Date(quotation.startDate).toLocaleDateString('en-GB')}
                                        {quotation.endDate ? ` - ${new Date(quotation.endDate).toLocaleDateString('en-GB')}` : ''}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Tour Description ── */}
                {/* Only show standalone description if it differs from ALL day-item descriptions
                   to avoid duplication in the print preview */}
                {tourSchedule.description && 
                 !tourSchedule.items.some(item => item.description === tourSchedule.description) &&
                 !tourSchedule.items.some(item => item.title === tourSchedule.description) && (
                    <p className="text-[10px] italic text-gray-600 border-l-2 border-blue-500 pl-2 mb-2 leading-snug print-avoid-break">
                        {tourSchedule.description}
                    </p>
                )}

                {/* ── Vehicle Specifications ── */}
                {(quotation.vehicleSeats || quotation.vehicleAcType || quotation.vehicleFeatures || quotation.vehicleInsuranceCoverage) && (
                    <div className="mb-2 print:mb-1.5 p-2 print:p-1.5 bg-blue-50 border border-blue-200 rounded-sm print-avoid-break">
                        <h3 className="text-[10px] font-bold uppercase text-blue-700 mb-1 tracking-wide print-heading">Vehicle Specifications</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
                            {quotation.vehicleSeats && (
                                <div><span className="text-gray-500">Seats:</span> <span className="font-semibold">{quotation.vehicleSeats}</span></div>
                            )}
                            {quotation.vehicleAcType && (
                                <div><span className="text-gray-500">AC Type:</span> <span className="font-semibold">{quotation.vehicleAcType}</span></div>
                            )}
                            {finalExcessKmRate > 0 && (
                                <div><span className="text-gray-500">Excess Km Rate:</span> <span className="font-semibold">{fmt(finalExcessKmRate)}/km</span></div>
                            )}
                            {finalExtraHourRate > 0 && (
                                <div><span className="text-gray-500">Extra Hour Rate:</span> <span className="font-semibold">{fmt(finalExtraHourRate)}/hr</span></div>
                            )}
                            {quotation.vehicleInsuranceCoverage && (
                                <div className="col-span-2 border-t border-blue-100 pt-1 mt-0.5">
                                    <span className="text-gray-500">Insurance:</span> <span className="font-semibold">{quotation.vehicleInsuranceCoverage}</span>
                                </div>
                            )}
                            {quotation.vehicleFeatures && (
                                <div className="col-span-2 border-t border-blue-100 pt-1 mt-0.5">
                                    <span className="text-gray-500">Features:</span> <span className="font-semibold">{quotation.vehicleFeatures}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Day-by-Day Itinerary ── */}
                <div className="mb-2.5 print:mb-2">
                    <h3 className="text-xs font-bold uppercase text-gray-500 mb-1 tracking-wide print-heading">Day-by-Day Itinerary</h3>
                    <div className="overflow-x-auto -mx-1 sm:mx-0 print:overflow-visible">
                        <table className="w-full min-w-[540px] sm:min-w-0 text-xs border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-800 text-white">
                                    <th className="px-2 py-1.5 print:py-1 text-left w-[46px] border-r border-gray-600">Day</th>
                                    <th className="px-2 py-1.5 print:py-1 text-left border-r border-gray-600">Route / Description</th>
                                    <th className="px-2 py-1.5 print:py-1 text-right w-[44px] border-r border-gray-600">Km</th>
                                    <th className="px-2 py-1.5 print:py-1 text-right border-r border-gray-600">Transport</th>
                                    <th className="px-2 py-1.5 print:py-1 text-right border-r border-gray-600">Accomm.</th>
                                    <th className="px-2 py-1.5 print:py-1 text-right border-r border-gray-600">Meals</th>
                                    <th className="px-2 py-1.5 print:py-1 text-right border-r border-gray-600">Activities</th>
                                    <th className="px-2 py-1.5 print:py-1 text-right border-r border-gray-600">Other</th>
                                    <th className="px-2 py-1.5 print:py-1 text-right font-bold">Day Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tourSchedule.items.map((item, idx) => {
                                    const dailyTransport = (quotation.transportCost / (tourSchedule.days || 1)) + (quotation.driverCostPerDay || 0);
                                    const dayTotal = dailyTransport + item.accommodation + item.meals + item.activities + item.otherCosts;
                                    const renderAmt = (val: number) => val === 0 ? '-' : fmt(val);
                                    const dayDate = quotation.startDate 
                                        ? new Date(new Date(quotation.startDate).getTime() + (item.dayNumber - 1) * 86400000) 
                                        : null;
                                    
                                    return (
                                        <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-200`}>
                                            <td className="px-2 py-1 print:py-0.5 font-bold text-center border-r border-gray-200">
                                                <div>Day {item.dayNumber}</div>
                                                {dayDate && (
                                                    <span className="text-[10px] text-gray-500 font-normal block leading-none mt-0.5">
                                                        {dayDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-2 py-1 print:py-0.5 border-r border-gray-200">
                                                <span className="font-semibold text-xs print:text-[11px]">{item.title}</span>
                                                {item.description && (
                                                    <span className="text-[10px] text-gray-500 block leading-tight mt-0.5">{item.description}</span>
                                                )}
                                            </td>
                                            <td className="px-2 py-1 print:py-0.5 text-right border-r border-gray-200 font-mono text-xs print:text-[11px]">{item.distanceKm > 0 ? item.distanceKm : '-'}</td>
                                            <td className="px-2 py-1 print:py-0.5 text-right border-r border-gray-200 font-mono text-xs print:text-[11px]">{renderAmt(dailyTransport)}</td>
                                            <td className="px-2 py-1 print:py-0.5 text-right border-r border-gray-200 font-mono text-xs print:text-[11px]">{renderAmt(item.accommodation)}</td>
                                            <td className="px-2 py-1 print:py-0.5 text-right border-r border-gray-200 font-mono text-xs print:text-[11px]">{renderAmt(item.meals)}</td>
                                            <td className="px-2 py-1 print:py-0.5 text-right border-r border-gray-200 font-mono text-xs print:text-[11px]">{renderAmt(item.activities)}</td>
                                            <td className="px-2 py-1 print:py-0.5 text-right border-r border-gray-200 font-mono text-xs print:text-[11px]">{renderAmt(item.otherCosts)}</td>
                                            <td className="px-2 py-1 print:py-0.5 text-right font-semibold font-mono text-xs print:text-[11px]">{renderAmt(dayTotal)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Visual Route Map & Cost Summary (Side-by-side on desktop/print, stacked on mobile) ── */}
                <div className="mb-2.5 print:mb-2 print-avoid-break">
                    {routeCoordinates.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-3 items-stretch">
                            {/* Column 1: Visual Tour Route Map */}
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wide flex items-center gap-1 print-heading">
                                            <span>🗺️ Visual Tour Route Map</span>
                                        </h3>
                                        {routeWaypoints.length >= 3 && (
                                            <span className="text-[9px] font-semibold flex items-center gap-2 bg-gray-100 border border-gray-300 px-1.5 py-0.5 rounded text-gray-700">
                                                <span className="flex items-center gap-1 text-blue-700">
                                                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" /> Outbound
                                                </span>
                                                <span className="flex items-center gap-1 text-orange-700">
                                                    <span className="w-2 h-2 rounded-full bg-orange-600 inline-block" /> Return
                                                </span>
                                            </span>
                                        )}
                                    </div>
                                    {effectiveDistance > 0 && (
                                        <span className="text-[10px] text-blue-700 font-semibold font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                            {effectiveDistance.toFixed(1)} km Road Route
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 rounded border border-gray-300 overflow-hidden shadow-xs print:border-gray-400 min-h-[190px] h-[190px] print:h-[185px]">
                                    <OSRMRouteMap
                                        coordinates={routeCoordinates}
                                        waypoints={routeWaypoints}
                                        height="100%"
                                        showOverlayLegend={false}
                                    />
                                </div>
                            </div>

                            {/* Column 2: Cost Summary */}
                            <div className="flex flex-col">
                                <h3 className="text-xs font-bold uppercase text-gray-500 mb-1 tracking-wide print-heading">Cost Summary</h3>
                                <div className="border border-gray-300 rounded p-2.5 print:p-2 text-xs flex-1 flex flex-col justify-between">
                                    <div className="space-y-0.5">
                                        <div className="grid grid-cols-[1fr_auto] gap-x-2 py-0.5 border-b border-gray-200">
                                            <span className="text-gray-600">Vehicle Transport ({tourSchedule.days} days{effectiveDistance > 0 ? ` · ${effectiveDistance.toFixed(0)} km` : ''})</span>
                                            <span className="text-right font-medium">{fmt(quotation.transportCost + driverTotal)}</span>
                                        </div>
                                        {finalExcessKmRate > 0 && (
                                            <div className="text-[10px] text-gray-400 italic py-0.5 leading-tight">
                                                * Any tour distance exceeding {effectiveDistance > 0 ? `${effectiveDistance.toFixed(0)} km` : `${(tourSchedule.days * quotation.kmPerDay).toFixed(0)} km`} will be charged at {fmt(finalExcessKmRate)}/km
                                            </div>
                                        )}
                                        {finalExtraHourRate > 0 && (
                                            <div className="text-[10px] text-gray-400 italic py-0.5 leading-tight">
                                                * Extra hours charged at {fmt(finalExtraHourRate)}/hr
                                            </div>
                                        )}
                                        {quotation.accommodationTotal > 0 && (
                                            <div className="grid grid-cols-[1fr_auto] gap-x-2 py-0.5 border-b border-gray-200">
                                                <span className="text-gray-600">Accommodation</span>
                                                <span className="text-right font-medium">{fmt(quotation.accommodationTotal)}</span>
                                            </div>
                                        )}
                                        {quotation.mealsTotal > 0 && (
                                            <div className="grid grid-cols-[1fr_auto] gap-x-2 py-0.5 border-b border-gray-200">
                                                <span className="text-gray-600">Meals</span>
                                                <span className="text-right font-medium">{fmt(quotation.mealsTotal)}</span>
                                            </div>
                                        )}
                                        {quotation.activitiesTotal > 0 && (
                                            <div className="grid grid-cols-[1fr_auto] gap-x-2 py-0.5 border-b border-gray-200">
                                                <span className="text-gray-600">Activities</span>
                                                <span className="text-right font-medium">{fmt(quotation.activitiesTotal)}</span>
                                            </div>
                                        )}
                                        {quotation.otherCostsTotal > 0 && (
                                            <div className="grid grid-cols-[1fr_auto] gap-x-2 py-0.5 border-b border-gray-200">
                                                <span className="text-gray-600">Other Costs</span>
                                                <span className="text-right font-medium">{fmt(quotation.otherCostsTotal)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-1 mt-1 border-t border-black">
                                        <div className="grid grid-cols-[1fr_auto] gap-x-2 py-0.5 font-medium">
                                            <span className="text-gray-600">Subtotal</span>
                                            <span className="text-right">{fmt(subtotalWithDriver)}</span>
                                        </div>
                                        {quotation.markup > 0 && (
                                            <div className="grid grid-cols-[1fr_auto] gap-x-2 text-green-700 py-0.5">
                                                <span>Markup ({quotation.markup}%)</span>
                                                <span className="text-right font-medium">+{fmt(markupAmount)}</span>
                                            </div>
                                        )}
                                        {quotation.discount > 0 && (
                                            <div className="grid grid-cols-[1fr_auto] gap-x-2 text-red-600 py-0.5">
                                                <span>Discount</span>
                                                <span className="text-right font-medium">-{fmt(quotation.discount)}</span>
                                            </div>
                                        )}
                                        <div className="border-t-2 border-black pt-1 mt-1 grid grid-cols-[1fr_auto] gap-x-2 text-sm font-bold py-0.5 items-center">
                                            <span>TOTAL AMOUNT</span>
                                            <div className="text-right">
                                                <span className="bg-gray-100 px-2 py-0.5 border border-gray-300 rounded-sm">{fmt(quotation.totalAmount)}</span>
                                                {businessProfile?.usdRate && businessProfile.usdRate > 0 && (
                                                    <div className="text-[11px] text-gray-600 font-medium mt-0.5">
                                                        ≈ {formatCurrency(quotation.totalAmount / businessProfile.usdRate, 'USD')} <span className="text-[9px] text-gray-400 font-normal">(1 USD ≈ {fmt(businessProfile.usdRate)})</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-md ml-auto">
                            <h3 className="text-xs font-bold uppercase text-gray-500 mb-1 tracking-wide print-heading">Cost Summary</h3>
                            <div className="border border-gray-300 rounded p-2.5 print:p-2 text-xs">
                                <div className="space-y-0.5">
                                    <div className="grid grid-cols-[1fr_auto] gap-x-2 py-0.5 border-b border-gray-200">
                                        <span className="text-gray-600">Vehicle Transport ({tourSchedule.days} days{effectiveDistance > 0 ? ` · ${effectiveDistance.toFixed(0)} km` : ''})</span>
                                        <span className="text-right font-medium">{fmt(quotation.transportCost + driverTotal)}</span>
                                    </div>
                                    {finalExcessKmRate > 0 && (
                                        <div className="text-[10px] text-gray-400 italic py-0.5 leading-tight">
                                            * Any tour distance exceeding {effectiveDistance > 0 ? `${effectiveDistance.toFixed(0)} km` : `${(tourSchedule.days * quotation.kmPerDay).toFixed(0)} km`} will be charged at {fmt(finalExcessKmRate)}/km
                                        </div>
                                    )}
                                    {finalExtraHourRate > 0 && (
                                        <div className="text-[10px] text-gray-400 italic py-0.5 leading-tight">
                                            * Extra hours charged at {fmt(finalExtraHourRate)}/hr
                                        </div>
                                    )}
                                    {quotation.accommodationTotal > 0 && (
                                        <div className="grid grid-cols-[1fr_auto] gap-x-2 py-0.5 border-b border-gray-200">
                                            <span className="text-gray-600">Accommodation</span>
                                            <span className="text-right font-medium">{fmt(quotation.accommodationTotal)}</span>
                                        </div>
                                    )}
                                    {quotation.mealsTotal > 0 && (
                                        <div className="grid grid-cols-[1fr_auto] gap-x-2 py-0.5 border-b border-gray-200">
                                            <span className="text-gray-600">Meals</span>
                                            <span className="text-right font-medium">{fmt(quotation.mealsTotal)}</span>
                                        </div>
                                    )}
                                    {quotation.activitiesTotal > 0 && (
                                        <div className="grid grid-cols-[1fr_auto] gap-x-2 py-0.5 border-b border-gray-200">
                                            <span className="text-gray-600">Activities</span>
                                            <span className="text-right font-medium">{fmt(quotation.activitiesTotal)}</span>
                                        </div>
                                    )}
                                    {quotation.otherCostsTotal > 0 && (
                                        <div className="grid grid-cols-[1fr_auto] gap-x-2 py-0.5 border-b border-gray-200">
                                            <span className="text-gray-600">Other Costs</span>
                                            <span className="text-right font-medium">{fmt(quotation.otherCostsTotal)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-1 mt-1 border-t border-black">
                                    <div className="grid grid-cols-[1fr_auto] gap-x-2 py-0.5 font-medium">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="text-right">{fmt(subtotalWithDriver)}</span>
                                    </div>
                                    {quotation.markup > 0 && (
                                        <div className="grid grid-cols-[1fr_auto] gap-x-2 text-green-700 py-0.5">
                                            <span>Markup ({quotation.markup}%)</span>
                                            <span className="text-right font-medium">+{fmt(markupAmount)}</span>
                                        </div>
                                    )}
                                    {quotation.discount > 0 && (
                                        <div className="grid grid-cols-[1fr_auto] gap-x-2 text-red-600 py-0.5">
                                            <span>Discount</span>
                                            <span className="text-right font-medium">-{fmt(quotation.discount)}</span>
                                        </div>
                                    )}
                                    <div className="border-t-2 border-black pt-1 mt-1 grid grid-cols-[1fr_auto] gap-x-2 text-sm font-bold py-0.5 items-center">
                                        <span>TOTAL AMOUNT</span>
                                        <div className="text-right">
                                            <span className="bg-gray-100 px-2 py-0.5 border border-gray-300 rounded-sm">{fmt(quotation.totalAmount)}</span>
                                            {businessProfile?.usdRate && businessProfile.usdRate > 0 && (
                                                <div className="text-[11px] text-gray-600 font-medium mt-0.5">
                                                    ≈ {formatCurrency(quotation.totalAmount / businessProfile.usdRate, 'USD')} <span className="text-[9px] text-gray-400 font-normal">(1 USD ≈ {fmt(businessProfile.usdRate)})</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Terms, Excluded Items, Advance Payment & Signatures ── */}
                <div className="print-avoid-break space-y-1.5 print:space-y-1">
                    {/* ── Excluded Items ── */}
                    {quotation.excludedItems && (
                        <div className="text-xs">
                            <div className="p-2 sm:p-2.5 print:p-1.5 bg-red-50 border border-red-200 rounded">
                                <span className="font-bold text-red-700">Not Included: </span>
                                <span className="whitespace-pre-wrap text-red-600">{quotation.excludedItems}</span>
                            </div>
                        </div>
                    )}

                    {/* ── Advance Payment & Bank Details ── */}
                    {quotation.advanceAmount > 0 && (
                        <div className="text-xs">
                            <div className="p-2 sm:p-2.5 print:p-1.5 bg-green-50 border border-green-200 rounded">
                                <span className="font-bold text-green-700">Advance Payment Required: </span>
                                <span className="font-bold text-green-800">{fmt(quotation.advanceAmount)}</span>
                                {businessProfile?.usdRate && businessProfile.usdRate > 0 && (
                                    <span className="ml-1.5 text-[11px] text-green-700 font-medium">
                                        (≈ {formatCurrency(quotation.advanceAmount / businessProfile.usdRate, 'USD')})
                                    </span>
                                )}
                                {businessProfile?.bankAccountNo && (
                                    <div className="mt-0.5 text-green-700 text-[11px]">
                                        <span className="font-semibold">Bank: </span>{businessProfile.bankName || 'N/A'}
                                        {businessProfile.bankBranch && <> — {businessProfile.bankBranch} Branch</>}
                                        {' | '}
                                        <span className="font-semibold">A/C No: </span>{businessProfile.bankAccountNo}
                                        {businessProfile.bankAccountName && (
                                             <> ({businessProfile.bankAccountName})</>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Notes & Validity ── */}
                    {(quotation.notes || quotation.validUntil) && (
                        <div className="text-xs space-y-1">
                            {quotation.notes && (
                                <div className="p-2 sm:p-2.5 print:p-1.5 bg-yellow-50 border border-yellow-200 rounded">
                                    <span className="font-bold text-gray-700">Notes & Terms: </span>
                                    <span className="whitespace-pre-wrap">{quotation.notes}</span>
                                </div>
                            )}
                            {quotation.validUntil && (
                                <p className="font-bold text-red-600 text-[11px]">
                                    ⚠ This quotation is valid until: {new Date(quotation.validUntil).toLocaleDateString('en-GB')} {new Date(quotation.validUntil).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── Signatures ── */}
                    <div className="pt-3 print:pt-2 grid grid-cols-2 gap-4 sm:gap-8 text-xs">
                        <div className="text-center border-t border-dotted border-black pt-1 text-gray-500">
                            Customer Signature
                        </div>
                        <div className="text-center border-t border-dotted border-black pt-1 text-gray-500">
                            Authorized Signature
                        </div>
                    </div>

                    {/* ── Footer ── */}
                    <div className="text-center text-[10px] text-gray-400 pt-1.5 pb-0.5">
                        System Generated Quotation | Thank you for choosing {companyName}!
                        <div className="mt-0.5 text-[9px] opacity-70">
                            Powered by <span className="font-semibold text-black">Bitgard PVT LTD</span> (+94 70 563 3969)
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Button - Below content, matching width */}
            <div className="w-full max-w-[190mm] mt-4 sm:mt-6 mb-8 print:hidden">
                <PrintButton
                    label="Print / Save Quotation PDF"
                    showBack={true}
                    elementId="printable-document"
                    filename={`Quotation-${quotation.quotationNumber}`}
                    title={`Quotation #${quotation.quotationNumber}`}
                    recipientPhone={quotation.customerPhone}
                />
            </div>
        </div>
    );
}
