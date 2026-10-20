'use client';

import React, { useState, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, FileCheck, Calculator, Plus, Sparkles, Navigation, CalendarRange, MapPin } from 'lucide-react';

import { QuotationFormSchema, type QuotationFormInput, type QuotationWithSchedule, type VehicleAvailabilityConflict, type DriverAvailabilityConflict } from '@/lib/validations';
import { notify } from '@/lib/notifications';
import { MapDistanceCalculator } from '@/components/MapDistanceCalculator';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { DatePicker } from '@/components/ui/date-picker';

// For backward compatibility
export type QuotationFormData = QuotationFormInput;
import { formatCurrency } from '@/lib/calculations';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { ComboboxField } from '@/components/ComboboxField';
import { TourScheduleForm } from '@/components/TourScheduleForm';
import { QuotationAIChat } from '@/components/QuotationAIChat';
import { QuotationCostSummary } from '@/components/quotations/QuotationCostSummary';
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
    oilChangeInterval?: number | null;
    serviceCost?: number | null;
    annualInsuranceCost?: number | null;
    fuelEfficiency?: number | null;
    tyreCost?: number | null;
    tyreLifespan?: number | null;
}

interface QuotationCreatorProps {
    schedules: ScheduleOption[];
    customers: CustomerOption[];
    vehicles: VehicleOption[];
    drivers?: { id: string; name: string }[];
    initialData?: QuotationWithSchedule;
}

interface QuotationDraft {
    customerName?: string;
    numberOfPersons?: number;
    days?: number;
    pickupLocation?: string;
    dropLocation?: string;
    hireRatePerDay?: number;
    driverCostPerDay?: number;
    notes?: string;
    vehicleType?: string;
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
    const [isAIChatOpen, setIsAIChatOpen] = useState(false);
    const [routingMode, setRoutingMode] = useState<'map' | 'schedule'>(
        initialData ? (initialData.tourScheduleId ? 'schedule' : 'map') : 'map'
    );
    const [mapDays, setMapDays] = useState<number>(initialData?.tourSchedule?.days || 1);

    const handleApplyDraft = (draft: QuotationDraft) => {
        if (draft.customerName) form.setValue('customerName', draft.customerName, { shouldDirty: true });
        if (draft.numberOfPersons) form.setValue('numberOfPersons', draft.numberOfPersons, { shouldDirty: true });
        if (draft.days) {
            setMapDays(draft.days);
            if (selectedSchedule) {
                setSelectedSchedule({ ...selectedSchedule, days: draft.days });
            }
        }
        if (draft.pickupLocation) form.setValue('pickupLocation', draft.pickupLocation, { shouldDirty: true });
        if (draft.dropLocation) form.setValue('dropLocation', draft.dropLocation, { shouldDirty: true });
        if (draft.hireRatePerDay) form.setValue('hireRatePerDay', draft.hireRatePerDay, { shouldDirty: true });
        if (draft.driverCostPerDay) form.setValue('driverCostPerDay', draft.driverCostPerDay, { shouldDirty: true });
        if (draft.notes) form.setValue('notes', draft.notes, { shouldDirty: true });

        // Try to match vehicle type to an existing vehicle
        if (draft.vehicleType) {
            const vehicleType = draft.vehicleType.toLowerCase();
            const v = vehicles.find(v => v.category?.toLowerCase().includes(vehicleType) || v.model?.toLowerCase().includes(vehicleType));
            if (v) {
                form.setValue('vehicleNo', v.vehicleNo, { shouldDirty: true });
                setSelectedVehicle(v);
                form.setValue('hireRatePerDay', v.ratePerDay || draft.hireRatePerDay || 0, { shouldDirty: true });
            }
        }
    };
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
            totalDistance: initialData.totalDistance ?? 0,
            excessKmRate: initialData.excessKmRate,
            extraHourRate: initialData.extraHourRate,
            markup: initialData.markup,
            discount: initialData.discount,
            driverCostPerDay: initialData.driverCostPerDay,
            advanceAmount: initialData.advanceAmount,
            excludedItems: initialData.excludedItems || 'Highway charges, Parking fees',
            notes: initialData.notes || '',
            tourScheduleId: initialData.tourScheduleId || '',
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
            totalDistance: 0,
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
        totalDistance: watchedTotalDistance,
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

