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
}

export function BookingDriverAssigner({
    bookingId,
    currentDriver,
    drivers,
    isAdmin = true,
}: BookingDriverAssignerProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isEditing, setIsEditing] = useState(false);
    const [selectedDriverId, setSelectedDriverId] = useState(currentDriver?.id || '');
    const [error, setError] = useState<string | null>(null);

    const handleSave = () => {
        setError(null);
        startTransition(async () => {
            const res = await assignDriverToBooking(bookingId, selectedDriverId || null);
            if (res.success) {
                notify.success(selectedDriverId ? 'Driver assigned successfully' : 'Driver unassigned');
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
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-primary hover:text-primary/80 gap-1"
                        onClick={() => setIsEditing(true)}
                    >
                        <Edit2 className="h-3 w-3" />
                        {currentDriver ? 'Change Driver' : 'Assign Driver'}
                    </Button>
                )}
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
                {isEditing ? (
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase">
                                Select Driver
                            </label>
                            <ComboboxField
                                options={driverOptions}
                                value={selectedDriverId}
                                onChange={(val) => setSelectedDriverId(val)}
                                placeholder="Choose a driver..."
                            />
                        </div>

                        {error && (
                            <p className="text-xs text-destructive font-medium">{error}</p>
                        )}

                        <div className="flex items-center gap-2 pt-2">
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={isPending}
                                className="h-8 text-xs gap-1"
                            >
                                {isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Check className="h-3 w-3" />
                                )}
                                Save
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
