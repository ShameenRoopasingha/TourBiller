'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';
import { type ActionResult } from '@/lib/validations';

export type TripActivityType = 'FUEL_FILL' | 'FLAT_TIRE' | 'STOP' | 'HOTEL_CHECKIN' | 'RESUME' | 'BREAKDOWN' | 'NOTE';

export interface TripActivity {
    id: string;
    bookingId: string;
    driverId: string;
    type: string;
    note: string | null;
    expenseId: string | null;
    timestamp: Date | string;
}

/**
 * Log a trip activity (driver only, must have active booking)
 */
export async function logTripActivity(
    bookingId: string,
    type: TripActivityType,
    note?: string,
    expenseId?: string
): Promise<ActionResult<string>> {
    try {
        const authCheck = await requireAuth();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        if (authCheck.role !== 'DRIVER' && authCheck.role !== 'ADMIN') {
            return { success: false, error: 'Unauthorized' };
        }

        // Verify the booking belongs to this driver
        const booking = await prisma.booking.findFirst({
            where: {
                id: bookingId,
                driverId: authCheck.userId,
                status: 'CONFIRMED',
            },
        });

        if (!booking && authCheck.role !== 'ADMIN') {
            return { success: false, error: 'Booking not found or not assigned to you.' };
        }

        const activity = await prisma.tripActivity.create({
            data: {
                bookingId,
                driverId: authCheck.userId,
                type,
                note: note || null,
                expenseId: expenseId || null,
            },
        });

        return { success: true, data: activity.id };
    } catch (error) {
        console.error('Error logging trip activity:', error);
        return { success: false, error: 'Failed to log activity' };
    }
}

/**
 * Get trip activities for a specific booking
 */
export async function getTripActivities(bookingId: string): Promise<ActionResult<TripActivity[]>> {
    try {
        const authCheck = await requireAuth();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        const activities = await prisma.tripActivity.findMany({
            where: { bookingId },
            orderBy: { timestamp: 'desc' },
        });

        const plain = JSON.parse(JSON.stringify(activities));
        return { success: true, data: plain as TripActivity[] };
    } catch (error) {
        console.error('Error fetching trip activities:', error);
        return { success: false, error: 'Failed to fetch activities' };
    }
}

export interface TourHistoryBooking {
    id: string;
    vehicleNo: string;
    customerName: string;
    destination: string | null;
    startDate: string;
    endDate: string | null;
    status: string;
    notes: string | null;
}

/**
 * Get upcoming and completed tours for a driver
 */
export async function getDriverTourHistory(
    type: 'upcoming' | 'completed'
): Promise<ActionResult<TourHistoryBooking[]>> {
    try {
        const authCheck = await requireAuth();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let bookings;
        if (type === 'upcoming') {
            bookings = await prisma.booking.findMany({
                where: {
                    driverId: authCheck.userId,
                    status: 'CONFIRMED',
                    startDate: { gt: new Date() },
                },
                orderBy: { startDate: 'asc' },
                take: 20,
            });
        } else {
            bookings = await prisma.booking.findMany({
                where: {
                    driverId: authCheck.userId,
                    status: 'COMPLETED',
                },
                orderBy: { startDate: 'desc' },
                take: 20,
            });
        }

        const plain = JSON.parse(JSON.stringify(bookings));
        return { success: true, data: plain as TourHistoryBooking[] };
    } catch (error) {
        console.error('Error fetching tour history:', error);
        return { success: false, error: 'Failed to fetch tour history' };
    }
}
