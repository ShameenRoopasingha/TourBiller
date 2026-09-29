import { prisma } from '@/lib/prisma';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '@/lib/vehicle-actions';
import { getDashboardStats } from '@/lib/dashboard-actions';
import { getBillById, updateBill, deleteBill } from '@/lib/actions';
import { getBookingById, cancelBooking } from '@/lib/booking-actions';
import { getQuotationById, updateQuotation, updateQuotationStatus, deleteQuotation } from '@/lib/quotation-actions';
import { getUsers, deleteUser } from '@/lib/user-actions';

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
    revalidateTag: jest.fn(),
    unstable_noStore: jest.fn(),
}));

// Mock auth-guard
jest.mock('@/lib/auth-guard', () => ({
    requireAuth: jest.fn(),
    requireAdmin: jest.fn()
}));
import * as authGuard from '@/lib/auth-guard';

describe('Multi-Tenant Data Isolation', () => {
    let companyA_Id: string;
    let companyB_Id: string;
    let vehicleB_Id: string;
    let billB_Id: string;
    let bookingB_Id: string;
    let quotationB_Id: string;
    let userB_Id: string;
    let scheduleB_Id: string;


    beforeAll(async () => {
        // Create Company A and B
        const compA = await prisma.businessProfile.create({ data: { companyName: 'Test Isolation Company A' } });
        const compB = await prisma.businessProfile.create({ data: { companyName: 'Test Isolation Company B' } });
        companyA_Id = compA.id;
        companyB_Id = compB.id;

        const bill = await prisma.bill.create({
            data: {
                companyId: companyB_Id,
                vehicleNo: 'ISO-B-222',
                customerName: 'Company B Customer',
                route: 'Test Route',
                startMeter: 100,
                endMeter: 150,
                hireRate: 100,
                totalAmount: 5000,
            },
        });
        billB_Id = bill.id;

        const booking = await prisma.booking.create({
            data: {
                companyId: companyB_Id,
                vehicleNo: 'ISO-B-222',
                customerName: 'Company B Customer',
                startDate: new Date(Date.now() + 86_400_000),
            },
        });
        bookingB_Id = booking.id;

        const schedule = await prisma.tourSchedule.create({
            data: { companyId: companyB_Id, name: 'ISO-B Tour', days: 1 },
        });
        scheduleB_Id = schedule.id;

        const quotation = await prisma.quotation.create({
            data: {
                companyId: companyB_Id,
                tourScheduleId: scheduleB_Id,
                customerName: 'Company B Customer',
            },
        });
        quotationB_Id = quotation.id;

        const user = await prisma.user.create({
            data: {
                companyId: companyB_Id,
                name: 'Company B Driver',
                email: `iso-driver-${Date.now()}@example.test`,
                password: 'test-password-hash',
                role: 'DRIVER',
            },
        });
        userB_Id = user.id;
    });

    afterAll(async () => {
        // Cleanup
        await prisma.vehicle.deleteMany({ where: { companyId: { in: [companyA_Id, companyB_Id] } } });
        await prisma.businessProfile.deleteMany({ where: { id: { in: [companyA_Id, companyB_Id] } } });
        await prisma.$disconnect();
    });

    const authSpy = authGuard.requireAuth as jest.Mock;
    const adminSpy = authGuard.requireAdmin as jest.Mock;

    beforeEach(() => {
        authSpy.mockReset();
        adminSpy.mockReset();
    });

    const simulateUserA = () => {
        const mockAuth = { authorized: true as const, userId: 'userA', role: 'ADMIN', companyId: companyA_Id };
        authSpy.mockResolvedValue(mockAuth);
        adminSpy.mockResolvedValue(mockAuth);
    };

    const simulateUserB = () => {
        const mockAuth = { authorized: true as const, userId: 'userB', role: 'ADMIN', companyId: companyB_Id };
        authSpy.mockResolvedValue(mockAuth);
        adminSpy.mockResolvedValue(mockAuth);
    };

    it('should prevent Company A from seeing Company B data (findMany)', async () => {
        // --- Setup Data ---
        // Create Vehicle for A
        simulateUserA();
        const fdA = new FormData();
        fdA.append('vehicleNo', 'ISO-A-111');
        fdA.append('type', 'CAR');
        fdA.append('model', 'Model A');
        fdA.append('category', 'STANDARD');
        fdA.append('status', 'ACTIVE');
        fdA.append('ownerType', 'COMPANY');
        const resA = await createVehicle(fdA);
        expect(resA.success).toBe(true);
        // Create Vehicle for B
        simulateUserB();
        const fdB = new FormData();
        fdB.append('vehicleNo', 'ISO-B-222');
        fdB.append('type', 'CAR');
        fdB.append('model', 'Model B');
        fdB.append('category', 'STANDARD');
        fdB.append('status', 'ACTIVE');
        fdB.append('ownerType', 'COMPANY');
        const resB = await createVehicle(fdB);
        expect(resB.success).toBe(true);
        vehicleB_Id = resB.data as string;

        // --- Test Isolation for User A ---
        simulateUserA();
        const listA = await getVehicles();
        expect(listA.success).toBe(true);
        const vehiclesA = listA.data!;
        
        // A should see their vehicle
        expect(vehiclesA.find(v => v.vehicleNo === 'ISO-A-111')).toBeDefined();
        // A should NOT see B's vehicle
        expect(vehiclesA.find(v => v.vehicleNo === 'ISO-B-222')).toBeUndefined();

        // Check search query leak
        const searchA = await getVehicles('ISO-B-222');
        expect(searchA.success).toBe(true);
        expect(searchA.data!.length).toBe(0); // Should return empty, not B's vehicle
    });

    it('should prevent Company A from modifying Company B record (update)', async () => {
        simulateUserA();
        
        // User A tries to update B's vehicle directly by ID
        const updateData = new FormData();
        updateData.append('vehicleNo', 'HACK-123');
        updateData.append('category', 'STANDARD');
        updateData.append('status', 'ACTIVE');
        const updateB = await updateVehicle(vehicleB_Id, updateData);
        expect(updateB.success).toBe(false);
    });

    it('should prevent Company A from modifying Company B record (update/delete)', async () => {
        simulateUserA();
        
        // User A tries to delete B's vehicle directly by ID
        const delB = await deleteVehicle(vehicleB_Id);
        expect(delB.success).toBe(false);
    });

    it('should block Company A from reading, updating, or deleting Company B bills', async () => {
        simulateUserA();

        const bill = await getBillById(billB_Id);
        expect(bill.success).toBe(false);

        const formData = new FormData();
        formData.set('vehicleNo', 'ISO-A-111');
        formData.set('customerName', 'Changed by Company A');
        formData.set('route', 'Changed Route');
        formData.set('startMeter', '100');
        formData.set('endMeter', '200');
        formData.set('hireRate', '100');
        const update = await updateBill(billB_Id, formData);
        expect(update.success).toBe(false);
        expect(update.error).toBe('Bill not found or unauthorized');

        const deletion = await deleteBill(billB_Id);
        expect(deletion.success).toBe(false);
    });

    it('should block Company A from reading or cancelling Company B bookings', async () => {
        simulateUserA();

        const booking = await getBookingById(bookingB_Id);
        expect(booking.success).toBe(false);

        const cancellation = await cancelBooking(bookingB_Id);
        expect(cancellation.success).toBe(false);
    });

    it('should block Company A from reading or mutating Company B quotations', async () => {
        simulateUserA();

        const quotation = await getQuotationById(quotationB_Id);
        expect(quotation.success).toBe(false);

        const formData = new FormData();
        formData.set('customerName', 'Changed by Company A');
        const update = await updateQuotation(quotationB_Id, scheduleB_Id, formData);
        expect(update.success).toBe(false);

        const status = await updateQuotationStatus(quotationB_Id, 'SENT');
        expect(status.success).toBe(false);

        const deletion = await deleteQuotation(quotationB_Id);
        expect(deletion.success).toBe(false);
    });

    it('should not list or delete Company B users from Company A', async () => {
        simulateUserA();

        const users = await getUsers();
        expect(users.success).toBe(true);
        expect(users.data?.some(user => user.id === userB_Id)).toBe(false);

        const deletion = await deleteUser(userB_Id);
        expect(deletion.success).toBe(false);
    });

    it('should aggregate only current company data (dashboard)', async () => {
        simulateUserA();
        const dashA = await getDashboardStats();
        expect(dashA.success).toBe(true);
        
        // Dashboard should only count Company A's 1 vehicle
        expect(dashA.data?.totalVehicles).toBe(1);
    });
});
