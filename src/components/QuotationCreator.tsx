'use client';

import React, { useState, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, FileCheck, Calculator, Plus } from 'lucide-react';

import { QuotationFormSchema, type QuotationFormInput, type QuotationWithSchedule, type VehicleAvailabilityConflict, type DriverAvailabilityConflict } from '@/lib/validations';

// For backward compatibility
export type QuotationFormData = QuotationFormInput;
import { generateQuotation, updateQuotation } from '@/lib/quotation-actions';
import { checkVehicleAvailability } from '@/lib/vehicle-actions';
import { checkDriverAvailability } from '@/lib/user-actions';
import { formatCurrency } from '@/lib/calculations';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { ComboboxField } from '@/components/ComboboxField';
import { TourScheduleForm } from '@/components/TourScheduleForm';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';

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
    excessKmRate?: number | null;
    extraHourRate?: number | null;
    vehicleNo?: string | null;
    ratePerDay: number;
    kmPerDay: number;
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
    ratePerDay: number;
    kmPerDay: number;
    excessKmRate: number;
    extraHourRate: number;
    seats: number | null;
    acType: string | null;
    features: string | null;
    insuranceCoverage: string | null;
}

interface QuotationCreatorProps {
    schedules: ScheduleOption[];
    customers: CustomerOption[];
    vehicles: VehicleOption[];
    drivers?: { id: string; name: string }[];
    initialData?: QuotationWithSchedule;
}

