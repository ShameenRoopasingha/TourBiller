
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Printer, Plus } from 'lucide-react';
import { BillFormSchema, type ActionResult, type BillFormInput, type Vehicle, type Customer, type VehicleExpense } from '@/lib/validations';

// For backward compatibility
export type BillFormData = BillFormInput;
import { BillReceiptSummary } from '@/components/bills/BillReceiptSummary';
import { parseBillItinerary } from '@/lib/bill-itinerary';

import { useCalculationEngine } from '@/hooks/useCalculationEngine';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { ComboboxField } from '@/components/ComboboxField';
import { TourScheduleForm } from '@/components/TourScheduleForm';
import { BillChargeFields } from '@/components/bills/BillChargeFields';
import { notify } from '@/lib/notifications';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
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
import { DateTimePicker } from '@/components/ui/datetime-picker';

import { useRouter } from 'next/navigation';




export function BillCreator({
    initialVehicleNo,
    initialCustomerName,
    initialBookingId,
    initialData,
    vehicles: serverVehicles,
    customers: serverCustomers,
    schedules: serverSchedules,
}: {
    initialVehicleNo?: string;
    initialCustomerName?: string;
    initialBookingId?: string;

    initialData?: Record<string, any>;
    vehicles: Vehicle[];
    customers: Customer[];
    schedules: {
        id: string;
        name: string;
        days: number;
        vehicleNo?: string | null;
        ratePerDay: number;
        kmPerDay: number;
        excessKmRate?: number | null;
        extraHourRate?: number | null;
        waitingCharge: number;
        gatePass: number;
        items: {
            dayNumber: number;
            title: string;
            distanceKm: number;
            accommodation: number;
            meals: number;
            activities: number;
            otherCosts: number;
        }[];
    }[];
}) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successId, setSuccessId] = useState<string | null>(null);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [tourScheduleName, setTourScheduleName] = useState<string | undefined>(
        () => parseBillItinerary(initialData?.itinerary).scheduleName
    );
    const vehicles = serverVehicles;
    const customers = serverCustomers;
    const schedules = serverSchedules;

    const {
        totalAmount,
        formattedTotalAmount,
        formattedBaseCharge,
        baseCharge,
        distance,
        updateField,
        resetCalculations,
        days,
    } = useCalculationEngine();

    const handleEnterKey = useEnterNavigation();

    const form = useForm<BillFormData>({

        resolver: zodResolver(BillFormSchema) as any,
        defaultValues: initialData ? {
            vehicleNo: initialData.vehicleNo || '',
            customerName: initialData.customerName || '',
            customerAddress: initialData.customerAddress || '',
            route: initialData.route || '',
            startMeter: initialData.startMeter,
            endMeter: initialData.endMeter,
            hireRate: initialData.hireRate,
            waitingCharge: initialData.waitingCharge || 0,
            gatePass: initialData.gatePass || 0,
            packageCharge: initialData.packageCharge || 0,
            advanceAmount: initialData.advanceAmount || 0,
            allowedKm: initialData.allowedKm || 0,
            currency: initialData.currency || 'LKR',
            exchangeRate: initialData.exchangeRate || 1,
            paymentMethod: initialData.paymentMethod || 'CASH',
            startDate: initialData.startDate ? new Date(initialData.startDate) : new Date(),
            endDate: initialData.endDate ? new Date(initialData.endDate) : new Date(),
            extraHours: initialData.extraHours || 0,
            extraHourRate: initialData.extraHourRate || 0,
            extraKm: initialData.extraKm || 0,
            accommodationCharge: initialData.accommodationCharge || 0,
            mealsCharge: initialData.mealsCharge || 0,
            activitiesCharge: initialData.activitiesCharge || 0,
            otherCostsCharge: initialData.otherCostsCharge || 0,
            scheduledDays: initialData.scheduledDays || 1,
        } : {
            vehicleNo: initialVehicleNo || '',
            customerName: initialCustomerName || '',
            customerAddress: '',
            route: '',
            startMeter: '' as unknown as number,
            endMeter: '' as unknown as number,
            hireRate: '' as unknown as number,
            waitingCharge: '' as unknown as number,
            gatePass: '' as unknown as number,
            packageCharge: '' as unknown as number,
            advanceAmount: '' as unknown as number,
            allowedKm: '' as unknown as number,
            currency: 'LKR',
            exchangeRate: 1,
            paymentMethod: 'CASH',
            startDate: new Date() as unknown as Date,
            endDate: new Date() as unknown as Date,
            extraHours: 0,
            extraHourRate: 0,
            extraKm: 0,
            accommodationCharge: '' as unknown as number,
            mealsCharge: '' as unknown as number,
            activitiesCharge: '' as unknown as number,
            otherCostsCharge: '' as unknown as number,
        },
    });

    const watchedFields = useWatch({
        control: form.control,
    });

    const watchedAllowedKm = Number(watchedFields.allowedKm) || 0;
    const watchedPackageCharge = Number(watchedFields.packageCharge) || 0;
    const watchedExtraHours = Number(watchedFields.extraHours) || 0;
    const watchedExtraHourRate = Number(watchedFields.extraHourRate) || 0;
    const watchedWaitingCharge = Number(watchedFields.waitingCharge) || 0;
    const watchedGatePass = Number(watchedFields.gatePass) || 0;
    
    // Determine if the selected vehicle uses Flat Rate Per Km pricing
    const isPerKmMode = vehicles.find(v => v.vehicleNo === watchedFields.vehicleNo)?.ratePerDay === 0;

    // Auto-fill customer address from pre-filled customer name
    useEffect(() => {
        if (initialCustomerName && customers.length > 0) {
            const customer = customers.find(c => c.name === initialCustomerName);
            if (customer?.address) {
                form.setValue('customerAddress', customer.address);
            }
        }
    }, [initialCustomerName, customers, form]);

    // Auto-fill booking data if bookingId is provided
    useEffect(() => {
        if (initialBookingId) {
            const loadBooking = async () => {
                const bookingResponse = await fetch(`/api/bookings/${encodeURIComponent(initialBookingId)}`);
                const bResult = await bookingResponse.json();
                if (bookingResponse.ok && bResult.success && bResult.data) {
                    const scheduleMatch = typeof bResult.data.notes === 'string'
                        ? bResult.data.notes.match(/^Tour schedule:\s*(.+)$/im)
                        : null;
                    if (scheduleMatch?.[1]) setTourScheduleName(scheduleMatch[1].trim());
                    if (bResult.data.advanceAmount) {
                        form.setValue('advanceAmount', bResult.data.advanceAmount);
                    }
                    if (bResult.data.destination) {
                        form.setValue('route', bResult.data.destination);
                    }
                    if (bResult.data.startDate) {
                        form.setValue('startDate', new Date(bResult.data.startDate) as unknown as Date);
                    }
                    if (bResult.data.endDate) {
                        form.setValue('endDate', new Date(bResult.data.endDate) as unknown as Date);
                    }
                }

                // Fetch customer expenses added by driver during the tour
                const expensesResponse = await fetch(`/api/vehicle-expenses?bookingId=${encodeURIComponent(initialBookingId)}`);
                const eResult = await expensesResponse.json() as ActionResult<VehicleExpense[]>;
                if (expensesResponse.ok && eResult.success && eResult.data) {
                    const customerExpenses = eResult.data.filter(e => e.expenseType === 'CUSTOMER');
                    const totalCustomerExpense = customerExpenses.reduce((sum, e) => sum + e.amount, 0);
                    
                    if (totalCustomerExpense > 0) {
                        const currentOtherCosts = Number(form.getValues('otherCostsCharge')) || 0;
                        form.setValue('otherCostsCharge', currentOtherCosts + totalCustomerExpense);
                        updateField('otherCostsCharge', currentOtherCosts + totalCustomerExpense);
                    }
                }
            };
            loadBooking();
        }
    }, [form, initialBookingId, updateField]);

    // Effect to check if vehicle selection needs to trigger rate update
    useEffect(() => {
        if (initialVehicleNo && vehicles.length > 0) {
            const selectedVehicle = vehicles.find(v => v.vehicleNo === initialVehicleNo);
            if (selectedVehicle) {
                const rate = selectedVehicle.excessKmRate ?? 0;
                const allowedKm = selectedVehicle.kmPerDay ?? 0;
                const packageCharge = selectedVehicle.ratePerDay ?? 0;
                const extraHourRate = selectedVehicle.extraHourRate ?? 0;
                form.setValue('hireRate', rate);
                form.setValue('allowedKm', allowedKm);
                form.setValue('packageCharge', packageCharge);
                form.setValue('extraHourRate', extraHourRate);
                updateField('hireRate', rate);
                updateField('allowedKm', allowedKm);
                updateField('packageCharge', packageCharge);
                updateField('extraHourRate', extraHourRate);
                updateField('startDate', form.getValues('startDate'));
                updateField('endDate', form.getValues('endDate'));
            }
        }
    }, [initialVehicleNo, vehicles, form, updateField]);

    // Automatically calculate extra hours
    // Automatically calculate extra hours and km
    const watchedCalcFields = useWatch({
        control: form.control,
        name: ['startDate', 'endDate', 'route', 'startMeter', 'endMeter', 'allowedKm'],
    });
    const startDateValue = watchedCalcFields[0];
    const endDateValue = watchedCalcFields[1];
    const routeValue = watchedCalcFields[2];
    const startMeterValue = Number(watchedCalcFields[3]) || 0;
    const endMeterValue = Number(watchedCalcFields[4]) || 0;
    const allowedKmValue = Number(watchedCalcFields[5]) || 0;

    useEffect(() => {
        if (startDateValue) updateField('startDate', new Date(startDateValue));
        if (endDateValue) updateField('endDate', new Date(endDateValue));
    }, [startDateValue, endDateValue, updateField]);

    // Auto-fill rates and included km when route changes
    useEffect(() => {
        if (!routeValue) {
            updateField('totalTourDistance', 0);
            return;
        }

        const selectedSchedule = schedules.find(s => s.name === routeValue);
        if (selectedSchedule) {
            // Calculate total tour distance from items
            const totalTourDistance = selectedSchedule.items.reduce((sum, item) => sum + (item.distanceKm || 0), 0);

            // Update calculation engine with expected tour distance
            updateField('totalTourDistance', totalTourDistance);

            // Prioritize schedule rates
            if (selectedSchedule.kmPerDay > 0) {
                form.setValue('allowedKm', selectedSchedule.kmPerDay);
                updateField('allowedKm', selectedSchedule.kmPerDay);
            } else {
                // Fallback to calculation from distance if no per-day km is set
                const includedKmPerDay = Math.ceil(totalTourDistance / selectedSchedule.days);
                form.setValue('allowedKm', includedKmPerDay);
                updateField('allowedKm', includedKmPerDay);
            }

            if (selectedSchedule.ratePerDay > 0) {
                form.setValue('packageCharge', selectedSchedule.ratePerDay);
                updateField('packageCharge', selectedSchedule.ratePerDay);
            }

            if (selectedSchedule.excessKmRate !== null && selectedSchedule.excessKmRate !== undefined) {
                form.setValue('hireRate', selectedSchedule.excessKmRate);
                updateField('hireRate', selectedSchedule.excessKmRate);
            }

            if (selectedSchedule.extraHourRate !== null && selectedSchedule.extraHourRate !== undefined) {
                form.setValue('extraHourRate', selectedSchedule.extraHourRate);
                updateField('extraHourRate', selectedSchedule.extraHourRate);
            }

            // Sum and set itinerary costs from schedule items
            const totalAccommodation = selectedSchedule.items.reduce((sum, item) => sum + (item.accommodation || 0), 0);
            const totalMeals = selectedSchedule.items.reduce((sum, item) => sum + (item.meals || 0), 0);
            const totalActivities = selectedSchedule.items.reduce((sum, item) => sum + (item.activities || 0), 0);
            const totalOtherCosts = selectedSchedule.items.reduce((sum, item) => sum + (item.otherCosts || 0), 0);

            form.setValue('accommodationCharge', totalAccommodation);
            form.setValue('mealsCharge', totalMeals);
            form.setValue('activitiesCharge', totalActivities);
            form.setValue('otherCostsCharge', totalOtherCosts);
            form.setValue('waitingCharge', selectedSchedule.waitingCharge);
            form.setValue('gatePass', selectedSchedule.gatePass);

            updateField('accommodationCharge', totalAccommodation);
            updateField('mealsCharge', totalMeals);
            updateField('activitiesCharge', totalActivities);
            updateField('otherCostsCharge', totalOtherCosts);
            updateField('waitingCharge', selectedSchedule.waitingCharge);
            updateField('gatePass', selectedSchedule.gatePass);

            // If schedule has a vehicle, try to select it
            if (selectedSchedule.vehicleNo && !form.getValues('vehicleNo')) {
                form.setValue('vehicleNo', selectedSchedule.vehicleNo);
                const selectedVehicle = vehicles.find(v => v.vehicleNo === selectedSchedule.vehicleNo);
                if (selectedVehicle) {
                    // Update rates that aren't set by schedule
                    if (!(selectedSchedule.ratePerDay > 0)) {
                        form.setValue('packageCharge', selectedVehicle.ratePerDay);
                        updateField('packageCharge', selectedVehicle.ratePerDay);
                    }
                    if (!(selectedSchedule.kmPerDay > 0)) {
                        form.setValue('allowedKm', selectedVehicle.kmPerDay);
                        updateField('allowedKm', selectedVehicle.kmPerDay);
                    }
                    if (selectedSchedule.excessKmRate === null || selectedSchedule.excessKmRate === undefined) {
                        form.setValue('hireRate', selectedVehicle.excessKmRate);
                        updateField('hireRate', selectedVehicle.excessKmRate);
                    }
                    if (selectedSchedule.extraHourRate === null || selectedSchedule.extraHourRate === undefined) {
                        form.setValue('extraHourRate', selectedVehicle.extraHourRate);
                        updateField('extraHourRate', selectedVehicle.extraHourRate);
                    }
                }
            }
        }
    }, [routeValue, schedules, form, updateField, vehicles]);

    useEffect(() => {
        const start = new Date(startDateValue);
        const end = new Date(endDateValue);

        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
            const diffMs = end.getTime() - start.getTime();
            const totalHours = diffMs / (1000 * 60 * 60);

            // Use predefined tour days from selected schedule, or fall back to calendar days
            const selectedSchedule = schedules.find(s => s.name === routeValue);
            const scheduledDays = selectedSchedule ? selectedSchedule.days : days;

            // Extra hours = total hours beyond the scheduled tour days
            const extra = Math.max(0, totalHours - (scheduledDays * 24));

            // Round to 1 decimal place
            const roundedExtra = Math.round(extra * 10) / 10;
            form.setValue('extraHours', roundedExtra);
            updateField('extraHours', roundedExtra);
        }
    }, [startDateValue, endDateValue, routeValue, form, updateField, schedules, days]);

    // Automatically calculate extra km based on meters and allowance
    // Uses scheduled days (matching extra hours) to be consistent
    useEffect(() => {
        if (endMeterValue > startMeterValue) {
            const totalDistance = endMeterValue - startMeterValue;

            // Derive scheduled days the same way extra hours does
            const start = new Date(startDateValue);
            const end = new Date(endDateValue);
            let scheduledDays = days; // fallback to engine days
            let autoPackageCharge = 0;

            if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
                const actualDays = days; // Using inclusive calendar days from engine
                const selectedSchedule = schedules.find(s => s.name === routeValue);
                if (selectedSchedule) {
                    // If they return early, only charge/allocate for the actual days driven.
                    // If they return late, cap the package days at the schedule's limit (so extra hours apply).
                    scheduledDays = Math.min(selectedSchedule.days, actualDays);
                    autoPackageCharge = selectedSchedule.ratePerDay * scheduledDays;
                } else {
                    scheduledDays = actualDays;
                    // Try to get vehicle rate
                    const selectedVehicle = vehicles.find(v => v.vehicleNo === form.getValues('vehicleNo'));
                    if (selectedVehicle && selectedVehicle.ratePerDay > 0) {
                        autoPackageCharge = selectedVehicle.ratePerDay * scheduledDays;
                    }
                }
            }

            const totalAllowedKm = allowedKmValue * scheduledDays;
            const extraKm = Math.max(0, totalDistance - totalAllowedKm);

            // Round to 1 decimal place
            const roundedExtraKm = Math.round(extraKm * 10) / 10;
            form.setValue('extraKm', roundedExtraKm);
            form.setValue('scheduledDays', scheduledDays);

            // Smart Auto-update: Only overwrite package charge if it's currently 0
            // OR if it currently equals the standard 1-day rate (meaning they haven't manually customized a total yet).
            const currentPackageCharge = Number(form.getValues('packageCharge')) || 0;
            const singleDayRate = schedules.find(s => s.name === routeValue)?.ratePerDay || 
                                  vehicles.find(v => v.vehicleNo === form.getValues('vehicleNo'))?.ratePerDay || 0;

            if (autoPackageCharge > 0 && (currentPackageCharge === 0 || currentPackageCharge === singleDayRate)) {
                form.setValue('packageCharge', autoPackageCharge);
                updateField('packageCharge', autoPackageCharge);
            }

            updateField('extraKm', roundedExtraKm);
        }
    }, [startMeterValue, endMeterValue, allowedKmValue, days, startDateValue, endDateValue, routeValue, schedules, vehicles, form, updateField]);



    const onSubmit = async (data: BillFormData) => {
        setIsSubmitting(true);
        setError(null);
        setSuccessId(null);

        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                formData.append(key, value instanceof Date ? value.toISOString() : value.toString());
            }
        });

        // Ensure address is sent


        // Append Booking ID if present to auto-close booking
        if (initialBookingId) {
            formData.append('bookingId', initialBookingId);
        }

        // Attach itinerary snapshot from matched tour schedule
        const matchedSchedule = schedules.find(s => s.name === data.route)
            ?? schedules.find(s => s.name === tourScheduleName);
        const scheduleName = matchedSchedule?.name ?? tourScheduleName;
        const itineraryItems = matchedSchedule?.items ?? parseBillItinerary(initialData?.itinerary).items;
        if (scheduleName || itineraryItems.length > 0) {
            formData.append('itinerary', JSON.stringify({
                scheduleName,
                route: data.route,
                items: itineraryItems.map(item => ({
                    dayNumber: item.dayNumber,
                    title: item.title,
                    distanceKm: item.distanceKm,
                    accommodation: item.accommodation,
                    meals: item.meals,
                    activities: item.activities,
                    otherCosts: item.otherCosts,
                })),
            }));
        } else if (initialData?.itinerary) {
            formData.append('itinerary', initialData.itinerary);
        }

        try {
            const response = await fetch(initialData?.id ? `/api/bills/${encodeURIComponent(initialData.id)}` : '/api/bills', {
                method: initialData?.id ? 'PUT' : 'POST',
                body: formData,
            });
            const result = await response.json();

            if (response.ok && result.success && result.data) {
                notify.success(initialData ? 'Bill updated successfully' : 'Bill created successfully');
                setSuccessId(result.data);
                if (!initialData) {
                    form.reset();
                    resetCalculations();
                }

                router.refresh();
                router.push(`/bills/${result.data}/print`);
            } else {
                const message = result.error || (initialData ? 'Failed to update bill' : 'Failed to create bill');
                notify.error(message);
                setError(message);
            }
        } catch (submitError) {
            console.error('Error saving bill:', submitError);
            const message = initialData ? 'Failed to update bill. Please try again.' : 'Failed to create bill. Please try again.';
            notify.error(message);
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNumericChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        fieldChange: (value: string | number) => void,
        fieldName: string
    ) => {
        // Let the form hold the raw string (so empty inputs are possible)
        const rawValue = e.target.value;
        fieldChange(rawValue);

        // Feed the calculation engine a number (0 if invalid/empty)
        const value = parseFloat(rawValue);
        updateField(fieldName, isNaN(value) ? 0 : value);
    };

    const handleVehicleChange = (
        value: string,
        fieldChange: (value: string) => void
    ) => {
        fieldChange(value);

        const selectedVehicle = vehicles.find(v => v.vehicleNo === value);
        const selectedSchedule = routeValue ? schedules.find(s => s.name === routeValue) : null;

        if (selectedVehicle) {
            // Prioritize schedule rates
            const packageCharge = (selectedSchedule && selectedSchedule.ratePerDay > 0) ? selectedSchedule.ratePerDay : (selectedVehicle.ratePerDay ?? 0);
            const allowedKm = (selectedSchedule && selectedSchedule.kmPerDay > 0) ? selectedSchedule.kmPerDay : (selectedVehicle.kmPerDay ?? 0);
            const hireRate = (selectedSchedule && (selectedSchedule.excessKmRate !== null && selectedSchedule.excessKmRate !== undefined)) ? selectedSchedule.excessKmRate : (selectedVehicle.excessKmRate ?? 0);
            const extraHourRate = (selectedSchedule && (selectedSchedule.extraHourRate !== null && selectedSchedule.extraHourRate !== undefined)) ? selectedSchedule.extraHourRate : (selectedVehicle.extraHourRate ?? 0);

            form.setValue('hireRate', hireRate);
            form.setValue('allowedKm', allowedKm);
            form.setValue('packageCharge', packageCharge);
            form.setValue('extraHourRate', extraHourRate);

            updateField('hireRate', hireRate);
            updateField('allowedKm', allowedKm);
            updateField('packageCharge', packageCharge);
            updateField('extraHourRate', extraHourRate);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-2 sm:p-4 md:p-8">
            {successId && (
                <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
                    <Printer className="h-4 w-4" />
                    <AlertTitle>Success!</AlertTitle>
                    <AlertDescription>
                        Bill created successfully. ID: {successId}
                        <div className="mt-2 flex gap-2">
                            <Button variant="outline" size="sm" className="bg-white" asChild>
                                <Link href={`/bills/${successId}/print`}>
                                    Print Invoice
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" className="bg-white" asChild>
                                <Link href="/">
                                    Go to Dashboard
                                </Link>
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

            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">New Bill</h1>
                    <p className="text-muted-foreground">Create a new invoice for vehicle hire.</p>
                </div>
            </div>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                    onKeyDown={handleEnterKey}
                >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

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
                                                        <ComboboxField
                                                            options={vehicles.map(v => ({
                                                                label: v.model ? `${v.vehicleNo} - ${v.model}` : v.vehicleNo,
                                                                value: v.vehicleNo
                                                            }))}
                                                            value={field.value}
                                                            onChange={(value) => handleVehicleChange(value, field.onChange)}
                                                            placeholder="Select Vehicle..."
                                                        />
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
                                                    <FormLabel>Customer Name</FormLabel>
                                                    <FormControl>
                                                        <ComboboxField
                                                            options={customers.map(c => ({
                                                                label: c.mobile ? `${c.name} (${c.mobile})` : c.name,
                                                                value: c.name
                                                            }))}
                                                            value={field.value || ''}
                                                            onChange={(value) => {
                                                                field.onChange(value);
                                                                const selected = customers.find(c => c.name === value);
                                                                if (selected && selected.address) {
                                                                    form.setValue('customerAddress', selected.address);
                                                                } else {
                                                                    form.setValue('customerAddress', '');
                                                                }
                                                            }}
                                                            placeholder="Select Customer..."
                                                            allowCustomValue={true}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="customerAddress"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Customer Address</FormLabel>
                                                <FormControl>
                                                    <ComboboxField
                                                        options={[]} // Suggested addresses from customer selection are handled by setValue
                                                        value={field.value || ''}
                                                        onChange={field.onChange}
                                                        placeholder="Customer Address"
                                                        allowCustomValue={true}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <FormLabel>Route / Description</FormLabel>
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
                                        <FormField
                                            control={form.control}
                                            name="route"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <ComboboxField
                                                            options={schedules.map(s => ({
                                                                label: s.name,
                                                                value: s.name
                                                            }))}
                                                            value={field.value || ''}
                                                            onChange={(value) => {
                                                                field.onChange(value);
                                                                setTourScheduleName(schedules.find(schedule => schedule.name === value)?.name);
                                                            }}
                                                            placeholder="e.g. Airport Drop or Kandy Tour"
                                                            allowCustomValue={true}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
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
                                                    form.setValue('route', data.name);
                                                    setTourScheduleName(data.name);
                                                    setIsScheduleModalOpen(false);
                                                }}
                                                onCancel={() => setIsScheduleModalOpen(false)}
                                            />
                                        </DialogContent>
                                    </Dialog>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="startMeter"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Start Meter</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.1" {...field} value={field.value ?? ""} onChange={e => handleNumericChange(e, field.onChange, 'startMeter')} />
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
                                                        <Input type="number" step="0.1" {...field} value={field.value ?? ""} onChange={e => handleNumericChange(e, field.onChange, 'endMeter')} />
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
                                                    <FormLabel>Start Date</FormLabel>
                                                    <DateTimePicker
                                                        date={field.value ? new Date(field.value) : undefined}
                                                        setDate={(date) => field.onChange(date)}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="endDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>End Date</FormLabel>
                                                    <DateTimePicker
                                                        date={field.value ? new Date(field.value) : undefined}
                                                        setDate={(date) => field.onChange(date)}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <BillChargeFields
                                isPerKmMode={isPerKmMode}
                                watchedAllowedKm={watchedAllowedKm}
                                handleNumericChange={handleNumericChange}
                            />
                        </div>

                        <BillReceiptSummary
                            distance={distance}
                            allowedKm={watchedAllowedKm}
                            days={days}
                            baseCharge={baseCharge}
                            packageCharge={watchedPackageCharge}
                            extraHours={watchedExtraHours}
                            extraHourRate={watchedExtraHourRate}
                            waitingCharge={watchedWaitingCharge}
                            gatePass={watchedGatePass}
                            advanceAmount={Number(watchedFields.advanceAmount) || 0}
                            totalAmount={totalAmount}
                            formattedBaseCharge={formattedBaseCharge}
                            formattedTotalAmount={formattedTotalAmount}
                            isPerKmMode={isPerKmMode}
                            isSubmitting={isSubmitting}
                            isEditing={Boolean(initialData)}
                        />

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

