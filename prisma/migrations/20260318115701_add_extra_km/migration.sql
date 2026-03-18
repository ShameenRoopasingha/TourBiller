-- AlterTable
ALTER TABLE "bills" ADD COLUMN     "advanceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "allowedKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'LKR',
ADD COLUMN     "customerAddress" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "extraHourRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "extraHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "extraKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "totalAmountLKR" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'ADMIN';

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "acType" TEXT,
ADD COLUMN     "excessKmRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "extraHourRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "features" TEXT,
ADD COLUMN     "insuranceCoverage" TEXT,
ADD COLUMN     "kmPerDay" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ratePerDay" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "seats" INTEGER;

-- CreateTable
CREATE TABLE "business_profile" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT 'My Transport Company',
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "usdRate" DOUBLE PRECISION NOT NULL DEFAULT 300.0,
    "logoUrl" TEXT,
    "bankName" TEXT,
    "bankBranch" TEXT,
    "bankAccountNo" TEXT,
    "bankAccountName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "vehicleNo" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "destination" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "notes" TEXT,
    "advanceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "refundStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_schedules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "days" INTEGER NOT NULL,
    "basePricePerPerson" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vehicleCategory" TEXT NOT NULL DEFAULT 'CAR',
    "excessKmRate" DOUBLE PRECISION,
    "extraHourRate" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tour_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_schedule_day_items" (
    "id" TEXT NOT NULL,
    "tourScheduleId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "distanceKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accommodation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "meals" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activities" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherCosts" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "tour_schedule_day_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL,
    "quotationNumber" SERIAL NOT NULL,
    "tourScheduleId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "vehicleNo" TEXT,
    "numberOfPersons" INTEGER NOT NULL DEFAULT 1,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "pickupLocation" TEXT,
    "dropLocation" TEXT,
    "hireRatePerDay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kmPerDay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "excessKmRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extraHourRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDistance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transportCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accommodationTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mealsTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activitiesTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherCostsTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "markup" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "driverCostPerDay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "advanceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "excludedItems" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "validUntil" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_email_token_key" ON "password_reset_tokens"("email", "token");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_startDate_idx" ON "bookings"("startDate");

-- CreateIndex
CREATE INDEX "bookings_vehicleNo_idx" ON "bookings"("vehicleNo");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_quotationNumber_key" ON "quotations"("quotationNumber");

-- CreateIndex
CREATE INDEX "bills_customerName_idx" ON "bills"("customerName");

-- CreateIndex
CREATE INDEX "bills_vehicleNo_idx" ON "bills"("vehicleNo");

-- CreateIndex
CREATE INDEX "bills_createdAt_idx" ON "bills"("createdAt");

-- CreateIndex
CREATE INDEX "customers_name_idx" ON "customers"("name");

-- CreateIndex
CREATE INDEX "customers_mobile_idx" ON "customers"("mobile");

-- AddForeignKey
ALTER TABLE "tour_schedule_day_items" ADD CONSTRAINT "tour_schedule_day_items_tourScheduleId_fkey" FOREIGN KEY ("tourScheduleId") REFERENCES "tour_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_tourScheduleId_fkey" FOREIGN KEY ("tourScheduleId") REFERENCES "tour_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
