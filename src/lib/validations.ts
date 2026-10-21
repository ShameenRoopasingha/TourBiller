import { z } from "zod";

// ============================================
// React Hook Form Compatible Form Schemas
// These schemas avoid .nullish() which produces T | null | undefined
// and handle dates to avoid unknown type issues
// ============================================

// ============================================
// Shared Types and Interfaces
// ============================================

export interface VehicleAvailabilityConflict {
  type: 'Bill' | 'Booking' | 'Quotation';
  id: string;
  reference: string;
  customer: string;
  start: Date;
  end: Date;
}

export interface DriverAvailabilityConflict {
  type: 'Booking' | 'Quotation';
  id: string;
  reference: string;
  customer: string;
  start: Date;
  end: Date;
}

// Customer form schema - RHF compatible
export const CustomerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z.string().default(''),
  email: z.string().email("Invalid email").or(z.literal('')).default(''),
  address: z.string().default(''),
});

export type CustomerFormInput = z.infer<typeof CustomerFormSchema>;

export const VehicleCategoryEnum = z.enum([
  'CAR',
  'VAN',
  'SUV',
  'BUS',
  'LORRY',
  'THREE_WHEELER',
]);
export type VehicleCategory = z.infer<typeof VehicleCategoryEnum>;

export const normalizeVehicleCategory = (val: unknown): VehicleCategory => {
  if (typeof val === 'string') {
    const upper = val.trim().toUpperCase().replace(/[\s-]+/g, '_');
    if (upper === 'CAR' || upper === 'VAN' || upper === 'SUV' || upper === 'BUS' || upper === 'LORRY' || upper === 'THREE_WHEELER') {
      return upper as VehicleCategory;
    }
  }
  return 'CAR';
};

// Vehicle form schema - RHF compatible
export const VehicleFormSchema = z.object({
  vehicleNo: z.string().min(1, "Vehicle number is required"),
  model: z.string().default(''),
  category: z.preprocess(normalizeVehicleCategory, VehicleCategoryEnum).default("CAR"),
  status: z.string().default("ACTIVE"),
  ratePerDay: z.coerce.number().min(0).default(0),
  kmPerDay: z.coerce.number().min(0).default(0),
  excessKmRate: z.coerce.number().min(0).default(0),
  extraHourRate: z.coerce.number().min(0).default(0),
  seats: z.coerce.number().min(0).default(0),
  acType: z.string().default(''),
  features: z.string().default(''),
  insuranceCoverage: z.string().default(''),
  insuranceExpiry: z.string().default(''),
  revenueLicenseExpiry: z.string().default(''),
  currentMileage: z.coerce.number().min(0).default(0),
  oilChangeInterval: z.coerce.number().min(0).default(5000),
  lastOilChangeMileage: z.coerce.number().min(0).default(0),
  filterChangeInterval: z.coerce.number().min(0).default(10000),
  lastFilterChangeMileage: z.coerce.number().min(0).default(0),
  washInterval: z.coerce.number().min(0).default(1000),
  lastWashMileage: z.coerce.number().min(0).default(0),
  serviceCost: z.coerce.number().min(0).default(0),
  annualInsuranceCost: z.coerce.number().min(0).default(0),
  fuelEfficiency: z.coerce.number().min(0).default(0),
  tyreCost: z.coerce.number().min(0).default(0),
  tyreLifespan: z.coerce.number().min(0).default(40000),
});

export type VehicleFormInput = z.infer<typeof VehicleFormSchema>;

