'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightLeft, User, Car, Calendar, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ComboboxField } from '@/components/ComboboxField';
import { notify } from '@/lib/notifications';

interface ConvertQuotationDialogProps {
    quotation: {
        id: string;
        quotationNumber: number;
        customerName: string;
        vehicleNo?: string | null;
        startDate?: Date | string | null;
        endDate?: Date | string | null;
        driver?: {
            id: string;
            name: string;
        } | null;
    };
    drivers: {
        id: string;
        name: string;
        email?: string | null;
    }[];
    trigger?: React.ReactNode;
}

export function ConvertQuotationDialog({
    quotation,
    drivers,
    trigger,
}: ConvertQuotationDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [selectedDriverId, setSelectedDriverId] = useState(quotation.driver?.id || '');
    const [error, setError] = useState<string | null>(null);

    const selectedDriver = drivers.find((d) => d.id === selectedDriverId);

    const driverOptions = [
        { label: '— No Driver (Unassigned) —', value: '' },
        ...drivers.map((d) => ({
            label: d.name,
            value: d.id,
        })),
    ];

    const handleConvert = () => {
        setError(null);
        startTransition(async () => {
            try {
                const response = await fetch(`/api/quotations/${encodeURIComponent(quotation.id)}/convert`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        driverId: selectedDriverId || null,
                    }),
                });
                const result = await response.json();

                if (!response.ok || !result.success) {
                    const msg = result.error || 'Failed to convert quotation to booking';
                    setError(msg);
                    notify.error(msg);
                } else {
                    setOpen(false);
                    if (selectedDriver) {
                        notify.success(`Converted to booking! Synced to ${selectedDriver.name}'s mobile app.`);
                    } else {
                        notify.success('Quotation converted to booking.');
                    }
                    router.refresh();
                    setTimeout(() => {
                        router.push('/bookings');
                    }, 1000);
                }
            } catch (err) {
                console.error('Convert error:', err);
                const msg = 'Failed to convert quotation. Please try again.';
                setError(msg);
                notify.error(msg);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white font-medium gap-1.5"
                    >
                        <ArrowRightLeft className="h-4 w-4" />
                        Convert to Booking
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <ArrowRightLeft className="h-5 w-5 text-green-600" />
                        Convert to Confirmed Booking
                    </DialogTitle>
                    <DialogDescription>
                        Convert Quotation Q-{String(quotation.quotationNumber).padStart(4, '0')} into a confirmed booking.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Summary Card */}
                    <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1.5 border">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Customer:</span>
                            <span className="font-semibold text-foreground">{quotation.customerName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <Car className="h-3.5 w-3.5" /> Vehicle:
                            </span>
                            <span className="font-medium font-mono">{quotation.vehicleNo || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" /> Dates:
                            </span>
                            <span className="font-medium">
                                {quotation.startDate
                                    ? new Date(quotation.startDate).toLocaleDateString('en-GB')
                                    : 'N/A'}
                                {quotation.endDate
                                    ? ` to ${new Date(quotation.endDate).toLocaleDateString('en-GB')}`
                                    : ''}
                            </span>
                        </div>
                    </div>

                    {/* Driver Assignment Field */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-primary" />
                            Assign Driver (Syncs to Mobile App)
                        </label>
                        <ComboboxField
                            options={driverOptions}
                            value={selectedDriverId}
                            onChange={(val) => {
                                setSelectedDriverId(val);
                                setError(null);
                            }}
                            placeholder="Select Driver for this Tour..."
                        />

                        {selectedDriver ? (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 p-2.5 rounded-lg text-xs flex items-start gap-2">
                                <Check className="h-4 w-4 shrink-0 mt-0.5 text-green-600" />
                                <div>
                                    <p className="font-semibold">Will sync to {selectedDriver.name}&apos;s mobile app</p>
                                    <p className="text-[11px] opacity-80 mt-0.5">
                                        As soon as converted, this tour will appear on the driver&apos;s phone with turn-by-turn navigation &amp; live GPS tracking.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-2.5 rounded-lg text-xs flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                                <div>
                                    <p className="font-semibold">No driver assigned</p>
                                    <p className="text-[11px] opacity-80 mt-0.5">
                                        This booking won&apos;t appear on any driver&apos;s mobile app until a driver is assigned. You can assign a driver later from Booking details.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <p className="text-xs text-destructive font-medium bg-destructive/10 p-2 rounded border border-destructive/20">
                            {error}
                        </p>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        className="bg-green-600 hover:bg-green-700 text-white font-medium gap-1.5"
                        onClick={handleConvert}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Converting &amp; Syncing...
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4" />
                                Confirm &amp; Convert
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
