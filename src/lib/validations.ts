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

// Customer form schema - RHF compatible
export const CustomerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z.string().default(''),
  email: z.string().email("Invalid email").or(z.literal('')).default(''),
  address: z.string().default(''),
});

export type CustomerFormInput = z.infer<typeof CustomerFormSchema>;

// Vehicle form schema - RHF compatible
export const VehicleFormSchema = z.object({
  vehicleNo: z.string().min(1, "Vehicle number is required"),
  model: z.string().default(''),
  category: z.string().default("CAR"),
  status: z.string().default("ACTIVE"),
  ratePerDay: z.coerce.number().min(0).default(0),
  kmPerDay: z.coerce.number().min(0).default(0),
  excessKmRate: z.coerce.number().min(0).default(0),
  extraHourRate: z.coerce.number().min(0).default(0),
  seats: z.coerce.number().min(0).default(0),
  acType: z.string().default(''),
  features: z.string().default(''),
  insuranceCoverage: z.string().default(''),
  currentMileage: z.coerce.number().min(0).default(0),
  oilChangeInterval: z.coerce.number().min(0).default(5000),
  lastOilChangeMileage: z.coerce.number().min(0).default(0),
  filterChangeInterval: z.coerce.number().min(0).default(10000),
  lastFilterChangeMileage: z.coerce.number().min(0).default(0),
  washInterval: z.coerce.number().min(0).default(1000),
  lastWashMileage: z.coerce.number().min(0).default(0),
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
  path: ["endDate"]
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
  vehicleCategory: z.string().default("CAR"),
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
  tourScheduleId: z.string().min(1, "Tour schedule is required"),
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
export const VehicleExpenseCategoryEnum = z.enum(['REPAIR', 'BREAKDOWN', 'FUEL', 'SERVICE', 'OIL_CHANGE', 'FILTER_CHANGE', 'BODY_WASH', 'OTHER']);
export type VehicleExpenseCategory = z.infer<typeof VehicleExpenseCategoryEnum>;

export const VehicleExpenseFormSchema = z.object({
  vehicleNo: z.string().min(1, "Vehicle number is required"),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  category: VehicleExpenseCategoryEnum,
  description: z.string().default(''),
  date: z.coerce.date().default(() => new Date()),
  bookingId: z.string().optional().default(''),
});

export type VehicleExpenseFormInput = z.infer<typeof VehicleExpenseFormSchema>;
export type VehicleExpenseFormData = VehicleExpenseFormInput; // Alias for backward compatibility

// Business Profile form schema - RHF compatible
export const BusinessProfileFormSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  address: z.string().default(''),
  phone: z.string().default(''),
  email: z.string().email("Invalid email").or(z.literal('')).default(''),
  website: z.string().default(''),
  logoUrl: z.string().default(''),
  usdRate: z.coerce.number().min(0).default(300),
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
  category: z.string().default("CAR"),
  status: z.string().default("ACTIVE"),
  ratePerDay: z.coerce.number().min(0).default(0),
  kmPerDay: z.coerce.number().min(0).default(0),
  excessKmRate: z.coerce.number().min(0).default(0),
  extraHourRate: z.coerce.number().min(0).default(0),
  seats: z.coerce.number().min(0).nullish().transform(v => v ?? undefined),
  acType: z.string().nullish().transform(v => v ?? undefined),
  features: z.string().nullish().transform(v => v ?? undefined),
  insuranceCoverage: z.string().nullish().transform(v => v ?? undefined),
  currentMileage: z.coerce.number().min(0).default(0),
  oilChangeInterval: z.coerce.number().min(0).default(5000),
  lastOilChangeMileage: z.coerce.number().min(0).default(0),
  filterChangeInterval: z.coerce.number().min(0).default(10000),
  lastFilterChangeMileage: z.coerce.number().min(0).default(0),
  washInterval: z.coerce.number().min(0).default(1000),
  lastWashMileage: z.coerce.number().min(0).default(0),
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
  website: z.string().nullish().transform(v => v ?? undefined),
  logoUrl: z.string().nullish().or(z.literal('')).transform(v => v || undefined),
  usdRate: z.coerce.number().min(0).default(300),
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
  vehicleNo: z.string().min(1, "Vehicle number is required"),
  customerName: z.string().min(1, "Customer name is required"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullish().transform(v => v ?? undefined),
  destination: z.string().nullish().transform(v => v ?? undefined),
  status: z.string().default("CONFIRMED"),
  advanceAmount: z.coerce.number().min(0).default(0),
  notes: z.string().nullish().transform(v => v ?? undefined),
  driverId: z.string().nullish().transform(v => v ?? undefined),
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
  vehicleCategory: z.string().default("CAR"),
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
  tourScheduleId: z.string().min(1, "Tour schedule is required"),
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
  tourSchedule: TourSchedule & {
    items: TourScheduleDayItem[];
  };
};

// Vehicle Expense validation schema
export const VehicleExpenseSchema = VehicleExpenseFormSchema;

export const VehicleExpenseDbSchema = VehicleExpenseSchema.extend({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type VehicleExpense = z.infer<typeof VehicleExpenseDbSchema>;
