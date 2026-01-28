'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { VehicleSchema, type VehicleFormData, type Vehicle } from '@/lib/validations';
import { createVehicle, updateVehicle } from '@/lib/vehicle-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface VehicleFormProps {
    vehicle?: Vehicle;
}

export function VehicleForm({ vehicle }: VehicleFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const form = useForm<VehicleFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(VehicleSchema) as any,
        defaultValues: {
            vehicleNo: vehicle?.vehicleNo || '',
            model: vehicle?.model || '',
            category: vehicle?.category || 'CAR',
            status: vehicle?.status || 'ACTIVE',
            defaultRate: vehicle?.defaultRate || 0,
            excessKmRate: vehicle?.excessKmRate || 0,
        },
    });

    const onSubmit = async (data: VehicleFormData) => {
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, value.toString());
            }
        });

        let result;
        if (vehicle) {
            result = await updateVehicle(vehicle.id, formData);
        } else {
            result = await createVehicle(formData);
        }

        if (result.success) {
            router.push('/vehicles');
            router.refresh();
        } else {
            setError(result.error || 'Failed to save vehicle');
        }

        setIsSubmitting(false);
    };

    return (
        <div className="max-w-2xl mx-auto">
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
                                    <FormLabel>Vehicle Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. CAB-1234" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="model"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Model (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Toyota Prius" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="defaultRate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Default Hire Rate (Rs.)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="e.g. 150.00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="excessKmRate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Excess Km Rate (Rs.)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="e.g. 200.00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <FormControl>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            {...field}
                                        >
                                            <option value="CAR">Car</option>
                                            <option value="VAN">Van</option>
                                            <option value="SUV">SUV</option>
                                            <option value="BUS">Bus</option>
                                            <option value="LORRY">Lorry</option>
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <FormControl>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            {...field}
                                        >
                                            <option value="ACTIVE">Active</option>
                                            <option value="MAINTENANCE">Maintenance</option>
                                            <option value="RETIRED">Retired</option>
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" type="button" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Vehicle
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
