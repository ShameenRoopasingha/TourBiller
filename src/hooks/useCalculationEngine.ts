import { useState, useCallback, useMemo } from 'react';
import {
  calculateDistance,
  calculateBaseCharge,
  calculateExtraCharges,
  formatCurrency
} from '@/lib/calculations';

export interface UseCalculationEngineReturn {
  totalAmount: number;
  distance: number;
  baseCharge: number;
  extraCharges: number;
  formattedTotalAmount: string;
  formattedBaseCharge: string;
  formattedExtraCharges: string;
  updateField: (field: string, value: number | Date | undefined) => void;
  resetCalculations: () => void;
  fields: CalculationFields;
  days: number;
}

interface CalculationFields {
  startMeter: number;
  endMeter: number;
  hireRate: number;
  waitingCharge: number;
  gatePass: number;
  packageCharge: number;
  allowedKm: number;
  extraKm?: number;
  extraHours: number;
  extraHourRate: number;
  startDate?: Date;
  endDate?: Date;
  totalTourDistance?: number;
  accommodationCharge: number;
  mealsCharge: number;
  activitiesCharge: number;
  otherCostsCharge: number;
}

const initialFields: CalculationFields = {
  startMeter: 0,
  endMeter: 0,
  hireRate: 0,
  waitingCharge: 0,
  gatePass: 0,
  packageCharge: 0,
  allowedKm: 0,
  extraKm: 0,
  extraHours: 0,
  extraHourRate: 0,
  startDate: undefined,
  endDate: undefined,
  totalTourDistance: 0,
  accommodationCharge: 0,
  mealsCharge: 0,
  activitiesCharge: 0,
  otherCostsCharge: 0,
};

export function useCalculationEngine(initialValues?: Partial<CalculationFields>): UseCalculationEngineReturn {
  const [fields, setFields] = useState<CalculationFields>({
    ...initialFields,
    ...initialValues,
  });

  // Calculate days for calculations (Inclusive Calendar Days)
  const days = useMemo(() => {
    if (!fields.startDate || !fields.endDate) return 1;
    const start = new Date(fields.startDate);
    const end = new Date(fields.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 1;
    
    // Calculate based on calendar dates, ignoring time
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    
    const diffMs = endDay.getTime() - startDay.getTime();
    const calendarDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
    
    return Math.max(1, calendarDays);
  }, [fields.startDate, fields.endDate]);

  // Calculate derived values
  const baseCharge = useMemo(() => {
    const distance = calculateDistance(fields.startMeter, fields.endMeter);
    
    // Priority 1: Use totalTourDistance if provided (Specific requirement for total tour mileage)
    if (fields.totalTourDistance && fields.totalTourDistance > 0) {
      const excessKm = fields.extraKm !== undefined && fields.extraKm !== 0 ? fields.extraKm : Math.max(0, distance - fields.totalTourDistance);
      return excessKm * fields.hireRate;
    }

    // Priority 2: Use allowedKm * days (Standard package mode)
    if (fields.allowedKm > 0 && fields.packageCharge > 0) {
      const totalAllowedKm = fields.allowedKm * days;
      const excessKm = fields.extraKm !== undefined && fields.extraKm !== 0 ? fields.extraKm : Math.max(0, distance - totalAllowedKm);
      return excessKm * fields.hireRate;
    }
    
    // Priority 3: Standard taxi mode (total distance * rate)
    return calculateBaseCharge(distance, fields.hireRate);
  }, [fields.startMeter, fields.endMeter, fields.hireRate, fields.allowedKm, fields.packageCharge, fields.totalTourDistance, days, fields.extraKm]);

  // Calculate derived values
  const distance = useMemo(() =>
    calculateDistance(fields.startMeter, fields.endMeter),
    [fields.startMeter, fields.endMeter]
  );

  const extraCharges = useMemo(() =>
    calculateExtraCharges(fields.waitingCharge, fields.gatePass, fields.packageCharge, fields.extraHours, fields.extraHourRate, fields.accommodationCharge, fields.mealsCharge, fields.activitiesCharge, fields.otherCostsCharge),
    [fields.waitingCharge, fields.gatePass, fields.packageCharge, fields.extraHours, fields.extraHourRate, fields.accommodationCharge, fields.mealsCharge, fields.activitiesCharge, fields.otherCostsCharge]
  );

  const totalAmount = useMemo(() => {
    const currentBaseCharge = baseCharge;
    // We already calculated baseCharge in its own useMemo, but calculateTotalAmount 
    // in calculations.ts has its own logic. To keep them in sync, we can pass extraKm 
    // if we want to override.
    
    const extraCharges = calculateExtraCharges(fields.waitingCharge, fields.gatePass, fields.packageCharge, fields.extraHours, fields.extraHourRate, fields.accommodationCharge, fields.mealsCharge, fields.activitiesCharge, fields.otherCostsCharge);
    return currentBaseCharge + extraCharges;
  }, [baseCharge, fields.waitingCharge, fields.gatePass, fields.packageCharge, fields.extraHours, fields.extraHourRate, fields.accommodationCharge, fields.mealsCharge, fields.activitiesCharge, fields.otherCostsCharge]);

  // Formatted values
  const formattedTotalAmount = useMemo(() => formatCurrency(totalAmount), [totalAmount]);
  const formattedBaseCharge = useMemo(() => formatCurrency(baseCharge), [baseCharge]);
  const formattedExtraCharges = useMemo(() => formatCurrency(extraCharges), [extraCharges]);

  // Update field function
  const updateField = useCallback((field: string, value: number | Date | undefined) => {
    // Check if the field is a valid calculation field using the static initial object
    if (Object.prototype.hasOwnProperty.call(initialFields, field)) {
      setFields(prev => ({
        ...prev,
        [field]: field.toLowerCase().includes('date') ? value : Math.max(0, typeof value === 'number' ? value : 0),
      }));
    }
  }, []);

  // Reset function
  const resetCalculations = useCallback(() => {
    setFields(initialFields);
  }, []);

  return {
    totalAmount,
    distance,
    baseCharge,
    extraCharges,
    formattedTotalAmount,
    formattedBaseCharge,
    formattedExtraCharges,
    updateField,
    resetCalculations,
    fields,
    days,
  };
}