    // Auto-calculate end date when start date, schedule, or mapDays changes
    const tourDurationDays = selectedSchedule?.days || mapDays || 1;
    React.useEffect(() => {
        if (!watchedStartDate) {
            return;
        }
        try {
            const start = new Date(watchedStartDate);
            if (!isNaN(start.getTime())) {
                const targetEnd = new Date(start);
                targetEnd.setDate(start.getDate() + (tourDurationDays - 1));
                
                // Compare with current endDate to prevent infinite re-renders
                const currentEnd = watchedEndDate ? new Date(watchedEndDate) : null;
                if (!currentEnd || isNaN(currentEnd.getTime()) || currentEnd.getTime() !== targetEnd.getTime()) {
                    form.setValue('endDate', targetEnd as unknown as Date, { shouldDirty: true });
                }
            }
        } catch (e) {
            console.error("Error calculating end date", e);
        }
    }, [watchedStartDate, tourDurationDays, form]);

    // Check vehicle and driver availability
    React.useEffect(() => {
        const checkAvailability = async () => {
            const hasVehicle = !!watchedVehicleNo;
            const hasDriver = !!watchedDriverId;
            const hasStartDate = !!watchedStartDate;
            const hasEndDate = !!watchedEndDate;

            if (hasStartDate && hasEndDate && (hasVehicle || hasDriver)) {
                const startDateObj = new Date(watchedStartDate);
                const endDateObj = new Date(watchedEndDate);
                if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
                    return;
                }

                setIsCheckingAvailability(true);
                // Reset conflicts before checking
                if (hasVehicle) setAvailabilityConflict(null);
                if (hasDriver) setDriverAvailabilityConflict(null);

                try {
                    const currentParams = {
                        startDate: startDateObj.toISOString(),
                        endDate: endDateObj.toISOString(),
                        currentType: 'Quotation',
                        ...(initialData?.id ? { currentId: initialData.id } : {}),
                    };
                    const vehicleParams = new URLSearchParams({ ...currentParams, vehicleNo: watchedVehicleNo || '' });
                    const driverParams = new URLSearchParams({ ...currentParams, driverId: String(watchedDriverId || '') });
                    const [vehicleResponse, driverResponse] = await Promise.all([
                        hasVehicle ? fetch(`/api/vehicles/availability?${vehicleParams}`) : Promise.resolve(null),
                        hasDriver ? fetch(`/api/drivers/availability?${driverParams}`) : Promise.resolve(null)
                    ]);
                    const [vehicleRes, driverRes] = await Promise.all([
                        vehicleResponse?.json() ?? null,
                        driverResponse?.json() ?? null,
                    ]);

                    if (vehicleResponse?.ok && vehicleRes?.success && !vehicleRes.data?.available) {
                        setAvailabilityConflict(vehicleRes.data?.conflicts[0] || null);
                    }
                    if (driverResponse?.ok && driverRes?.success && !driverRes.data?.available) {
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
            setMapDays(schedule.days || 1);
            // Autofill rates from schedule if they exist
            if (schedule.ratePerDay > 0) form.setValue('hireRatePerDay', schedule.ratePerDay);
            if (schedule.kmPerDay > 0) form.setValue('kmPerDay', schedule.kmPerDay);
            if (schedule.excessKmRate) form.setValue('excessKmRate', schedule.excessKmRate);
            if (schedule.extraHourRate) form.setValue('extraHourRate', schedule.extraHourRate);

            // Autofill total distance from schedule items
            const schedDistance = schedule.items.reduce((sum, item) => sum + item.distanceKm, 0);
            if (schedDistance > 0) {
                form.setValue('totalDistance', schedDistance, { shouldDirty: true });
            }

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
            let excess = (selectedSchedule && selectedSchedule.excessKmRate) || vehicle.excessKmRate || 0;
            const extraHour = (selectedSchedule && selectedSchedule.extraHourRate) || vehicle.extraHourRate || 0;

            // If excessKmRate not pre-saved, auto-compute from vehicle operating costs
            if (!excess) {
                const sPerKm = (vehicle.serviceCost && vehicle.oilChangeInterval) ? (vehicle.serviceCost / vehicle.oilChangeInterval) : 0;
                const iPerKm = (vehicle.annualInsuranceCost && (km || 100)) ? (vehicle.annualInsuranceCost / (365 * (km || 100))) : 0;
                const tPerKm = (vehicle.tyreCost && (vehicle.tyreLifespan || 40000)) ? (vehicle.tyreCost / (vehicle.tyreLifespan || 40000)) : 0;
                const fPerKm = (vehicle.fuelEfficiency && vehicle.fuelEfficiency > 0) ? (370 / vehicle.fuelEfficiency) : 0;
                const baseCost = sPerKm + iPerKm + tPerKm + fPerKm;
                if (baseCost > 0) {
                    excess = Math.round(((baseCost + 5) * 1.2) / 5) * 5;
                }
            }

            form.setValue('hireRatePerDay', rate);
            form.setValue('kmPerDay', km);
            form.setValue('excessKmRate', excess);
            form.setValue('extraHourRate', extraHour);
            setSelectedVehicle(vehicle);
        } else {
            setSelectedVehicle(null);
        }
    };

    // Live vehicle operating cost breakdown
    const vehicleCostStats = useMemo(() => {
        if (!selectedVehicle) return null;
        const dailyKm = Number(watchedKmPerDay) || selectedVehicle.kmPerDay || 100;
        const sInterval = selectedVehicle.oilChangeInterval || 5000;
        const sCost = (selectedVehicle.serviceCost && sInterval > 0) ? (selectedVehicle.serviceCost / sInterval) : 0;
        const insCost = (selectedVehicle.annualInsuranceCost && dailyKm > 0) ? (selectedVehicle.annualInsuranceCost / (365 * dailyKm)) : 0;
        const tyreLifespan = selectedVehicle.tyreLifespan || 40000;
        const tyreCost = (selectedVehicle.tyreCost && tyreLifespan > 0) ? (selectedVehicle.tyreCost / tyreLifespan) : 0;
        const fuelCost = (selectedVehicle.fuelEfficiency && selectedVehicle.fuelEfficiency > 0) ? (370 / selectedVehicle.fuelEfficiency) : 0;
        const baseVoc = sCost + insCost + tyreCost + fuelCost;
        const suggestedRate = baseVoc > 0 ? Math.round(((baseVoc + 5) * 1.2) / 5) * 5 : 0;

        return {
            sCost,
            insCost,
            tyreCost,
            fuelCost,
            baseVoc,
            suggestedRate,
        };
    }, [selectedVehicle, watchedKmPerDay]);

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

        const effectiveDistance = (Number(watchedTotalDistance) && Number(watchedTotalDistance) > 0)
            ? Number(watchedTotalDistance)
            : itemTotals.distance;

        const ratePerDay = Number(watchedHireRate) || 0;
        const kmAllowancePerDay = Number(watchedKmPerDay) || 0;
        const excessKmRate = Number(watchedExcessKmRate) || 0;
        const days = selectedSchedule.days || 1;
        
        // Dynamic transport cost: if package rate is 0, fall back to pure distance-based calculation
        const isPerKmMode = ratePerDay === 0;
        const includedKm = isPerKmMode ? 0 : (days * kmAllowancePerDay);

        // Calculate excess distance and charge
        const excessKm = (!isPerKmMode && kmAllowancePerDay > 0)
            ? Math.max(0, effectiveDistance - includedKm)
            : 0;
        const excessKmCost = excessKm * excessKmRate;

        // Base package transport cost
        const baseTransportCost = isPerKmMode ? (effectiveDistance * excessKmRate) : (days * ratePerDay);
        const transportCost = baseTransportCost + excessKmCost;
        
        const driverTotal = days * (Number(watchedDriverCost) || 0);
        const subtotal = transportCost + driverTotal + itemTotals.accommodation + itemTotals.meals + itemTotals.activities + itemTotals.other;
        const markupAmount = subtotal * ((Number(watchedMarkup) || 0) / 100);
        const totalAmount = Math.max(0, subtotal + markupAmount - (Number(watchedDiscount) || 0));

        return {
            totalDistance: effectiveDistance,
            includedKm,
            excessKm,
            excessKmCost,
            baseTransportCost,
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
    }, [selectedSchedule, watchedHireRate, watchedKmPerDay, watchedTotalDistance, watchedMarkup, watchedDiscount, watchedDriverCost, watchedExcessKmRate]);

    const onSubmit = async (data: QuotationFormData) => {
        setIsSubmitting(true);
        setError(null);

        try {
            let finalScheduleId = data.tourScheduleId;

            // In package mode, a predefined tour schedule is required
            if (routingMode === 'schedule' && !finalScheduleId) {
                form.setError('tourScheduleId', { message: 'Tour schedule is required for predefined packages' });
                setIsSubmitting(false);
                return;
            }

            // In Map mode, quotations are saved directly without creating a dummy TourSchedule
            if (routingMode === 'map' || finalScheduleId?.startsWith('transfer-')) {
                finalScheduleId = '';
            }

            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (key === 'tourScheduleId') {
                    if (finalScheduleId) {
                        formData.append(key, finalScheduleId);
                    }
                } else if (value !== undefined && value !== null) {
                    formData.append(key, value instanceof Date ? value.toISOString() : String(value));
                }
            });

            const response = await fetch(initialData ? `/api/quotations/${encodeURIComponent(initialData.id)}` : '/api/quotations', {
                method: initialData ? 'PUT' : 'POST',
                body: formData,
            });
            const result = await response.json();

            if (response.ok && result.success) {
                notify.success(initialData ? 'Quotation updated successfully' : 'Quotation created successfully');
                setSuccess(true);
                router.refresh();
                setTimeout(() => {
                    router.push(`/quotations/${result.data}`);
                }, 2000);
            } else {
                const message = result.error || 'Failed to process quotation';
                notify.error(message);
                setError(message);
            }
        } catch (e) {
            setError('An unexpected error occurred');
            console.error(e);
            notify.error('Failed to process quotation. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const fmt = formatCurrency;

    return (
        <Form {...form}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6" onKeyDown={handleEnterKey}>
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {initialData ? `Edit Quotation Q-${String(initialData.quotationNumber).padStart(4, '0')}` : 'New Quotation'}
                    </h1>
                    <p className="text-muted-foreground">
                        {initialData ? 'Update details for this quotation' : 'Generate a professional tour quotation for your customer'}
                    </p>
                </div>
                {!initialData && (
                    <Button 
                        type="button" 
                        variant="default"
                        className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                        onClick={() => setIsAIChatOpen(true)}
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate with AI
                    </Button>
                )}
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

            {/* Step 1: Select Routing Mode (Map Route vs Tour Schedule) */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                {routingMode === 'map' ? (
                                    <>
                                        <Navigation className="h-5 w-5 text-primary" />
                                        Point-to-Point Route (Map Planner)
                                    </>
                                ) : (
                                    <>
                                        <FileCheck className="h-5 w-5 text-primary" />
                                        Tour Schedule Package
                                    </>
                                )}
                            </CardTitle>
                            <CardDescription>
                                {routingMode === 'map' 
                                    ? 'Calculate road distance and driving duration with live road routing'
                                    : 'Choose a predefined multi-day tour package or create a custom itinerary'}
                            </CardDescription>
                        </div>

                        {/* Segmented Mode Selector Button Group */}
                        <div className="inline-flex p-1 bg-muted rounded-lg border self-start sm:self-auto shrink-0 shadow-2xs">
                            <button
                                type="button"
                                onClick={() => setRoutingMode('map')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                    routingMode === 'map'
                                        ? 'bg-background text-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Navigation className="w-3.5 h-3.5 text-primary" />
                                Direct Map Route
                            </button>
                            <button
                                type="button"
                                onClick={() => setRoutingMode('schedule')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                    routingMode === 'schedule'
                                        ? 'bg-background text-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <CalendarRange className="w-3.5 h-3.5 text-primary" />
                                Tour Schedule
                            </button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {routingMode === 'map' ? (
                        <div className="space-y-4">
                            <MapDistanceCalculator
                                onDistanceCalculated={(dist, duration, start, end, details) => {
                                    const startTown = start.split(',')[0].trim();
                                    const endTown = end.split(',')[0].trim();
                                    form.setValue('pickupLocation', startTown, { shouldDirty: true });
                                    form.setValue('dropLocation', endTown, { shouldDirty: true });

                                    // Build route description with intermediate stops if present
                                    let routeDisplay = `${startTown} to ${endTown}`;
                                    if (details?.waypoints && details.waypoints.length > 2) {
                                        routeDisplay = details.waypoints.map(wp => wp.name.split(',')[0].trim()).join(' → ');
                                    }

                                    let autoNote = `Route: ${routeDisplay}\nEst. Distance: ${dist.toFixed(1)} km\nEst. Duration: ${duration}`;
                                    if (details?.fuelEstimate) {
                                        autoNote += `\nEst. Fuel: ~${details.fuelEstimate.liters} L (Rs. ${details.fuelEstimate.estimatedCost.toLocaleString()})`;
                                    }
                                    const currentNotes = form.getValues('notes');
                                    form.setValue('notes', currentNotes ? `${currentNotes}\n\n${autoNote}` : autoNote, { shouldDirty: true });

                                    // Create in-memory transfer schedule
                                    const transferSchedule: ScheduleOption = {
                                        id: selectedSchedule?.id?.startsWith('transfer-') ? selectedSchedule.id : `transfer-${Date.now()}`,
                                        name: `Transfer: ${routeDisplay}`,
                                        days: mapDays,
                                        vehicleCategory: selectedVehicle?.category || 'CAR',
                                        vehicleNo: selectedVehicle?.vehicleNo || null,
                                        ratePerDay: selectedVehicle?.ratePerDay || 0,
                                        kmPerDay: selectedVehicle?.kmPerDay || 0,
                                        excessKmRate: selectedVehicle?.excessKmRate || 0,
                                        extraHourRate: selectedVehicle?.extraHourRate || 0,
                                        items: [
                                            {
                                                dayNumber: 1,
                                                title: routeDisplay,
                                                description: null,
                                                distanceKm: Math.round(dist * 10) / 10,
                                                accommodation: 0,
                                                meals: 0,
                                                activities: 0,
                                                otherCosts: 0,
                                            }
                                        ]
                                    };
                                    setSelectedSchedule(transferSchedule);
                                    form.setValue('tourScheduleId', transferSchedule.id, { shouldDirty: true });
                                    form.setValue('totalDistance', Math.round(dist * 10) / 10, { shouldDirty: true });
                                }}
                            />

                            {/* Live Route Summary Badge if route is calculated */}
                            {selectedSchedule?.id?.startsWith('transfer-') && (
                                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex flex-wrap items-center justify-between gap-3 text-sm animate-in fade-in">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="font-semibold text-foreground">
                                            {form.getValues('pickupLocation') || 'Origin'} ➔ {form.getValues('dropLocation') || 'Destination'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                        <span className="font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                                            {selectedSchedule.items[0]?.distanceKm} km
                                        </span>
                                        <span className="text-muted-foreground bg-background px-2.5 py-1 rounded-md border font-medium">
                                            {mapDays} {mapDays === 1 ? 'Day' : 'Days'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
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
                            {selectedSchedule && !selectedSchedule.id.startsWith('transfer-') && (
                                <div className="mt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-medium">Itinerary Preview</h4>
                                        <span className="text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border font-medium">
                                            {mapDays} {mapDays === 1 ? 'Day' : 'Days'}
                                        </span>
                                    </div>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

                        {/* Dedicated Tour Duration (Days) Field */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="tourDays" className="font-semibold text-primary">
                                    Tour Duration (Days) *
                                </Label>
                                <span className="text-[11px] text-muted-foreground font-mono">
                                    {mapDays} {mapDays === 1 ? 'Day' : 'Days'}
                                </span>
                            </div>
                            <Input
                                id="tourDays"
                                type="number"
                                min="1"
                                max="60"
                                value={mapDays}
                                onChange={(e) => {
                                    const newDays = Math.max(1, parseInt(e.target.value) || 1);
                                    if (newDays !== mapDays) {
                                        setMapDays(newDays);
                                    }
                                    if (watchedStartDate) {
                                        const start = new Date(watchedStartDate);
                                        if (!isNaN(start.getTime())) {
                                            const end = new Date(start);
                                            end.setDate(start.getDate() + (newDays - 1));
                                            form.setValue('endDate', end as unknown as Date, { shouldValidate: true, shouldDirty: true });
                                        }
                                    }
                                }}
                                className="font-bold border-primary/50 focus:border-primary text-base"
                                placeholder="e.g. 1"
                            />
                        </div>
                    </div>

                    {/* Start Date & End Date side-by-side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Tour Start Date *</Label>
                            <DateTimePicker
                                date={watchedStartDate ? (watchedStartDate instanceof Date ? watchedStartDate : new Date(watchedStartDate)) : undefined}
                                setDate={(newDate) => {
                                    form.setValue('startDate', newDate as unknown as Date, { shouldValidate: true, shouldDirty: true });
                                    if (newDate) {
                                        const end = new Date(newDate);
                                        end.setDate(newDate.getDate() + (tourDurationDays - 1));
                                        form.setValue('endDate', end as unknown as Date, { shouldValidate: true, shouldDirty: true });
                                    }
                                }}
                            />
                            {form.formState.errors.startDate && (
                                <p className="text-sm text-destructive font-medium">{form.formState.errors.startDate.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="endDate" className="text-muted-foreground">Tour End Date</Label>
                                <span className="text-[10px] text-muted-foreground font-mono">Auto-syncs with days</span>
                            </div>
                            <DateTimePicker
                                date={watchedEndDate ? (watchedEndDate instanceof Date ? watchedEndDate : new Date(watchedEndDate)) : undefined}
                                setDate={(newEndVal) => {
                                    form.setValue('endDate', newEndVal as unknown as Date, { shouldValidate: true, shouldDirty: true });
                                    if (watchedStartDate && newEndVal) {
                                        const start = new Date(watchedStartDate);
                                        const end = new Date(newEndVal);
                                        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
                                            const diffTime = end.getTime() - start.getTime();
                                            const calcDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
                                            if (calcDays !== mapDays) {
                                                setMapDays(calcDays);
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Conditional Pickup & Drop-off handling */}
                    {routingMode === 'map' ? (
                        /* Direct Map Route mode: Show synchronized route banner instead of duplicate input fields */
                        (watchedFields.pickupLocation || watchedFields.dropLocation) && (
                            <div className="p-3 bg-muted/40 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span className="text-muted-foreground font-medium">Route:</span>
                                    <span className="font-semibold text-foreground">
                                        {watchedFields.pickupLocation || 'Origin'} ➔ {watchedFields.dropLocation || 'Destination'}
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                    Auto-synced from Map Planner
                                </span>
                            </div>
                        )
                    ) : (
                        /* Tour Schedule mode (No Map Planner): Provide manual pickup & drop inputs */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
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
                    )}
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
                            <div className="flex items-center justify-between">
                                <Label htmlFor="totalDistance">Tour Distance (KM)</Label>
                                {selectedSchedule && selectedSchedule.items.length > 0 && (
                                    <button
                                        type="button"
                                        className="text-[10px] text-primary hover:underline font-mono"
                                        onClick={() => {
                                            const sDist = selectedSchedule.items.reduce((s, i) => s + i.distanceKm, 0);
                                            form.setValue('totalDistance', sDist, { shouldDirty: true });
                                        }}
                                        title="Reset to itinerary schedule distance"
                                    >
                                        Auto: {selectedSchedule.items.reduce((s, i) => s + i.distanceKm, 0)} km
                                    </button>
                                )}
                            </div>
                            <Input
                                id="totalDistance"
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="0.00"
                                {...form.register('totalDistance')}
                            />
                        </div>
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
                            <div className="flex items-center justify-between">
                                <Label htmlFor="excessKmRate">Extra Km Rate (Rs.)</Label>
                                {vehicleCostStats && vehicleCostStats.suggestedRate > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => form.setValue('excessKmRate', vehicleCostStats.suggestedRate, { shouldDirty: true })}
                                        className="text-xs text-primary hover:underline flex items-center gap-1 font-medium bg-primary/10 px-2 py-0.5 rounded cursor-pointer transition-colors hover:bg-primary/20"
                                        title="Auto-calculated from vehicle maintenance, insurance, tyre, and fuel costs"
                                    >
                                        <Sparkles className="w-3 h-3 text-primary" />
                                        Auto Rate: Rs. {vehicleCostStats.suggestedRate}/km
                                    </button>
                                )}
                            </div>
                            <Input
                                id="excessKmRate"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...form.register('excessKmRate')}
                            />
                            {/* Automated vehicle operating cost basis & tour extra calculation */}
                            {vehicleCostStats && vehicleCostStats.baseVoc > 0 && (
                                <div className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded border border-border/60 space-y-1">
                                    <div className="flex flex-wrap items-center justify-between gap-1">
                                        <span className="font-medium text-foreground">
                                            Cost Basis ({selectedVehicle?.vehicleNo}):
                                        </span>
                                        <span>
                                            Service: Rs. {vehicleCostStats.sCost.toFixed(1)} • Ins: Rs. {vehicleCostStats.insCost.toFixed(1)} • Tyres: Rs. {vehicleCostStats.tyreCost.toFixed(1)}
                                            {vehicleCostStats.fuelCost > 0 ? ` • Fuel: Rs. ${vehicleCostStats.fuelCost.toFixed(1)}` : ''}
                                        </span>
                                    </div>
                                    {(calculatedTotals.excessKm || 0) > 0 && (
                                        <div className="text-amber-600 dark:text-amber-400 font-medium">
                                            Tour Extra: {(calculatedTotals.excessKm || 0).toFixed(0)} km × Rs. {watchedExcessKmRate || 0} = Rs. {formatCurrency(calculatedTotals.excessKmCost || 0)}
                                        </div>
                                    )}
                                </div>
                            )}
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
                            <DatePicker
                                date={watchedFields.validUntil ? (watchedFields.validUntil instanceof Date ? watchedFields.validUntil : new Date(watchedFields.validUntil)) : undefined}
                                setDate={(d) => form.setValue('validUntil', d as unknown as Date)}
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
                            {Number(watchedDriverCost) > 0 && selectedSchedule && (
                                <p className="text-xs text-muted-foreground">
                                    {selectedSchedule.days} days × Rs. {Number(watchedDriverCost).toLocaleString()} = Rs. {(selectedSchedule.days * Number(watchedDriverCost)).toLocaleString()} total
                                </p>
                            )}
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
                        <QuotationCostSummary
                            days={selectedSchedule.days}
                            hireRate={Number(watchedHireRate) || 0}
                            excessKmRate={Number(watchedExcessKmRate) || 0}
                            extraHourRate={Number(watchedExtraHourRate) || 0}
                            driverCost={Number(watchedDriverCost) || 0}
                            markup={Number(watchedMarkup) || 0}
                            discount={Number(watchedDiscount) || 0}
                            totals={calculatedTotals}
                        />
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

        <Dialog open={isAIChatOpen} onOpenChange={setIsAIChatOpen}>
            <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-primary/20">
                <DialogHeader className="p-4 border-b bg-muted/30">
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        AI Quotation Generator
                    </DialogTitle>
                    <DialogDescription>
                        Describe the trip to instantly draft a quotation.
                    </DialogDescription>
                </DialogHeader>
                <QuotationAIChat 
                    onApplyDraft={handleApplyDraft} 
                    onClose={() => setIsAIChatOpen(false)} 
                />
            </DialogContent>
        </Dialog>
        </Form>
    );
}
