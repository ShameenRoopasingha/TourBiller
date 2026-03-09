'use client';

import { useEffect } from 'react';
import { type Bill } from '@/lib/validations';
import { formatCurrency } from '@/lib/calculations';
import { PrintButton } from '@/components/PrintButton';
import { BluetoothPrintButton } from '@/components/BluetoothPrintButton';

import { BusinessProfile } from '@/lib/validations';

interface InvoiceTemplateProps {
    bill: Bill;
    businessProfile?: BusinessProfile;
    userRole?: 'ADMIN' | 'DRIVER';
}

export function InvoiceTemplate({ bill, businessProfile, userRole = 'ADMIN' }: InvoiceTemplateProps) {
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

    const fmt = formatCurrency;

    // --- 58mm THERMAL RECEIPT LAYOUT (FOR DRIVERS) ---
    if (userRole === 'DRIVER') {
        return (
            <div className="flex flex-col items-center mx-auto text-black leading-tight bg-white print:bg-transparent min-h-screen">
                <style jsx global>{`
                    @media print {
                        @page {
                            size: 58mm auto;
                            margin: 0;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                            background: white !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                    }
                `}</style>
                
                {/* Fixed physical 58mm width wrapper for Thermal Printers */}
                <div className="w-[58mm] max-w-[58mm] print-thermal text-[10px] font-mono break-words bg-white border border-gray-200 print:border-none my-4 print:my-0 pb-10">
                    {/* Header */}
                    <div className="text-center border-b border-black border-dashed pb-2 mb-2 pt-2 flex flex-col items-center">
                        {businessProfile?.logoUrl && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={businessProfile.logoUrl}
                                alt="Company Logo"
                                className="h-12 w-12 rounded-lg object-cover mb-1 grayscale contrast-125"
                            />
                        )}
                        <div className="font-bold text-sm uppercase">{companyName}</div>
                        <div className="text-[9px] leading-tight mt-1 whitespace-pre-wrap">{address}</div>
                        <div className="text-[9px]">TEL: {phone}</div>
                        <div className="font-bold mt-2 text-xs uppercase underline">CASH RECEIPT</div>
                    </div>

                    {/* Meta Info */}
                    <div className="px-1 text-[9px] mb-2 leading-snug">
                        <div><span className="font-semibold">BILL NO: </span>#{bill.billNumber}</div>
                        <div><span className="font-semibold">DATE: </span>{new Date(bill.createdAt).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                        <div><span className="font-semibold">CUSTOMER: </span>{bill.customerName}</div>
                        <div><span className="font-semibold">VEHICLE: </span>{bill.vehicleNo}</div>
                        <div><span className="font-semibold">ROUTE: </span>{bill.route}</div>
                    </div>

                    <div className="border-t border-black border-dashed my-1"></div>

                    {/* Table-like Rows */}
                    <div className="px-1 w-full text-[9px]">
                        <div className="flex justify-between font-bold border-b border-black pb-0.5 mb-1">
                            <span>DESC</span>
                            <span>AMT</span>
                        </div>
                        
                        <div className="flex justify-between items-start mb-0.5">
                            <span className="w-[65%] leading-tight">Mileage ({bill.endMeter}-{bill.startMeter}km)</span>
                            <span className="w-[35%] text-right">{fmt((bill.endMeter - bill.startMeter) * bill.hireRate)}</span>
                        </div>
                        {bill.waitingCharge > 0 && (
                            <div className="flex justify-between">
                                <span>Waiting Charge</span>
                                <span>{fmt(bill.waitingCharge)}</span>
                            </div>
                        )}
                        {bill.gatePass > 0 && (
                            <div className="flex justify-between">
                                <span>Gate Pass</span>
                                <span>{fmt(bill.gatePass)}</span>
                            </div>
                        )}
                        {bill.packageCharge > 0 && (
                            <div className="flex justify-between">
                                <span>Package Chg</span>
                                <span>{fmt(bill.packageCharge)}</span>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-black border-dashed my-1"></div>

                    {/* Totals */}
                    <div className="px-1 text-[10px]">
                        <div className="flex justify-between items-center mb-0.5">
                            <span>TOTAL</span>
                            <span>{fmt(bill.totalAmount)}</span>
                        </div>
                        {bill.advanceAmount > 0 && (
                            <div className="flex justify-between items-center text-[9px]">
                                <span>ADVANCE</span>
                                <span>-{fmt(bill.advanceAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center font-bold text-sm border-y border-black py-1 my-1">
                            <span>BALANCE</span>
                            <span>{fmt(Math.max(0, bill.totalAmount - (bill.advanceAmount || 0)))}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-[8px] mt-4 pt-1 border-t border-black border-dashed">
                        <div>Customer Signature:</div>
                        <br/><br/>
                        <div>.......................</div>
                        <div className="mt-3 font-semibold italic">Thank you!</div>
                        <div className="mt-1 opacity-70">Powered By TourBiller</div>
                    </div>
                </div>
                
                {/* Connect/Print Actions Panel (Hidden on Print) */}
                <div className="w-[58mm] mb-8 print:hidden flex flex-col gap-2">
                    <PrintButton />
                    <BluetoothPrintButton bill={bill} companyName={companyName} />
                </div>
            </div>
        );
    }

    // --- A4 PORTRAIT INVOICE LAYOUT (FOR ADMINS) ---
    return (
        <div className="flex flex-col items-center mx-auto font-mono text-xs text-black leading-tight bg-white print:bg-transparent min-h-screen">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>

            {/* Main Container - A4 Portrait (21cm x max intrinsic height) */}
            <div className="w-[190mm] flex flex-col justify-between shadow-lg print:shadow-none border border-gray-200 print:border-none p-6 print:p-8 bg-white my-8 print:my-0">

                {/* Header Section - 3 Column Layout */}
                <div className="grid grid-cols-[auto_1fr_auto] items-start gap-4 border-b-2 border-black pb-2 mb-2">
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
                        <h1 className="text-xl font-bold uppercase tracking-wider">{companyName}</h1>
                        <p className="text-[10px] text-gray-600 mt-1 whitespace-pre-wrap">
                            {address}
                            <br />
                            Tel: {phone} {email && `| ${email}`}
                        </p>
                    </div>

                    {/* Column 3: Invoice Details */}
                    <div className="text-right">
                        <div className="text-2xl font-bold text-red-600">INVOICE</div>
                        <div className="text-base font-bold mt-0.5">#{bill.billNumber}</div>
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

                                {bill.customerAddress && (
                                    <>
                                        <span className="font-semibold text-gray-600 self-start">Address:</span>
                                        <span className="text-[10px] text-gray-800 leading-tight break-words">{bill.customerAddress}</span>
                                    </>
                                )}

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
                                    ({bill.endMeter} - {bill.startMeter} = {(bill.endMeter - bill.startMeter).toFixed(1)} km @ {fmt(bill.hireRate)})
                                </span>
                            </div>
                            <div className="col-span-4 text-right font-medium">
                                {fmt((bill.endMeter - bill.startMeter) * bill.hireRate)}
                            </div>

                            {/* Extra Charges */}
                            <div className="col-span-8">Waiting Charges</div>
                            <div className="col-span-4 text-right font-medium">{fmt(bill.waitingCharge)}</div>

                            <div className="col-span-8">Gate Pass</div>
                            <div className="col-span-4 text-right font-medium">{fmt(bill.gatePass)}</div>

                            <div className="col-span-8">Package Charge</div>
                            <div className="col-span-4 text-right font-medium">{fmt(bill.packageCharge)}</div>

                            {/* Totals */}
                            <div className="col-span-12 border-t-2 border-black mt-2 pt-1"></div>

                            <div className="col-span-8 text-right pr-2">Total Amount</div>
                            <div className="col-span-4 text-right font-medium">
                                {fmt(bill.totalAmount)}
                            </div>

                            {bill.advanceAmount > 0 && (
                                <>
                                    <div className="col-span-8 text-right pr-2 text-gray-600">Less: Advance Payment</div>
                                    <div className="col-span-4 text-right font-medium text-gray-600">
                                        -{fmt(bill.advanceAmount)}
                                    </div>
                                </>
                            )}

                            <div className="col-span-12 border-t border-dotted border-black my-1"></div>

                            <div className="col-span-6 font-bold text-lg text-right pr-2">BALANCE DUE</div>
                            <div className="col-span-6 text-right font-bold text-lg bg-gray-100 px-1 border border-gray-300">
                                {fmt(Math.max(0, bill.totalAmount - (bill.advanceAmount || 0)))}
                            </div>
                            <div className="col-span-12 border-b-2 double border-black mt-1"></div>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="mt-4 pt-10 grid grid-cols-2 gap-8 text-[10px]">
                    <div className="text-center border-t border-dotted border-black pt-1">Customer Signature</div>
                    <div className="text-center border-t border-dotted border-black pt-1">Authorized Signature</div>
                </div>

                <div className="text-center text-[9px] text-gray-400 mt-2">
                    System Generated Invoice | Thank you for your business!
                    <div className="mt-0.5 text-[8px] opacity-70">
                        Powered by <span className="font-semibold text-black">Bitgard PVT LTD</span> (+94 70 563 3969)
                    </div>
                </div>
            </div>

            {/* Print Button - Below invoice, matching width */}
            <div className="w-[190mm] mt-6 mb-8 print:hidden">
                <PrintButton />
            </div>
        </div>
    );
}
