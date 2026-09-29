'use client';

import type { ChangeEvent } from 'react';
import { Banknote } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { type BillFormInput } from '@/lib/validations';
import { Input } from '@/components/ui/input';
import {
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

interface BillChargeFieldsProps {
    isPerKmMode: boolean;
    watchedAllowedKm: number;
    handleNumericChange: (
        event: ChangeEvent<HTMLInputElement>,
        fieldChange: (value: string | number) => void,
        fieldName: string
    ) => void;
}

export function BillChargeFields({ isPerKmMode, watchedAllowedKm, handleNumericChange }: BillChargeFieldsProps) {
    const form = useFormContext<BillFormInput>();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Banknote className="h-[18px] w-[18px]" /> Billing &amp; Charges
                </CardTitle>
                <CardDescription>Configure rates, packages, and extra charges.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-4">
                    <h3 className="font-semibold text-sm text-foreground">Rate Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {!isPerKmMode && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="packageCharge"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Package Charge</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={event => handleNumericChange(event, field.onChange, 'packageCharge')} />
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
                                            <FormLabel>Included Km (Per Day)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="1" {...field} value={field.value ?? ''} onChange={event => handleNumericChange(event, field.onChange, 'allowedKm')} />
                                            </FormControl>
                                            <FormMessage />
                                            {form.getValues('allowedKm') > 0 && <p className="text-[10px] text-muted-foreground">Standard distance per day</p>}
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}
                        <FormField
                            control={form.control}
                            name="hireRate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{watchedAllowedKm > 0 ? 'Excess Rate / km' : 'Rate / km'}</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={event => handleNumericChange(event, field.onChange, 'hireRate')} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="waitingCharge"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Waiting Charge</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} onChange={event => handleNumericChange(event, field.onChange, 'waitingCharge')} />
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
                                    <Input type="number" step="0.01" {...field} onChange={event => handleNumericChange(event, field.onChange, 'gatePass')} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormField
                        control={form.control}
                        name="extraKm"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{isPerKmMode ? 'Total Distance (Km)' : 'Extra Km'}</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.1" {...field} onChange={event => handleNumericChange(event, field.onChange, 'extraKm')} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="extraHours"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Extra Hours</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.1" {...field} onChange={event => handleNumericChange(event, field.onChange, 'extraHours')} />
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
                                <FormLabel>Extra Hour Rate</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={event => handleNumericChange(event, field.onChange, 'extraHourRate')} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {([
                        ['accommodationCharge', 'Accommodation'],
                        ['mealsCharge', 'Meals'],
                        ['activitiesCharge', 'Activities'],
                        ['otherCostsCharge', 'Other Costs'],
                    ] as const).map(([name, label]) => (
                        <FormField
                            key={name}
                            control={form.control}
                            name={name}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{label}</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} onChange={event => handleNumericChange(event, field.onChange, name)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="advanceAmount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Advance Deducted</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} onChange={event => handleNumericChange(event, field.onChange, 'advanceAmount')} />
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
    );
}