// Bill form schema - RHF compatible
export const BillFormSchema = z.object({
  vehicleNo: z.string().min(1, "Vehicle number is required"),
  customerName: z.string().min(1, "Customer name is required"),
  customerAddress: z.string().optional().default(''),
  route: z.string().min(1, "Route is required"),
  startMeter: z.coerce.number().min(0, "Start meter must be positive"),
  endMeter: z.coerce.number().min(0, "End meter must be positive"),
  hireRate: z.coerce.number().min(0, "Hire rate must be positive"),
  allowedKm: z.coerce.number().min(0, "Allowed Km must be positive").default(0),
  waitingCharge: z.coerce.number().min(0, "Waiting charge must be positive").default(0),
  gatePass: z.coerce.number().min(0, "Gate pass must be positive").default(0),
  packageCharge: z.coerce.number().min(0, "Package charge must be positive").default(0),
  advanceAmount: z.coerce.number().min(0, "Advance amount must be positive").default(0),
  currency: z.string().default("LKR"),
  exchangeRate: z.coerce.number().min(0).default(1),
  paymentMethod: z.enum(["CASH", "CREDIT"]).default("CASH"),
  startDate: z.coerce.date().default(() => new Date()),
  endDate: z.coerce.date().default(() => new Date()),
  extraHours: z.coerce.number().min(0).default(0),
  extraHourRate: z.coerce.number().min(0).default(0),
  extraKm: z.coerce.number().min(0).default(0),
  scheduledDays: z.coerce.number().min(1).default(1),
  accommodationCharge: z.coerce.number().min(0).default(0),
  mealsCharge: z.coerce.number().min(0).default(0),
  activitiesCharge: z.coerce.number().min(0).default(0),
  otherCostsCharge: z.coerce.number().min(0).default(0),
}).refine(data => data.endMeter > data.startMeter, {
  message: "End meter must be greater than start meter",
  path: ["endMeter"]
});

export type BillFormInput = z.infer<typeof BillFormSchema>;

// Booking form schema - RHF compatible
export const BookingFormSchema = z.object({
  vehicleNo: z.string().min(1, "Vehicle number is required"),
  customerName: z.string().min(1, "Customer name is required"),
  startDate: z.coerce.date().default(() => new Date()),
  endDate: z.coerce.date().optional(),
  destination: z.string().default(''),
  status: z.string().default("CONFIRMED"),
  advanceAmount: z.coerce.number().min(0).default(0),
  notes: z.string().optional().default(''),
  driverId: z.string().optional().default(''),
}).refine(data => !data.endDate || data.endDate >= data.startDate, {
  message: "End date must be after or equal to start date",
  path: ["endDate"]
});

export type BookingFormInput = z.infer<typeof BookingFormSchema>;

// Tour Schedule form schema - RHF compatible
// Note: items schema is defined inline to avoid forward reference issues
const TourScheduleDayItemFormSchema = z.object({
  dayNumber: z.coerce.number().min(1, "Day number must be at least 1"),
  title: z.string().min(1, "Day title is required"),
  description: z.string().default(''),
  distanceKm: z.coerce.number().min(0).default(0),
  accommodation: z.coerce.number().min(0).default(0),
  meals: z.coerce.number().min(0).default(0),
  activities: z.coerce.number().min(0).default(0),
  otherCosts: z.coerce.number().min(0).default(0),
});

export const TourScheduleFormSchema = z.object({
  name: z.string().min(1, "Tour name is required"),
  description: z.string().default(''),
  days: z.coerce.number().min(1, "Must have at least 1 day"),
  basePricePerPerson: z.coerce.number().min(0).default(0),
  vehicleCategory: z.preprocess(normalizeVehicleCategory, VehicleCategoryEnum).default("CAR"),
  vehicleNo: z.string().default(''),
  ratePerDay: z.coerce.number().min(0).default(0),
  kmPerDay: z.coerce.number().min(0).default(0),
  seats: z.coerce.number().min(0).default(0),
  excessKmRate: z.coerce.number().min(0).optional(),
  extraHourRate: z.coerce.number().min(0).optional(),
  waitingCharge: z.coerce.number().min(0).default(0),
  gatePass: z.coerce.number().min(0).default(0),
  isActive: z.boolean().default(true),
  items: z.array(TourScheduleDayItemFormSchema).min(1, "At least one day item is required"),
});

export type TourScheduleFormInput = z.infer<typeof TourScheduleFormSchema>;

