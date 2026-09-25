import { prisma } from '@/lib/prisma';
import * as authGuard from '@/lib/auth-guard';
import { createVehicle } from '@/lib/vehicle-actions';
import { createCustomer } from '@/lib/customer-actions';
import { createTourSchedule } from '@/lib/tour-schedule-actions';
import { generateQuotation, updateQuotationStatus, convertQuotationToBooking } from '@/lib/quotation-actions';
import { getBookings } from '@/lib/booking-actions';

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
    revalidateTag: jest.fn()
}));

jest.mock('@/lib/auth-guard', () => ({
    requireAuth: jest.fn(),
    requireAdmin: jest.fn()
}));

describe('Complete User Flow Integration', () => {
    let companyId: string;
    let customerId: string;
    let vehicleId: string;
    let tourScheduleId: string;
    let quotationId: string;

    beforeAll(async () => {
        const comp = await prisma.businessProfile.create({ data: { companyName: 'E2E Flow Company' } });
        companyId = comp.id;
    });

    afterAll(async () => {
        await prisma.businessProfile.deleteMany({ where: { id: companyId } });
        await prisma.$disconnect();
    });

    const authSpy = authGuard.requireAuth as jest.Mock;
    const adminSpy = authGuard.requireAdmin as jest.Mock;

    beforeEach(() => {
        const mockAuth = { authorized: true as const, userId: 'admin1', role: 'ADMIN', companyId };
        authSpy.mockResolvedValue(mockAuth);
        adminSpy.mockResolvedValue(mockAuth);
    });

    it('should complete the full booking lifecycle', async () => {
        // 1. Create Vehicle
        const vData = new FormData();
        vData.append('vehicleNo', 'FLOW-123');
        vData.append('type', 'CAR');
        vData.append('model', 'Sedan');
        vData.append('category', 'STANDARD');
        vData.append('status', 'ACTIVE');
        vData.append('ownerType', 'COMPANY');
        const vRes = await createVehicle(vData);
        expect(vRes.success).toBe(true);
        vehicleId = vRes.data as string;

        // 2. Create Customer
        const cData = new FormData();
        cData.append('name', 'Flow Customer');
        cData.append('mobile', '0771234567');
        const cRes = await createCustomer(cData);
        expect(cRes.success).toBe(true);
        customerId = cRes.data as string;

        // 3. Create Tour Schedule
        const scheduleRes = await createTourSchedule({
            name: 'Flow Tour Package',
            days: 3,
            basePricePerPerson: 5000,
            vehicleCategory: 'CAR',
            ratePerDay: 10000,
            kmPerDay: 100,
            seats: 4,
            waitingCharge: 500,
            gatePass: 1000,
            items: [
                { dayNumber: 1, title: 'Day 1', distanceKm: 50, accommodation: 2000, meals: 1000, activities: 0, otherCosts: 0 }
            ]
        });
        expect(scheduleRes.success).toBe(true);
        tourScheduleId = scheduleRes.data!.id;

        // 4. Generate Quotation
        const qData = new FormData();
        qData.append('customerName', 'Flow Customer');
        qData.append('customerMobile', '0771234567');
        qData.append('vehicleNo', 'FLOW-123'); // Added this line
        qData.append('numberOfPersons', '2');
        qData.append('startDate', new Date().toISOString());
        qData.append('hireRatePerDay', '10000');
        qData.append('kmPerDay', '100');
        qData.append('excessKmRate', '50');
        qData.append('extraHourRate', '500');
        qData.append('markup', '10');
        qData.append('discount', '0');
        const qRes = await generateQuotation(tourScheduleId, qData);
        expect(qRes.success).toBe(true);
        quotationId = qRes.data as string;

        // 6. Convert to Booking
        const bookRes = await convertQuotationToBooking(quotationId);
        expect(bookRes.success).toBe(true);
        const bookingId = bookRes.data as string;

        // 7. Verify Booking Exists
        const bookings = await getBookings();
        expect(bookings.success).toBe(true);
        const found = bookings.data!.find(b => b.id === bookingId);
        expect(found).toBeDefined();
        expect(found!.customerName).toBe('Flow Customer');
    });
});
