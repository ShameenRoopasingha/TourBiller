
'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Printer } from 'lucide-react';
import { BillSchema, type BillFormData, type Vehicle, type Customer } from '@/lib/validations';
import { createBill } from '@/lib/actions';
import { getVehicles } from '@/lib/vehicle-actions';
import { getCustomers } from '@/lib/customer-actions';

import { useCalculationEngine } from '@/hooks/useCalculationEngine';
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
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { useRouter } from 'next/navigation';




export function BillCreator({
    initialVehicleNo,
    initialCustomerName,
    initialBookingId
}: {
    initialVehicleNo?: string;
    initialCustomerName?: string;
    initialBookingId?: string;
}) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successId, setSuccessId] = useState<string | null>(null);
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

    const {
        formattedTotalAmount,
        formattedBaseCharge,
        formattedExtraCharges,
        distance,
        updateField,
        resetCalculations,
    } = useCalculationEngine();

    const form = useForm<BillFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(BillSchema) as any,
        defaultValues: {
            vehicleNo: initialVehicleNo || '',
            customerName: initialCustomerName || '',
            route: '',
            startMeter: 0,
            endMeter: 0,
            hireRate: 0,
            waitingCharge: 0,
            gatePass: 0,
            packageCharge: 0,
            allowedKm: 0,
            currency: 'LKR',
            exchangeRate: 1,
            paymentMethod: 'CASH',
        },
    });

    const watchedAllowedKm = useWatch({
        control: form.control,
        name: 'allowedKm',
        defaultValue: 0
    });

    // Effect to check if vehicle selection needs to trigger rate update
    useEffect(() => {
        if (initialVehicleNo && vehicles.length > 0) {
            const selectedVehicle = vehicles.find(v => v.vehicleNo === initialVehicleNo);
            if (selectedVehicle) {
                const rate = selectedVehicle.defaultRate ?? 0;
                form.setValue('hireRate', rate);
                updateField('hireRate', rate);
            }
        }
    }, [initialVehicleNo, vehicles, form, updateField]);



    const onSubmit = async (data: BillFormData) => {
        setIsSubmitting(true);
        setError(null);
        setSuccessId(null);

        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, value.toString());
        });

        // Append Booking ID if present to auto-close booking
        if (initialBookingId) {
            formData.append('bookingId', initialBookingId);
        }

        const result = await createBill(formData);

        if (result.success && result.data) {
            setSuccessId(result.data);
            form.reset();
            resetCalculations();

            // Auto open print page
            router.push(`/bills/${result.data}/print`);
        } else {
            setError(result.error || 'Failed to create bill');
        }

        setIsSubmitting(false);
    };

    const handleNumericChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        fieldChange: (value: number) => void,
        fieldName: string
    ) => {
        const value = parseFloat(e.target.value) || 0;
        fieldChange(value);
        updateField(fieldName, value);
    };

    const handleVehicleChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        fieldChange: (value: string) => void
    ) => {
        const value = e.target.value;
        fieldChange(value);

        const selectedVehicle = vehicles.find(v => v.vehicleNo === value);
        if (selectedVehicle) {
            const rate = selectedVehicle.defaultRate ?? 0;
            form.setValue('hireRate', rate);
            updateField('hireRate', rate);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            {successId && (
                <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
                    <Printer className="h-4 w-4" />
                    <AlertTitle>Success!</AlertTitle>
                    <AlertDescription>
                        Bill created successfully. ID: {successId}
                        <div className="mt-2 flex gap-2">
                            <Button variant="outline" size="sm" className="bg-white" asChild>
                                <a href={`/bills/${successId}/print`} target="_blank" rel="noopener noreferrer">
                                    Print Invoice
                                </a>
                            </Button>
                            <Button variant="outline" size="sm" className="bg-white" onClick={() => window.location.href = '/'}>
                                Go to Dashboard
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">New Bill</h1>
                    <p className="text-muted-foreground">Create a new invoice for vehicle hire.</p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                        {/* LEFT COLUMN: INPUTS */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Card 1: Trip Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TripIcon /> Trip Details
                                    </CardTitle>
                                    <CardDescription>Customer, vehicle, and route information.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="vehicleNo"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Vehicle Number</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Select Vehicle..."
                                                            {...field}
                                                            list="vehicle-list"
                                                            autoComplete="off"
                                                            onChange={(e) => handleVehicleChange(e, field.onChange)}
                                                        />
                                                    </FormControl>
                                                    <datalist id="vehicle-list">
                                                        {vehicles.map((v) => (
                                                            <option key={v.id} value={v.vehicleNo}>
                                                                {v.model ? `${v.vehicleNo} - ${v.model}` : v.vehicleNo}
                                                            </option>
                                                        ))}
                                                    </datalist>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="customerName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Customer Name</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Select Customer..."
                                                            {...field}
                                                            list="customer-list"
                                                            autoComplete="off"
                                                        />
                                                    </FormControl>
                                                    <datalist id="customer-list">
                                                        {customers.map((c) => (
                                                            <option key={c.id} value={c.name}>
                                                                {c.mobile ? `${c.name} (${c.mobile})` : c.name}
                                                            </option>
                                                        ))}
                                                    </datalist>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="route"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Route / Description</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Airport Drop or Kandy Tour" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="startMeter"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Start Meter</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.1" {...field} onChange={e => handleNumericChange(e, field.onChange, 'startMeter')} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="endMeter"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>End Meter</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.1" {...field} onChange={e => handleNumericChange(e, field.onChange, 'endMeter')} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 2: Billing & Charges */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MoneyIcon /> Billing & Charges
                                    </CardTitle>
                                    <CardDescription>Configure rates, packages, and extra charges.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Primary Rate Configuration */}
                                    <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-4">
                                        <h3 className="font-semibold text-sm text-foreground">Rate Configuration</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="packageCharge"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Package Charge</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" step="0.01" {...field} onChange={e => handleNumericChange(e, field.onChange, 'packageCharge')} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="allowedKm"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Included Km</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" step="1" {...field} onChange={e => handleNumericChange(e, field.onChange, 'allowedKm')} />
                                                        </FormControl>
                                                        <FormMessage />
                                                        {form.getValues('allowedKm') > 0 && <p className="text-[10px] text-muted-foreground">Standard distance</p>}
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="hireRate"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{watchedAllowedKm > 0 ? "Excess Rate / km" : "Rate / km"}</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" step="0.01" {...field} onChange={e => handleNumericChange(e, field.onChange, 'hireRate')} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* Extra Charges */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="waitingCharge"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Waiting Charge</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" {...field} onChange={e => handleNumericChange(e, field.onChange, 'waitingCharge')} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="gatePass"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Gate Pass</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" {...field} onChange={e => handleNumericChange(e, field.onChange, 'gatePass')} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="paymentMethod"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Payment Method</FormLabel>
                                                <FormControl>
                                                    <div className="flex gap-4">
                                                        <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-md hover:bg-muted/50 transition-colors w-full">
                                                            <input type="radio" {...field} value="CASH" checked={field.value === 'CASH'} className="h-4 w-4 text-primary" />
                                                            <span className="font-medium">Cash</span>
                                                        </label>
                                                        <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-md hover:bg-muted/50 transition-colors w-full">
                                                            <input type="radio" {...field} value="CREDIT" checked={field.value === 'CREDIT'} className="h-4 w-4 text-primary" />
                                                            <span className="font-medium">Credit</span>
                                                        </label>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN: STICKY SUMMARY */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-8 space-y-6">
                                <Card className="bg-primary/5 border-primary/20 shadow-lg">
                                    <CardHeader className="bg-primary/10 border-b border-primary/10 pb-4">
                                        <CardTitle className="text-lg">Receipt Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4">

                                        {/* Distance Breakdown */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Total Distance</span>
                                                <span className="font-medium">{distance.toFixed(1)} km</span>
                                            </div>
                                            {watchedAllowedKm > 0 && (
                                                <>
                                                    <div className="flex justify-between text-xs text-muted-foreground pl-2 border-l-2 border-primary/20">
                                                        <span>Included</span>
                                                        <span>{watchedAllowedKm} km</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-muted-foreground pl-2 border-l-2 border-primary/20">
                                                        <span>Excess</span>
                                                        <span>{Math.max(0, distance - watchedAllowedKm).toFixed(1)} km</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="border-t border-dashed border-primary/20 my-2"></div>

                                        {/* Cost Breakdown */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Base Charge</span>
                                                <span>{formattedBaseCharge}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Extra Charges</span>
                                                <span>{formattedExtraCharges}</span>
                                            </div>
                                        </div>

                                        <div className="border-t border-primary/20 my-4"></div>

                                        <div className="flex justify-between items-end">
                                            <span className="text-lg font-bold">Total</span>
                                            <span className="text-3xl font-bold text-primary">Rs.{formattedTotalAmount.replace('Rs. ', '')}</span>
                                        </div>

                                        <Button type="submit" className="w-full mt-6 h-12 text-lg font-semibold shadow-md" disabled={isSubmitting}>
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>Create Bill</>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                    </div>
                </form>
            </Form>
        </div>
    );
}

// Simple Icons
function TripIcon() {
    return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></svg>
}

function MoneyIcon() {
    return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>
}
