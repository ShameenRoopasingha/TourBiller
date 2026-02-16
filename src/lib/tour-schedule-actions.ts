'use server';

import { prisma } from '@/lib/prisma';
import { TourScheduleSchema, type ActionResult } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

// Types for server responses
type TourScheduleWithItems = {
    id: string;
    name: string;
    description: string | null;
    days: number;
    basePricePerPerson: number;
    vehicleCategory: string;
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
): Promise<ActionResult<string>> {
    try {
        const validated = TourScheduleSchema.parse(data);

        const schedule = await prisma.$transaction(async (tx) => {
            const created = await tx.tourSchedule.create({
                data: {
                    name: validated.name,
                    description: validated.description,
                    days: validated.days,
                    basePricePerPerson: validated.basePricePerPerson,
                    vehicleCategory: validated.vehicleCategory,
                    isActive: validated.isActive,
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

        revalidatePath('/tour-schedules');
        return { success: true, data: schedule.id };
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
        const schedules = await prisma.tourSchedule.findMany({
            where: {
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
        const schedule = await prisma.tourSchedule.findUnique({
            where: { id },
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
): Promise<ActionResult<string>> {
    try {
        const validated = TourScheduleSchema.parse(data);

        await prisma.$transaction(async (tx) => {
            // Update schedule details
            await tx.tourSchedule.update({
                where: { id },
                data: {
                    name: validated.name,
                    description: validated.description,
                    days: validated.days,
                    basePricePerPerson: validated.basePricePerPerson,
                    vehicleCategory: validated.vehicleCategory,
                },
            });

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

        revalidatePath('/tour-schedules');
        return { success: true, data: id };
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
        await prisma.tourSchedule.update({
            where: { id },
            data: { isActive: false },
        });

        revalidatePath('/tour-schedules');
        return { success: true };
    } catch (error) {
        console.error('Error deleting tour schedule:', error);
        return { success: false, error: 'Failed to delete tour schedule' };
    }
}
