import {
  calculateDistance,
  calculateBaseCharge,
  calculateTotalAmount,
  formatCurrency,
  calculateExtraCharges,
  calculateBalance,
} from '@/lib/calculations';

describe('calculateDistance', () => {
  it('returns correct distance for valid meter readings', () => {
    expect(calculateDistance(100, 250)).toBe(150);
  });

  it('returns 0 when endMeter equals startMeter', () => {
    expect(calculateDistance(100, 100)).toBe(0);
  });

  it('returns 0 when endMeter is less than startMeter', () => {
    expect(calculateDistance(250, 100)).toBe(0);
  });

  it('handles large distances', () => {
    expect(calculateDistance(0, 999999)).toBe(999999);
  });

  it('handles decimal meter readings', () => {
    expect(calculateDistance(100.5, 200.7)).toBeCloseTo(100.2);
  });
});

describe('calculateBaseCharge', () => {
  it('calculates correctly for standard rates', () => {
    expect(calculateBaseCharge(100, 50)).toBe(5000);
  });

  it('returns 0 for zero distance', () => {
    expect(calculateBaseCharge(0, 50)).toBe(0);
  });

  it('returns 0 for zero rate', () => {
    expect(calculateBaseCharge(100, 0)).toBe(0);
  });
});

describe('calculateTotalAmount', () => {
  describe('Standard Mode (no package)', () => {
    it('calculates total with distance * rate + extras', () => {
      // 100km * Rs.50/km + Rs.500 waiting + Rs.200 gate + Rs.0 package
      const total = calculateTotalAmount(100, 200, 50, 500, 200, 0, 0);
      expect(total).toBe(5700); // 5000 + 500 + 200
    });

    it('handles zero extras', () => {
      const total = calculateTotalAmount(0, 100, 50);
      expect(total).toBe(5000);
    });

    it('returns 0 when no distance traveled', () => {
      const total = calculateTotalAmount(100, 100, 50);
      expect(total).toBe(0);
    });
  });

  describe('Package Mode (allowedKm + packageCharge)', () => {
    it('charges only excess km beyond allowedKm', () => {
      // 150km total, 100km allowed, Rs.40/excess-km, Rs.5000 package
      const total = calculateTotalAmount(0, 150, 40, 0, 0, 5000, 100);
      // Excess = 50km * 40 = 2000 + package 5000 = 7000
      expect(total).toBe(7000);
    });

    it('charges only package when within allowedKm', () => {
      // 80km total, 100km allowed → no excess
      const total = calculateTotalAmount(0, 80, 40, 0, 0, 5000, 100);
      expect(total).toBe(5000); // Just the package charge
    });

    it('charges only package when exactly at allowedKm', () => {
      const total = calculateTotalAmount(0, 100, 40, 0, 0, 5000, 100);
      expect(total).toBe(5000);
    });

    it('includes waiting and gate pass on top of package', () => {
      const total = calculateTotalAmount(0, 150, 40, 300, 200, 5000, 100);
      // Excess: 50*40 = 2000. Extras: 300+200+5000 = 5500. Total: 7500
      expect(total).toBe(7500);
    });
  });
});

describe('formatCurrency', () => {
  it('formats whole numbers with 2 decimal places', () => {
    expect(formatCurrency(5000)).toBe('Rs. 5,000.00');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('Rs. 0.00');
  });

  it('formats decimal amounts', () => {
    expect(formatCurrency(1234.56)).toBe('Rs. 1,234.56');
  });

  it('formats large amounts with commas', () => {
    expect(formatCurrency(1000000)).toBe('Rs. 1,000,000.00');
  });
});

describe('calculateExtraCharges', () => {
  it('sums all extra charges', () => {
    expect(calculateExtraCharges(500, 200, 3000)).toBe(3700);
  });

  it('returns 0 with no charges', () => {
    expect(calculateExtraCharges()).toBe(0);
  });
});

describe('calculateBalance', () => {
  it('returns balance due after advance', () => {
    expect(calculateBalance(10000, 3000)).toBe(7000);
  });

  it('returns 0 when advance covers total', () => {
    expect(calculateBalance(5000, 5000)).toBe(0);
  });

  it('returns 0 when advance exceeds total (no negative balance)', () => {
    expect(calculateBalance(5000, 8000)).toBe(0);
  });
});
