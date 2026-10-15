'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Edit2, Check, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ComboboxField } from '@/components/ComboboxField';
import { assignDriverToBooking } from '@/lib/booking-actions';
import { notify } from '@/lib/notifications';

interface BookingDriverAssignerProps {
    bookingId: string;
    bookingStatus?: string;
    currentDriver: {
        id: string;
        name: string;
        email?: string | null;
    } | null;
    drivers: {
        id: string;
        name: string;
        email?: string | null;
    }[];
    isAdmin?: boolean;
    pendingHandoverRequest?: {
        reason?: string;
        meterReading?: string;
        note?: string;
        timestamp?: Date | string;
    } | null;
}

export function BookingDriverAssigner({
    bookingId,
    bookingStatus,
    currentDriver,
    drivers,
    isAdmin = true,
    pendingHandoverRequest,
}: BookingDriverAssignerProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isEditing, setIsEditing] = useState(!!pendingHandoverRequest);
    const [selectedDriverId, setSelectedDriverId] = useState(currentDriver?.id || '');
    const [handoverReason, setHandoverReason] = useState(pendingHandoverRequest?.reason || 'Medical / Sickness');
    const [handoverMeterReading, setHandoverMeterReading] = useState(pendingHandoverRequest?.meterReading || '');
    const [handoverNotes, setHandoverNotes] = useState(pendingHandoverRequest?.note || '');
    const [error, setError] = useState<string | null>(null);

    const isOngoing = bookingStatus === 'ONGOING';

    const handleSave = () => {
        setError(null);

        // Strictly enforce mandatory handover meter reading for ONGOING tours
        if (isOngoing && selectedDriverId !== currentDriver?.id) {
            if (!handoverMeterReading.trim()) {
                setError('Handover Odometer / Meter Reading is strictly required.');
                return;
            }
        }

        startTransition(async () => {
            const handoverOptions = isOngoing && selectedDriverId !== currentDriver?.id ? {
                reason: handoverReason,
                handoverMeterReading: handoverMeterReading.trim(),
                notes: handoverNotes.trim() || undefined,
            } : undefined;

            const res = await assignDriverToBooking(bookingId, selectedDriverId || null, handoverOptions);
            if (res.success) {
                notify.success(
                    isOngoing && selectedDriverId !== currentDriver?.id
                        ? 'Mid-tour driver handover recorded successfully'
                        : selectedDriverId 
                            ? 'Driver assigned successfully' 
                            : 'Driver unassigned'
                );
                setIsEditing(false);
                router.refresh();
            } else {
                setError(res.error || 'Failed to update driver');
                notify.error(res.error || 'Failed to update driver');
            }
        });
    };

    const handleCancel = () => {
        setSelectedDriverId(currentDriver?.id || '');
        setHandoverReason('Medical / Sickness');
        setHandoverMeterReading('');
        setHandoverNotes('');
        setError(null);
        setIsEditing(false);
    };

    const driverOptions = [
        { label: '— Unassign Driver —', value: '' },
        ...drivers.map((d) => ({
            label: d.name,
            value: d.id,
        })),
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" /> Assigned Driver
                </h3>
                {isAdmin && !isEditing && (
                    <Button
                        variant={isOngoing ? "default" : "ghost"}
                        size="sm"
                        className={`h-8 text-xs gap-1.5 ${isOngoing ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'text-primary hover:text-primary/80'}`}
                        onClick={() => setIsEditing(true)}
                    >
                        <Edit2 className="h-3 w-3" />
                        {isOngoing ? '⚡ Mid-Tour Handover' : currentDriver ? 'Change Driver' : 'Assign Driver'}
                    </Button>
                )}
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
                {isEditing ? (
                    <div className="space-y-4">
                        {isOngoing && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs text-amber-800 dark:text-amber-300">
                                <p className="font-semibold flex items-center gap-1 mb-1">
                                    ⚠️ Tour in Progress (Mid-Tour Reassignment)
                                </p>
                                <p>
                                    Reassigning will stop live tracking for <strong>{currentDriver?.name || 'current driver'}</strong> and record an official handover event with odometer reading for billing and audit accuracy.
                                </p>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase">
                                {isOngoing ? 'Select Replacement Driver' : 'Select Driver'}
                            </label>
                            <ComboboxField
                                options={driverOptions}
                                value={selectedDriverId}
                                onChange={(val) => setSelectedDriverId(val)}
                                placeholder="Choose a driver..."
                            />
                        </div>

                        {isOngoing && selectedDriverId && selectedDriverId !== currentDriver?.id && (
                            <div className="space-y-3 pt-2 border-t border-muted/50">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                                        Handover Reason
                                    </label>
                                    <select
                                        value={handoverReason}
                                        onChange={(e) => setHandoverReason(e.target.value)}
                                        className="w-full text-xs rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="Medical / Sickness">Medical / Driver Sickness</option>
                                        <option value="Emergency">Family / Personal Emergency</option>
                                        <option value="Shift Change">Scheduled Shift Handover</option>
                                        <option value="Vehicle Breakdown">Vehicle Breakdown / Exchange</option>
                                        <option value="Customer Request">Customer Request</option>
                                        <option value="Operational">Other Operational Reason</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                                            Handover Odometer (KM) <span className="text-destructive font-bold">* (Required)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={handoverMeterReading}
                                            onChange={(e) => setHandoverMeterReading(e.target.value)}
                                            placeholder="e.g. 45350"
                                            className="w-full text-xs rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                                            Handover Location / Note
                                        </label>
                                        <input
                                            type="text"
                                            value={handoverNotes}
                                            onChange={(e) => setHandoverNotes(e.target.value)}
                                            placeholder="e.g. Handover at Kandy Clock Tower"
                                            className="w-full text-xs rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <p className="text-xs text-destructive font-medium">{error}</p>
                        )}

                        <div className="flex items-center gap-2 pt-2">
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={isPending}
                                className={`h-8 text-xs gap-1 ${isOngoing ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
                            >
                                {isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Check className="h-3 w-3" />
                                )}
                                {isOngoing ? 'Confirm Handover' : 'Save'}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancel}
                                disabled={isPending}
                                className="h-8 text-xs gap-1"
                            >
                                <X className="h-3 w-3" />
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : currentDriver ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Driver Name</p>
                                <p className="font-bold text-lg text-foreground flex items-center gap-2">
                                    {currentDriver.name}
                                </p>
                            </div>
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 font-medium">
                                Assigned
                            </Badge>
                        </div>
                        {currentDriver.email && (
                            <div className="pt-3 border-t">
                                <p className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1 mb-0.5">
                                    <Mail className="h-3 w-3" /> Email Address
                                </p>
                                <a
                                    href={`mailto:${currentDriver.email}`}
                                    className="text-sm font-medium text-primary hover:underline truncate block"
                                >
                                    {currentDriver.email}
                                </a>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-between py-1">
                        <span className="text-sm text-muted-foreground italic">No driver assigned to this booking</span>
                        <Badge variant="secondary" className="text-xs">
                            Unassigned
                        </Badge>
                    </div>
                )}
            </div>
        </div>
    );
}
