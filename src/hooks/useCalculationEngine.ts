import { useState, useCallback, useMemo } from 'react';
import {
  calculateTotalAmount,
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
  updateField: (field: string, value: number) => void;
  resetCalculations: () => void;
  fields: CalculationFields;
}

interface CalculationFields {
  startMeter: number;
  endMeter: number;
  hireRate: number;
  waitingCharge: number;
  gatePass: number;
  packageCharge: number;
  allowedKm: number;
}

const initialFields: CalculationFields = {
  startMeter: 0,
  endMeter: 0,
  hireRate: 0,
  waitingCharge: 0,
  gatePass: 0,
  packageCharge: 0,
  allowedKm: 0,
};

export function useCalculationEngine(initialValues?: Partial<CalculationFields>): UseCalculationEngineReturn {
  const [fields, setFields] = useState<CalculationFields>({
    ...initialFields,
    ...initialValues,
  });

  // Calculate derived values
  const baseCharge = useMemo(() => {
    const distance = calculateDistance(fields.startMeter, fields.endMeter);
    if (fields.allowedKm > 0 && fields.packageCharge > 0) {
      const excessKm = Math.max(0, distance - fields.allowedKm);
      return excessKm * fields.hireRate;
    }
    return calculateBaseCharge(distance, fields.hireRate);
  }, [fields.startMeter, fields.endMeter, fields.hireRate, fields.allowedKm, fields.packageCharge]);

  // Calculate derived values
  const distance = useMemo(() =>
    calculateDistance(fields.startMeter, fields.endMeter),
    [fields.startMeter, fields.endMeter]
  );

  const extraCharges = useMemo(() =>
    calculateExtraCharges(fields.waitingCharge, fields.gatePass, fields.packageCharge),
    [fields.waitingCharge, fields.gatePass, fields.packageCharge]
  );

  const totalAmount = useMemo(() =>
    calculateTotalAmount(
      fields.startMeter,
      fields.endMeter,
      fields.hireRate,
      fields.waitingCharge,
      fields.gatePass,
      fields.packageCharge,
      fields.allowedKm
    ),
    [fields.startMeter, fields.endMeter, fields.hireRate, fields.waitingCharge, fields.gatePass, fields.packageCharge, fields.allowedKm]
  );

  // Formatted values
  const formattedTotalAmount = useMemo(() => formatCurrency(totalAmount), [totalAmount]);
  const formattedBaseCharge = useMemo(() => formatCurrency(baseCharge), [baseCharge]);
  const formattedExtraCharges = useMemo(() => formatCurrency(extraCharges), [extraCharges]);

  // Update field function
  const updateField = useCallback((field: string, value: number) => {
    // Check if the field is a valid calculation field using the static initial object
    if (Object.prototype.hasOwnProperty.call(initialFields, field)) {
      setFields(prev => ({
        ...prev,
        [field]: Math.max(0, value), // Ensure non-negative values
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
  };
}