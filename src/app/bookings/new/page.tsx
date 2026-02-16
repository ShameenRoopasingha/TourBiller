'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { BookingSchema, type BookingFormData, type Vehicle, type Customer } from '@/lib/validations';
import { createBooking } from '@/lib/booking-actions';
import { getVehicles } from '@/lib/vehicle-actions';
import { getCustomers } from '@/lib/customer-actions';
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

export default function NewBookingPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);

    useEffect(() => {
        const loadData = async () => {
            const [vResult, cResult] = await Promise.all([
                getVehicles(),
                getCustomers()
            ]);
            if (vResult.success && vResult.data) setVehicles(vResult.data);
            if (cResult.success && cResult.data) setCustomers(cResult.data);
        };
        loadData();
    }, []);

    const form = useForm<BookingFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(BookingSchema) as any,
        defaultValues: {
            vehicleNo: '',
            customerName: '',
            status: 'CONFIRMED',
            destination: '',
            advanceAmount: 0,
            notes: '',
        },
    });

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
        <div className="container mx-auto py-10 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8">New Booking</h1>

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
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="vehicleNo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vehicle</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        placeholder="Select Vehicle..."
                                                        {...field}
                                                        list="vehicle-list"
                                                        autoComplete="off"
                                                    />
                                                    <datalist id="vehicle-list">
                                                        {vehicles.map((v) => (
                                                            <option key={v.id} value={v.vehicleNo}>
                                                                {v.model ? `${v.vehicleNo} - ${v.model}` : v.vehicleNo}
                                                            </option>
                                                        ))}
                                                    </datalist>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
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
                                                <div className="relative">
                                                    <Input
                                                        placeholder="Select Customer..."
                                                        {...field}
                                                        list="customer-list"
                                                        autoComplete="off"
                                                    />
                                                    <datalist id="customer-list">
                                                        {customers.map((c) => (
                                                            <option key={c.id} value={c.name}>
                                                                {c.mobile ? `${c.name} (${c.mobile})` : c.name}
                                                            </option>
                                                        ))}
                                                    </datalist>
                                                </div>
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
                                            <FormLabel>Destination</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Kandy Tour" {...field} />
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
                                <Button type="submit" disabled={isSubmitting}>
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
