'use client';

import { useEffect } from 'react';
import { PrintButton } from '@/components/PrintButton';
import { formatCurrency } from '@/lib/calculations';

interface QuotationData {
    id: string;
    quotationNumber: number;
    customerName: string;
    customerEmail: string | null;
    customerPhone: string | null;
    vehicleNo: string | null;
    numberOfPersons: number;
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
    tourSchedule: {
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
    };
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
}

interface QuotationTemplateProps {
    quotation: QuotationData;
    businessProfile?: BusinessProfileData;
}

export function QuotationTemplate({ quotation, businessProfile }: QuotationTemplateProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

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

    const driverTotal = quotation.tourSchedule.days * (quotation.driverCostPerDay || 0);
    const subtotalWithDriver = subtotal + driverTotal;
    const markupAmount = subtotalWithDriver * (quotation.markup / 100);

    return (
        <div className="flex flex-col items-center mx-auto font-sans text-sm text-black leading-relaxed">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>

            <div className="w-[190mm] mx-auto p-8 flex flex-col justify-between shadow-lg print:shadow-none border border-gray-200 print:border-none print:p-10 bg-white overflow-hidden">

                {/* ── Header - 3 Column Layout ── */}
                <div className="grid grid-cols-[auto_1fr_auto] items-start gap-4 border-b-2 border-black pb-3 mb-5">
                    {/* Column 1: Logo */}
                    <div className="flex items-start pt-1">
                        {businessProfile?.logoUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={businessProfile.logoUrl}
                                alt="Company Logo"
                                className="h-14 w-14 rounded-full object-cover"
                            />
                        ) : (
                            <div className="h-14 w-14" />
                        )}
                    </div>

                    {/* Column 2: Company Name & Contact */}
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-wider">{companyName}</h1>
                        <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                            {address && <>{address}<br /></>}
                            {phone && <>Tel: {phone}</>}
                            {email && <> | Email: {email}</>}
                        </p>
                    </div>

                    {/* Column 3: Quotation Details */}
                    <div className="text-right">
                        <div className="text-3xl font-bold text-blue-700">
                            QUOTATION
                        </div>
                        <div className="text-lg font-bold mt-0.5">
                            NO: {quotation.quotationNumber}
                        </div>
                        <div className="text-sm text-gray-500 mt-0.5">
                            Date: {new Date(quotation.createdAt).toLocaleDateString('en-GB')}
                        </div>
                        <div className="mt-1">
                            <span className={`font-bold border px-2.5 py-1 text-xs uppercase rounded-sm ${quotation.status === 'ACCEPTED' ? 'border-green-600 text-green-700' :
                                quotation.status === 'SENT' ? 'border-blue-600 text-blue-700' :
                                    quotation.status === 'EXPIRED' ? 'border-red-600 text-red-700' :
                                        'border-black text-black'
                                }`}>
                                {quotation.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Customer & Tour Details ── */}
                <div className="flex gap-4 mb-5">
                    <div className="w-1/2 bg-gray-50 p-3 border border-gray-200 rounded">
                        <div className="grid grid-cols-[75px_1fr] gap-y-1.5 gap-x-2 text-sm">
                            <span className="font-medium text-gray-500">Customer:</span>
                            <span className="font-semibold">{quotation.customerName}</span>
                            {quotation.customerPhone && (
                                <>
                                    <span className="font-medium text-gray-500">Phone:</span>
                                    <span>{quotation.customerPhone}</span>
                                </>
                            )}
                            {quotation.customerEmail && (
                                <>
                                    <span className="font-medium text-gray-500">Email:</span>
                                    <span>{quotation.customerEmail}</span>
                                </>
                            )}
                            <span className="font-medium text-gray-500">Persons:</span>
                            <span>{quotation.numberOfPersons}</span>
                        </div>
                    </div>
                    <div className="w-1/2 bg-gray-50 p-3 border border-gray-200 rounded">
                        <div className="grid grid-cols-[75px_1fr] gap-y-1.5 gap-x-2 text-sm">
                            <span className="font-medium text-gray-500">Tour:</span>
                            <span className="font-semibold">{quotation.tourSchedule.name}</span>
                            <span className="font-medium text-gray-500">Duration:</span>
                            <span>{quotation.tourSchedule.days} days</span>
                            <span className="font-medium text-gray-500">Vehicle:</span>
                            <span>{quotation.vehicleNo || '—'} ({quotation.tourSchedule.vehicleCategory})</span>
                            {quotation.startDate && (
                                <>
                                    <span className="font-medium text-gray-500">Period:</span>
                                    <span>
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
                {quotation.tourSchedule.description && 
                 !quotation.tourSchedule.items.some(item => item.description === quotation.tourSchedule.description) &&
                 !quotation.tourSchedule.items.some(item => item.title === quotation.tourSchedule.description) && (
                    <p className="text-[10px] italic text-gray-600 border-l-2 border-blue-500 pl-2 mb-3 leading-snug">
                        {quotation.tourSchedule.description}
                    </p>
                )}

                {/* ── Vehicle Specifications ── */}
                {(quotation.vehicleSeats || quotation.vehicleAcType || quotation.vehicleFeatures || quotation.vehicleInsuranceCoverage) && (
                    <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-sm">
                        <h3 className="text-[10px] font-bold uppercase text-blue-700 mb-1 tracking-wide">Vehicle Specifications</h3>
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
                <div className="mb-3">
                    <h3 className="text-xs font-bold uppercase text-gray-500 mb-1.5 tracking-wide">Day-by-Day Itinerary</h3>
                    <table className="w-full text-xs border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-800 text-white">
                                <th className="px-2 py-1.5 text-left w-[36px] border-r border-gray-600">Day</th>
                                <th className="px-2 py-1.5 text-left border-r border-gray-600">Route / Description</th>
                                <th className="px-2 py-1.5 text-right w-[40px] border-r border-gray-600">Km</th>
                                <th className="px-2 py-1.5 text-right border-r border-gray-600">Accomm.</th>
                                <th className="px-2 py-1.5 text-right border-r border-gray-600">Meals</th>
                                <th className="px-2 py-1.5 text-right border-r border-gray-600">Activities</th>
                                <th className="px-2 py-1.5 text-right border-r border-gray-600">Other</th>
                                <th className="px-2 py-1.5 text-right font-bold">Day Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotation.tourSchedule.items.map((item, idx) => {
                                const dayTotal = item.accommodation + item.meals + item.activities + item.otherCosts;
                                return (
                                    <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-200`}>
                                        <td className="px-2 py-1.5 font-bold text-center border-r border-gray-200">{item.dayNumber}</td>
                                        <td className="px-2 py-1.5 border-r border-gray-200">
                                            <span className="font-semibold">{item.title}</span>
                                            {item.description && (
                                                <span className="text-[11px] text-gray-500 block leading-snug mt-0.5">{item.description}</span>
                                            )}
                                        </td>
                                        <td className="px-2 py-1.5 text-right border-r border-gray-200">{item.distanceKm}</td>
                                        <td className="px-2 py-1.5 text-right border-r border-gray-200">{fmt(item.accommodation)}</td>
                                        <td className="px-2 py-1.5 text-right border-r border-gray-200">{fmt(item.meals)}</td>
                                        <td className="px-2 py-1.5 text-right border-r border-gray-200">{fmt(item.activities)}</td>
                                        <td className="px-2 py-1.5 text-right border-r border-gray-200">{fmt(item.otherCosts)}</td>
                                        <td className="px-2 py-1.5 text-right font-semibold">{fmt(dayTotal)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* ── Cost Summary ── */}
                <div className="mb-3">
                    <div>
                        <h3 className="text-xs font-bold uppercase text-gray-500 mb-1.5 tracking-wide">Cost Summary</h3>
                        <div className="border border-gray-300 rounded p-3 text-sm">
                            <div className="grid grid-cols-[1fr_auto] gap-x-4 py-1 border-b border-gray-200">
                                <span className="text-gray-600">Van Hire ({quotation.tourSchedule.days} days × {fmt(quotation.hireRatePerDay)}/day for {(quotation.tourSchedule.days * quotation.kmPerDay).toFixed(0)} km)</span>
                                <span className="text-right">{fmt(quotation.transportCost)}</span>
                            </div>
                            {finalExcessKmRate > 0 && (
                                <div className="text-xs text-gray-400 italic py-0.5">
                                    Any km exceeding {(quotation.tourSchedule.days * quotation.kmPerDay).toFixed(0)} km charged at {fmt(finalExcessKmRate)}/km
                                </div>
                            )}
                            {finalExtraHourRate > 0 && (
                                <div className="text-xs text-gray-400 italic py-0.5">
                                    Extra hours charged at {fmt(finalExtraHourRate)}/hr
                                </div>
                            )}
                            <div className="grid grid-cols-[1fr_auto] gap-x-4 py-1 border-b border-gray-200">
                                <span className="text-gray-600">Accommodation</span>
                                <span className="text-right">{fmt(quotation.accommodationTotal)}</span>
                            </div>
                            <div className="grid grid-cols-[1fr_auto] gap-x-4 py-1 border-b border-gray-200">
                                <span className="text-gray-600">Meals</span>
                                <span className="text-right">{fmt(quotation.mealsTotal)}</span>
                            </div>
                            <div className="grid grid-cols-[1fr_auto] gap-x-4 py-1 border-b border-gray-200">
                                <span className="text-gray-600">Activities</span>
                                <span className="text-right">{fmt(quotation.activitiesTotal)}</span>
                            </div>
                            <div className="grid grid-cols-[1fr_auto] gap-x-4 py-1">
                                <span className="text-gray-600">Other Costs</span>
                                <span className="text-right">{fmt(quotation.otherCostsTotal)}</span>
                            </div>
                            {driverTotal > 0 && (
                                <div className="grid grid-cols-[1fr_auto] gap-x-4 py-1">
                                    <span className="text-gray-600">Driver ({quotation.tourSchedule.days} days × {fmt(quotation.driverCostPerDay)}/day)</span>
                                    <span className="text-right">{fmt(driverTotal)}</span>
                                </div>
                            )}

                            <div className="border-t border-black pt-1 mt-1 grid grid-cols-[1fr_auto] gap-x-4 py-1">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="text-right font-medium">{fmt(subtotalWithDriver)}</span>
                            </div>
                            {quotation.markup > 0 && (
                                <div className="grid grid-cols-[1fr_auto] gap-x-4 text-green-700 py-1">
                                    <span>Markup ({quotation.markup}%)</span>
                                    <span className="text-right">+{fmt(markupAmount)}</span>
                                </div>
                            )}
                            {quotation.discount > 0 && (
                                <div className="grid grid-cols-[1fr_auto] gap-x-4 text-red-600 py-1">
                                    <span>Discount</span>
                                    <span className="text-right">-{fmt(quotation.discount)}</span>
                                </div>
                            )}

                            <div className="border-t-2 border-black pt-1.5 mt-1.5 grid grid-cols-[1fr_auto] gap-x-4 text-base font-bold py-1">
                                <span>TOTAL AMOUNT</span>
                                <span className="text-right bg-gray-100 px-2 py-0.5 border border-gray-300 rounded-sm">{fmt(quotation.totalAmount)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Excluded Items ── */}
                {quotation.excludedItems && (
                    <div className="mb-3 text-xs">
                        <div className="p-3 bg-red-50 border border-red-200 rounded">
                            <span className="font-bold text-red-700">Not Included: </span>
                            <span className="whitespace-pre-wrap text-red-600">{quotation.excludedItems}</span>
                        </div>
                    </div>
                )}

                {/* ── Advance Payment & Bank Details ── */}
                {quotation.advanceAmount > 0 && (
                    <div className="mb-3 text-xs">
                        <div className="p-3 bg-green-50 border border-green-200 rounded">
                            <span className="font-bold text-green-700">Advance Payment Required: </span>
                            <span className="font-bold text-green-800 text-sm">{fmt(quotation.advanceAmount)}</span>
                            {businessProfile?.bankAccountNo && (
                                <div className="mt-1 text-green-700">
                                    <span className="font-semibold">Bank: </span>{businessProfile.bankName || 'N/A'}
                                    {businessProfile.bankBranch && <> — {businessProfile.bankBranch} Branch</>}
                                    <br />
                                    <span className="font-semibold">A/C No: </span>{businessProfile.bankAccountNo}
                                    {businessProfile.bankAccountName && (
                                        <> — <span className="font-semibold">Name: </span>{businessProfile.bankAccountName}</>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Notes & Validity ── */}
                {(quotation.notes || quotation.validUntil) && (
                    <div className="mb-3 text-xs space-y-1.5">
                        {quotation.notes && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                                <span className="font-bold text-gray-700">Notes & Terms: </span>
                                <span className="whitespace-pre-wrap">{quotation.notes}</span>
                            </div>
                        )}
                        {quotation.validUntil && (
                            <p className="font-bold text-red-600">
                                ⚠ This quotation is valid until: {new Date(quotation.validUntil).toLocaleDateString('en-GB')} {new Date(quotation.validUntil).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        )}
                    </div>
                )}

                {/* ── Signatures ── */}
                <div className="mt-auto pt-10 grid grid-cols-2 gap-8 text-xs">
                    <div className="text-center border-t border-dotted border-black pt-1.5 text-gray-500">
                        Customer Signature
                    </div>
                    <div className="text-center border-t border-dotted border-black pt-1.5 text-gray-500">
                        Authorized Signature
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="text-center text-[10px] text-gray-400 mt-4">
                    System Generated Quotation | Thank you for choosing {companyName}!
                    <div className="mt-1 text-[9px] opacity-70">
                        Powered by <span className="font-semibold text-black">Bitgard PVT LTD</span> (+94 70 563 3969)
                    </div>
                </div>
            </div>

            {/* Print Button - Below content, matching width */}
            <div className="w-[190mm] mt-6 mb-8 print:hidden">
                <PrintButton />
            </div>
        </div>
    );
}
