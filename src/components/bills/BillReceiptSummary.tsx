import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

interface BillReceiptSummaryProps {
    distance: number;
    allowedKm: number;
    days: number;
    baseCharge: number;
    packageCharge: number;
    extraHours: number;
    extraHourRate: number;
    waitingCharge: number;
    gatePass: number;
    advanceAmount: number;
    totalAmount: number;
    formattedBaseCharge: string;
    formattedTotalAmount: string;
    isPerKmMode: boolean;
    isSubmitting: boolean;
    isEditing: boolean;
}

export function BillReceiptSummary({
    distance,
    allowedKm,
    days,
    baseCharge,
    packageCharge,
    extraHours,
    extraHourRate,
    waitingCharge,
    gatePass,
    advanceAmount,
    totalAmount,
    formattedBaseCharge,
    formattedTotalAmount,
    isPerKmMode,
    isSubmitting,
    isEditing,
}: BillReceiptSummaryProps) {
    return (
        <div className="lg:col-span-1 h-full">
            <div className="sticky top-8 space-y-6">
                <Card className="bg-primary/5 border-primary/20 shadow-lg">
                    <CardHeader className="bg-primary/10 border-b border-primary/10 pb-4">
                        <CardTitle className="text-lg">Receipt Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Distance</span>
                                <span className="font-medium">{distance.toFixed(1)} km</span>
                            </div>
                            {allowedKm > 0 && (
                                <div className="space-y-1 mt-2">
                                    <div className="flex justify-between text-xs text-muted-foreground pl-2 border-l-2 border-primary/20">
                                        <span>Included ({allowedKm} km x {days} {days === 1 ? 'day' : 'days'})</span>
                                        <span>{allowedKm * days} km</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-dashed border-primary/20 my-2" />

                        <div className="space-y-2">
                            {allowedKm === 0 && packageCharge === 0 && (
                                <div className="flex justify-between text-sm">
                                    <span>{isPerKmMode ? 'Km Charge' : 'Base Charge'}</span>
                                    <span>{formattedBaseCharge}</span>
                                </div>
                            )}
                            {packageCharge > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span>Package Charge</span>
                                    <span>{formatCurrency(packageCharge)}</span>
                                </div>
                            )}
                            {allowedKm > 0 && packageCharge > 0 && baseCharge > 0 && (
                                <div className="flex justify-between text-sm text-destructive">
                                    <span>Extra Km Charge</span>
                                    <span>{formatCurrency(baseCharge)}</span>
                                </div>
                            )}
                            {extraHours > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span>Extra Hours ({extraHours}h x {extraHourRate})</span>
                                    <span>{formatCurrency(extraHours * extraHourRate)}</span>
                                </div>
                            )}
                            {waitingCharge > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span>Waiting Charge</span>
                                    <span>{formatCurrency(waitingCharge)}</span>
                                </div>
                            )}
                            {gatePass > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span>Gate Pass / Parking</span>
                                    <span>{formatCurrency(gatePass)}</span>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-primary/20 my-4" />

                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold">Total</span>
                            <span className="text-xl font-bold text-primary">{formattedTotalAmount}</span>
                        </div>

                        {advanceAmount > 0 && (
                            <>
                                <div className="flex justify-between items-center text-muted-foreground mt-2">
                                    <span>Advance Payment</span>
                                    <span>-{formatCurrency(advanceAmount)}</span>
                                </div>
                                <div className="border-t border-dashed border-primary/20 my-2" />
                                <div className="flex justify-between items-end">
                                    <span className="text-xl font-extrabold">Balance</span>
                                    <span className="text-2xl sm:text-3xl font-extrabold text-destructive">
                                        Rs.{(totalAmount - advanceAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </>
                        )}

                        <Button type="submit" className="w-full mt-6 h-12 text-lg font-semibold shadow-md" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <span className="flex items-center">
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    {isEditing ? 'Updating...' : 'Creating...'}
                                </span>
                            ) : (
                                isEditing ? 'Update Bill' : 'Create Bill'
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}