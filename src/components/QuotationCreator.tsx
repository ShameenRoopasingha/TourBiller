'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, FileCheck, Calculator } from 'lucide-react';

import { QuotationSchema, type QuotationFormData } from '@/lib/validations';
import { generateQuotation } from '@/lib/quotation-actions';
import { formatCurrency } from '@/lib/calculations';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

import { useRouter } from 'next/navigation';

interface ScheduleOption {
    id: string;
    name: string;
    days: number;
    vehicleCategory: string;
    items: {
        dayNumber: number;
        title: string;
        description: string | null;
        distanceKm: number;
        accommodation: number;
        meals: number;
        activities: number;
        otherCosts: number;
    }[];
}

interface CustomerOption {
    id: string;
    name: string;
    mobile: string | null;
    email: string | null;
}

interface VehicleOption {
    id: string;
    vehicleNo: string;
    model: string | null;
    category: string;
    defaultRate: number;
}

interface QuotationCreatorProps {
    schedules: ScheduleOption[];
    customers: CustomerOption[];
    vehicles: VehicleOption[];
}

export function QuotationCreator({ schedules, customers, vehicles }: QuotationCreatorProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<ScheduleOption | null>(null);

    const form = useForm<QuotationFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(QuotationSchema) as any,
        defaultValues: {
            tourScheduleId: '',
            customerName: '',
            customerEmail: '',
            customerPhone: '',
            vehicleNo: '',
            numberOfPersons: 1,
            hireRatePerKm: 0,
            markup: 0,
            discount: 0,
            notes: '',
        },
    });

    const [watchedHireRate, watchedMarkup, watchedDiscount] = form.watch(['hireRatePerKm', 'markup', 'discount']);

    // When schedule selection changes
    const handleScheduleChange = (scheduleId: string) => {
        form.setValue('tourScheduleId', scheduleId);
        const schedule = schedules.find((s) => s.id === scheduleId);
        setSelectedSchedule(schedule || null);
    };

    // When customer selection changes
    const handleCustomerChange = (customerId: string) => {
        const customer = customers.find((c) => c.id === customerId);
        if (customer) {
            form.setValue('customerName', customer.name);
            form.setValue('customerEmail', customer.email || '');
            form.setValue('customerPhone', customer.mobile || '');
        }
    };

    // When vehicle selection changes
    const handleVehicleChange = (vehicleId: string) => {
        const vehicle = vehicles.find((v) => v.id === vehicleId);
        if (vehicle) {
            form.setValue('vehicleNo', vehicle.vehicleNo);
            form.setValue('hireRatePerKm', vehicle.defaultRate);
        }
    };

    // Calculate totals in real-time using single-pass reduce
    const calculatedTotals = useMemo(() => {
        if (!selectedSchedule) {
            return {
                totalDistance: 0,
                transportCost: 0,
                accommodationTotal: 0,
                mealsTotal: 0,
                activitiesTotal: 0,
                otherCostsTotal: 0,
                subtotal: 0,
                markupAmount: 0,
                totalAmount: 0,
            };
        }

        const itemTotals = selectedSchedule.items.reduce(
            (acc, item) => ({
                distance: acc.distance + item.distanceKm,
                accommodation: acc.accommodation + item.accommodation,
                meals: acc.meals + item.meals,
                activities: acc.activities + item.activities,
                other: acc.other + item.otherCosts,
            }),
            { distance: 0, accommodation: 0, meals: 0, activities: 0, other: 0 }
        );

        const transportCost = itemTotals.distance * (Number(watchedHireRate) || 0);
        const subtotal = transportCost + itemTotals.accommodation + itemTotals.meals + itemTotals.activities + itemTotals.other;
        const markupAmount = subtotal * ((Number(watchedMarkup) || 0) / 100);
        const totalAmount = Math.max(0, subtotal + markupAmount - (Number(watchedDiscount) || 0));

        return {
            totalDistance: itemTotals.distance,
            transportCost,
            accommodationTotal: itemTotals.accommodation,
            mealsTotal: itemTotals.meals,
            activitiesTotal: itemTotals.activities,
            otherCostsTotal: itemTotals.other,
            subtotal,
            markupAmount,
            totalAmount,
        };
    }, [selectedSchedule, watchedHireRate, watchedMarkup, watchedDiscount]);

    const onSubmit = async (data: QuotationFormData) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await generateQuotation(data);

            if (result.success) {
                setSuccess(true);
                setTimeout(() => router.push('/quotations'), 1000);
            } else {
                setError(result.error || 'An error occurred');
            }
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const fmt = formatCurrency;

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {success && (
                <Alert>
                    <AlertDescription>
                        Quotation generated successfully! Redirecting...
                    </AlertDescription>
                </Alert>
            )}

            {/* Step 1: Select Tour Schedule */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileCheck className="h-5 w-5" />
                        Select Tour Schedule
                    </CardTitle>
                    <CardDescription>
                        Choose an existing tour itinerary as the basis for this quotation
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="tourScheduleId">Tour Schedule *</Label>
                        <select
                            id="tourScheduleId"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            onChange={(e) => handleScheduleChange(e.target.value)}
                            defaultValue=""
                        >
                            <option value="" disabled>Select a tour schedule...</option>
                            {schedules.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.days} days, {s.vehicleCategory})
                                </option>
                            ))}
                        </select>
                        {form.formState.errors.tourScheduleId && (
                            <p className="text-sm text-destructive">{form.formState.errors.tourScheduleId.message}</p>
                        )}
                    </div>

                    {/* Day-by-day preview */}
                    {selectedSchedule && (
                        <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Itinerary Preview</h4>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[60px]">Day</TableHead>
                                        <TableHead>Route</TableHead>
                                        <TableHead className="text-right">Km</TableHead>
                                        <TableHead className="text-right">Accommodation</TableHead>
                                        <TableHead className="text-right">Meals</TableHead>
                                        <TableHead className="text-right">Activities</TableHead>
                                        <TableHead className="text-right">Other</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedSchedule.items.map((item) => (
                                        <TableRow key={item.dayNumber}>
                                            <TableCell className="font-medium">Day {item.dayNumber}</TableCell>
                                            <TableCell>{item.title}</TableCell>
                                            <TableCell className="text-right">{item.distanceKm}</TableCell>
                                            <TableCell className="text-right">{fmt(item.accommodation)}</TableCell>
                                            <TableCell className="text-right">{fmt(item.meals)}</TableCell>
                                            <TableCell className="text-right">{fmt(item.activities)}</TableCell>
                                            <TableCell className="text-right">{fmt(item.otherCosts)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Step 2: Customer & Vehicle Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Customer & Vehicle</CardTitle>
                    <CardDescription>
                        Enter customer details and select a vehicle
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Select Existing Customer</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                onChange={(e) => handleCustomerChange(e.target.value)}
                                defaultValue=""
                            >
                                <option value="">-- Or type below --</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {c.mobile ? `(${c.mobile})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Select Vehicle</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                onChange={(e) => handleVehicleChange(e.target.value)}
                                defaultValue=""
                            >
                                <option value="">-- Select vehicle --</option>
                                {vehicles.map((v) => (
                                    <option key={v.id} value={v.id}>
                                        {v.vehicleNo} {v.model ? `- ${v.model}` : ''} ({v.category})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="customerName">Customer Name *</Label>
                            <Input
                                id="customerName"
                                placeholder="Customer name"
                                {...form.register('customerName')}
                            />
                            {form.formState.errors.customerName && (
                                <p className="text-sm text-destructive">{form.formState.errors.customerName.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customerEmail">Email</Label>
                            <Input
                                id="customerEmail"
                                type="email"
                                placeholder="email@example.com"
                                {...form.register('customerEmail')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customerPhone">Phone</Label>
                            <Input
                                id="customerPhone"
                                placeholder="Phone number"
                                {...form.register('customerPhone')}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="vehicleNo">Vehicle No</Label>
                            <Input
                                id="vehicleNo"
                                placeholder="e.g. ABC-1234"
                                {...form.register('vehicleNo')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="numberOfPersons">Number of Persons</Label>
                            <Input
                                id="numberOfPersons"
                                type="number"
                                min="1"
                                {...form.register('numberOfPersons')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Tour Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                {...form.register('startDate')}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Step 3: Pricing */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Pricing
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="hireRatePerKm">Hire Rate / Km (LKR)</Label>
                            <Input
                                id="hireRatePerKm"
                                type="number"
                                step="0.01"
                                {...form.register('hireRatePerKm')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="markup">Markup (%)</Label>
                            <Input
                                id="markup"
                                type="number"
                                step="0.01"
                                {...form.register('markup')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="discount">Discount (LKR)</Label>
                            <Input
                                id="discount"
                                type="number"
                                step="0.01"
                                {...form.register('discount')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="validUntil">Valid Until</Label>
                            <Input
                                id="validUntil"
                                type="date"
                                {...form.register('validUntil')}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Additional notes or terms..."
                            {...form.register('notes')}
                        />
                    </div>

                    {/* Live Cost Summary */}
                    {selectedSchedule && (
                        <div className="mt-4 p-4 bg-muted/40 rounded-lg border">
                            <h4 className="font-semibold text-sm mb-3">Cost Summary</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Transport ({calculatedTotals.totalDistance.toFixed(1)} km × {fmt(Number(watchedHireRate) || 0)}/km)
                                    </span>
                                    <span>{fmt(calculatedTotals.transportCost)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Accommodation</span>
                                    <span>{fmt(calculatedTotals.accommodationTotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Meals</span>
                                    <span>{fmt(calculatedTotals.mealsTotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Activities</span>
                                    <span>{fmt(calculatedTotals.activitiesTotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Other Costs</span>
                                    <span>{fmt(calculatedTotals.otherCostsTotal)}</span>
                                </div>
                                <div className="border-t pt-2 flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-medium">{fmt(calculatedTotals.subtotal)}</span>
                                </div>
                                {(Number(watchedMarkup) || 0) > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Markup ({watchedMarkup}%)</span>
                                        <span>+{fmt(calculatedTotals.markupAmount)}</span>
                                    </div>
                                )}
                                {(Number(watchedDiscount) || 0) > 0 && (
                                    <div className="flex justify-between text-destructive">
                                        <span>Discount</span>
                                        <span>-{fmt(Number(watchedDiscount) || 0)}</span>
                                    </div>
                                )}
                                <div className="border-t-2 pt-2 flex justify-between text-lg font-bold">
                                    <span>TOTAL</span>
                                    <span className="text-primary">{fmt(calculatedTotals.totalAmount)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting || !selectedSchedule} className="min-w-[160px]">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Quotation
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/quotations')}
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}
