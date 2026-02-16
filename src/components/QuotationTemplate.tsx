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
    hireRatePerKm: number;
    totalDistance: number;
    transportCost: number;
    accommodationTotal: number;
    mealsTotal: number;
    activitiesTotal: number;
    otherCostsTotal: number;
    markup: number;
    discount: number;
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
}

interface BusinessProfileData {
    companyName: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
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

    const companyName = businessProfile?.companyName || 'TourBiller Transport';
    const address = businessProfile?.address || '';
    const phone = businessProfile?.phone || '';
    const email = businessProfile?.email || '';

    const fmt = formatCurrency;

    const subtotal =
        quotation.transportCost +
        quotation.accommodationTotal +
        quotation.mealsTotal +
        quotation.activitiesTotal +
        quotation.otherCostsTotal;

    const markupAmount = subtotal * (quotation.markup / 100);

    return (
        <div className="mx-auto bg-white font-mono text-[11px] text-black leading-snug">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 8mm 10mm;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>

            <div className="w-[190mm] mx-auto p-6 print:p-0 flex flex-col">

                {/* ── Header ── */}
                <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-4">
                    <div className="w-1/2">
                        <h1 className="text-xl font-bold uppercase tracking-wider">{companyName}</h1>
                        <p className="text-[10px] text-gray-600 mt-1 whitespace-pre-wrap">
                            {address && <>{address}<br /></>}
                            {phone && <>Tel: {phone}</>}
                            {email && <> | Email: {email}</>}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-blue-700">
                            QUOTATION
                        </div>
                        <div className="text-base font-bold mt-0.5">
                            Q-{String(quotation.quotationNumber).padStart(4, '0')}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                            Date: {new Date(quotation.createdAt).toLocaleDateString()}
                        </div>
                        <div className="mt-1">
                            <span className={`font-bold border px-2 py-0.5 text-[10px] uppercase ${quotation.status === 'ACCEPTED' ? 'border-green-600 text-green-700' :
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
                <div className="flex gap-4 mb-4">
                    <div className="w-1/2 bg-gray-50 p-2.5 border border-gray-200 rounded-sm">
                        <div className="grid grid-cols-[70px_1fr] gap-y-0.5 gap-x-2 text-[11px]">
                            <span className="font-semibold text-gray-500">Customer:</span>
                            <span className="font-bold">{quotation.customerName}</span>
                            {quotation.customerPhone && (
                                <>
                                    <span className="font-semibold text-gray-500">Phone:</span>
                                    <span>{quotation.customerPhone}</span>
                                </>
                            )}
                            {quotation.customerEmail && (
                                <>
                                    <span className="font-semibold text-gray-500">Email:</span>
                                    <span>{quotation.customerEmail}</span>
                                </>
                            )}
                            <span className="font-semibold text-gray-500">Persons:</span>
                            <span>{quotation.numberOfPersons}</span>
                        </div>
                    </div>
                    <div className="w-1/2 bg-gray-50 p-2.5 border border-gray-200 rounded-sm">
                        <div className="grid grid-cols-[70px_1fr] gap-y-0.5 gap-x-2 text-[11px]">
                            <span className="font-semibold text-gray-500">Tour:</span>
                            <span className="font-bold">{quotation.tourSchedule.name}</span>
                            <span className="font-semibold text-gray-500">Duration:</span>
                            <span>{quotation.tourSchedule.days} days</span>
                            <span className="font-semibold text-gray-500">Vehicle:</span>
                            <span>{quotation.vehicleNo || '—'} ({quotation.tourSchedule.vehicleCategory})</span>
                            {quotation.startDate && (
                                <>
                                    <span className="font-semibold text-gray-500">Start:</span>
                                    <span>{new Date(quotation.startDate).toLocaleDateString()}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Tour Description ── */}
                {quotation.tourSchedule.description && (
                    <p className="text-[10px] italic text-gray-600 border-l-2 border-blue-500 pl-2 mb-3 leading-snug">
                        {quotation.tourSchedule.description}
                    </p>
                )}

                {/* ── Day-by-Day Itinerary ── */}
                <div className="mb-3">
                    <h3 className="text-[10px] font-bold uppercase text-gray-500 mb-1 tracking-wide">Day-by-Day Itinerary</h3>
                    <table className="w-full text-[10px] border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-800 text-white">
                                <th className="px-1.5 py-1 text-left w-[32px] border-r border-gray-600">Day</th>
                                <th className="px-1.5 py-1 text-left border-r border-gray-600">Route / Description</th>
                                <th className="px-1.5 py-1 text-right w-[35px] border-r border-gray-600">Km</th>
                                <th className="px-1.5 py-1 text-right border-r border-gray-600">Accomm.</th>
                                <th className="px-1.5 py-1 text-right border-r border-gray-600">Meals</th>
                                <th className="px-1.5 py-1 text-right border-r border-gray-600">Activities</th>
                                <th className="px-1.5 py-1 text-right border-r border-gray-600">Other</th>
                                <th className="px-1.5 py-1 text-right font-bold">Day Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotation.tourSchedule.items.map((item, idx) => {
                                const dayTotal = item.accommodation + item.meals + item.activities + item.otherCosts;
                                return (
                                    <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-200`}>
                                        <td className="px-1.5 py-1 font-bold text-center border-r border-gray-200">{item.dayNumber}</td>
                                        <td className="px-1.5 py-1 border-r border-gray-200">
                                            <span className="font-semibold">{item.title}</span>
                                            {item.description && (
                                                <span className="text-[9px] text-gray-500 block leading-tight">{item.description}</span>
                                            )}
                                        </td>
                                        <td className="px-1.5 py-1 text-right border-r border-gray-200">{item.distanceKm}</td>
                                        <td className="px-1.5 py-1 text-right border-r border-gray-200">{fmt(item.accommodation)}</td>
                                        <td className="px-1.5 py-1 text-right border-r border-gray-200">{fmt(item.meals)}</td>
                                        <td className="px-1.5 py-1 text-right border-r border-gray-200">{fmt(item.activities)}</td>
                                        <td className="px-1.5 py-1 text-right border-r border-gray-200">{fmt(item.otherCosts)}</td>
                                        <td className="px-1.5 py-1 text-right font-semibold">{fmt(dayTotal)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* ── Cost Summary ── */}
                <div className="flex justify-end mb-3">
                    <div className="w-[280px]">
                        <h3 className="text-[10px] font-bold uppercase text-gray-500 mb-1 tracking-wide">Cost Summary</h3>
                        <div className="border border-gray-300 rounded-sm p-2 text-[11px] space-y-0.5">
                            <div className="grid grid-cols-[1fr_auto] gap-x-4">
                                <span className="text-gray-600">Transport ({quotation.totalDistance.toFixed(0)} km × {fmt(quotation.hireRatePerKm)}/km)</span>
                                <span className="text-right">{fmt(quotation.transportCost)}</span>
                            </div>
                            <div className="grid grid-cols-[1fr_auto] gap-x-4">
                                <span className="text-gray-600">Accommodation</span>
                                <span className="text-right">{fmt(quotation.accommodationTotal)}</span>
                            </div>
                            <div className="grid grid-cols-[1fr_auto] gap-x-4">
                                <span className="text-gray-600">Meals</span>
                                <span className="text-right">{fmt(quotation.mealsTotal)}</span>
                            </div>
                            <div className="grid grid-cols-[1fr_auto] gap-x-4">
                                <span className="text-gray-600">Activities</span>
                                <span className="text-right">{fmt(quotation.activitiesTotal)}</span>
                            </div>
                            <div className="grid grid-cols-[1fr_auto] gap-x-4">
                                <span className="text-gray-600">Other Costs</span>
                                <span className="text-right">{fmt(quotation.otherCostsTotal)}</span>
                            </div>

                            <div className="border-t border-black pt-1 mt-1 grid grid-cols-[1fr_auto] gap-x-4">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="text-right font-medium">{fmt(subtotal)}</span>
                            </div>
                            {quotation.markup > 0 && (
                                <div className="grid grid-cols-[1fr_auto] gap-x-4 text-green-700">
                                    <span>Markup ({quotation.markup}%)</span>
                                    <span className="text-right">+{fmt(markupAmount)}</span>
                                </div>
                            )}
                            {quotation.discount > 0 && (
                                <div className="grid grid-cols-[1fr_auto] gap-x-4 text-red-600">
                                    <span>Discount</span>
                                    <span className="text-right">-{fmt(quotation.discount)}</span>
                                </div>
                            )}

                            <div className="border-t-2 border-black pt-1 mt-1 grid grid-cols-[1fr_auto] gap-x-4 text-sm font-bold">
                                <span>TOTAL AMOUNT</span>
                                <span className="text-right bg-gray-100 px-1 border border-gray-300">{fmt(quotation.totalAmount)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Notes & Validity ── */}
                {(quotation.notes || quotation.validUntil) && (
                    <div className="mb-3 text-[10px] space-y-1">
                        {quotation.notes && (
                            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-sm">
                                <span className="font-bold text-gray-700">Notes & Terms: </span>
                                <span className="whitespace-pre-wrap">{quotation.notes}</span>
                            </div>
                        )}
                        {quotation.validUntil && (
                            <p className="font-bold text-red-600">
                                ⚠ This quotation is valid until: {new Date(quotation.validUntil).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                )}

                {/* ── Signatures ── */}
                <div className="mt-auto pt-8 grid grid-cols-2 gap-8 text-[10px]">
                    <div className="text-center border-t border-dotted border-black pt-1">
                        Customer Signature
                    </div>
                    <div className="text-center border-t border-dotted border-black pt-1">
                        Authorized Signature
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="text-center text-[9px] text-gray-400 mt-3">
                    System Generated Quotation | Thank you for choosing {companyName}!
                    <div className="mt-0.5 text-[8px] opacity-70">
                        Powered by <span className="font-semibold text-black">Bitgard PVT LTD</span> (+94 70 563 3969)
                    </div>
                </div>
            </div>

            {/* Print Button (screen only) */}
            <div className="mt-4 text-center print:hidden">
                <PrintButton />
            </div>
        </div>
    );
}
