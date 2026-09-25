'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TourScheduleSchema, type ActionResult } from '@/lib/validations';
import { revalidateFor } from '@/lib/revalidation';
import { requireAdmin, requireAuth } from '@/lib/auth-guard';

// Types for server responses
export type TourScheduleWithItems = {
    id: string;
    name: string;
    description: string | null;
    days: number;
    basePricePerPerson: number;
    vehicleCategory: string;
    vehicleNo: string | null;
    ratePerDay: number;
    kmPerDay: number;
    seats: number;
    excessKmRate: number | null;
    extraHourRate: number | null;
    waitingCharge: number;
    gatePass: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    items: {
        id: string;
        tourScheduleId: string;
        dayNumber: number;
        title: string;
        description: string | null;
        distanceKm: number;
        accommodation: number;
        meals: number;
        activities: number;
        otherCosts: number;
    }[];
    _count?: { quotations: number };
};

/**
 * Create a new tour schedule with day items
 */
export async function createTourSchedule(
    data: {
        name: string;
        description?: string;
        days: number;
        basePricePerPerson?: number;
        vehicleCategory?: string;
        vehicleNo?: string;
        ratePerDay?: number;
        kmPerDay?: number;
        seats?: number;
        excessKmRate?: number;
        extraHourRate?: number;
        waitingCharge?: number;
        gatePass?: number;
        items: {
            dayNumber: number;
            title: string;
            description?: string;
            distanceKm?: number;
            accommodation?: number;
            meals?: number;
            activities?: number;
            otherCosts?: number;
        }[];
    }
): Promise<ActionResult<{ id: string, name: string }>> {
    try {
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        const validated = TourScheduleSchema.parse(data);

        const schedule = await prisma.$transaction(async (tx) => {
            const created = await tx.tourSchedule.create({
                data: {
                    name: validated.name,
                    description: validated.description,
                    days: validated.days,
                    basePricePerPerson: validated.basePricePerPerson,
                    vehicleCategory: validated.vehicleCategory,
                    vehicleNo: validated.vehicleNo,
                    ratePerDay: validated.ratePerDay,
                    kmPerDay: validated.kmPerDay,
                    seats: validated.seats,
                    excessKmRate: validated.excessKmRate,
                    extraHourRate: validated.extraHourRate,
                    waitingCharge: validated.waitingCharge,
                    gatePass: validated.gatePass,
                    isActive: validated.isActive,
                    companyId: authCheck.companyId,
                    items: {
                        create: validated.items.map((item) => ({
                            dayNumber: item.dayNumber,
                            title: item.title,
                            description: item.description,
                            distanceKm: item.distanceKm,
                            accommodation: item.accommodation,
                            meals: item.meals,
                            activities: item.activities,
                            otherCosts: item.otherCosts,
                        })),
                    },
                },
            });
            return created;
        });

        revalidateFor('tourSchedule');
        return { success: true, data: { id: schedule.id, name: schedule.name } };
    } catch (error) {
        console.error('Error creating tour schedule:', error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Failed to create tour schedule' };
    }
}

/**
 * Get all tour schedules with optional search
 */
export async function getTourSchedules(
    searchQuery?: string
): Promise<ActionResult<TourScheduleWithItems[]>> {
    try {
        const authCheck = await requireAuth();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        const schedules = await prisma.tourSchedule.findMany({
            where: {
                companyId: authCheck.companyId,
                AND: [
                    { isActive: true },
                    searchQuery
                        ? {
                            OR: [
                                { name: { contains: searchQuery, mode: 'insensitive' } },
                                { description: { contains: searchQuery, mode: 'insensitive' } },
                            ],
                        }
                        : {},
                ],
            },
            include: {
                items: { orderBy: { dayNumber: 'asc' } },
                _count: { select: { quotations: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });

        return { success: true, data: schedules as TourScheduleWithItems[] };
    } catch (error) {
        console.error('Error fetching tour schedules:', error);
        return { success: false, error: 'Failed to fetch tour schedules' };
    }
}

/**
 * Get a single tour schedule by ID with all day items
 */
export async function getTourScheduleById(
    id: string
): Promise<ActionResult<TourScheduleWithItems>> {
    try {
        const authCheck = await requireAuth();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        const schedule = await prisma.tourSchedule.findFirst({
            where: { id, companyId: authCheck.companyId },
            include: {
                items: { orderBy: { dayNumber: 'asc' } },
            },
        });

        if (!schedule) {
            return { success: false, error: 'Tour schedule not found' };
        }

        return { success: true, data: schedule as TourScheduleWithItems };
    } catch (error) {
        console.error('Error fetching tour schedule:', error);
        return { success: false, error: 'Failed to fetch tour schedule' };
    }
}

/**
 * Update a tour schedule and its day items
 */
export async function updateTourSchedule(
    id: string,
    data: {
        name: string;
        description?: string;
        days: number;
        basePricePerPerson?: number;
        vehicleCategory?: string;
        vehicleNo?: string;
        ratePerDay?: number;
        kmPerDay?: number;
        seats?: number;
        excessKmRate?: number;
        extraHourRate?: number;
        waitingCharge?: number;
        gatePass?: number;
        items: {
            dayNumber: number;
            title: string;
            description?: string;
            distanceKm?: number;
            accommodation?: number;
            meals?: number;
            activities?: number;
            otherCosts?: number;
        }[];
    }
): Promise<ActionResult<{ id: string, name: string }>> {
    try {
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        const validated = TourScheduleSchema.parse(data);

        await prisma.$transaction(async (tx) => {
            // Update schedule details
            const updated = await tx.tourSchedule.updateMany({
                where: { id, companyId: authCheck.companyId },
                data: {
                    name: validated.name,
                    description: validated.description,
                    days: validated.days,
                    basePricePerPerson: validated.basePricePerPerson,
                    vehicleCategory: validated.vehicleCategory,
                    vehicleNo: validated.vehicleNo,
                    ratePerDay: validated.ratePerDay,
                    kmPerDay: validated.kmPerDay,
                    seats: validated.seats,
                    excessKmRate: validated.excessKmRate,
                    extraHourRate: validated.extraHourRate,
                    waitingCharge: validated.waitingCharge,
                    gatePass: validated.gatePass,
                },
            });

            if (updated.count === 0) {
                throw new Error('Tour schedule not found or unauthorized');
            }

            // Delete existing items and recreate (simpler than upsert for variable-length arrays)
            await tx.tourScheduleDayItem.deleteMany({
                where: { tourScheduleId: id },
            });

            await tx.tourScheduleDayItem.createMany({
                data: validated.items.map((item) => ({
                    tourScheduleId: id,
                    dayNumber: item.dayNumber,
                    title: item.title,
                    description: item.description,
                    distanceKm: item.distanceKm,
                    accommodation: item.accommodation,
                    meals: item.meals,
                    activities: item.activities,
                    otherCosts: item.otherCosts,
                })),
            });
        });

        revalidateFor('tourSchedule');
        return { success: true, data: { id: id, name: validated.name } };
    } catch (error) {
        console.error('Error updating tour schedule:', error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Failed to update tour schedule' };
    }
}

/**
 * Soft delete a tour schedule
 */
export async function deleteTourSchedule(id: string): Promise<ActionResult<void>> {
    try {
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        const _res = await prisma.tourSchedule.updateMany({
            where: { id, companyId: authCheck.companyId },
            data: { isActive: false },
        });
        if (_res.count === 0) return { success: false, error: 'Record not found or unauthorized' };

        revalidateFor('tourSchedule');
        return { success: true };
    } catch (error) {
        console.error('Error deleting tour schedule:', error);
        return { success: false, error: 'Failed to delete tour schedule' };
    }
}
