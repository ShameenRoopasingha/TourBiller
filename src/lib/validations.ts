import { z } from "zod";

// Bill validation schema
export const BillSchema = z.object({
  vehicleNo: z.string().min(1, "Vehicle number is required"),
  customerName: z.string().min(1, "Customer name is required"),
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
  model: z.string().optional(),
  category: z.string().default("CAR"),
  status: z.string().default("ACTIVE"),
  defaultRate: z.coerce.number().min(0).default(0),
  excessKmRate: z.coerce.number().min(0).default(0),
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
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal('')),
  website: z.string().optional(),
  logoUrl: z.string().optional().or(z.literal('')),
  usdRate: z.coerce.number().min(0).default(300),
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
  mobile: z.string().min(1, "Mobile number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal('')),
  address: z.string().optional(),
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
  endDate: z.coerce.date().optional(),
  destination: z.string().optional(),
  status: z.string().default("CONFIRMED"),
  advanceAmount: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
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
  description: z.string().optional(),
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
  description: z.string().optional(),
  days: z.coerce.number().min(1, "Must have at least 1 day"),
  basePricePerPerson: z.coerce.number().min(0).default(0),
  vehicleCategory: z.string().default("CAR"),
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
  customerEmail: z.string().email("Invalid email").optional().or(z.literal('')).transform(v => v || undefined),
  customerPhone: z.string().optional(),
  vehicleNo: z.string().optional(),
  numberOfPersons: z.coerce.number().min(1).default(1),
  startDate: z.coerce.date().optional(),
  hireRatePerKm: z.coerce.number().min(0).default(0),
  markup: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  validUntil: z.coerce.date().optional(),
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
