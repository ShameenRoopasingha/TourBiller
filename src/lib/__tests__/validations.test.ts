import {
  BillSchema,
  CustomerSchema,
  VehicleSchema,
  BookingSchema,
} from '@/lib/validations';

describe('BillSchema', () => {
  const validBill = {
    vehicleNo: 'CAB-1234',
    customerName: 'John Doe',
    route: 'Colombo - Kandy',
    startMeter: 1000,
    endMeter: 1250,
    hireRate: 50,
    waitingCharge: 0,
    gatePass: 0,
    packageCharge: 0,
    advanceAmount: 0,
    allowedKm: 0,
    currency: 'LKR',
    exchangeRate: 1,
    paymentMethod: 'CASH',
  };

  it('accepts valid bill data', () => {
    const result = BillSchema.safeParse(validBill);
    expect(result.success).toBe(true);
  });

  it('rejects missing vehicleNo', () => {
    const result = BillSchema.safeParse({ ...validBill, vehicleNo: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing customerName', () => {
    const result = BillSchema.safeParse({ ...validBill, customerName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects endMeter less than startMeter', () => {
    const result = BillSchema.safeParse({
      ...validBill,
      startMeter: 500,
      endMeter: 400,
    });
    expect(result.success).toBe(false);
  });

  it('rejects endMeter equal to startMeter (zero distance is invalid)', () => {
    const result = BillSchema.safeParse({
      ...validBill,
      startMeter: 500,
      endMeter: 500,
    });
    expect(result.success).toBe(false);
  });

  it('coerces string numbers to numbers', () => {
    const result = BillSchema.safeParse({
      ...validBill,
      startMeter: '100',
      endMeter: '200',
      hireRate: '50',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startMeter).toBe(100);
      expect(result.data.endMeter).toBe(200);
      expect(result.data.hireRate).toBe(50);
    }
  });
});

describe('CustomerSchema', () => {
  it('accepts valid customer data', () => {
    const result = CustomerSchema.safeParse({
      name: 'John Doe',
      mobile: '0771234567',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = CustomerSchema.safeParse({
      name: '',
      mobile: '0771234567',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional email and address', () => {
    const result = CustomerSchema.safeParse({
      name: 'John',
      mobile: '077',
      email: 'john@example.com',
      address: '123 Main St',
    });
    expect(result.success).toBe(true);
  });
});

describe('VehicleSchema', () => {
  const validVehicle = {
    vehicleNo: 'CAB-1234',
    category: 'CAR',
    status: 'AVAILABLE',
    ratePerDay: 5000,
    kmPerDay: 100,
    excessKmRate: 40,
    extraHourRate: 500,
  };

  it('accepts valid vehicle data', () => {
    const result = VehicleSchema.safeParse(validVehicle);
    expect(result.success).toBe(true);
  });

  it('rejects empty vehicleNo', () => {
    const result = VehicleSchema.safeParse({ ...validVehicle, vehicleNo: '' });
    expect(result.success).toBe(false);
  });

  it('rejects negative rates', () => {
    const result = VehicleSchema.safeParse({ ...validVehicle, ratePerDay: -100 });
    expect(result.success).toBe(false);
  });
});

describe('BookingSchema', () => {
  const validBooking = {
    vehicleNo: 'CAB-1234',
    customerName: 'John',
    startDate: new Date('2026-04-01'),
    status: 'CONFIRMED',
    advanceAmount: 5000,
  };

  it('accepts valid booking data', () => {
    const result = BookingSchema.safeParse(validBooking);
    expect(result.success).toBe(true);
  });

  it('accepts booking without endDate', () => {
    const result = BookingSchema.safeParse(validBooking);
    expect(result.success).toBe(true);
  });

  it('rejects endDate before startDate', () => {
    const result = BookingSchema.safeParse({
      ...validBooking,
      endDate: new Date('2026-03-01'), // Before startDate
    });
    expect(result.success).toBe(false);
  });

  it('accepts endDate equal to startDate', () => {
    const result = BookingSchema.safeParse({
      ...validBooking,
      endDate: new Date('2026-04-01'),
    });
    expect(result.success).toBe(true);
  });

  it('accepts endDate after startDate', () => {
    const result = BookingSchema.safeParse({
      ...validBooking,
      endDate: new Date('2026-04-05'),
    });
    expect(result.success).toBe(true);
  });
});