// Quotation form schema - RHF compatible
export const QuotationFormSchema = z.object({
  tourScheduleId: z.string().optional().default(""),
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Invalid email").or(z.literal('')).default(''),
  customerPhone: z.string().default(''),
  vehicleNo: z.string().default(''),
  pickupLocation: z.string().default(''),
  dropLocation: z.string().default(''),
  numberOfPersons: z.coerce.number().min(1).default(1),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  hireRatePerDay: z.coerce.number().min(0).default(0),
  kmPerDay: z.coerce.number().min(0).default(0),
  totalDistance: z.coerce.number().min(0).default(0),
  excessKmRate: z.coerce.number().min(0).default(0),
  extraHourRate: z.coerce.number().min(0).default(0),
  markup: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  driverCostPerDay: z.coerce.number().min(0).default(0),
  advanceAmount: z.coerce.number().min(0).default(0),
  excludedItems: z.string().default(''),
  notes: z.string().default(''),
  validUntil: z.coerce.date().optional(),
  status: z.string().default('DRAFT'),
  driverId: z.string().optional().default(''),
});

export type QuotationFormInput = z.infer<typeof QuotationFormSchema>;

// Vehicle Expense form schema - RHF compatible
export const VehicleExpenseCategoryEnum = z.enum([
  'REPAIR',
  'BREAKDOWN',
  'FUEL',
  'SERVICE',
  'OIL_CHANGE',
  'FILTER_CHANGE',
  'BODY_WASH',
  'TYRE',
  'INSURANCE',
  'DRIVER',
  'OTHER',
]);
export type VehicleExpenseCategory = z.infer<typeof VehicleExpenseCategoryEnum>;

export const VehicleExpenseFormSchema = z.object({
  vehicleNo: z.string().min(1, "Vehicle number is required"),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  category: VehicleExpenseCategoryEnum,
  description: z.string().default(''),
  date: z.coerce.date().default(() => new Date()),
  bookingId: z.string().optional().default(''),
  driverId: z.string().optional().default(''),
  expenseType: z.string().default('COMPANY'),
});

export type VehicleExpenseFormInput = z.infer<typeof VehicleExpenseFormSchema>;
export type VehicleExpenseFormData = VehicleExpenseFormInput; // Alias for backward compatibility

// Safe URL validator against XSS/javascript pseudo-protocol
export const isSafeUrl = (url?: string | null) => {
  if (!url) return true;
  const trimmed = url.trim().toLowerCase();
  return !trimmed.startsWith('javascript:') && !trimmed.startsWith('vbscript:') && !trimmed.startsWith('data:text/html');
};

// Business Profile form schema - RHF compatible
export const BusinessProfileFormSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  address: z.string().default(''),
  phone: z.string().default(''),
  email: z.string().email("Invalid email").or(z.literal('')).default(''),
  website: z.string().refine(isSafeUrl, "Unsafe URL protocol not allowed").default(''),
  logoUrl: z.string().refine(isSafeUrl, "Unsafe URL protocol not allowed").default(''),
  usdRate: z.coerce.number().min(0).default(300),
  currency: z.string().default('LKR'),
  currencyConfigured: z.boolean().default(false),
  countryCode: z.string().default('lk'),
  countryName: z.string().default('Sri Lanka'),
  bankName: z.string().default(''),
  bankBranch: z.string().default(''),
  bankAccountNo: z.string().default(''),
  bankAccountName: z.string().default(''),
});

export type BusinessProfileFormInput = z.infer<typeof BusinessProfileFormSchema>;

// ============================================
// Original Database/Server Validation Schemas
// ============================================

