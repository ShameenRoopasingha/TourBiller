'use server';

import { prisma } from '@/lib/prisma';
import { BookingSchema, type ActionResult } from '@/lib/validations';
import { type Booking } from '@prisma/client';
import { revalidatePath } from 'next/cache';

/**
 * Create a new booking
 */
export async function createBooking(formData: FormData): Promise<ActionResult<string>> {
    try {
        const rawData = {
            vehicleNo: formData.get('vehicleNo') as string,
            customerName: formData.get('customerName') as string,
            startDate: formData.get('startDate') as string,
            endDate: formData.get('endDate') ? formData.get('endDate') as string : undefined,
            destination: formData.get('destination') as string,
            notes: formData.get('notes') as string,
            advanceAmount: parseFloat(formData.get('advanceAmount') as string) || 0,
            status: 'CONFIRMED',
        };

        const validatedData = BookingSchema.parse(rawData);

        const booking = await prisma.booking.create({
            data: validatedData,
        });

        revalidatePath('/bookings');

        return {
            success: true,
            data: booking.id,
        };
    } catch (error) {
        console.error('Error creating booking:', error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Failed to create booking' };
    }
}

/**
 * Get all bookings
 */
export async function getBookings(status?: string): Promise<ActionResult<Booking[]>> {
    try {
        const bookings = await prisma.booking.findMany({
            where: status ? { status } : undefined,
            orderBy: { startDate: 'asc' },
        });

        return { success: true, data: bookings as Booking[] };
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return { success: false, error: 'Failed to fetch bookings' };
    }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(id: string): Promise<ActionResult<void>> {
    try {
        // 1. Fetch booking to check date
        const booking = await prisma.booking.findUnique({
            where: { id },
        });

        if (!booking) {
            return { success: false, error: 'Booking not found' };
        }

        // 2. Calculate Refund Status
        let refundStatus = null;
        if ((booking as any).advanceAmount > 0) {
            const now = new Date();
            const tripDate = new Date(booking.startDate);
            const diffTime = tripDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Refund Policy: > 7 days = REFUNDED, <= 7 days = FORFEITED
            refundStatus = (diffDays > 7) ? 'REFUNDED' : 'FORFEITED';
        }

        // 3. Update Booking
        await prisma.booking.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                refundStatus: refundStatus
            } as any,
        });

        revalidatePath('/bookings');

        return { success: true };
    } catch (error) {
        console.error('Error cancelling booking:', error);
        return { success: false, error: 'Failed to cancel booking' };
    }
}

/**
 * Get a single booking by ID
 */
export async function getBookingById(id: string): Promise<ActionResult<Booking>> {
    try {
        const booking = await prisma.booking.findUnique({
            where: { id },
        });

        if (!booking) {
            return { success: false, error: 'Booking not found' };
        }

        return { success: true, data: booking as Booking };
    } catch (error) {
        console.error('Error fetching booking:', error);
        return { success: false, error: 'Failed to fetch booking' };
    }
}
