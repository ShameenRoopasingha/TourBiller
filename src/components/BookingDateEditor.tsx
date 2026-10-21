'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Edit2, Loader2, AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { updateBookingDates } from '@/lib/booking-actions';
import { notify } from '@/lib/notifications';

interface BookingDateEditorProps {
    bookingId: string;
    vehicleNo: string;
    customerName: string;
    currentStartDate: Date | string;
    currentEndDate: Date | string | null;
    driverId?: string | null;
    driverName?: string | null;
    isOngoing?: boolean;
    currentNotes?: string | null;
    triggerVariant?: 'button' | 'icon' | 'compact';
}

export function BookingDateEditor({
    bookingId,
    vehicleNo,
    customerName,
    currentStartDate,
    currentEndDate,
    driverId,
    driverName,
    isOngoing = false,
    currentNotes = '',
    triggerVariant = 'button',
}: BookingDateEditorProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const initialStart = new Date(currentStartDate);
    const initialEnd = currentEndDate ? new Date(currentEndDate) : (() => {
        const d = new Date(initialStart);
        d.setHours(18, 0, 0, 0);
        return d;
    })();

    const [startDate, setStartDate] = useState<Date | undefined>(initialStart);
    const [endDate, setEndDate] = useState<Date | undefined>(initialEnd);
    const [reasonNote, setReasonNote] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Calculate duration in days
    const calculateDays = (start?: Date, end?: Date) => {
        if (!start || !end) return 1;
        const diffMs = end.getTime() - start.getTime();
        if (diffMs <= 0) return 1;
        return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
    };

    const currentDurationDays = calculateDays(startDate, endDate);

    // Quick duration handler
    const applyQuickDuration = (days: number) => {
        const baseStart = startDate ? new Date(startDate) : new Date();
        const newEnd = new Date(baseStart);
        newEnd.setDate(baseStart.getDate() + (days - 1));
        newEnd.setHours(18, 0, 0, 0); // Standard evening tour conclusion
        setEndDate(newEnd);
        setError(null);
    };

    // Quick extension handler (+1 day, +2 days)
    const applyExtension = (extraDays: number) => {
        const baseEnd = endDate ? new Date(endDate) : (startDate ? new Date(startDate) : new Date());
        const newEnd = new Date(baseEnd);
        newEnd.setDate(baseEnd.getDate() + extraDays);
        if (newEnd.getHours() < 12) {
            newEnd.setHours(18, 0, 0, 0);
        }
        setEndDate(newEnd);
        setError(null);
    };

    const handleSave = () => {
        if (!startDate) {
            setError('Start date & time is required.');
            return;
        }

        if (endDate && endDate < startDate) {
            setError('End date & time must be after or equal to start date.');
            return;
        }

        setError(null);

        startTransition(async () => {
            try {
                const combinedNotes = reasonNote.trim()
                    ? `${currentNotes ? currentNotes + '\n\n' : ''}[Tour Rescheduled]: ${reasonNote.trim()}`
                    : undefined;

                const result = await updateBookingDates(bookingId, {
                    startDate: startDate.toISOString(),
                    endDate: endDate ? endDate.toISOString() : null,
                    notes: combinedNotes,
                });

                if (result.success) {
                    notify.success('Tour dates updated successfully');
                    setIsOpen(false);
                    setReasonNote('');
                    router.refresh();
                } else {
                    setError(result.error || 'Failed to update tour dates');
                    notify.error(result.error || 'Failed to update tour dates');
                }
            } catch (err: any) {
                console.error('Error updating booking dates:', err);
                const msg = err.message || 'An unexpected error occurred';
                setError(msg);
                notify.error(msg);
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {triggerVariant === 'compact' ? (
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary hover:text-primary/80 hover:bg-primary/10">
                        <Edit2 className="h-3.5 w-3.5 mr-1" />
                        Edit Dates
                    </Button>
                ) : triggerVariant === 'icon' ? (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10">
                        <Edit2 className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 flex items-center gap-1.5 font-semibold">
                        <Calendar className="h-4 w-4" />
                        Change Tour Dates
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <Calendar className="h-5 w-5 text-primary" />
                        Reschedule / Extend Tour
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        Update the start and expected end date & time for <strong>{customerName}</strong> ({vehicleNo}).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Active Conflict / Error Alert */}
                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2.5 text-xs text-destructive font-medium animate-in fade-in">
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Quick Duration Presets */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Quick Tour Duration Presets
                            </Label>
                            <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                                {currentDurationDays} {currentDurationDays === 1 ? 'Day' : 'Days'} Tour
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {[1, 2, 3, 4, 5, 7, 10].map((d) => (
                                <Button
                                    key={d}
                                    type="button"
                                    variant={currentDurationDays === d ? "default" : "outline"}
                                    size="sm"
                                    className="h-8 px-2.5 text-xs font-medium"
                                    onClick={() => applyQuickDuration(d)}
                                >
                                    {d} {d === 1 ? 'Day' : 'Days'}
                                </Button>
                            ))}
                            {isOngoing && (
                                <>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="h-8 px-2 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100"
                                        onClick={() => applyExtension(1)}
                                    >
                                        <Plus className="h-3 w-3 mr-0.5" /> 1 Day Ext.
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="h-8 px-2 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100"
                                        onClick={() => applyExtension(2)}
                                    >
                                        <Plus className="h-3 w-3 mr-0.5" /> 2 Days Ext.
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Start Date & Time */}
                    <div className="space-y-1.5">
                        <Label htmlFor="start-date" className="text-sm font-semibold flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-emerald-600" />
                            Tour Start Date & Time *
                        </Label>
                        <DateTimePicker
                            date={startDate}
                            setDate={(d) => {
                                setStartDate(d);
                                setError(null);
                                // If end date was before or identical to old start, push it forward
                                if (d && endDate && endDate < d) {
                                    const nextEnd = new Date(d);
                                    nextEnd.setDate(d.getDate() + 1);
                                    nextEnd.setHours(18, 0, 0, 0);
                                    setEndDate(nextEnd);
                                }
                            }}
                        />
                    </div>

                    {/* Expected End Date & Time */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="end-date" className="text-sm font-semibold flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-blue-600" />
                                Expected End Date & Time *
                            </Label>
                            <span className="text-[11px] text-muted-foreground">
                                Driver app & radar automatically sync
                            </span>
                        </div>
                        <DateTimePicker
                            date={endDate}
                            setDate={(d) => {
                                setEndDate(d);
                                setError(null);
                            }}
                        />
                    </div>

                    {/* Reason / Adjustment Note */}
                    <div className="space-y-1.5">
                        <Label htmlFor="reason-note" className="text-sm font-semibold text-muted-foreground">
                            Reason for Reschedule / Date Change (Optional)
                        </Label>
                        <Textarea
                            id="reason-note"
                            placeholder="e.g. Guest requested 2 extra days, Flight delayed, Bad weather detour..."
                            value={reasonNote}
                            onChange={(e) => setReasonNote(e.target.value)}
                            rows={2}
                            className="text-xs"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                            setIsOpen(false);
                            setError(null);
                        }}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={isPending}
                        className="bg-primary font-semibold flex items-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Checking Availability & Saving...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4" />
                                Save Tour Dates
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
