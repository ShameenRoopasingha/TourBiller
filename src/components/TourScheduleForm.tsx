'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Trash2, MapPin } from 'lucide-react';

import { TourScheduleSchema, type TourScheduleFormData, type Vehicle } from '@/lib/validations';
import { createTourSchedule, updateTourSchedule } from '@/lib/tour-schedule-actions';
import { getVehicles } from '@/lib/vehicle-actions';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { ComboboxField } from '@/components/ComboboxField';

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

import { useRouter } from 'next/navigation';

const VEHICLE_CATEGORIES = ['CAR', 'VAN', 'SUV', 'BUS', 'MINI_BUS', 'COASTER'];

const CATEGORY_SEATS: Record<string, number> = {
    'CAR': 4,
    'VAN': 14,
    'SUV': 7,
    'BUS': 45,
    'MINI_BUS': 25,
    'COASTER': 29
};

interface TourScheduleFormProps {
    initialData?: {
        id: string;
        name: string;
        description: string | null;
        days: number;
        basePricePerPerson: number;
        vehicleCategory: string;
        excessKmRate: number | null;
        extraHourRate: number | null;
        vehicleNo: string | null;
        ratePerDay: number;
        kmPerDay: number;
        seats: number;
        waitingCharge: number;
        gatePass: number;
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
    };
    existingSchedules?: { id: string; name: string }[];
    onSuccess?: (data: { id: string; name: string }) => void;
    onCancel?: () => void;
    hideHeader?: boolean;
}

