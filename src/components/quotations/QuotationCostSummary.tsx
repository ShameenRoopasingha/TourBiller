import { formatCurrency } from '@/lib/calculations';

interface QuotationCostTotals {
    totalDistance: number;
    includedKm: number;
    transportCost: number;
    driverTotal: number;
    accommodationTotal: number;
    mealsTotal: number;
    activitiesTotal: number;
    otherCostsTotal: number;
    subtotal: number;
    markupAmount: number;
    totalAmount: number;
}

interface QuotationCostSummaryProps {
    days: number;
    hireRate: number;
    excessKmRate: number;
    extraHourRate: number;
    driverCost: number;
    markup: number;
    discount: number;
    totals: QuotationCostTotals;
}

export function QuotationCostSummary({
    days,
    hireRate,
    excessKmRate,
    extraHourRate,
    driverCost,
    markup,
    discount,
    totals,
}: QuotationCostSummaryProps) {
    const format = formatCurrency;

    return (
        <div className="mt-4 p-4 bg-muted/40 rounded-lg border">
            <h4 className="font-semibold text-sm mb-3">Cost Summary</h4>

            {totals.transportCost > 0 && (
                <div className="mb-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    {hireRate === 0 ? (
                        <p className="font-semibold text-primary text-sm">
                            💰 Vehicle Hire: {totals.totalDistance.toFixed(0)} km @ {format(excessKmRate)}/km : {format(totals.transportCost)}
                        </p>
                    ) : (
                        <>
                            <p className="font-semibold text-primary text-sm">
                                💰 Vehicle Hire: {days} days : {format(totals.transportCost)} for {totals.includedKm.toFixed(0)} km
                            </p>
                            {excessKmRate > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Any distance exceeding {totals.includedKm.toFixed(0)} km will be charged at Rs. {excessKmRate} per additional km.
                                </p>
                            )}
                            {extraHourRate > 0 && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Extra hours will be charged at Rs. {extraHourRate} per hour.
                                </p>
                            )}
                        </>
                    )}
                </div>
            )}

            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Van Hire ({days} days x {format(hireRate)}/day)</span>
                    <span>{format(totals.transportCost)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Accommodation</span>
                    <span>{format(totals.accommodationTotal)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Meals</span>
                    <span>{format(totals.mealsTotal)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Activities</span>
                    <span>{format(totals.activitiesTotal)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Other Costs</span>
                    <span>{format(totals.otherCostsTotal)}</span>
                </div>
                {driverCost > 0 && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Driver ({days} days x {format(driverCost)}/day)</span>
                        <span>{format(totals.driverTotal)}</span>
                    </div>
                )}
                <div className="border-t pt-2 flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{format(totals.subtotal)}</span>
                </div>
                {markup > 0 && (
                    <div className="flex justify-between text-green-600">
                        <span>Commission ({markup}%)</span>
                        <span>+{format(totals.markupAmount)}</span>
                    </div>
                )}
                {discount > 0 && (
                    <div className="flex justify-between text-destructive">
                        <span>Discount</span>
                        <span>-{format(discount)}</span>
                    </div>
                )}
                <div className="border-t-2 pt-2 flex justify-between text-lg font-bold">
                    <span>TOTAL</span>
                    <span className="text-primary">{format(totals.totalAmount)}</span>
                </div>
            </div>
        </div>
    );
}