// Bill validation schema
export const BillSchema = z.object({
  vehicleNo: z.string().min(1, "Vehicle number is required"),
  customerName: z.string().min(1, "Customer name is required"),
  customerAddress: z.string().nullish().transform(v => v ?? undefined),
  customerPhone: z.string().nullish().transform(v => v ?? undefined),
  route: z.string().min(1, "Route is required"),
  startMeter: z.coerce.number().min(0, "Start meter must be positive"),
  endMeter: z.coerce.number().min(0, "End meter must be positive"),
  hireRate: z.coerce.number().min(0, "Hire rate must be positive"),
  allowedKm: z.coerce.number().min(0, "Allowed Km must be positive").default(0),
  waitingCharge: z.coerce.number().min(0, "Waiting charge must be positive").default(0),
  gatePass: z.coerce.number().min(0, "Gate pass must be positive").default(0),
  packageCharge: z.coerce.number().min(0, "Package charge must be positive").default(0),
  advanceAmount: z.coerce.number().min(0, "Advance amount must be positive").default(0),
  currency: z.string().default("LKR"),
  exchangeRate: z.coerce.number().min(0).default(1),
  paymentMethod: z.enum(["CASH", "CREDIT"]).default("CASH"),
  startDate: z.coerce.date().default(() => new Date()),
  endDate: z.coerce.date().default(() => new Date()),
  extraHours: z.coerce.number().min(0).default(0),
  extraHourRate: z.coerce.number().min(0).default(0),
  extraKm: z.coerce.number().min(0).default(0),
  scheduledDays: z.coerce.number().min(1).default(1),
  accommodationCharge: z.coerce.number().min(0).default(0),
  mealsCharge: z.coerce.number().min(0).default(0),
  activitiesCharge: z.coerce.number().min(0).default(0),
  otherCostsCharge: z.coerce.number().min(0).default(0),
}).refine(data => data.endMeter > data.startMeter, {
  message: "End meter must be greater than start meter",
  path: ["endMeter"]
});

// Form data type
export type BillFormData = z.infer<typeof BillSchema>;

// Database bill type (includes generated fields)
export const BillDbSchema = BillSchema.extend({
  id: z.string(),
  billNumber: z.number(),
  vehicleId: z.string().nullable().optional(),
  routePolyline: z.any().optional(),
  totalAmount: z.number(),
  totalAmountLKR: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Bill = z.infer<typeof BillDbSchema>;

// Server action result type
export type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Vehicle validation schema
export const VehicleSchema = z.object({
  vehicleNo: z.string().min(1, "Vehicle number is required"),
  model: z.string().nullish().transform(v => v ?? undefined),
  category: z.preprocess(normalizeVehicleCategory, VehicleCategoryEnum).default("CAR"),
  status: z.string().default("ACTIVE"),
  ratePerDay: z.coerce.number().min(0).default(0),
  kmPerDay: z.coerce.number().min(0).default(0),
  excessKmRate: z.coerce.number().min(0).default(0),
  extraHourRate: z.coerce.number().min(0).default(0),
  seats: z.coerce.number().min(0).nullish().transform(v => v ?? undefined),
  acType: z.string().nullish().transform(v => v ?? undefined),
  features: z.string().nullish().transform(v => v ?? undefined),
  insuranceCoverage: z.string().nullish().transform(v => v ?? undefined),
  insuranceExpiry: z.coerce.date().nullish().transform(v => v ?? undefined),
  revenueLicenseExpiry: z.coerce.date().nullish().transform(v => v ?? undefined),
  currentMileage: z.coerce.number().min(0).default(0),
  oilChangeInterval: z.coerce.number().min(0).default(5000),
  lastOilChangeMileage: z.coerce.number().min(0).default(0),
  filterChangeInterval: z.coerce.number().min(0).default(10000),
  lastFilterChangeMileage: z.coerce.number().min(0).default(0),
  washInterval: z.coerce.number().min(0).default(1000),
  lastWashMileage: z.coerce.number().min(0).default(0),
  serviceCost: z.coerce.number().min(0).default(0),
  annualInsuranceCost: z.coerce.number().min(0).default(0),
  fuelEfficiency: z.coerce.number().min(0).default(0),
  tyreCost: z.coerce.number().min(0).default(0),
  tyreLifespan: z.coerce.number().min(0).default(40000),
});

export type VehicleFormData = z.infer<typeof VehicleSchema>;

export const VehicleDbSchema = VehicleSchema.extend({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});


export type Vehicle = z.infer<typeof VehicleDbSchema>;

// Business Profile validation schema
export const BusinessProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  address: z.string().nullish().transform(v => v ?? undefined),
  phone: z.string().nullish().transform(v => v ?? undefined),
  email: z.string().email("Invalid email").nullish().or(z.literal('')).transform(v => v || undefined),
  website: z.string().refine(isSafeUrl, "Unsafe URL protocol not allowed").nullish().transform(v => v ?? undefined),
  logoUrl: z.string().refine(isSafeUrl, "Unsafe URL protocol not allowed").nullish().or(z.literal('')).transform(v => v || undefined),
  usdRate: z.coerce.number().min(0).default(300),
  currency: z.string().default('LKR'),
  currencyConfigured: z.boolean().default(false),
  countryCode: z.string().nullish().default('lk').transform(v => v ?? 'lk'),
  countryName: z.string().nullish().default('Sri Lanka').transform(v => v ?? 'Sri Lanka'),
  bankName: z.string().nullish().transform(v => v ?? undefined),
  bankBranch: z.string().nullish().transform(v => v ?? undefined),
  bankAccountNo: z.string().nullish().transform(v => v ?? undefined),
  bankAccountName: z.string().nullish().transform(v => v ?? undefined),
});

