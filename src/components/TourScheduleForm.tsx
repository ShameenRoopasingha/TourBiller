'use client';

import { useState } from 'react';
import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Trash2, MapPin } from 'lucide-react';

import { TourScheduleSchema, type TourScheduleFormData } from '@/lib/validations';
import { createTourSchedule, updateTourSchedule } from '@/lib/tour-schedule-actions';
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
    existingSchedules?: { name: string }[];
}

export function TourScheduleForm({ initialData, existingSchedules = [] }: TourScheduleFormProps) {
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
            excessKmRate: initialData?.excessKmRate || ('' as unknown as number),
            extraHourRate: initialData?.extraHourRate || ('' as unknown as number),
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

    const grandTotal = totals.accommodation + totals.meals + totals.activities + totals.otherCosts;

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
        setIsSubmitting(true);
        setError(null);

        try {
            const result = isEditing
                ? await updateTourSchedule(initialData!.id, data)
                : await createTourSchedule(data);

            if (result.success) {
                setSuccess(true);
                // Keep isSubmitting true during transition
                setTimeout(() => router.push('/tour-schedules'), 1000);
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
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Tour Details
                    </CardTitle>
                    <CardDescription>
                        Basic information about the tour schedule
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Tour Name *</Label>
                            <Controller
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <ComboboxField
                                        options={existingSchedules.map(s => ({ label: s.name, value: s.name }))}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="e.g. 5-Day Cultural Triangle Tour"
                                        allowCustomValue={true}
                                    />
                                )}
                            />
                            {form.formState.errors.name && (
                                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                            )}
                        </div>
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
                                        />
                                    )}
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
                            <Label htmlFor="basePricePerPerson">Base Price Per Person (Rs.)</Label>
                            <Input
                                id="basePricePerPerson"
                                type="number"
                                step="0.01"
                                {...form.register('basePricePerPerson')}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="excessKmRate">Extra Km Rate (Rs.)</Label>
                            <Input
                                id="excessKmRate"
                                type="number"
                                step="0.01"
                                placeholder="Optional global extra km rate"
                                {...form.register('excessKmRate')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="extraHourRate">Extra Hour Rate (Rs.)</Label>
                            <Input
                                id="extraHourRate"
                                type="number"
                                step="0.01"
                                placeholder="Optional global extra hour rate"
                                {...form.register('extraHourRate')}
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
                                        {...form.register(`items.${index}.distanceKm`)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Accommodation</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        {...form.register(`items.${index}.accommodation`)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Meals</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        {...form.register(`items.${index}.meals`)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Activities</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        {...form.register(`items.${index}.activities`)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Other Costs</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
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
                    onClick={() => router.push('/tour-schedules')}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? 'Update Schedule' : 'Create Schedule'}
                </Button>
            </div>
        </form>
    );
}