export function QuotationCreator({ schedules, customers, vehicles, drivers = [], initialData }: QuotationCreatorProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<ScheduleOption | null>(
        initialData ? schedules.find(s => s.id === initialData.tourScheduleId) || null : null
    );
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(
        initialData ? vehicles.find(v => v.vehicleNo === initialData.vehicleNo) || null : null
    );
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [justCreatedScheduleId, setJustCreatedScheduleId] = useState<string | null>(null);
    const [availabilityConflict, setAvailabilityConflict] = useState<VehicleAvailabilityConflict | null>(null);
    const [driverAvailabilityConflict, setDriverAvailabilityConflict] = useState<DriverAvailabilityConflict | null>(null);
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
    const handleEnterKey = useEnterNavigation();

    const form = useForm<QuotationFormInput>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(QuotationFormSchema) as any,
        defaultValues: initialData ? {
            customerName: initialData.customerName,
            customerEmail: initialData.customerEmail || '',
            customerPhone: initialData.customerPhone || '',
            vehicleNo: initialData.vehicleNo || '',
            numberOfPersons: initialData.numberOfPersons,
            startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] as unknown as Date : undefined,
            endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] as unknown as Date : undefined,
            pickupLocation: initialData.pickupLocation || '',
            dropLocation: initialData.dropLocation || '',
            hireRatePerDay: initialData.hireRatePerDay,
            kmPerDay: initialData.kmPerDay,
            excessKmRate: initialData.excessKmRate,
            extraHourRate: initialData.extraHourRate,
            markup: initialData.markup,
            discount: initialData.discount,
            driverCostPerDay: initialData.driverCostPerDay,
            advanceAmount: initialData.advanceAmount,
            excludedItems: initialData.excludedItems || 'Highway charges, Parking fees',
            notes: initialData.notes || '',
            tourScheduleId: initialData.tourScheduleId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            status: (initialData.status as any) || 'DRAFT',
            validUntil: initialData.validUntil ? new Date(initialData.validUntil).toISOString().split('T')[0] as unknown as Date : undefined,
            driverId: initialData.driverId || '',
        } : {
            customerName: '',
            customerEmail: '',
            customerPhone: '',
            vehicleNo: '',
            numberOfPersons: 1,
            pickupLocation: '',
            dropLocation: '',
            hireRatePerDay: 0,
            kmPerDay: 0,
            excessKmRate: 0,
            extraHourRate: 0,
            markup: 0,
            discount: 0,
            driverCostPerDay: 0,
            advanceAmount: 0,
            excludedItems: 'Highway / expressway charges\nParking fees',
            notes: '',
            validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] as unknown as Date,
            status: 'DRAFT',
            driverId: '',
        },
    });

    const watchedFields = useWatch({
        control: form.control,
    });

    const {
        hireRatePerDay: watchedHireRate,
        kmPerDay: watchedKmPerDay,
        markup: watchedMarkup,
        discount: watchedDiscount,
        driverCostPerDay: watchedDriverCost,
        excessKmRate: watchedExcessKmRate,
        extraHourRate: watchedExtraHourRate,
        startDate: watchedStartDate,
        endDate: watchedEndDate,
        tourScheduleId: watchedTourScheduleId,
        customerName: watchedCustomerName,
        vehicleNo: watchedVehicleNo,
        driverId: watchedDriverId,
    } = watchedFields;

    // Auto-calculate end date when start date or schedule changes
    React.useEffect(() => {
        if (selectedSchedule && watchedStartDate) {
            try {
                const start = new Date(watchedStartDate);
                if (!isNaN(start.getTime())) {
                    // End date = start date + (days - 1)
                    const end = new Date(start);
                    end.setDate(start.getDate() + (selectedSchedule.days - 1));
                    form.setValue('endDate', end.toISOString().split('T')[0] as unknown as Date);
                }
            } catch (e) {
                console.error("Error calculating end date", e);
            }
        } else {
            form.setValue('endDate', '' as unknown as Date);
        }
    }, [watchedStartDate, selectedSchedule, form]);

    // Check vehicle and driver availability
    React.useEffect(() => {
        const checkAvailability = async () => {
            const hasVehicle = !!watchedVehicleNo;
            const hasDriver = !!watchedDriverId;
            const hasStartDate = !!watchedStartDate;
            const hasEndDate = !!watchedEndDate;

            if (hasStartDate && hasEndDate && (hasVehicle || hasDriver)) {
                setIsCheckingAvailability(true);
                // Reset conflicts before checking
                if (hasVehicle) setAvailabilityConflict(null);
                if (hasDriver) setDriverAvailabilityConflict(null);

                try {
                    const [vehicleRes, driverRes] = await Promise.all([
                        hasVehicle ? checkVehicleAvailability(
                            watchedVehicleNo,
                            watchedStartDate,
                            watchedEndDate,
                            initialData?.id,
                            'Quotation'
                        ) : Promise.resolve(null),
                        hasDriver ? checkDriverAvailability(
                            watchedDriverId as string,
                            watchedStartDate,
                            watchedEndDate,
                            initialData?.id,
                            'Quotation'
                        ) : Promise.resolve(null)
                    ]);

                    if (vehicleRes?.success && !vehicleRes.data?.available) {
                        setAvailabilityConflict(vehicleRes.data?.conflicts[0] || null);
                    }
                    if (driverRes?.success && !driverRes.data?.available) {
                        setDriverAvailabilityConflict(driverRes.data?.conflicts[0] || null);
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
    }, [watchedVehicleNo, watchedDriverId, watchedStartDate, watchedEndDate, initialData?.id]);

    // When schedule selection changes
    const handleScheduleChange = React.useCallback((scheduleId: string) => {
        form.setValue('tourScheduleId', scheduleId);
        const schedule = schedules.find((s) => s.id === scheduleId);
        setSelectedSchedule(schedule || null);

        if (schedule) {
            // Autofill rates from schedule if they exist
            if (schedule.ratePerDay > 0) form.setValue('hireRatePerDay', schedule.ratePerDay);
            if (schedule.kmPerDay > 0) form.setValue('kmPerDay', schedule.kmPerDay);
            if (schedule.excessKmRate) form.setValue('excessKmRate', schedule.excessKmRate);
            if (schedule.extraHourRate) form.setValue('extraHourRate', schedule.extraHourRate);

            // If schedule has a vehicle, try to select it
            if (schedule.vehicleNo) {
                const vehicle = vehicles.find(v => v.vehicleNo === schedule.vehicleNo);
                if (vehicle) {
                    form.setValue('vehicleNo', vehicle.vehicleNo);
                    setSelectedVehicle(vehicle);
                    // Also ensure rates are filled if not already set by schedule
                    if (!(schedule.ratePerDay > 0)) form.setValue('hireRatePerDay', vehicle.ratePerDay);
                    if (!(schedule.kmPerDay > 0)) form.setValue('kmPerDay', vehicle.kmPerDay);
                    if (!schedule.excessKmRate) form.setValue('excessKmRate', vehicle.excessKmRate);
                    if (!schedule.extraHourRate) form.setValue('extraHourRate', vehicle.extraHourRate);
                }
            }
        }
    }, [form, schedules, vehicles]);

    // Auto-select newly created schedule
    React.useEffect(() => {
        if (justCreatedScheduleId) {
            const schedule = schedules.find(s => s.id === justCreatedScheduleId);
            if (schedule) {
                handleScheduleChange(schedule.id);
                setJustCreatedScheduleId(null);
            }
        }
    }, [schedules, justCreatedScheduleId, handleScheduleChange]);

    // List all vehicles (category filtering removed based on user request)
    const filteredVehicles = useMemo(() => {
        return vehicles;
    }, [vehicles]);



    // When vehicle selection changes
    const handleVehicleChange = (vehicleId: string) => {
        const vehicle = vehicles.find((v) => v.id === vehicleId);
        if (vehicle) {
            form.setValue('vehicleNo', vehicle.vehicleNo);

            // Prioritize schedule rates if they are set (non-zero)
            const rate = (selectedSchedule && selectedSchedule.ratePerDay > 0) ? selectedSchedule.ratePerDay : vehicle.ratePerDay;
            const km = (selectedSchedule && selectedSchedule.kmPerDay > 0) ? selectedSchedule.kmPerDay : vehicle.kmPerDay;
            const excess = (selectedSchedule && selectedSchedule.excessKmRate) || vehicle.excessKmRate || 0;
            const extraHour = (selectedSchedule && selectedSchedule.extraHourRate) || vehicle.extraHourRate || 0;

            form.setValue('hireRatePerDay', rate);
            form.setValue('kmPerDay', km);
            form.setValue('excessKmRate', excess);
            form.setValue('extraHourRate', extraHour);
            setSelectedVehicle(vehicle);
        } else {
            setSelectedVehicle(null);
        }
    };

    // Calculate totals in real-time using single-pass reduce
    const calculatedTotals = useMemo(() => {
        if (!selectedSchedule) {
            return {
                totalDistance: 0,
                includedKm: 0,
                transportCost: 0,
                driverTotal: 0,
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

        const ratePerDay = Number(watchedHireRate) || 0;
        const kmAllowancePerDay = Number(watchedKmPerDay) || 0;
        const days = selectedSchedule.days;
        const transportCost = days * ratePerDay;
        const includedKm = days * kmAllowancePerDay;
        const driverTotal = days * (Number(watchedDriverCost) || 0);
        const subtotal = transportCost + driverTotal + itemTotals.accommodation + itemTotals.meals + itemTotals.activities + itemTotals.other;
        const markupAmount = subtotal * ((Number(watchedMarkup) || 0) / 100);
        const totalAmount = Math.max(0, subtotal + markupAmount - (Number(watchedDiscount) || 0));

        return {
            totalDistance: itemTotals.distance,
            includedKm,
            transportCost,
            driverTotal,
            accommodationTotal: itemTotals.accommodation,
            mealsTotal: itemTotals.meals,
            activitiesTotal: itemTotals.activities,
            otherCostsTotal: itemTotals.other,
            subtotal,
            markupAmount,
            totalAmount,
        };
    }, [selectedSchedule, watchedHireRate, watchedKmPerDay, watchedMarkup, watchedDiscount, watchedDriverCost]);

    const onSubmit = async (data: QuotationFormData) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    formData.append(key, value instanceof Date ? value.toISOString() : String(value));
                }
            });

            const result = initialData
                ? await updateQuotation(initialData.id, data.tourScheduleId, formData)
                : await generateQuotation(data.tourScheduleId, formData);

            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push(`/quotations/${result.data}`);
                }, 2000);
            } else {
                setError(result.error || 'Failed to process quotation');
            }
        } catch (e) {
            setError('An unexpected error occurred');
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const fmt = formatCurrency;

    return (
        <Form {...form}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6" onKeyDown={handleEnterKey}>
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">
                    {initialData ? `Edit Quotation Q-${String(initialData.quotationNumber).padStart(4, '0')}` : 'New Quotation'}
                </h1>
                <p className="text-muted-foreground">
                    {initialData ? 'Update details for this quotation' : 'Generate a professional tour quotation for your customer'}
                </p>
            </div>

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
                        <div className="flex items-center justify-between">
                            <Label htmlFor="tourScheduleId">Tour Schedule *</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 flex items-center gap-1"
                                onClick={() => setIsScheduleModalOpen(true)}
                            >
                                <Plus className="h-4 w-4" />
                                New
                            </Button>
                        </div>
                        <ComboboxField
                            options={schedules.map((s) => ({
                                label: `${s.name} (${s.days} days, ${s.vehicleCategory})`,
                                value: s.id
                            }))}
                            value={watchedTourScheduleId}
                            onChange={handleScheduleChange}
                            placeholder="Select a tour schedule..."
                        />
                        {form.formState.errors.tourScheduleId && (
                            <p className="text-sm text-destructive font-medium">{form.formState.errors.tourScheduleId.message}</p>
                        )}
                    </div>

                    <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Create New Tour Schedule</DialogTitle>
                                <DialogDescription>
                                    Add a new tour itinerary. It will be available for selection once saved.
                                </DialogDescription>
                            </DialogHeader>
                            <TourScheduleForm
                                existingSchedules={schedules}
                                hideHeader={true}
                                onSuccess={(data) => {
                                    setJustCreatedScheduleId(data.id);
                                    setIsScheduleModalOpen(false);
                                }}
                                onCancel={() => setIsScheduleModalOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>

                    {/* Day-by-day preview */}
                    {selectedSchedule && (
                        <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Itinerary Preview</h4>
                            <div className="rounded-md border overflow-x-auto">
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
                            <Label htmlFor="customerName">Customer Name *</Label>
                            <ComboboxField
                                options={customers.map(c => ({
                                    label: c.mobile ? `${c.name} (${c.mobile})` : c.name,
                                    value: c.id
                                }))}
                                value={customers.find(c => c.name === watchedCustomerName)?.id || watchedCustomerName}
                                onChange={(val) => {
                                    const customer = customers.find(c => c.id === val);
                                    if (customer) {
                                        form.setValue('customerName', customer.name);
                                        form.setValue('customerEmail', customer.email || '');
                                        form.setValue('customerPhone', customer.mobile || '');
                                    } else {
                                        // Case where custom value is typed
                                        form.setValue('customerName', val);
                                    }
                                }}
                                allowCustomValue={true}
                                placeholder="Select or type customer name..."
                            />
                            {form.formState.errors.customerName && (
                                <p className="text-sm text-destructive font-medium">{form.formState.errors.customerName.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between mb-1">
                                <Label>Select Vehicle *</Label>
                            </div>
                            <ComboboxField
                                options={filteredVehicles.map((v) => ({
                                    label: `${v.vehicleNo} ${v.model ? `- ${v.model}` : ''} (${v.category})`,
                                    value: v.id
                                }))}
                                value={vehicles.find(v => v.vehicleNo === watchedVehicleNo)?.id || ''}
                                onChange={handleVehicleChange}
                                placeholder="-- Select vehicle --"
                            />
                            {form.formState.errors.vehicleNo && (
                                <p className="text-sm text-destructive font-medium">{form.formState.errors.vehicleNo.message}</p>
                            )}
                            {availabilityConflict && (
                                <div className="mt-2 text-xs font-semibold text-destructive flex items-center gap-1.5 p-2 bg-destructive/10 rounded animate-in fade-in slide-in-from-top-1">
                                    <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                                    <span>
                                        Vehicle is occupied by <span className="underline">{availabilityConflict.customer}</span> ({availabilityConflict.type}: {availabilityConflict.reference}) until {new Date(availabilityConflict.end).toLocaleDateString('en-GB')}
                                    </span>
                                </div>
                            )}
                            {isCheckingAvailability && (
                                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                    <Loader2 className="h-3 w-3 animate-spin" /> Checking availability...
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Vehicle Specifications Display */}
                    {selectedVehicle && (selectedVehicle.seats || selectedVehicle.acType || selectedVehicle.features || selectedVehicle.insuranceCoverage) && (
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary/70">Vehicle Configuration</h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {selectedVehicle.seats && (
                                    <div className="flex items-start gap-2.5">
                                        <div className="p-1.5 bg-white dark:bg-slate-900 rounded-md border border-primary/10 shadow-sm">
                                            <span className="text-primary font-bold text-xs">A/C</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground leading-none mb-1">Climate</p>
                                            <p className="text-sm font-semibold">{selectedVehicle.acType || 'Non A/C'}</p>
                                        </div>
                                    </div>
                                )}

                                {selectedVehicle.seats && (
                                    <div className="flex items-start gap-2.5">
                                        <div className="p-1.5 bg-white dark:bg-slate-900 rounded-md border border-primary/10 shadow-sm text-primary">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground leading-none mb-1">Capacity</p>
                                            <p className="text-sm font-semibold text-foreground">{selectedVehicle.seats} Passenger Seats</p>
                                        </div>
                                    </div>
                                )}

                                {selectedVehicle.features && (
                                    <div className="flex items-start gap-2.5 sm:col-span-2 lg:col-span-1">
                                        <div className="p-1.5 bg-white dark:bg-slate-900 rounded-md border border-primary/10 shadow-sm text-primary">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground leading-none mb-1">Key Features</p>
                                            <p className="text-sm font-medium leading-tight">{selectedVehicle.features}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {selectedVehicle.insuranceCoverage && (
                                <div className="mt-2 pt-3 border-t border-primary/10 flex items-center gap-2">
                                    <div className="p-1 rounded bg-green-500/10 text-green-600 dark:text-green-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>
                                    </div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        <span className="text-foreground font-bold">Insurance:</span> {selectedVehicle.insuranceCoverage}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="customerEmail">Email</Label>
                            <Input
                                id="customerEmail"
                                type="email"
                                placeholder="email@example.com"
                                {...form.register('customerEmail')}
                            />
                            {form.formState.errors.customerEmail && (
                                <p className="text-sm text-destructive font-medium">{form.formState.errors.customerEmail.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customerPhone">Phone</Label>
                            <Input
                                id="customerPhone"
                                placeholder="Phone number"
                                {...form.register('customerPhone')}
                            />
                            {form.formState.errors.customerPhone && (
                                <p className="text-sm text-destructive font-medium">{form.formState.errors.customerPhone.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                            onChange={(value) => field.onChange(value)}
                                            placeholder="Select Driver..."
                                            allowCustomValue={false}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    {driverAvailabilityConflict && (
                                        <div className="mt-2 text-xs font-semibold text-destructive flex items-center gap-1.5 p-2 bg-destructive/10 rounded animate-in fade-in slide-in-from-top-1">
                                            <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                                            <span>
                                                Driver is occupied by <span className="underline">{driverAvailabilityConflict.customer}</span> ({driverAvailabilityConflict.type}: {driverAvailabilityConflict.reference}) until {new Date(driverAvailabilityConflict.end).toLocaleDateString('en-GB')}
                                            </span>
                                        </div>
                                    )}
                                </FormItem>
                            )}
                        />
                        <div className="space-y-2">
                            <Label htmlFor="numberOfPersons">Number of Guests</Label>
                            <Input
                                id="numberOfPersons"
                                type="number"
                                min="1"
                                placeholder="1"
                                {...form.register('numberOfPersons')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Tour Start Date *</Label>
                            <Input
                                id="startDate"
                                type="date"
                                {...form.register('startDate')}
                            />
                            {form.formState.errors.startDate && (
                                <p className="text-sm text-destructive font-medium">{form.formState.errors.startDate.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate" className="text-muted-foreground">Tour End Date (Auto)</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={watchedFields.endDate ? (watchedFields.endDate instanceof Date ? watchedFields.endDate.toISOString().split('T')[0] : watchedFields.endDate) : ''}
                                readOnly
                                className="bg-muted cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="pickupLocation">Pickup Location</Label>
                            <Input
                                id="pickupLocation"
                                placeholder="e.g. BIA / Colombo"
                                {...form.register('pickupLocation')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dropLocation">Drop-off Location</Label>
                            <Input
                                id="dropLocation"
                                placeholder="e.g. Hotel in Kandy"
                                {...form.register('dropLocation')}
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
                            <Label htmlFor="hireRatePerDay">Vehicle Rate Per Day (Rs.)</Label>
                            <Input
                                id="hireRatePerDay"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...form.register('hireRatePerDay')}
                            />
                            {form.formState.errors.hireRatePerDay && (
                                <p className="text-sm text-destructive font-medium">{form.formState.errors.hireRatePerDay.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="kmPerDay">Included Km Per Day</Label>
                            <Input
                                id="kmPerDay"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...form.register('kmPerDay')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="excessKmRate">Extra Km Rate (Rs.)</Label>
                            <Input
                                id="excessKmRate"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...form.register('excessKmRate')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="extraHourRate">Extra Hour Rate (Rs.)</Label>
                            <Input
                                id="extraHourRate"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...form.register('extraHourRate')}
                            />
                            {form.formState.errors.extraHourRate && (
                                <p className="text-sm text-destructive font-medium">{form.formState.errors.extraHourRate.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="markup">Commission (%)</Label>
                            <Input
                                id="markup"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...form.register('markup')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="discount">Discount (Rs.)</Label>
                            <Input
                                id="discount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...form.register('discount')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="validUntil">Quotation Valid Until</Label>
                            <Input
                                id="validUntil"
                                type="date"
                                {...form.register('validUntil')}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="driverCostPerDay">Driver Cost Per Day (Rs.)</Label>
                            <Input
                                id="driverCostPerDay"
                                type="number"
                                step="0.01"
                                placeholder="e.g. 3000"
                                {...form.register('driverCostPerDay')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="advanceAmount">Advance Payment (Rs.)</Label>
                            <Input
                                id="advanceAmount"
                                type="number"
                                step="0.01"
                                placeholder="e.g. 25000"
                                {...form.register('advanceAmount')}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="excludedItems">Not Included in This Quotation</Label>
                            <Textarea
                                id="excludedItems"
                                placeholder="Highway / expressway charges&#10;Parking fees"
                                rows={3}
                                {...form.register('excludedItems')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Additional Notes / Terms</Label>
                            <Textarea
                                id="notes"
                                placeholder="Additional notes or terms..."
                                rows={3}
                                {...form.register('notes')}
                            />
                        </div>
                    </div>

                    {/* Live Cost Summary */}
                    {selectedSchedule && (
                        <div className="mt-4 p-4 bg-muted/40 rounded-lg border">
                            <h4 className="font-semibold text-sm mb-3">Cost Summary</h4>

                            {/* Hire Summary Banner */}
                            {calculatedTotals.transportCost > 0 && (
                                <div className="mb-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                                    <p className="font-semibold text-primary text-sm">
                                        💰 Van Hire: {selectedSchedule?.days} days : {fmt(calculatedTotals.transportCost)} for {calculatedTotals.includedKm.toFixed(0)} km
                                    </p>
                                    {(Number(watchedExcessKmRate) || 0) > 0 && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Any distance exceeding {calculatedTotals.includedKm.toFixed(0)} km will be charged at Rs. {watchedExcessKmRate} per additional km.
                                        </p>
                                    )}
                                    {(Number(watchedExtraHourRate) || 0) > 0 && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Extra hours will be charged at Rs. {watchedExtraHourRate} per hour.
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Van Hire ({selectedSchedule?.days} days × {fmt(Number(watchedHireRate) || 0)}/day)
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
                                {(Number(watchedDriverCost) || 0) > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Driver ({selectedSchedule?.days} days × {fmt(Number(watchedDriverCost) || 0)}/day)
                                        </span>
                                        <span>{fmt(calculatedTotals.driverTotal)}</span>
                                    </div>
                                )}
                                <div className="border-t pt-2 flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-medium">{fmt(calculatedTotals.subtotal)}</span>
                                </div>
                                {(Number(watchedMarkup) || 0) > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Commission ({watchedMarkup}%)</span>
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
            <div className="flex gap-3 justify-end">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/quotations')}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !!availabilityConflict} className="min-w-[160px]">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Quotation
                </Button>
            </div>
        </form>
        </Form>
    );
}
