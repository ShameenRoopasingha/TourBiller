'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Calculator,
  Wrench,
  Fuel,
  Disc,
  Shield,
  ShieldAlert,
  Percent,
  Check,
} from 'lucide-react';

interface PerKmCostCalculatorModalProps {
  initialServiceCost?: number;
  initialServiceInterval?: number;
  initialDailyMileage?: number;
  initialAnnualInsurance?: number;
  currentRate?: number;
  onApplyRate: (rate: number) => void;
  triggerButton?: React.ReactNode;
}

export function PerKmCostCalculatorModal({
  initialServiceCost = 35000,
  initialServiceInterval = 5000,
  initialDailyMileage = 100,
  initialAnnualInsurance = 120000,
  currentRate,
  onApplyRate,
  triggerButton,
}: PerKmCostCalculatorModalProps) {
  const [open, setOpen] = useState(false);

  // 1. Routine Service Inputs
  const [serviceCost, setServiceCost] = useState<number>(initialServiceCost);
  const [serviceInterval, setServiceInterval] = useState<number>(initialServiceInterval);

  // 2. Annual Insurance Inputs
  const [includeInsurance, setIncludeInsurance] = useState<boolean>(true);
  const [annualInsurance, setAnnualInsurance] = useState<number>(initialAnnualInsurance);
  const [dailyMileageLimit, setDailyMileageLimit] = useState<number>(initialDailyMileage || 100);

  // 3. Tyre Wear Inputs
  const [tyreCost, setTyreCost] = useState<number>(160000);
  const [tyreLifespan, setTyreLifespan] = useState<number>(40000);

  // 4. Fuel Inputs
  const [includeFuel, setIncludeFuel] = useState<boolean>(true);
  const [fuelPrice, setFuelPrice] = useState<number>(370);
  const [fuelEfficiency, setFuelEfficiency] = useState<number>(12);

  // 5. Wear & Tear Reserve & Profit Margin
  const [wearReserve, setWearReserve] = useState<number>(5);
  const [profitMargin, setProfitMargin] = useState<number>(20);
  const [roundToNearestTen, setRoundToNearestTen] = useState<boolean>(true);

  // Live Calculations
  // 1. Service Cost per KM = Service Cost / Service Interval
  const serviceCostPerKm = useMemo(() => {
    if (!serviceInterval || serviceInterval <= 0) return 0;
    return (serviceCost || 0) / serviceInterval;
  }, [serviceCost, serviceInterval]);

  // 2. Insurance Cost per KM = Annual Insurance / (365 * Daily Mileage Limit)
  const insuranceCostPerKm = useMemo(() => {
    if (!includeInsurance) return 0;
    const annualMileage = 365 * (dailyMileageLimit || 1);
    if (!annualMileage || annualMileage <= 0) return 0;
    return (annualInsurance || 0) / annualMileage;
  }, [includeInsurance, annualInsurance, dailyMileageLimit]);

  // 3. Tyre Cost per KM = Tyre Set Cost / Tyre Lifespan
  const tyreCostPerKm = useMemo(() => {
    if (!tyreLifespan || tyreLifespan <= 0) return 0;
    return (tyreCost || 0) / tyreLifespan;
  }, [tyreCost, tyreLifespan]);

  // 4. Fuel Cost per KM = Fuel Price / Fuel Efficiency
  const fuelCostPerKm = useMemo(() => {
    if (!includeFuel) return 0;
    if (!fuelEfficiency || fuelEfficiency <= 0) return 0;
    return (fuelPrice || 0) / fuelEfficiency;
  }, [includeFuel, fuelPrice, fuelEfficiency]);

  // Total Base Running Cost per 1 KM
  const baseRunningCostPerKm = useMemo(() => {
    return (
      serviceCostPerKm +
      insuranceCostPerKm +
      tyreCostPerKm +
      fuelCostPerKm +
      (wearReserve || 0)
    );
  }, [serviceCostPerKm, insuranceCostPerKm, tyreCostPerKm, fuelCostPerKm, wearReserve]);

  const profitAmountPerKm = useMemo(() => {
    return baseRunningCostPerKm * ((profitMargin || 0) / 100);
  }, [baseRunningCostPerKm, profitMargin]);

  const exactSuggestedRate = useMemo(() => {
    return baseRunningCostPerKm + profitAmountPerKm;
  }, [baseRunningCostPerKm, profitAmountPerKm]);

  const finalSuggestedRate = useMemo(() => {
    if (roundToNearestTen) {
      return Math.round(exactSuggestedRate / 10) * 10;
    }
    return Math.round(exactSuggestedRate * 100) / 100;
  }, [exactSuggestedRate, roundToNearestTen]);

  const handleApply = () => {
    onApplyRate(finalSuggestedRate);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2.5 flex items-center gap-1.5 border-dashed border-blue-400 text-blue-700 hover:bg-blue-50"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Cost/KM Estimator</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-md">
              <Calculator className="w-4 h-4" />
            </span>
            <span>Per 1 KM Rate Estimator</span>
            <Badge variant="secondary" className="ml-auto text-[10px]">
              VOC Formula
            </Badge>
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Calculates per 1 KM rate from routine service, annual insurance, tyre wear, and fuel costs.
          </p>
        </DialogHeader>

        <div className="space-y-3.5 py-2 text-xs">
          {/* 1. Service / Maintenance Cost */}
          <div className="p-3 bg-muted/40 rounded-lg border border-border/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5 text-foreground">
                <Wrench className="w-3.5 h-3.5 text-amber-600" />
                Routine Service Cost (ඔයිල් / සර්විස් වියදම)
              </span>
              <span className="font-mono font-bold text-blue-600">
                Rs. {serviceCostPerKm.toFixed(2)} / km
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-muted-foreground">Full Service Cost (Rs.)</Label>
                <Input
                  type="number"
                  min="0"
                  step="500"
                  value={serviceCost || ''}
                  onChange={(e) => setServiceCost(Number(e.target.value))}
                  placeholder="e.g. 35000"
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Service Interval (KM)</Label>
                <Input
                  type="number"
                  min="500"
                  step="500"
                  value={serviceInterval || ''}
                  onChange={(e) => setServiceInterval(Number(e.target.value))}
                  placeholder="e.g. 5000"
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Formula: Service Cost ÷ Interval = Rs. {serviceCost.toLocaleString()} ÷ {serviceInterval.toLocaleString()} km
            </p>
          </div>

          {/* 2. Annual Insurance Cost */}
          <div className="p-3 bg-muted/40 rounded-lg border border-border/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={includeInsurance}
                    onChange={(e) => setIncludeInsurance(e.target.checked)}
                    className="w-3.5 h-3.5 accent-primary rounded"
                  />
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  Annual Insurance (වාර්ෂික රක්ෂණය)
                </label>
              </div>
              <span className="font-mono font-bold text-blue-600">
                {includeInsurance ? `Rs. ${insuranceCostPerKm.toFixed(2)} / km` : 'Excluded'}
              </span>
            </div>
            {includeInsurance && (
              <>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Annual Insurance (Rs.)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1000"
                      value={annualInsurance || ''}
                      onChange={(e) => setAnnualInsurance(Number(e.target.value))}
                      placeholder="e.g. 120000"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Daily Mileage Limit (KM)</Label>
                    <Input
                      type="number"
                      min="10"
                      step="10"
                      value={dailyMileageLimit || ''}
                      onChange={(e) => setDailyMileageLimit(Number(e.target.value))}
                      placeholder="e.g. 100"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  Formula: Annual Insurance ÷ (365 × Daily KM) = Rs. {annualInsurance.toLocaleString()} ÷ {(365 * dailyMileageLimit).toLocaleString()} km/yr
                </p>
              </>
            )}
          </div>

          {/* 3. Tyre Wear & Alignment */}
          <div className="p-3 bg-muted/40 rounded-lg border border-border/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5 text-foreground">
                <Disc className="w-3.5 h-3.5 text-purple-600" />
                Tyres & Alignment (ටයර් සහ ගෙවීයාම්)
              </span>
              <span className="font-mono font-bold text-blue-600">
                Rs. {tyreCostPerKm.toFixed(2)} / km
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-muted-foreground">Tyre Set Cost (Rs.)</Label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  value={tyreCost || ''}
                  onChange={(e) => setTyreCost(Number(e.target.value))}
                  placeholder="e.g. 160000"
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Tyre Lifespan (KM)</Label>
                <Input
                  type="number"
                  min="5000"
                  step="5000"
                  value={tyreLifespan || ''}
                  onChange={(e) => setTyreLifespan(Number(e.target.value))}
                  placeholder="e.g. 40000"
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* 4. Fuel Running Cost */}
          <div className="p-3 bg-muted/40 rounded-lg border border-border/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={includeFuel}
                    onChange={(e) => setIncludeFuel(e.target.checked)}
                    className="w-3.5 h-3.5 accent-primary rounded"
                  />
                  <Fuel className="w-3.5 h-3.5 text-emerald-600" />
                  Fuel Running Cost (ඉන්ධන වියදම)
                </label>
              </div>
              <span className="font-mono font-bold text-blue-600">
                {includeFuel ? `Rs. ${fuelCostPerKm.toFixed(2)} / km` : 'Excluded'}
              </span>
            </div>
            {includeFuel && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Fuel Price / Litre (Rs.)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="5"
                    value={fuelPrice || ''}
                    onChange={(e) => setFuelPrice(Number(e.target.value))}
                    placeholder="e.g. 370"
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Fuel Efficiency (KM / L)</Label>
                  <Input
                    type="number"
                    min="1"
                    step="0.5"
                    value={fuelEfficiency || ''}
                    onChange={(e) => setFuelEfficiency(Number(e.target.value))}
                    placeholder="e.g. 12"
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 5. Wear Reserve & Profit Margin */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 bg-muted/30 rounded-lg border border-border/50">
              <Label className="text-[11px] font-semibold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-orange-500" />
                Unscheduled Repairs (Rs./KM)
              </Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={wearReserve ?? ''}
                onChange={(e) => setWearReserve(Number(e.target.value))}
                placeholder="e.g. 5"
                className="h-8 text-xs mt-1.5"
              />
              <span className="text-[10px] text-muted-foreground block mt-1">Brake pads, suspension reserve</span>
            </div>

            <div className="p-2.5 bg-muted/30 rounded-lg border border-border/50">
              <Label className="text-[11px] font-semibold flex items-center gap-1">
                <Percent className="w-3 h-3 text-green-600" />
                Profit Margin (%)
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="5"
                value={profitMargin ?? ''}
                onChange={(e) => setProfitMargin(Number(e.target.value))}
                placeholder="e.g. 20"
                className="h-8 text-xs mt-1.5"
              />
              <span className="text-[10px] text-muted-foreground block mt-1">
                +Rs. {profitAmountPerKm.toFixed(2)} / km
              </span>
            </div>
          </div>

          {/* Live Calculation Summary Banner */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-600">🛢️ Service:</span>
                <span className="font-mono">Rs. {serviceCostPerKm.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">🛡️ Insurance:</span>
                <span className="font-mono">Rs. {insuranceCostPerKm.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">🚗 Tyres:</span>
                <span className="font-mono">Rs. {tyreCostPerKm.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">⛽ Fuel:</span>
                <span className="font-mono">{includeFuel ? `Rs. ${fuelCostPerKm.toFixed(2)}` : 'Excluded'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">🔧 Wear Reserve:</span>
                <span className="font-mono">Rs. {wearReserve.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">📈 Profit ({profitMargin}%):</span>
                <span className="font-mono text-emerald-700">+{profitAmountPerKm.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-blue-200 pt-2 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-900 block">Recommended Rate per KM</span>
                <span className="text-[10px] text-blue-700">
                  {roundToNearestTen ? '(Rounded to nearest Rs. 10)' : '(Exact)'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold text-blue-700 font-mono">
                  Rs. {finalSuggestedRate.toFixed(2)}
                </span>
                <span className="text-xs text-blue-600 font-medium ml-1">/ km</span>
              </div>
            </div>

            {/* Rounding Checkbox */}
            <div className="pt-1 flex items-center justify-between text-[11px] text-blue-800 border-t border-blue-100">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={roundToNearestTen}
                  onChange={(e) => setRoundToNearestTen(e.target.checked)}
                  className="w-3 h-3 accent-blue-600"
                />
                Round to nearest Rs. 10 (e.g. Rs. {Math.round(exactSuggestedRate / 10) * 10})
              </label>
              {currentRate !== undefined && currentRate > 0 && (
                <span className="text-gray-500">
                  Current: <strong className="text-black">Rs. {currentRate}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Apply Rs. {finalSuggestedRate.toFixed(2)} / KM</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