export type BusinessProfileFormData = z.infer<typeof BusinessProfileSchema>;

export const BusinessProfileDbSchema = BusinessProfileSchema.extend({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BusinessProfile = z.infer<typeof BusinessProfileDbSchema>;

// Customer validation schema
export const CustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z.string().min(1, "Mobile number is required").nullish().transform(v => v ?? undefined),
  email: z.string().email("Invalid email").nullish().or(z.literal('')).transform(v => v || undefined),
  address: z.string().nullish().transform(v => v ?? undefined),
});

export type CustomerFormData = z.infer<typeof CustomerSchema>;

export const CustomerDbSchema = CustomerSchema.extend({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Customer = z.infer<typeof CustomerDbSchema>;

// Booking validation schema
export const BookingSchema = z.object({
  vehicleId: z.string().nullish().transform(v => v ?? undefined),
  vehicleNo: z.string().min(1, "Vehicle number is required"),
  customerName: z.string().min(1, "Customer name is required"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullish().transform(v => v ?? undefined),
  destination: z.string().nullish().transform(v => v ?? undefined),
  status: z.string().default("CONFIRMED"),
  advanceAmount: z.coerce.number().min(0).default(0),
  notes: z.string().nullish().transform(v => v ?? undefined),
  driverId: z.string().nullish().transform(v => v ?? undefined),
  isEmergencyActive: z.boolean().default(false),
  emergencyReason: z.string().nullable().optional(),
  emergencyTriggeredAt: z.coerce.date().nullable().optional(),
  emergencyAcknowledgedAt: z.coerce.date().nullable().optional(),
  emergencyAcknowledgedById: z.string().nullable().optional(),
  isExternalVehicle: z.boolean().default(false),
  externalVehicleNo: z.string().nullable().optional(),
  supplierName: z.string().nullable().optional(),
  supplierContact: z.string().nullable().optional(),
  supplierNegotiatedCost: z.coerce.number().min(0).default(0),
  routePolyline: z.any().optional(),
}).refine(data => !data.endDate || data.endDate >= data.startDate, {
  message: "End date must be after or equal to start date",
  path: ["endDate"]
});

export type BookingFormData = z.infer<typeof BookingSchema>;

export const BookingDbSchema = BookingSchema.extend({
  id: z.string(),
  refundStatus: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Booking = z.infer<typeof BookingDbSchema>;

export type BookingWithDriver = Booking & {
  driver?: {
    id: string;
    name: string;
    email: string;
  } | null;
  tripActivities?: {
    id: string;
    type: string;
    note: string | null;
    timestamp: Date | string;
    driver?: {
      name: string;
    } | null;
  }[];
};

// Tour Schedule Day Item validation schema
export const TourScheduleDayItemSchema = z.object({
  dayNumber: z.coerce.number().min(1, "Day number must be at least 1"),
  title: z.string().min(1, "Day title is required"),
  description: z.string().nullish().transform(v => v ?? undefined),
  distanceKm: z.coerce.number().min(0).default(0),
  accommodation: z.coerce.number().min(0).default(0),
  meals: z.coerce.number().min(0).default(0),
  activities: z.coerce.number().min(0).default(0),
  otherCosts: z.coerce.number().min(0).default(0),
});

export type TourScheduleDayItemFormData = z.infer<typeof TourScheduleDayItemSchema>;

// Tour Schedule validation schema
export const TourScheduleSchema = z.object({
  name: z.string().min(1, "Tour name is required"),
  description: z.string().nullish().transform(v => v ?? undefined),
  days: z.coerce.number().min(1, "Must have at least 1 day"),
  basePricePerPerson: z.coerce.number().min(0).optional().default(0),
  vehicleCategory: z.preprocess(normalizeVehicleCategory, VehicleCategoryEnum).default("CAR"),
  vehicleNo: z.string().nullish().or(z.literal('')).transform(v => (v === '' || v === null) ? undefined : v),
  ratePerDay: z.coerce.number().min(0).default(0),
  kmPerDay: z.coerce.number().min(0).default(0),
  seats: z.coerce.number().min(0).default(0),
  excessKmRate: z.coerce.number().min(0).nullish().or(z.literal('')).transform(v => (v === '' || v === null) ? undefined : v),
  extraHourRate: z.coerce.number().min(0).nullish().or(z.literal('')).transform(v => (v === '' || v === null) ? undefined : v),
  waitingCharge: z.coerce.number().min(0).default(0),
  gatePass: z.coerce.number().min(0).default(0),
  isActive: z.boolean().default(true),
  items: z.array(TourScheduleDayItemSchema).min(1, "At least one day item is required"),
});

export type TourScheduleFormData = z.infer<typeof TourScheduleSchema>;

export const TourScheduleDbSchema = TourScheduleSchema.omit({ items: true }).extend({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TourSchedule = z.infer<typeof TourScheduleDbSchema>;

export const TourScheduleDayItemDbSchema = TourScheduleDayItemSchema.extend({
  id: z.string(),
  tourScheduleId: z.string(),
});

export type TourScheduleDayItem = z.infer<typeof TourScheduleDayItemDbSchema>;

// Quotation validation schema
export const QuotationSchema = z.object({
  vehicleId: z.string().nullish().transform(v => v ?? undefined),
  tourScheduleId: z.string().nullish().transform(v => v || undefined),
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Invalid email").nullish().or(z.literal('')).transform(v => v || undefined),
  customerPhone: z.string().nullish().transform(v => v ?? undefined),
  vehicleNo: z.string().nullish().transform(v => v ?? undefined),
  pickupLocation: z.string().nullish().transform(v => v ?? undefined),
  dropLocation: z.string().nullish().transform(v => v ?? undefined),
  numberOfPersons: z.coerce.number().min(1).default(1),
  startDate: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.date().nullable()).optional().transform(v => v ?? undefined),
  endDate: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.date().nullable()).optional().transform(v => v ?? undefined),
  hireRatePerDay: z.coerce.number().min(0).default(0),
  kmPerDay: z.coerce.number().min(0).default(0),
  totalDistance: z.coerce.number().min(0).default(0),
  excessKmRate: z.coerce.number().min(0).default(0),
  extraHourRate: z.coerce.number().min(0).default(0),
  markup: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  driverCostPerDay: z.coerce.number().min(0).default(0),
  advanceAmount: z.coerce.number().min(0).default(0),
  excludedItems: z.string().nullish().transform(v => v ?? undefined),
  notes: z.string().nullish().transform(v => v ?? undefined),
  validUntil: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.date().nullable()).optional().transform(v => v ?? undefined),
  status: z.string().optional().default('DRAFT'),
  driverId: z.string().nullish().transform(v => v ?? undefined),
});

export type QuotationFormData = z.infer<typeof QuotationSchema>;

export const QuotationDbSchema = QuotationSchema.extend({
  id: z.string(),
  quotationNumber: z.number(),
  vehicleId: z.string().nullable().optional(),
  totalDistance: z.number().default(0),
  transportCost: z.number().default(0),
  accommodationTotal: z.number().default(0),
  mealsTotal: z.number().default(0),
  activitiesTotal: z.number().default(0),
  otherCostsTotal: z.number().default(0),
  totalAmount: z.number().default(0),
  status: z.string().default("DRAFT"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Quotation = z.infer<typeof QuotationDbSchema>;

export type QuotationWithSchedule = Quotation & {
  tourSchedule: (TourSchedule & {
    items: TourScheduleDayItem[];
  }) | null;
  driver?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

// Vehicle Expense validation schema
export const VehicleExpenseSchema = VehicleExpenseFormSchema;

export const VehicleExpenseDbSchema = VehicleExpenseSchema.extend({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type VehicleExpense = z.infer<typeof VehicleExpenseDbSchema>;

export const TripActivityTypeEnum = z.enum([
  'START',
  'END',
  'HANDOVER_REQUESTED',
  'HANDOVER',
  'TAKEOVER',
  'FUEL_FILL',
  'FLAT_TIRE',
  'STOP',
  'HOTEL_CHECKIN',
  'RESUME',
  'BREAKDOWN',
  'BREAKDOWN_REPORTED',
  'VEHICLE_SWAPPED',
  'NOTE',
]);

export type TripActivityType = z.infer<typeof TripActivityTypeEnum>;

export interface TripActivity {
  id: string;
  bookingId: string;
  driverId: string;
  type: string;
  note: string | null;
  expenseId: string | null;
  timestamp: Date | string;
}

export const TripActivityLogSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  type: TripActivityTypeEnum,
  note: z.string().nullish().transform(v => v || undefined),
  expenseId: z.string().nullish().transform(v => v || undefined),
});

export type TripActivityLogInput = z.infer<typeof TripActivityLogSchema>;

// Emergency Vehicle Swap Schema
export const EmergencyVehicleSwapSchema = z.object({
  swapType: z.enum(['FLEET', 'EXTERNAL']),
  newVehicleNo: z.string().min(1, 'Replacement vehicle number is required'),
  breakdownMeterReading: z.string().min(1, 'Breakdown odometer reading is required'),
  newVehicleStartMeter: z.string().min(1, 'New vehicle initial odometer reading is required'),
  location: z.string().min(1, 'Breakdown location is required'),
  reason: z.string().min(1, 'Breakdown reason is required'),
  notes: z.string().optional(),
  supplierName: z.string().optional(),
  supplierPhone: z.string().optional(),
  hireCost: z.coerce.number().min(0).optional(),
  expenseType: z.enum(['COMPANY', 'CUSTOMER']).optional(),
  markOldVehicleMaintenance: z.boolean().optional(),
});

export type EmergencyVehicleSwapOptions = z.infer<typeof EmergencyVehicleSwapSchema>;

// User creation
export const UserCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'DRIVER', 'STAFF', 'MODERATOR', 'SUPERADMIN', 'OWNER']).or(z.string()).default('DRIVER'),
});

export type UserCreateInput = z.infer<typeof UserCreateSchema>;

// Profile update
export const ProfileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
});

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

// Password change
export const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export type PasswordChangeInput = z.infer<typeof PasswordChangeSchema>;

// Password reset request & confirm
export const PasswordResetRequestSchema = z.object({
  email: z.string().email('Valid email is required'),
});

export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;

export const PasswordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type PasswordResetConfirmInput = z.infer<typeof PasswordResetConfirmSchema>;

// Driver login
export const DriverLoginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export type DriverLoginInput = z.infer<typeof DriverLoginSchema>;

// Driver expense API
export const DriverExpenseApiSchema = z.object({
  vehicleNo: z.string().min(1, 'Vehicle number is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().nullish().transform(v => v || undefined),
  bookingId: z.string().nullish().transform(v => v || undefined),
  expenseType: z.enum(['COMPANY', 'CUSTOMER']).nullish().transform(v => v || 'COMPANY'),
});

export type DriverExpenseApiInput = z.infer<typeof DriverExpenseApiSchema>;

// Driver location schemas
export const DriverLocationPointSchema = z.object({
  lat: z.coerce.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
  lon: z.coerce.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
  heading: z.coerce.number().nullish().transform(v => v ?? null),
  speed: z.coerce.number().nullish().transform(v => v ?? null),
  accuracy: z.coerce.number().nullish().transform(v => v ?? null),
  battery: z.coerce.number().nullish().transform(v => v ?? null),
  timestamp: z.union([z.string(), z.number(), z.date()]).nullish().transform(v => (v ? new Date(v) : new Date())),
});

export const DriverLocationPingSchema = DriverLocationPointSchema.omit({ timestamp: true }).extend({
  bookingId: z.string().nullish().transform(v => v || null),
});

export const DriverLocationBatchSchema = z.object({
  bookingId: z.string().nullish().transform(v => v || null),
  batch: z.array(DriverLocationPointSchema).min(1, 'Batch points array cannot be empty'),
});

// Quotation status update
export const QuotationStatusUpdateSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'CONVERTED', 'EXPIRED']),
});

