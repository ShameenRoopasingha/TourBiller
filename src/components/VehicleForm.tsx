'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, Calculator, Sparkles, Wrench, Shield, Fuel, Disc } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { VehicleFormSchema, type VehicleFormInput, type Vehicle } from '@/lib/validations';
import { notify } from '@/lib/notifications';

// For backward compatibility - alias the type
export type VehicleFormData = VehicleFormInput;
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
            insuranceExpiry: vehicle?.insuranceExpiry ? new Date(vehicle.insuranceExpiry).toISOString().split('T')[0] : '',
            revenueLicenseExpiry: vehicle?.revenueLicenseExpiry ? new Date(vehicle.revenueLicenseExpiry).toISOString().split('T')[0] : '',
            currentMileage: vehicle?.currentMileage ?? 0,
            oilChangeInterval: vehicle?.oilChangeInterval ?? 5000,
            lastOilChangeMileage: vehicle?.lastOilChangeMileage ?? 0,
            filterChangeInterval: vehicle?.filterChangeInterval ?? 10000,
            lastFilterChangeMileage: vehicle?.lastFilterChangeMileage ?? 0,
            washInterval: vehicle?.washInterval ?? 1000,
            lastWashMileage: vehicle?.lastWashMileage ?? 0,
            serviceCost: vehicle?.serviceCost ?? 0,
            annualInsuranceCost: vehicle?.annualInsuranceCost ?? 0,
            fuelEfficiency: vehicle?.fuelEfficiency ?? 0,
            tyreCost: vehicle?.tyreCost ?? 0,
            tyreLifespan: vehicle?.tyreLifespan ?? 40000,
        },
    });

    // Live Operating Cost (VOC) calculations
    const watchedServiceCost = Number(form.watch('serviceCost')) || 0;
    const watchedOilInterval = Number(form.watch('oilChangeInterval')) || 5000;
    const watchedAnnualInsurance = Number(form.watch('annualInsuranceCost')) || 0;
    const watchedKmPerDay = Number(form.watch('kmPerDay')) || 100;
    const watchedTyreCost = Number(form.watch('tyreCost')) || 0;
    const watchedTyreLifespan = Number(form.watch('tyreLifespan')) || 40000;
    const watchedFuelEfficiency = Number(form.watch('fuelEfficiency')) || 0;

    const costBreakdown = useMemo(() => {
        const servicePerKm = watchedOilInterval > 0 ? watchedServiceCost / watchedOilInterval : 0;
        const insurancePerKm = watchedKmPerDay > 0 ? watchedAnnualInsurance / (365 * watchedKmPerDay) : 0;
        const tyrePerKm = watchedTyreLifespan > 0 ? watchedTyreCost / watchedTyreLifespan : 0;
        const fuelPerKm = watchedFuelEfficiency > 0 ? 370 / watchedFuelEfficiency : 0;
        const baseCostPerKm = servicePerKm + insurancePerKm + tyrePerKm + fuelPerKm;
        const wearReserve = baseCostPerKm > 0 ? 5 : 0;
        const profitMargin = (baseCostPerKm + wearReserve) * 0.20; // 20% profit margin
        const suggestedRate = baseCostPerKm > 0 ? Math.round(((baseCostPerKm + wearReserve + profitMargin) / 5)) * 5 : 0;

        return {
            servicePerKm,
            insurancePerKm,
            tyrePerKm,
            fuelPerKm,
            baseCostPerKm,
            wearReserve,
            suggestedRate,
        };
    }, [watchedServiceCost, watchedOilInterval, watchedAnnualInsurance, watchedKmPerDay, watchedTyreCost, watchedTyreLifespan, watchedFuelEfficiency]);

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

        try {
            const response = await fetch(vehicle ? `/api/vehicles/${encodeURIComponent(vehicle.id)}` : '/api/vehicles', {
                method: vehicle ? 'PUT' : 'POST',
                body: formData,
            });
            const result = await response.json();

            if (response.ok && result.success) {
                notify.success(vehicle ? 'Vehicle updated successfully' : 'Vehicle created successfully');
                router.refresh();
                router.push('/vehicles');
                return;
            }

            notify.error(result.error || 'Failed to save vehicle');
            setError(result.error || 'Failed to save vehicle');
        } catch (submitError) {
            console.error('Error saving vehicle:', submitError);
            const message = submitError instanceof Error ? submitError.message : 'Failed to save vehicle. Please try again.';
            notify.error(message);
            setError(message);
        } finally {
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
                                    <div className="flex items-center justify-between">
                                        <FormLabel>{rateMode === 'PER_DAY' ? 'Extra Km Charge (Rs.)' : 'Rate Per Km (Rs.)'}</FormLabel>
                                        {costBreakdown.suggestedRate > 0 && (
                                            <button
                                                type="button"
                                                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium bg-primary/10 px-2 py-0.5 rounded cursor-pointer transition-colors hover:bg-primary/20"
                                                onClick={() => form.setValue('excessKmRate', costBreakdown.suggestedRate, { shouldDirty: true })}
                                                title="Auto-calculate based on Service, Insurance, Tyres and Fuel costs"
                                            >
                                                <Sparkles className="w-3 h-3 text-primary" />
                                                Auto-fill: Rs. {costBreakdown.suggestedRate}/km
                                            </button>
                                        )}
                                    </div>
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
                                                { label: 'Three Wheeler', value: 'THREE_WHEELER' },
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
                                name="insuranceExpiry"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Insurance Expiry Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="revenueLicenseExpiry"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Revenue License Expiry Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} value={field.value || ""} />
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

                    {/* Operating Costs & Rate Estimator */}
                    <div className="border-t pt-4 mt-6">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    Operating Costs & Running Charges
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Enter routine costs to automatically compute the vehicle&apos;s true cost per kilometer and suggested extra km rate.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="serviceCost"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1.5">
                                            <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
                                            Service Cost per Routine Service (Rs.)
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="e.g. 35000" {...field} value={field.value ?? ""} />
                                        </FormControl>
                                        <p className="text-xs text-muted-foreground">
                                            Divided by {form.watch('oilChangeInterval') || 5000} km interval = Rs. {costBreakdown.servicePerKm.toFixed(2)}/km
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="annualInsuranceCost"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1.5">
                                            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                                            Annual Insurance Premium (Rs.)
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="e.g. 120000" {...field} value={field.value ?? ""} />
                                        </FormControl>
                                        <p className="text-xs text-muted-foreground">
                                            Divided by (365 × {form.watch('kmPerDay') || 100} km) = Rs. {costBreakdown.insurancePerKm.toFixed(2)}/km
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="tyreCost"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1.5">
                                            <Disc className="w-3.5 h-3.5 text-muted-foreground" />
                                            Cost of Tyre Set (Rs.)
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="e.g. 160000" {...field} value={field.value ?? ""} />
                                        </FormControl>
                                        <p className="text-xs text-muted-foreground">
                                            Divided by {form.watch('tyreLifespan') || 40000} km = Rs. {costBreakdown.tyrePerKm.toFixed(2)}/km
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="tyreLifespan"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tyre Lifespan (KM)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="1000" placeholder="e.g. 40000" {...field} value={field.value ?? ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="fuelEfficiency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1.5">
                                            <Fuel className="w-3.5 h-3.5 text-muted-foreground" />
                                            Fuel Efficiency (KM / Litre)
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" placeholder="e.g. 12" {...field} value={field.value ?? ""} />
                                        </FormControl>
                                        <p className="text-xs text-muted-foreground">
                                            {costBreakdown.fuelPerKm > 0 ? `At Rs. 370/L = Rs. ${costBreakdown.fuelPerKm.toFixed(2)}/km` : 'Optional (leave 0 if customer pays fuel)'}
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Real-time VOC Breakdown Card */}
                        {costBreakdown.baseCostPerKm > 0 && (
                            <div className="mt-4 p-3 bg-muted/40 rounded-lg border border-border/80 text-xs space-y-2">
                                <div className="flex items-center justify-between font-medium">
                                    <span className="flex items-center gap-1.5 text-foreground font-semibold">
                                        <Calculator className="w-3.5 h-3.5 text-primary" />
                                        Running Cost Breakdown
                                    </span>
                                    <span className="text-primary font-bold">
                                        Base: Rs. {costBreakdown.baseCostPerKm.toFixed(2)} / KM
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-muted-foreground pt-1">
                                    <div>Service: <span className="font-semibold text-foreground">Rs. {costBreakdown.servicePerKm.toFixed(2)}</span></div>
                                    <div>Insurance: <span className="font-semibold text-foreground">Rs. {costBreakdown.insurancePerKm.toFixed(2)}</span></div>
                                    <div>Tyres: <span className="font-semibold text-foreground">Rs. {costBreakdown.tyrePerKm.toFixed(2)}</span></div>
                                    <div>Fuel: <span className="font-semibold text-foreground">{costBreakdown.fuelPerKm > 0 ? `Rs. ${costBreakdown.fuelPerKm.toFixed(2)}` : 'Rs. 0.00'}</span></div>
                                </div>
                                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-border/60 gap-2">
                                    <span className="text-muted-foreground">
                                        Suggested Rate (Base + Rs. 5 reserve + 20% margin): <strong className="text-foreground text-sm">Rs. {costBreakdown.suggestedRate}/km</strong>
                                    </span>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                                        onClick={() => {
                                            form.setValue('excessKmRate', costBreakdown.suggestedRate, { shouldDirty: true });
                                            notify.success(`Set Extra Km Rate to Rs. ${costBreakdown.suggestedRate}`);
                                        }}
                                    >
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        Apply to Extra Km Charge
                                    </Button>
                                </div>
                            </div>
                        )}
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
                                            <FormLabel className="flex justify-between items-center">
                                                <span>Last Oil Change at (KM)</span>
                                                <Button 
                                                    type="button" 
                                                    variant="secondary" 
                                                    size="sm" 
                                                    className="h-6 px-2 text-xs"
                                                    onClick={() => form.setValue('lastOilChangeMileage', form.getValues('currentMileage') || 0, { shouldDirty: true })}
                                                >
                                                    Set to Current
                                                </Button>
                                            </FormLabel>
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
                                            <FormLabel className="flex justify-between items-center">
                                                <span>Last Filter Change at (KM)</span>
                                                <Button 
                                                    type="button" 
                                                    variant="secondary" 
                                                    size="sm" 
                                                    className="h-6 px-2 text-xs"
                                                    onClick={() => form.setValue('lastFilterChangeMileage', form.getValues('currentMileage') || 0, { shouldDirty: true })}
                                                >
                                                    Set to Current
                                                </Button>
                                            </FormLabel>
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
                                        <FormLabel className="flex justify-between items-center">
                                            <span>Last Body Wash at (KM)</span>
                                            <Button 
                                                type="button" 
                                                variant="secondary" 
                                                size="sm" 
                                                className="h-6 px-2 text-xs"
                                                onClick={() => form.setValue('lastWashMileage', form.getValues('currentMileage') || 0, { shouldDirty: true })}
                                            >
                                                Set to Current
                                            </Button>
                                        </FormLabel>
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
