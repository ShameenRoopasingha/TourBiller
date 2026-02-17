'use server';

import { prisma } from '@/lib/prisma';
import { QuotationSchema, type ActionResult } from '@/lib/validations';
import { revalidateFor } from '@/lib/revalidation';

// Types for server responses
type QuotationWithSchedule = {
    id: string;
    quotationNumber: number;
    tourScheduleId: string;
    customerName: string;
    customerEmail: string | null;
    customerPhone: string | null;
    vehicleNo: string | null;
    numberOfPersons: number;
    startDate: Date | null;
    hireRatePerDay: number;
    kmPerDay: number;
    totalDistance: number;
    transportCost: number;
    accommodationTotal: number;
    mealsTotal: number;
    activitiesTotal: number;
    otherCostsTotal: number;
    markup: number;
    discount: number;
    driverCostPerDay: number;
    advanceAmount: number;
    excludedItems: string | null;
    totalAmount: number;
    notes: string | null;
    validUntil: Date | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    tourSchedule: {
        id: string;
        name: string;
        description: string | null;
        days: number;
        vehicleCategory: string;
        items: {
            id: string;
            dayNumber: number;
            title: string;
            description: string | null;
            distanceKm: number;
            accommodation: number;
            meals: number;
            activities: number;
            otherCosts: number;
        }[];
    };
};

/**
 * Generate a new quotation from a tour schedule.
 * Auto-calculates totals from the schedule's day items.
 */
export async function generateQuotation(
    data: {
        tourScheduleId: string;
        customerName: string;
        customerEmail?: string;
        customerPhone?: string;
        vehicleNo?: string;
        numberOfPersons?: number;
        startDate?: string | Date;
        hireRatePerDay?: number;
        kmPerDay?: number;
        markup?: number;
        discount?: number;
        driverCostPerDay?: number;
        advanceAmount?: number;
        excludedItems?: string;
        notes?: string;
        validUntil?: string | Date;
    }
): Promise<ActionResult<string>> {
    try {
        const validated = QuotationSchema.parse(data);

        const quotation = await prisma.$transaction(async (tx) => {
            // Fetch the tour schedule with items to calculate totals
            const schedule = await tx.tourSchedule.findUnique({
                where: { id: validated.tourScheduleId },
                include: { items: true },
            });

            if (!schedule) {
                throw new Error('Tour schedule not found');
            }

            // Calculate totals from day items in a single pass
            const itemTotals = schedule.items.reduce(
                (acc, item) => ({
                    distance: acc.distance + item.distanceKm,
                    accommodation: acc.accommodation + item.accommodation,
                    meals: acc.meals + item.meals,
                    activities: acc.activities + item.activities,
                    other: acc.other + item.otherCosts,
                }),
                { distance: 0, accommodation: 0, meals: 0, activities: 0, other: 0 }
            );

            const transportCost = schedule.days * (validated.hireRatePerDay || 0);
            const driverTotal = schedule.days * (validated.driverCostPerDay || 0);
            const subtotal = transportCost + driverTotal + itemTotals.accommodation + itemTotals.meals + itemTotals.activities + itemTotals.other;
            const markupAmount = subtotal * ((validated.markup || 0) / 100);
            const totalAmount = subtotal + markupAmount - (validated.discount || 0);

            return tx.quotation.create({
                data: {
                    tourScheduleId: validated.tourScheduleId,
                    customerName: validated.customerName,
                    customerEmail: validated.customerEmail || null,
                    customerPhone: validated.customerPhone || null,
                    vehicleNo: validated.vehicleNo || null,
                    numberOfPersons: validated.numberOfPersons || 1,
                    startDate: validated.startDate || null,
                    hireRatePerDay: validated.hireRatePerDay || 0,
                    kmPerDay: validated.kmPerDay || 0,
                    totalDistance: itemTotals.distance,
                    transportCost,
                    accommodationTotal: itemTotals.accommodation,
                    mealsTotal: itemTotals.meals,
                    activitiesTotal: itemTotals.activities,
                    otherCostsTotal: itemTotals.other,
                    markup: validated.markup || 0,
                    discount: validated.discount || 0,
                    driverCostPerDay: validated.driverCostPerDay || 0,
                    advanceAmount: validated.advanceAmount || 0,
                    excludedItems: validated.excludedItems || null,
                    totalAmount: Math.max(0, totalAmount),
                    notes: validated.notes || null,
                    validUntil: validated.validUntil || null,
                    status: 'DRAFT',
                },
            });
        });

        revalidateFor('quotation');
        return { success: true, data: quotation.id };
    } catch (error) {
        console.error('Error generating quotation:', error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Failed to generate quotation' };
    }
}

/**
 * Get all quotations with optional search
 */
export async function getQuotations(
    searchQuery?: string
): Promise<ActionResult<QuotationWithSchedule[]>> {
    try {
        const quotations = await prisma.quotation.findMany({
            where: searchQuery
                ? {
                    OR: [
                        { customerName: { contains: searchQuery, mode: 'insensitive' } },
                        { tourSchedule: { name: { contains: searchQuery, mode: 'insensitive' } } },
                        ...(Number.isFinite(Number(searchQuery))
                            ? [{ quotationNumber: { equals: Number(searchQuery) } }]
                            : []),
                    ],
                }
                : undefined,
            include: {
                tourSchedule: {
                    include: { items: { orderBy: { dayNumber: 'asc' } } },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return { success: true, data: quotations as QuotationWithSchedule[] };
    } catch (error) {
        console.error('Error fetching quotations:', error);
        return { success: false, error: 'Failed to fetch quotations' };
    }
}

/**
 * Get a single quotation by ID with full tour schedule details
 */
export async function getQuotationById(
    id: string
): Promise<ActionResult<QuotationWithSchedule>> {
    try {
        const quotation = await prisma.quotation.findUnique({
            where: { id },
            include: {
                tourSchedule: {
                    include: { items: { orderBy: { dayNumber: 'asc' } } },
                },
            },
        });

        if (!quotation) {
            return { success: false, error: 'Quotation not found' };
        }

        return { success: true, data: quotation as QuotationWithSchedule };
    } catch (error) {
        console.error('Error fetching quotation:', error);
        return { success: false, error: 'Failed to fetch quotation' };
    }
}

/**
 * Update quotation status
 */
export async function updateQuotationStatus(
    id: string,
    status: string
): Promise<ActionResult<void>> {
    try {
        const validStatuses = ['DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED'];
        if (!validStatuses.includes(status)) {
            return { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` };
        }

        await prisma.quotation.update({
            where: { id },
            data: { status },
        });

        revalidateFor('quotation');
        return { success: true };
    } catch (error) {
        console.error('Error updating quotation status:', error);
        return { success: false, error: 'Failed to update quotation status' };
    }
}

/**
 * Delete a quotation
 */
export async function deleteQuotation(id: string): Promise<ActionResult<void>> {
    try {
        await prisma.quotation.delete({
            where: { id },
        });

        revalidateFor('quotation');
        return { success: true };
    } catch (error) {
        console.error('Error deleting quotation:', error);
        return { success: false, error: 'Failed to delete quotation' };
    }
}
