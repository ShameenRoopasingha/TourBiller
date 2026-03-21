'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { BookingFormSchema, type BookingFormInput, type Vehicle, type Customer, type VehicleAvailabilityConflict, type DriverAvailabilityConflict } from '@/lib/validations';

// For backward compatibility
export type BookingFormData = BookingFormInput;
import { createBooking } from '@/lib/booking-actions';
import { checkVehicleAvailability } from '@/lib/vehicle-actions';
import { checkDriverAvailability } from '@/lib/user-actions';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { ComboboxField } from '@/components/ComboboxField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Loader2, CalendarPlus } from 'lucide-react';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BookingCreatorProps {
    vehicles: Vehicle[];
    customers: Customer[];
    schedules: { id: string; name: string }[];
    drivers?: { id: string; name: string }[];
}

export function BookingCreator({ vehicles, customers, schedules, drivers = [] }: BookingCreatorProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
    const [availabilityConflict, setAvailabilityConflict] = useState<VehicleAvailabilityConflict | null>(null);
    const [driverAvailabilityConflict, setDriverAvailabilityConflict] = useState<DriverAvailabilityConflict | null>(null);
    const handleEnterKey = useEnterNavigation();

    const form = useForm<BookingFormInput>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(BookingFormSchema) as any,
        defaultValues: {
            vehicleNo: '',
            customerName: '',
            status: 'CONFIRMED',
            destination: '',
            advanceAmount: 0,
            notes: '',
        },
    });

    const watchedVehicleNo = useWatch({ control: form.control, name: 'vehicleNo' });
    const watchedDriverId = useWatch({ control: form.control, name: 'driverId' });
    const watchedStartDate = useWatch({ control: form.control, name: 'startDate' });
    const watchedEndDate = useWatch({ control: form.control, name: 'endDate' });

    // Check vehicle and driver availability
    useEffect(() => {
        const checkAvailability = async () => {
            const hasVehicle = !!watchedVehicleNo;
            const hasDriver = !!watchedDriverId;
            const hasDates = !!watchedStartDate;

            if (hasDates && (hasVehicle || hasDriver)) {
                setIsCheckingAvailability(true);
                // Reset conflicts before checking
                if (hasVehicle) setAvailabilityConflict(null);
                if (hasDriver) setDriverAvailabilityConflict(null);

                try {
                    const end = watchedEndDate || watchedStartDate;
                    
                    const checks = [];
                    if (hasVehicle) {
                        checks.push(checkVehicleAvailability(watchedVehicleNo, watchedStartDate, end, undefined, 'Booking'));
                    }
                    if (hasDriver) {
                        checks.push(checkDriverAvailability(watchedDriverId, watchedStartDate, end, undefined, 'Booking'));
                    }

                    const results = await Promise.all(checks);
                    
                    let resultIdx = 0;
                    if (hasVehicle) {
                        const vehicleResult = results[resultIdx++];
                        if (vehicleResult.success && vehicleResult.data && !vehicleResult.data.available) {
                            setAvailabilityConflict(vehicleResult.data.conflicts[0]);
                        }
                    }
                    if (hasDriver) {
                        const driverResult = results[resultIdx++];
                        if (driverResult.success && driverResult.data && !driverResult.data.available) {
                            setDriverAvailabilityConflict(driverResult.data.conflicts[0]);
                        }
                    }
                } catch (e) {
                    console.error("Availability check failed", e);
                } finally {
                    setIsCheckingAvailability(false);
                }
            } else {
                setAvailabilityConflict(null);
                setDriverAvailabilityConflict(null);
            }
        };

        const timer = setTimeout(checkAvailability, 500);
        return () => clearTimeout(timer);
    }, [watchedVehicleNo, watchedDriverId, watchedStartDate, watchedEndDate]);

    const onSubmit = async (data: BookingFormData) => {
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value instanceof Date) {
                formData.append(key, value.toISOString());
            } else if (value !== undefined && value !== null) {
                formData.append(key, value.toString());
            }
        });

        const result = await createBooking(formData);

        if (result.success) {
            router.push('/bookings');
            router.refresh();
        } else {
            setError(result.error || 'Failed to create booking');
        }

        setIsSubmitting(false);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Booking Details</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" onKeyDown={handleEnterKey}>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="vehicleNo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vehicle</FormLabel>
                                            <FormControl>
                                                <ComboboxField
                                                    options={vehicles.map(v => ({
                                                        label: v.model ? `${v.vehicleNo} - ${v.model}` : v.vehicleNo,
                                                        value: v.vehicleNo
                                                    }))}
                                                    value={field.value || ''}
                                                    onChange={field.onChange}
                                                    placeholder="Select Vehicle..."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                            {availabilityConflict && (
                                                <div className="mt-2 text-xs font-semibold text-destructive flex items-center gap-1.5 p-2 bg-destructive/10 rounded animate-in fade-in slide-in-from-top-1">
                                                    <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                                                    <span>
                                                        Vehicle is occupied by <span className="underline">{availabilityConflict.customer}</span> ({availabilityConflict.type}: {availabilityConflict.reference}) until {new Date(availabilityConflict.end).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                            {isCheckingAvailability && (
                                                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    Checking availability...
                                                </div>
                                            )}
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="customerName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Customer</FormLabel>
                                            <FormControl>
                                                <ComboboxField
                                                    options={customers.map(c => ({
                                                        label: c.mobile ? `${c.name} (${c.mobile})` : c.name,
                                                        value: c.name
                                                    }))}
                                                    value={field.value || ''}
                                                    onChange={field.onChange}
                                                    placeholder="Select Customer..."
                                                    allowCustomValue={true}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="driverId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Driver (Optional)</FormLabel>
                                            <FormControl>
                                                <ComboboxField
                                                    options={drivers.map(d => ({
                                                        label: d.name,
                                                        value: d.id
                                                    }))}
                                                    value={field.value || ''}
                                                    onChange={field.onChange}
                                                    placeholder="Select Driver..."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                            {driverAvailabilityConflict && (
                                                <div className="mt-2 text-xs font-semibold text-destructive flex items-center gap-1.5 p-2 bg-destructive/10 rounded animate-in fade-in slide-in-from-top-1">
                                                    <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                                                    <span>
                                                        Driver is occupied by <span className="underline">{driverAvailabilityConflict.customer}</span> ({driverAvailabilityConflict.type}: {driverAvailabilityConflict.reference}) until {new Date(driverAvailabilityConflict.end).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Start Date & Time</FormLabel>
                                            <FormControl>
                                                <DateTimePicker
                                                    date={field.value || undefined}
                                                    setDate={(date) => field.onChange(date)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="endDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>End Date & Time (Optional)</FormLabel>
                                            <FormControl>
                                                <DateTimePicker
                                                    date={field.value || undefined}
                                                    setDate={(date) => field.onChange(date)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="destination"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Destination / Tour</FormLabel>
                                            <FormControl>
                                                <ComboboxField
                                                    options={schedules.map(s => ({
                                                        label: s.name,
                                                        value: s.name
                                                    }))}
                                                    value={field.value || ''}
                                                    onChange={field.onChange}
                                                    placeholder="Select or type a destination..."
                                                    allowCustomValue={true}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="advanceAmount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Advance Payment (Rs)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    placeholder="0.00"
                                                    {...field}
                                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Additional details..." {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" type="button" onClick={() => router.back()}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting || !!availabilityConflict}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Booking...
                                        </>
                                    ) : (
                                        <>
                                            <CalendarPlus className="mr-2 h-4 w-4" />
                                            Create Booking
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
