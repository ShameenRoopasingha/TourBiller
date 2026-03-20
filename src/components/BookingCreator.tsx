'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { BookingSchema, type BookingFormData, type Vehicle, type Customer } from '@/lib/validations';
import { createBooking } from '@/lib/booking-actions';
import { checkVehicleAvailability } from '@/lib/vehicle-actions';
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
}

export function BookingCreator({ vehicles, customers, schedules }: BookingCreatorProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
    const [availabilityConflict, setAvailabilityConflict] = useState<any | null>(null);
    const handleEnterKey = useEnterNavigation();

    const form = useForm<BookingFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(BookingSchema) as any,
        defaultValues: {
            vehicleNo: '',
            customerName: '',
            status: 'CONFIRMED',
            destination: '',
            advanceAmount: '' as unknown as number,
            notes: '',
        },
    });

    const watchedVehicleNo = useWatch({ control: form.control, name: 'vehicleNo' });
    const watchedStartDate = useWatch({ control: form.control, name: 'startDate' });
    const watchedEndDate = useWatch({ control: form.control, name: 'endDate' });

    // Check vehicle availability
    useEffect(() => {
        const checkAvailability = async () => {
            if (watchedVehicleNo && watchedStartDate) {
                setIsCheckingAvailability(true);
                setAvailabilityConflict(null);
                try {
                    // Treat null endDate as single-day booking
                    const end = watchedEndDate || watchedStartDate;
                    const result = await checkVehicleAvailability(
                        watchedVehicleNo,
                        watchedStartDate,
                        end,
                        undefined,
                        'Booking'
                    );
                    if (result.success && result.data && !result.data.available) {
                        setAvailabilityConflict(result.data.conflicts[0]);
                    }
                } catch (e) {
                    console.error("Availability check failed", e);
                } finally {
                    setIsCheckingAvailability(false);
                }
            } else {
                setAvailabilityConflict(null);
            }
        };

        const timer = setTimeout(checkAvailability, 500);
        return () => clearTimeout(timer);
    }, [watchedVehicleNo, watchedStartDate, watchedEndDate]);

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
                                                    value={field.value}
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
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Select Customer..."
                                                    allowCustomValue={true}
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
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Start Date & Time</FormLabel>
                                            <FormControl>
                                                <DateTimePicker
                                                    date={field.value}
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
                                                    date={field.value}
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
                                                    value={field.value}
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
                                            <Textarea placeholder="Additional details..." {...field} />
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
