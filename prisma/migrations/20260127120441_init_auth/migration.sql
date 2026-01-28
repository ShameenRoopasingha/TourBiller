-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL,
    "billNumber" SERIAL NOT NULL,
    "vehicleNo" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "startMeter" DOUBLE PRECISION NOT NULL,
    "endMeter" DOUBLE PRECISION NOT NULL,
    "hireRate" DOUBLE PRECISION NOT NULL,
    "waitingCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gatePass" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "packageCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "vehicleNo" TEXT NOT NULL,
    "model" TEXT,
    "category" TEXT NOT NULL DEFAULT 'CAR',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT,
    "email" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bills_billNumber_key" ON "bills"("billNumber");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vehicleNo_key" ON "vehicles"("vehicleNo");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
