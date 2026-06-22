'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { VehicleFormSchema, type VehicleFormInput, type Vehicle } from '@/lib/validations';

// For backward compatibility - alias the type
export type VehicleFormData = VehicleFormInput;
import { createVehicle, updateVehicle } from '@/lib/vehicle-actions';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { ComboboxField } from '@/components/ComboboxField';
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
    const [rateMode, setRateMode] = useState<'PER_DAY' | 'PER_KM'>(
        vehicle?.ratePerDay === 0 && vehicle?.kmPerDay === 0 && (vehicle?.excessKmRate || 0) > 0 ? 'PER_KM' : 'PER_DAY'
    );
    const router = useRouter();
    const handleEnterKey = useEnterNavigation();

    const form = useForm<VehicleFormInput>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(VehicleFormSchema) as any,
        defaultValues: {
            vehicleNo: vehicle?.vehicleNo || '',
            model: vehicle?.model || '',
            category: vehicle?.category || 'CAR',
            status: vehicle?.status || 'ACTIVE',
            ratePerDay: vehicle?.ratePerDay ?? 0,
            kmPerDay: vehicle?.kmPerDay ?? 0,
            excessKmRate: vehicle?.excessKmRate ?? 0,
            extraHourRate: vehicle?.extraHourRate ?? 0,
            seats: vehicle?.seats ?? 0,
            acType: vehicle?.acType || '',
            features: vehicle?.features || '',
            insuranceCoverage: vehicle?.insuranceCoverage || '',
            currentMileage: vehicle?.currentMileage ?? 0,
            oilChangeInterval: vehicle?.oilChangeInterval ?? 5000,
            lastOilChangeMileage: vehicle?.lastOilChangeMileage ?? 0,
            filterChangeInterval: vehicle?.filterChangeInterval ?? 10000,
            lastFilterChangeMileage: vehicle?.lastFilterChangeMileage ?? 0,
            washInterval: vehicle?.washInterval ?? 1000,
            lastWashMileage: vehicle?.lastWashMileage ?? 0,
        },
    });

    const onSubmit = async (data: VehicleFormData) => {
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData();
        const submissionData = { ...data };
        
        if (rateMode === 'PER_KM') {
            submissionData.ratePerDay = 0;
            submissionData.kmPerDay = 0;
            // The excessKmRate is used as the rate per km
        }
        
        Object.entries(submissionData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formData.append(key, (value as any) instanceof Date ? (value as any).toISOString() : String(value));
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
            // Intentionally not setting isSubmitting to false here
        } else {
            setError(result.error || 'Failed to save vehicle');
            setIsSubmitting(false);
        }
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" onKeyDown={handleEnterKey}>
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
                                        <Input placeholder="e.g. Toyota Prius" {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Rate Mode Toggle */}
                    <div className="flex flex-col gap-2 mb-2 mt-4">
                        <FormLabel>Pricing Mode</FormLabel>
                        <div className="flex gap-6 p-3 bg-muted/30 rounded-lg border">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="rateMode" 
                                    value="PER_DAY" 
                                    checked={rateMode === 'PER_DAY'} 
                                    onChange={() => setRateMode('PER_DAY')}
                                    className="w-4 h-4 text-primary accent-primary"
                                />
                                <span className="text-sm font-medium">Rate Per Day (Package)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="rateMode" 
                                    value="PER_KM" 
                                    checked={rateMode === 'PER_KM'} 
                                    onChange={() => setRateMode('PER_KM')}
                                    className="w-4 h-4 text-primary accent-primary"
                                />
                                <span className="text-sm font-medium">Flat Rate Per Km</span>
                            </label>
                        </div>
                    </div>

                    {rateMode === 'PER_DAY' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="ratePerDay"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vehicle Rate Per Day (Rs.)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="e.g. 17000" {...field} value={field.value ?? ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="kmPerDay"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Included Km Per Day</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="e.g. 100" {...field} value={field.value ?? ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="excessKmRate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{rateMode === 'PER_DAY' ? 'Extra Km Charge (Rs.)' : 'Rate Per Km (Rs.)'}</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="e.g. 120" {...field} value={field.value ?? ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="extraHourRate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Extra Hour Charge (Rs.)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="e.g. 800" {...field} value={field.value ?? ""} />
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
                                        <ComboboxField
                                            options={[
                                                { label: 'Car', value: 'CAR' },
                                                { label: 'Van', value: 'VAN' },
                                                { label: 'SUV', value: 'SUV' },
                                                { label: 'Bus', value: 'BUS' },
                                                { label: 'Lorry', value: 'LORRY' },
                                            ]}
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="Select category..."
                                        />
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
                                        <ComboboxField
                                            options={[
                                                { label: 'Active', value: 'ACTIVE' },
                                                { label: 'Maintenance', value: 'MAINTENANCE' },
                                                { label: 'Retired', value: 'RETIRED' },
                                            ]}
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="Select status..."
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Vehicle Specifications */}
                    <div className="border-t pt-4 mt-2">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Vehicle Specifications</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="seats"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Number of Seats</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="1" placeholder="e.g. 14" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="acType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>AC Type</FormLabel>
                                        <FormControl>
                                            <ComboboxField
                                                options={[
                                                    { label: 'No AC', value: 'No AC' },
                                                    { label: 'Line AC', value: 'Line AC' },
                                                    { label: 'Dual AC', value: 'Dual AC' },
                                                    { label: 'Roof AC', value: 'Roof AC' },
                                                ]}
                                                value={field.value || ''}
                                                onChange={field.onChange}
                                                placeholder="Select AC type..."
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <FormField
                                control={form.control}
                                name="insuranceCoverage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Insurance Coverage</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Rs. 500,000 per passenger" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="features"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Features / Amenities</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. TV, Sound system, Original seats" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* Maintenance Tracking */}
                    <div className="border-t pt-4 mt-6">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Maintenance Tracking</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                                control={form.control}
                                name="currentMileage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Current Mileage (KM)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="e.g. 45000" {...field} value={field.value ?? ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="oilChangeInterval"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Oil Change Interval (KM)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} value={field.value ?? ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastOilChangeMileage"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last Oil Change at (KM)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} value={field.value ?? ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="filterChangeInterval"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Filter Change Interval (KM)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} value={field.value ?? ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastFilterChangeMileage"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last Filter Change at (KM)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} value={field.value ?? ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <FormField
                                control={form.control}
                                name="washInterval"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Body Wash Interval (KM)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} value={field.value ?? ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastWashMileage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last Body Wash at (KM)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} value={field.value ?? ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
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