export function TourScheduleForm({
    initialData,
    existingSchedules = [],
    onSuccess,
    onCancel,
    hideHeader = false
}: TourScheduleFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const handleEnterKey = useEnterNavigation();

    const isEditing = !!initialData;

    const defaultItems = initialData?.items.map((item) => ({
        dayNumber: item.dayNumber,
        title: item.title,
        description: item.description || '',
        distanceKm: item.distanceKm,
        accommodation: item.accommodation,
        meals: item.meals,
        activities: item.activities,
        otherCosts: item.otherCosts,
    })) || [
            {
                dayNumber: 1,
                title: '',
                description: '',
                distanceKm: '' as unknown as number,
                accommodation: '' as unknown as number,
                meals: '' as unknown as number,
                activities: '' as unknown as number,
                otherCosts: '' as unknown as number,
            },
        ];

    const form = useForm<TourScheduleFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(TourScheduleSchema) as any,
        defaultValues: {
            name: initialData?.name || '',
            description: initialData?.description || '',
            days: initialData?.days || 1,
            basePricePerPerson: initialData?.basePricePerPerson || ('' as unknown as number),
            vehicleCategory: initialData?.vehicleCategory || 'CAR',
            vehicleNo: initialData?.vehicleNo || '',
            ratePerDay: initialData?.ratePerDay || 0,
            kmPerDay: initialData?.kmPerDay || 0,
            seats: initialData?.seats || 0,
            excessKmRate: initialData?.excessKmRate || ('' as unknown as number),
            extraHourRate: initialData?.extraHourRate || ('' as unknown as number),
            waitingCharge: initialData?.waitingCharge || 0,
            gatePass: initialData?.gatePass || 0,
            isActive: true,
            items: defaultItems,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'items',
    });

    const watchedItems = useWatch({
        control: form.control,
        name: 'items',
    });

    const watchedName = useWatch({
        control: form.control,
        name: 'name',
    });

    const watchedDays = useWatch({
        control: form.control,
        name: 'days',
    });

    const watchedRatePerDay = useWatch({
        control: form.control,
        name: 'ratePerDay',
    });

    const watchedWaitingCharge = useWatch({
        control: form.control,
        name: 'waitingCharge',
    });

    const watchedGatePass = useWatch({
        control: form.control,
        name: 'gatePass',
    });

    // Debug: log existing schedules and initial data
    console.log('initialData:', initialData);
    console.log('existingSchedules:', existingSchedules);

    // Temporarily disable duplicate check when editing to resolve issue
    const isNameDuplicate = !isEditing && watchedName && existingSchedules.some(
        s => s.name.toLowerCase() === watchedName.trim().toLowerCase()
    );

    console.log('isNameDuplicate:', isNameDuplicate, 'isEditing:', isEditing);

    // Calculate totals from day items
    const totals = watchedItems?.reduce(
        (acc, item) => ({
            distance: acc.distance + (Number(item?.distanceKm) || 0),
            accommodation: acc.accommodation + (Number(item?.accommodation) || 0),
            meals: acc.meals + (Number(item?.meals) || 0),
            activities: acc.activities + (Number(item?.activities) || 0),
            otherCosts: acc.otherCosts + (Number(item?.otherCosts) || 0),
        }),
        { distance: 0, accommodation: 0, meals: 0, activities: 0, otherCosts: 0 }
    ) || { distance: 0, accommodation: 0, meals: 0, activities: 0, otherCosts: 0 };

    const hireTotal = (Number(watchedRatePerDay) || 0) * (Number(watchedDays) || 1);
    const itineraryTotal = totals.accommodation + totals.meals + totals.activities + totals.otherCosts;
    const additionalTotal = (Number(watchedWaitingCharge) || 0) + (Number(watchedGatePass) || 0);
    const grandTotal = hireTotal + itineraryTotal + additionalTotal;

    const [isManualPrice, setIsManualPrice] = useState(false);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    // Fetch vehicles
    useEffect(() => {
        async function fetchVehicles() {
            const result = await getVehicles();
            if (result.success) {
                setVehicles(result.data || []);
            }
        }
        fetchVehicles();
    }, []);

    const watchedCategory = useWatch({
        control: form.control,
        name: 'vehicleCategory',
    });

    const watchedSeats = useWatch({
        control: form.control,
        name: 'seats',
    });

    const handleVehicleChange = (vehicleNo: string) => {
        const vehicle = vehicles.find(v => v.vehicleNo === vehicleNo);
        if (vehicle) {
            form.setValue('vehicleNo', vehicle.vehicleNo);
            form.setValue('vehicleCategory', vehicle.category);
            form.setValue('ratePerDay', vehicle.ratePerDay);
            form.setValue('kmPerDay', vehicle.kmPerDay);
            form.setValue('excessKmRate', vehicle.excessKmRate);
            form.setValue('extraHourRate', vehicle.extraHourRate);
            form.setValue('seats', vehicle.seats || 0);
        }
    };

    useEffect(() => {
        if (isManualPrice) return;

        const seats = Number(watchedSeats) || CATEGORY_SEATS[watchedCategory] || 1;
        const calculatedPrice = grandTotal / seats;

        // Only update if it's a valid number and actually changed significantly
        if (!isNaN(calculatedPrice) && isFinite(calculatedPrice)) {
            form.setValue('basePricePerPerson', Math.round(calculatedPrice));
        }
    }, [grandTotal, watchedCategory, watchedSeats, isManualPrice, form]);

    const addDay = () => {
        append({
            dayNumber: fields.length + 1,
            title: '',
            description: '',
            distanceKm: '' as unknown as number,
            accommodation: '' as unknown as number,
            meals: '' as unknown as number,
            activities: '' as unknown as number,
            otherCosts: '' as unknown as number,
        });
        form.setValue('days', fields.length + 1);
    };

    const removeDay = (index: number) => {
        if (fields.length <= 1) return;
        remove(index);
        // Re-number remaining days
        const remaining = form.getValues('items');
        remaining.forEach((_, i) => {
            form.setValue(`items.${i}.dayNumber`, i + 1);
        });
        form.setValue('days', remaining.length);
    };

    const onSubmit = async (data: TourScheduleFormData) => {
        if (isNameDuplicate) {
            setError('This tour name already exists. Please use a unique name.');
            return;
        }
        setIsSubmitting(true);
        setError(null);

        try {
            const result = isEditing
                ? await updateTourSchedule(initialData!.id, data)
                : await createTourSchedule(data);

            if (result.success) {
                setSuccess(true);
                router.refresh();
                if (onSuccess) {
                    onSuccess(result.data!);
                } else {
                    // Keep isSubmitting true during transition
                    setTimeout(() => router.push('/tour-schedules'), 1000);
                }
            } else {
                setError(result.error || 'An error occurred');
                setIsSubmitting(false);
            }
        } catch {
            setError('An unexpected error occurred');
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" onKeyDown={handleEnterKey}>
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {success && (
                <Alert>
                    <AlertDescription>
                        Tour schedule {isEditing ? 'updated' : 'created'} successfully! Redirecting...
                    </AlertDescription>
                </Alert>
            )}

            {/* Schedule Details */}
            <Card>
                {!hideHeader && (
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Tour Details
                        </CardTitle>
                        <CardDescription>
                            Basic information about the tour schedule
                        </CardDescription>
                    </CardHeader>
                )}
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Tour Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g. 5-Day Cultural Triangle Tour"
                                {...form.register('name')}
                                className={isNameDuplicate ? 'border-destructive' : ''}
                            />
                            {isNameDuplicate && (
                                <p className="text-sm text-destructive font-medium">This name cannot be used, it already exists</p>
                            )}
                            {form.formState.errors.name && (
                                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="vehicleNo">Vehicle *</Label>
                            <Controller
                                control={form.control}
                                name="vehicleNo"
                                render={({ field }) => (
                                    <ComboboxField
                                        options={vehicles.map((v) => ({
                                            label: `${v.vehicleNo} - ${v.model || ''} (${v.category})`,
                                            value: v.vehicleNo
                                        }))}
                                        value={field.value || ''}
                                        onChange={(val) => {
                                            field.onChange(val);
                                            handleVehicleChange(val);
                                        }}
                                        placeholder="Select vehicle..."
                                    />
                                )}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="vehicleCategory">Vehicle Category</Label>
                            <Controller
                                control={form.control}
                                name="vehicleCategory"
                                render={({ field }) => (
                                    <ComboboxField
                                        options={VEHICLE_CATEGORIES.map((cat) => ({
                                            label: cat.replace('_', ' '),
                                            value: cat
                                        }))}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select category..."
                                        disabled // Disabled as it's auto-filled from vehicle
                                    />
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="seats">Seats</Label>
                            <Input
                                id="seats"
                                type="number"
                                {...form.register('seats')}
                                readOnly
                                className="bg-muted"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Brief description of the tour..."
                            {...form.register('description')}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="basePricePerPerson">Base Price Per Person (Rs.)</Label>
                                {(watchedSeats || watchedCategory) && (
                                    <span className="text-[10px] text-muted-foreground italic">
                                        (Est. Rs. {grandTotal.toLocaleString()} / {watchedSeats || CATEGORY_SEATS[watchedCategory] || '?'} seats)
                                    </span>
                                )}
                            </div>
                            <Input
                                id="basePricePerPerson"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...form.register('basePricePerPerson', {
                                    onChange: () => setIsManualPrice(true)
                                })}
                                className={!isManualPrice ? 'bg-primary/5 border-primary/20' : ''}
                            />
                            {!isManualPrice && (
                                <p className="text-[10px] text-primary/60 mt-1">Auto-calculated based on {watchedCategory} seats</p>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="ratePerDay">Rate Per Day (Rs.)</Label>
                            <Input
                                id="ratePerDay"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...form.register('ratePerDay')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="kmPerDay">Km Per Day</Label>
                            <Input
                                id="kmPerDay"
                                type="number"
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
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="waitingCharge">Waiting Charge (Rs.)</Label>
                            <Input
                                id="waitingCharge"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...form.register('waitingCharge')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gatePass">Gate Pass (Rs.)</Label>
                            <Input
                                id="gatePass"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...form.register('gatePass')}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Day Items */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Day-by-Day Itinerary</CardTitle>
                            <CardDescription>
                                Add details and costs for each day of the tour
                            </CardDescription>
                        </div>
                        <Button type="button" onClick={addDay} variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-1" /> Add Day
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {fields.map((field, index) => (
                        <div
                            key={field.id}
                            className="border border-border rounded-lg p-4 space-y-3 bg-muted/30"
                        >
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">
                                    Day {index + 1}
                                </h4>
                                {fields.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeDay(index)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>



                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Route / Title *</Label>
                                    <Input
                                        placeholder="e.g. Colombo → Kandy"
                                        {...form.register(`items.${index}.title`)}
                                    />
                                    {form.formState.errors.items?.[index]?.title && (
                                        <p className="text-xs text-destructive">
                                            {form.formState.errors.items[index]?.title?.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Description</Label>
                                    <Input
                                        placeholder="Optional details..."
                                        {...form.register(`items.${index}.description`)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Distance (km)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="0.0"
                                        {...form.register(`items.${index}.distanceKm`)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Accommodation</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        {...form.register(`items.${index}.accommodation`)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Meals</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        {...form.register(`items.${index}.meals`)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Activities</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        {...form.register(`items.${index}.activities`)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Other Costs</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        {...form.register(`items.${index}.otherCosts`)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Totals Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Schedule Totals</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-7 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Days</span>
                            <p className="font-semibold">{fields.length}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Total Distance</span>
                            <p className="font-semibold">{totals.distance.toFixed(1)} km</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Accommodation</span>
                            <p className="font-semibold">Rs. {totals.accommodation.toLocaleString('en-US')}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Meals</span>
                            <p className="font-semibold">Rs. {totals.meals.toLocaleString('en-US')}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Activities</span>
                            <p className="font-semibold">Rs. {totals.activities.toLocaleString('en-US')}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Other</span>
                            <p className="font-semibold">Rs. {totals.otherCosts.toLocaleString('en-US')}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Grand Total</span>
                            <p className="font-bold text-primary text-lg">Rs. {grandTotal.toLocaleString('en-US')}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-3 justify-end">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => onCancel ? onCancel() : router.push('/tour-schedules')}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !!isNameDuplicate} className="min-w-[140px]">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? 'Update Schedule' : 'Create Schedule'}
                </Button>
            </div>
        </form>
    );
}
