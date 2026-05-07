'use server';

import { prisma } from '@/lib/prisma';
import { BookingSchema, type ActionResult } from '@/lib/validations';
import { type Booking } from '@prisma/client';
import { revalidateFor } from '@/lib/revalidation';
import { requireAuth, requireAdmin } from '@/lib/auth-guard';
import { checkVehicleAvailability } from '@/lib/vehicle-actions';

/**
 * Generate a quotation from tour schedule and customer data
 */
export async function createBooking(formData: FormData): Promise<ActionResult<string>> {
    try {
        const authCheck = await requireAuth();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        const rawData = {
            vehicleNo: formData.get('vehicleNo') as string,
            customerName: formData.get('customerName') as string,
            startDate: formData.get('startDate') as string,
            endDate: formData.get('endDate') ? formData.get('endDate') as string : undefined,
            destination: (formData.get('destination') as string) || undefined,
            notes: (formData.get('notes') as string) || undefined,
            advanceAmount: parseFloat(formData.get('advanceAmount') as string) || 0,
            driverId: (formData.get('driverId') as string) || undefined,
            status: 'CONFIRMED',
        };

        const validatedData = BookingSchema.parse(rawData);

        // Check vehicle availability
        if (validatedData.vehicleNo && validatedData.startDate) {
            const endDate = validatedData.endDate || validatedData.startDate;
            const availability = await checkVehicleAvailability(
                validatedData.vehicleNo,
                validatedData.startDate,
                endDate,
                undefined,
                'Booking'
            );
            
            if (availability.success && availability.data && !availability.data.available) {
                const conflict = availability.data.conflicts[0];
                return { 
                    success: false, 
                    error: `Vehicle is already occupied by ${conflict.customer} (${conflict.type}: ${conflict.reference}) until ${new Date(conflict.end).toLocaleDateString('en-GB')}` 
                };
            }
        }

        const booking = await prisma.booking.create({
            data: validatedData,
        });

        revalidateFor('booking');

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
export async function getBookings(searchQuery?: string): Promise<ActionResult<Booking[]>> {
    try {
        const bookings = await prisma.booking.findMany({
            where: searchQuery ? {
                OR: [
                    { vehicleNo: { contains: searchQuery, mode: 'insensitive' } },
                    { customerName: { contains: searchQuery, mode: 'insensitive' } },
                    { destination: { contains: searchQuery, mode: 'insensitive' } },
                ],
            } : undefined,
            orderBy: { createdAt: 'desc' },
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
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        // 1. Fetch booking to check date
        const booking = await prisma.booking.findUnique({
            where: { id },
        });

        if (!booking) {
            return { success: false, error: 'Booking not found' };
        }

        // 2. Calculate Refund Status
        let refundStatus = null;
        if (booking.advanceAmount > 0) {
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
                refundStatus: refundStatus,
            },
        });

        revalidateFor('booking');

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
