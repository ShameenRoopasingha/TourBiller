'use client';

import { useEffect } from 'react';
import { type Bill } from '@/lib/validations';
import { formatCurrency } from '@/lib/calculations';
import { PrintButton } from '@/components/PrintButton';

import { BusinessProfile } from '@/lib/validations';

interface InvoiceTemplateProps {
    bill: Bill;
    businessProfile?: BusinessProfile;
}

export function InvoiceTemplate({ bill, businessProfile }: InvoiceTemplateProps) {
    useEffect(() => {
        // Auto-print when component mounts
        const timer = setTimeout(() => {
            window.print();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const companyName = businessProfile?.companyName || 'TourBiller Transport';
    const address = businessProfile?.address || 'No. 123, Transport Lane, Cityville';
    const phone = businessProfile?.phone || '(555) 123-4567';
    const email = businessProfile?.email ? `Email: ${businessProfile.email}` : '';


    return (
        <div className="mx-auto bg-white font-mono text-xs text-black leading-tight">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A5 landscape;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 10mm;
                    }
                }
            `}</style>

            {/* Main Container - A5 Landscape approx 210mm x 148mm (minus margins) */}
            <div className="w-[190mm] h-[128mm] flex flex-col justify-between">

                {/* Header Section */}
                <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-2">
                    <div className="w-1/2">
                        <h1 className="text-xl font-bold uppercase tracking-wider">{companyName}</h1>
                        <p className="text-[10px] text-gray-600 mt-1 whitespace-pre-wrap">
                            {address}
                            <br />
                            Tel: {phone} {email && `| ${email}`}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-red-600">INVOICE NO: {bill.billNumber}</div>
                        <div className="text-xs">Date: {new Date(bill.createdAt).toLocaleDateString()}</div>
                        <div className="mt-1">
                            <span className="font-bold border border-black px-2 py-0.5 text-[10px] uppercase">
                                {bill.paymentMethod || 'CASH'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content Grid - Side by Side */}
                <div className="flex gap-4 flex-1">

                    {/* Left Column: Trip Details */}
                    <div className="w-[45%] space-y-3">
                        <div className="bg-gray-50 p-2 border border-gray-200 rounded-sm">
                            <div className="grid grid-cols-[80px_1fr] gap-1 text-[11px]">
                                <span className="font-semibold text-gray-600">Customer:</span>
                                <span className="font-bold truncate">{bill.customerName}</span>

                                <span className="font-semibold text-gray-600">Vehicle:</span>
                                <span className="font-bold">{bill.vehicleNo}</span>

                                <span className="font-semibold text-gray-600">Route:</span>
                                <span className="font-bold leading-tight">{bill.route}</span>
                            </div>
                        </div>

                        <div className="text-[10px] space-y-1 pt-2">
                            <div className="flex flex-col gap-1">
                                <span>Start: {new Date(bill.createdAt).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                <span>End:&nbsp;&nbsp;&nbsp;{new Date().toLocaleDateString()} --:--</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Calculations */}
                    <div className="w-[55%]">
                        <div className="grid grid-cols-12 gap-y-1 text-[11px]">
                            {/* Header Row */}
                            <div className="col-span-12 grid grid-cols-12 border-b border-black pb-1 mb-1 font-semibold text-[10px] uppercase text-gray-600">
                                <div className="col-span-8">Description</div>
                                <div className="col-span-4 text-right">Amount</div>
                            </div>

                            {/* Mileage */}
                            <div className="col-span-8 flex justify-between pr-2">
                                <span>Mileage Cost</span>
                                <span className="text-[10px] text-gray-500">
                                    ({bill.endMeter} - {bill.startMeter} = {(bill.endMeter - bill.startMeter).toFixed(1)} km @ {bill.hireRate})
                                </span>
                            </div>
                            <div className="col-span-4 text-right font-medium">
                                {formatCurrency((bill.endMeter - bill.startMeter) * bill.hireRate)}
                            </div>

                            {/* Extra Charges */}
                            <div className="col-span-8">Waiting Charges</div>
                            <div className="col-span-4 text-right font-medium">{formatCurrency(bill.waitingCharge)}</div>

                            <div className="col-span-8">Gate Pass</div>
                            <div className="col-span-4 text-right font-medium">{formatCurrency(bill.gatePass)}</div>

                            <div className="col-span-8">Package Charge</div>
                            <div className="col-span-4 text-right font-medium">{formatCurrency(bill.packageCharge)}</div>

                            {/* Totals */}
                            <div className="col-span-12 border-t-2 border-black mt-2 pt-1"></div>

                            <div className="col-span-6 font-bold text-lg text-right pr-2">TOTAL</div>
                            <div className="col-span-6 text-right font-bold text-lg bg-gray-100 px-1 border border-gray-300">
                                {formatCurrency(bill.totalAmount)}
                            </div>
                            <div className="col-span-12 border-b-2 double border-black mt-1"></div>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="mt-4 pt-10 grid grid-cols-2 gap-8 text-[10px]">
                    <div className="text-center border-t border-dotted border-black pt-1">Customer Signature</div>
                    <div className="text-center border-t border-dotted border-black pt-1">Driver Signature</div>
                </div>

                <div className="text-center text-[9px] text-gray-400 mt-2">
                    System Generated Invoice | Thank you for your business!
                    <div className="mt-0.5 text-[8px] opacity-70">
                        Powered by <span className="font-semibold text-black">Bitgard PVT LTD</span> (+94 70 563 3969)
                    </div>
                </div>
            </div>

            <div className="mt-4 text-center print:hidden">
                <PrintButton />
            </div>
        </div>
    );
}