export type QuotationStatusUpdateInput = z.infer<typeof QuotationStatusUpdateSchema>;

// Company CSV / Excel import
export const CompanyImportSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  entityType: z.enum(['customers', 'vehicles'], {
    message: 'Unsupported entity type. Must be customers or vehicles',
  }),
  data: z.array(z.record(z.string(), z.any())).min(1, 'Data array must not be empty'),
});

export type CompanyImportInput = z.infer<typeof CompanyImportSchema>;

// Driver Tour Actions
export const DriverTourActionSchema = z.object({
  action: z.enum(['START_TRIP', 'END_TRIP', 'TAKEOVER', 'REQUEST_HANDOVER', 'REPORT_BREAKDOWN', 'ADD_ACTIVITY', 'CHANGE_ROUTE']),
  changeType: z.enum(['DETOUR', 'DESTINATION', 'ITINERARY']).nullish().transform(v => v || undefined),
  extraKm: z.union([z.string(), z.number()]).nullish().transform(v => (v !== undefined && v !== null && v !== '' ? Number(v) : undefined)),
  agreedByCustomer: z.boolean().optional(),
  note: z.string().nullish().transform(v => v || undefined),
  meterReading: z.union([z.string(), z.number()]).nullish().transform(v => (v !== undefined && v !== null ? String(v) : undefined)),
  reason: z.string().nullish().transform(v => v || undefined),
  location: z.string().nullish().transform(v => v || undefined),
  pickupLocation: z.string().nullish().transform(v => v || undefined),
  dropLocation: z.string().nullish().transform(v => v || undefined),
  destination: z.string().nullish().transform(v => v || undefined),
  stops: z.array(z.any()).nullish().transform(v => v || undefined),
  routePolyline: z.any().nullish().transform(v => v || undefined),
});

export type DriverTourActionInput = z.infer<typeof DriverTourActionSchema>;

// Mid-Tour Driver Handover Options
export const DriverHandoverOptionsSchema = z.object({
  reason: z.string().optional(),
  handoverMeterReading: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export type DriverHandoverOptions = z.infer<typeof DriverHandoverOptionsSchema>;



