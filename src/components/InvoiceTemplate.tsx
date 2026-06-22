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

    const companyName = businessProfile?.companyName || 'VIGIL Transport';
    const address = businessProfile?.address || 'No. 123, Transport Lane, Cityville';
    const phone = businessProfile?.phone || '(555) 123-4567';
    const email = businessProfile?.email ? `Email: ${businessProfile.email}` : '';

    const fmt = formatCurrency;

    // Derive scheduled days consistently:
    // First, try to use the explicitly saved scheduledDays from the DB (this handles early returns perfectly).
    // If not available (e.g. old bills), fallback to the calculation based on time duration.
    const diffMs = new Date(bill.endDate).getTime() - new Date(bill.startDate).getTime();
    const totalHours = Math.max(0, diffMs / (1000 * 60 * 60));
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const billAny = bill as any; // Cast to bypass strict type checking temporarily if Prisma client hasn't caught up
    const scheduledDays = billAny.scheduledDays !== undefined 
        ? billAny.scheduledDays 
        : (bill.extraHours > 0
            ? Math.max(1, Math.floor(totalHours / 24))
            : Math.max(1, Math.ceil(totalHours / 24)));
            
    const expectedKm = bill.allowedKm * scheduledDays;

    // Parse itinerary if available
    type ItineraryItem = {
        dayNumber: number;
        title: string;
        distanceKm: number;
        accommodation: number;
        meals: number;
        activities: number;
        otherCosts: number;
    };
    let itineraryItems: ItineraryItem[] = [];
    try {
        if (billAny.itinerary) {
            itineraryItems = JSON.parse(billAny.itinerary);
        }
    } catch { /* ignore parse errors for old bills */ }

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
                <div className="w-[58mm] max-w-[58mm] print-thermal text-[11px] font-sans break-words bg-white border border-gray-200 print:border-none my-4 print:my-0 pb-10">
                    {/* Header */}
                    <div className="text-center border-b-2 border-black border-dashed pb-3 mb-3 pt-2 flex flex-col items-center">
                        {businessProfile?.logoUrl && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={businessProfile.logoUrl}
                                alt="Company Logo"
                                className="h-14 w-14 rounded-lg object-cover mb-2 grayscale contrast-125"
                            />
                        )}
                        <div className="font-black text-base uppercase tracking-wide">{companyName}</div>
                        <div className="text-[10px] leading-tight mt-1 whitespace-pre-wrap font-medium">{address}</div>
                        <div className="text-[10px] font-semibold mt-0.5">TEL: {phone}</div>
                        <div className="font-bold mt-3 text-sm uppercase tracking-widest bg-black text-white px-3 py-1 rounded-sm">CASH RECEIPT</div>
                    </div>

                    {/* Meta Info */}
                    <div className="px-1 text-[11px] mb-3 leading-relaxed">
                        <div className="flex justify-between border-b border-gray-200 pb-1 mb-1"><span className="font-bold text-gray-700">NO:</span> <span className="font-semibold">{bill.billNumber}</span></div>
                        <div className="flex justify-between border-b border-gray-200 pb-1 mb-1"><span className="font-bold text-gray-700">DATE:</span> <span>{new Date(bill.createdAt).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span></div>
                        <div className="flex flex-col border-b border-gray-200 pb-1 mb-1"><span className="font-bold text-gray-700">CUSTOMER:</span> <span className="font-semibold text-sm">{bill.customerName}</span></div>
                        <div className="flex justify-between border-b border-gray-200 pb-1 mb-1"><span className="font-bold text-gray-700">VEHICLE:</span> <span className="font-semibold">{bill.vehicleNo}</span></div>
                        <div className="flex flex-col border-b border-gray-200 pb-1 mb-1"><span className="font-bold text-gray-700">ROUTE:</span> <span className="font-semibold">{bill.route}</span></div>
                        <div className="mt-2 border-t border-dashed border-gray-400 pt-2">
                            <div className="flex justify-between"><span>Start:</span> <span className="font-medium">{new Date(bill.startDate).toLocaleString('en-GB', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span></div>
                            <div className="flex justify-between"><span>End:</span> <span className="font-medium">{new Date(bill.endDate).toLocaleString('en-GB', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span></div>
                            <div className="text-center font-bold bg-gray-100 py-1 mt-1 rounded-sm">Duration: {scheduledDays}d{bill.extraHours > 0 ? ` + ${bill.extraHours}h` : ''}</div>
                        </div>
                         {itineraryItems.length > 0 && (
                             <div className="mt-2 border-t border-dashed border-gray-400 pt-2">
                                 <div className="font-bold text-[10px] tracking-wider uppercase mb-1">Itinerary:</div>
                                 {itineraryItems.map((item) => (
                                     <div key={item.dayNumber} className="leading-snug mb-1 text-[10px]">
                                         <span className="font-bold bg-gray-200 px-1 rounded mr-1">D{item.dayNumber}</span> {item.title}
                                         {item.distanceKm > 0 && <span className="text-[9px] text-gray-600"> ({item.distanceKm}km)</span>}
                                     </div>
                                 ))}
                             </div>
                         )}
                    </div>

                    <div className="border-t-2 border-black border-dashed my-2"></div>

                    {/* Table-like Rows */}
                    <div className="px-1 w-full text-[11px] font-medium space-y-1">
                        <div className="flex justify-between font-bold border-b border-black pb-0.5 mb-1">
                            <span>DESC</span>
                            <span>AMT</span>
                        </div>

                        {/* Expected Mileage */}
                        {(bill.allowedKm > 0 || bill.packageCharge > 0) ? (
                            <div className="flex justify-between items-start mb-0.5">
                                <span className="w-[65%] leading-tight">Expected Mileage
                                    <br /><span className="text-[8px]">({bill.allowedKm}km/d × {scheduledDays}d = {expectedKm}km)</span>
                                </span>
                                <span className="w-[35%] text-right">{fmt(bill.packageCharge)}</span>
                            </div>
                        ) : null}

                        {/* Mileage Cost */}
                        {bill.extraKm > 0 && (
                            <div className="flex justify-between items-start mb-0.5">
                                <span className="w-[65%] leading-tight">{(bill.allowedKm > 0 || bill.packageCharge > 0) ? 'Extra Mileage Cost' : 'Distance Charge'}
                                    <br /><span className="text-[8px]">({bill.extraKm}km × {fmt(bill.hireRate)}/km)</span>
                                </span>
                                <span className="w-[35%] text-right">{fmt(bill.extraKm * bill.hireRate)}</span>
                            </div>
                        )}

                        {/* Extra Hours */}
                        {bill.extraHours > 0 && (
                            <div className="flex justify-between items-start mb-0.5">
                                <span className="w-[65%] leading-tight">Extra Hours
                                    <br /><span className="text-[8px]">({bill.extraHours}h @ {fmt(bill.extraHourRate)})</span>
                                </span>
                                <span className="w-[35%] text-right">{fmt(bill.extraHours * bill.extraHourRate)}</span>
                            </div>
                        )}

                        {bill.waitingCharge > 0 && (
                            <div className="flex justify-between">
                                <span>Waiting Charges</span>
                                <span>{fmt(bill.waitingCharge)}</span>
                            </div>
                        )}
                        {bill.gatePass > 0 && (
                            <div className="flex justify-between">
                                <span>Gate Pass</span>
                                <span>{fmt(bill.gatePass)}</span>
                            </div>
                        )}
                        {(bill.accommodationCharge || 0) > 0 && (
                            <div className="flex justify-between">
                                <span>Accommodation</span>
                                <span>{fmt(bill.accommodationCharge || 0)}</span>
                            </div>
                        )}
                        {(bill.mealsCharge || 0) > 0 && (
                            <div className="flex justify-between">
                                <span>Meals</span>
                                <span>{fmt(bill.mealsCharge || 0)}</span>
                            </div>
                        )}
                        {(bill.activitiesCharge || 0) > 0 && (
                            <div className="flex justify-between">
                                <span>Activities</span>
                                <span>{fmt(bill.activitiesCharge || 0)}</span>
                            </div>
                        )}
                        {(bill.otherCostsCharge || 0) > 0 && (
                            <div className="flex justify-between">
                                <span>Other Costs</span>
                                <span>{fmt(bill.otherCostsCharge || 0)}</span>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-black border-dashed my-1"></div>

                    {/* Totals */}
                    <div className="px-1 text-[12px] font-semibold">
                        <div className="flex justify-between items-center mb-1">
                            <span>TOTAL</span>
                            <span className="font-bold">{fmt(bill.totalAmount)}</span>
                        </div>
                        {bill.advanceAmount > 0 && (
                            <div className="flex justify-between items-center text-[10px] text-gray-700">
                                <span>ADVANCE</span>
                                <span>-{fmt(bill.advanceAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center font-black text-[16px] border-y-2 border-black py-1.5 my-1.5">
                            <span>BALANCE</span>
                            <span>{fmt(Math.max(0, bill.totalAmount - (bill.advanceAmount || 0)))}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-[10px] mt-6 pt-2 border-t-2 border-black border-dashed">
                        <div className="font-medium text-gray-600">Customer Signature:</div>
                        <br /><br />
                        <div className="tracking-widest">.......................</div>
                        <div className="mt-3 font-bold italic text-sm">Thank you!</div>
                        <div className="mt-1 font-medium text-[9px] text-gray-500 tracking-wider">Powered By VIGIL</div>
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
        <div className="flex flex-col items-center mx-auto font-sans text-sm text-black leading-relaxed bg-white print:bg-transparent min-h-screen">
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
            <div className="w-[190mm] flex flex-col justify-between shadow-lg print:shadow-none border border-gray-200 print:border-none p-8 print:p-10 bg-white my-8 print:my-0">

                {/* Header Section - 3 Column Layout */}
                <div className="grid grid-cols-[auto_1fr_auto] items-start gap-4 border-b-2 border-black pb-3 mb-4">
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
                            {address}
                            <br />
                            Tel: {phone} {email && `| ${email}`}
                        </p>
                    </div>

                    {/* Column 3: Invoice Details */}
                    <div className="text-right">
                        <div className="text-3xl font-bold text-red-600">INVOICE</div>
                        <div className="text-lg font-bold mt-0.5">NO: {bill.billNumber}</div>
                        <div className="text-sm text-gray-600">Date: {new Date(bill.createdAt).toLocaleDateString('en-GB')}</div>
                        <div className="mt-1">
                            <span className="font-bold border border-black px-2.5 py-1 text-xs uppercase rounded-sm">
                                {bill.paymentMethod || 'CASH'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content Grid - Side by Side */}
                <div className="flex gap-4 flex-1">

                    {/* Left Column: Trip Details */}
                    <div className="w-[45%] space-y-3">
                        <div className="bg-gray-50 p-3 border border-gray-200 rounded">
                            <div className="grid grid-cols-[85px_1fr] gap-y-1.5 gap-x-2 text-sm">
                                <span className="font-medium text-gray-500">Customer:</span>
                                <span className="font-semibold truncate">{bill.customerName}</span>

                                {bill.customerAddress && (
                                    <>
                                        <span className="font-medium text-gray-500 self-start">Address:</span>
                                        <span className="text-xs text-gray-700 leading-snug break-words">{bill.customerAddress}</span>
                                    </>
                                )}

                                <span className="font-medium text-gray-500">Vehicle:</span>
                                <span className="font-semibold">{bill.vehicleNo}</span>

                                <span className="font-medium text-gray-500">Route:</span>
                                <span className="font-semibold leading-snug">{bill.route}</span>
                            </div>
                        </div>

                        <div className="text-xs space-y-1 pt-3">
                            <div className="flex flex-col gap-1">
                                <span>Start: {new Date(bill.startDate).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                <span>End:&nbsp;&nbsp;&nbsp;{new Date(bill.endDate).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="font-semibold mt-1 text-sm">Duration: {scheduledDays} days{bill.extraHours > 0 ? ` + ${bill.extraHours} hrs` : ''}</span>
                            </div>
                        </div>

                        {/* Day-by-Day Itinerary */}
                        {itineraryItems.length > 0 && (
                            <div className="mt-3">
                                <h3 className="text-xs font-semibold uppercase text-gray-500 mb-1.5 border-b border-gray-300 pb-1 tracking-wide">Day-by-Day Itinerary</h3>
                                <div className="text-xs space-y-1">
                                    {itineraryItems.map((item) => (
                                        <div key={item.dayNumber} className="flex items-start gap-1">
                                            <span className="font-bold text-gray-700 shrink-0 w-[28px]">D{item.dayNumber}</span>
                                            <span className="flex-1 leading-tight">
                                                {item.title}
                                                {item.distanceKm > 0 && (
                                                    <span className="text-gray-500 ml-1">({item.distanceKm} km)</span>
                                                )}
                                            </span>
                                            {(item.accommodation + item.meals + item.activities + item.otherCosts) > 0 && (
                                                <span className="text-gray-500 shrink-0">
                                                    {fmt(item.accommodation + item.meals + item.activities + item.otherCosts)}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Route already shown in customer details above - removed to avoid duplication */}
                        {false && bill.route && (
                            <div className="mt-3">
                                <h3 className="text-xs font-semibold uppercase text-gray-500 mb-1.5 border-b border-gray-300 pb-1 tracking-wide">Destination</h3>
                                <div className="text-sm text-gray-800 leading-snug">
                                    {bill.route}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Calculations */}
                    <div className="w-[55%]">
                        <div className="grid grid-cols-12 gap-y-1.5 text-sm">
                            {/* Header Row */}
                            <div className="col-span-12 grid grid-cols-12 border-b-2 border-gray-800 pb-1.5 mb-2 font-semibold text-xs uppercase text-gray-500 tracking-wide">
                                <div className="col-span-8">Description</div>
                                <div className="col-span-4 text-right">Amount</div>
                            </div>

                            {/* Expected Mileage (covered by package charge) */}
                            {(bill.allowedKm > 0 || bill.packageCharge > 0) ? (
                                <>
                                    <div className="col-span-8 flex justify-between pr-2">
                                        <span>Expected Mileage</span>
                                        <span className="text-xs text-gray-400">
                                            ({bill.allowedKm}km/day × {scheduledDays} days = {expectedKm}km{scheduledDays > 1 ? ` | ${fmt(bill.packageCharge / scheduledDays)}/day` : ''})
                                        </span>
                                    </div>
                                    <div className="col-span-4 text-right font-medium">
                                        {fmt(bill.packageCharge)}
                                    </div>
                                </>
                            ) : null}

                            {/* Mileage Cost */}
                            {(bill.extraKm || 0) > 0 && (
                                <>
                                    <div className="col-span-8 flex justify-between pr-2">
                                        <span>{(bill.allowedKm > 0 || bill.packageCharge > 0) ? 'Extra Mileage Cost' : 'Distance Charge'}</span>
                                        <span className="text-xs text-gray-400">
                                            ({bill.extraKm}km × {fmt(bill.hireRate)}/km)
                                        </span>
                                    </div>
                                    <div className="col-span-4 text-right font-medium">
                                        {fmt((bill.extraKm || 0) * bill.hireRate)}
                                    </div>
                                </>
                            )}
                            {bill.extraHours > 0 && (
                                <>
                                    <div className="col-span-8 flex justify-between pr-2">
                                        <span>Extra Hours</span>
                                        <span className="text-xs text-gray-400">
                                            ({bill.extraHours} hrs @ {fmt(bill.extraHourRate)})
                                        </span>
                                    </div>
                                    <div className="col-span-4 text-right font-medium">
                                        {fmt(bill.extraHours * bill.extraHourRate)}
                                    </div>
                                </>
                            )}



                            {/* Extra Charges */}
                            {bill.waitingCharge > 0 && (
                                <>
                                    <div className="col-span-8">Waiting Charges</div>
                                    <div className="col-span-4 text-right font-medium">{fmt(bill.waitingCharge)}</div>
                                </>
                            )}

                            {bill.gatePass > 0 && (
                                <>
                                    <div className="col-span-8">Gate Pass</div>
                                    <div className="col-span-4 text-right font-medium">{fmt(bill.gatePass)}</div>
                                </>
                            )}

                            {(bill.accommodationCharge || 0) > 0 && (
                                <>
                                    <div className="col-span-8">Accommodation</div>
                                    <div className="col-span-4 text-right font-medium">{fmt(bill.accommodationCharge || 0)}</div>
                                </>
                            )}
                            
                            {(bill.mealsCharge || 0) > 0 && (
                                <>
                                    <div className="col-span-8">Meals</div>
                                    <div className="col-span-4 text-right font-medium">{fmt(bill.mealsCharge || 0)}</div>
                                </>
                            )}

                            {(bill.activitiesCharge || 0) > 0 && (
                                <>
                                    <div className="col-span-8">Activities</div>
                                    <div className="col-span-4 text-right font-medium">{fmt(bill.activitiesCharge || 0)}</div>
                                </>
                            )}

                            {(bill.otherCostsCharge || 0) > 0 && (
                                <>
                                    <div className="col-span-8">Other Costs</div>
                                    <div className="col-span-4 text-right font-medium">{fmt(bill.otherCostsCharge || 0)}</div>
                                </>
                            )}

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

                            <div className="col-span-6 font-bold text-xl text-right pr-2">BALANCE DUE</div>
                            <div className="col-span-6 text-right font-bold text-xl bg-gray-100 px-2 py-0.5 border border-gray-300 rounded-sm">
                                {fmt(Math.max(0, bill.totalAmount - (bill.advanceAmount || 0)))}
                            </div>
                            <div className="col-span-12 border-b-2 double border-black mt-1"></div>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="mt-6 pt-12 grid grid-cols-2 gap-8 text-xs">
                    <div className="text-center border-t border-dotted border-black pt-1.5 text-gray-500">Customer Signature</div>
                    <div className="text-center border-t border-dotted border-black pt-1.5 text-gray-500">Authorized Signature</div>
                </div>

                <div className="text-center text-[10px] text-gray-400 mt-4">
                    System Generated Invoice | Thank you for your business!
                    <div className="mt-1 text-[9px] opacity-70">
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
