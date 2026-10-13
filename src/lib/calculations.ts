/**
 * Calculate the distance between start and end meter readings
 */
export function calculateDistance(startMeter: number, endMeter: number): number {
  if (endMeter <= startMeter) return 0;
  return endMeter - startMeter;
}

/**
 * Calculate the base charge based on distance and hire rate
 */
export function calculateBaseCharge(distance: number, hireRate: number): number {
  return distance * hireRate;
}

/**
 * Calculate the total amount for a bill
 * Formula: ((endMeter - startMeter) * hireRate) + waitingCharge + gatePass + packageCharge
 */
export function calculateTotalAmount(
  startMeter: number,
  endMeter: number,
  hireRate: number,
  waitingCharge: number = 0,
  gatePass: number = 0,
  packageCharge: number = 0,
  allowedKm: number = 0,
  extraHours: number = 0,
  extraHourRate: number = 0,
  days: number = 1,
  extraKm?: number,
  accommodationCharge: number = 0,
  mealsCharge: number = 0,
  activitiesCharge: number = 0,
  otherCostsCharge: number = 0
): number {
  const distance = calculateDistance(startMeter, endMeter);

  let baseCharge = 0;
  if (allowedKm > 0 && packageCharge > 0) {
    // Package Mode: Only charge for Excess Km
    const totalAllowedKm = allowedKm * Math.max(1, days);
    const excessKm = extraKm !== undefined ? extraKm : Math.max(0, distance - totalAllowedKm);
    baseCharge = excessKm * hireRate;
  } else {
    // Standard Mode: Charge for all Km (Taxi style)
    baseCharge = distance * hireRate;
  }

  const extraCharges = waitingCharge + gatePass + packageCharge + (extraHours * extraHourRate) +
    accommodationCharge + mealsCharge + activitiesCharge + otherCostsCharge;

  return baseCharge + extraCharges;
}

/**
 * Format a number as currency (supports LKR, USD, EUR, GBP, AUD, CAD)
 */
export function formatCurrency(amount: number, currency: string = 'LKR'): string {
  const code = (currency || 'LKR').toUpperCase().trim();
  const formattedNumber = (amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  switch (code) {
    case 'USD':
    case '$':
      return '$' + formattedNumber;
    case 'EUR':
    case '€':
      return '€' + formattedNumber;
    case 'GBP':
    case '£':
      return '£' + formattedNumber;
    case 'AUD':
      return 'A$' + formattedNumber;
    case 'CAD':
      return 'C$' + formattedNumber;
    case 'LKR':
    case 'RS':
    case 'RS.':
    default:
      return 'Rs. ' + formattedNumber;
  }
}

/**
 * Calculate extra charges total
 */
export function calculateExtraCharges(
  waitingCharge: number = 0,
  gatePass: number = 0,
  packageCharge: number = 0,
  extraHours: number = 0,
  extraHourRate: number = 0,
  accommodationCharge: number = 0,
  mealsCharge: number = 0,
  activitiesCharge: number = 0,
  otherCostsCharge: number = 0
): number {
  return waitingCharge + gatePass + packageCharge + (extraHours * extraHourRate) +
    accommodationCharge + mealsCharge + activitiesCharge + otherCostsCharge;
}

/**
 * Calculate balance due (Total - Advance)
 */
export function calculateBalance(totalAmount: number, advanceAmount: number): number {
  return Math.max(0, totalAmount - advanceAmount);
}