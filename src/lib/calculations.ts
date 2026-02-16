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
  allowedKm: number = 0
): number {
  const distance = calculateDistance(startMeter, endMeter);

  let baseCharge = 0;
  if (allowedKm > 0 && packageCharge > 0) {
    // Package Mode: Only charge for Excess Km
    const excessKm = Math.max(0, distance - allowedKm);
    baseCharge = excessKm * hireRate;
  } else {
    // Standard Mode: Charge for all Km (Taxi style)
    baseCharge = distance * hireRate;
  }

  const extraCharges = waitingCharge + gatePass + packageCharge;

  return baseCharge + extraCharges;
}

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number): string {
  // Using explicit Rs. prefix as it's cleaner than the standard LKR symbol for receipts
  return 'Rs. ' + amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Calculate extra charges total
 */
export function calculateExtraCharges(
  waitingCharge: number = 0,
  gatePass: number = 0,
  packageCharge: number = 0
): number {
  return waitingCharge + gatePass + packageCharge;
}

/**
 * Calculate balance due (Total - Advance)
 */
export function calculateBalance(totalAmount: number, advanceAmount: number): number {
  return Math.max(0, totalAmount - advanceAmount);
}