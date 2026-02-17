'use server';

import { prisma } from '@/lib/prisma';
import { BillSchema, BusinessProfileSchema, type ActionResult } from '@/lib/validations';
import { type Bill, type BusinessProfile } from '@prisma/client';
import { calculateTotalAmount } from '@/lib/calculations';
import { revalidateFor } from '@/lib/revalidation';

/**
 * Create a new bill
 */
export async function createBill(formData: FormData): Promise<ActionResult<string>> {
  try {
    // Extract and parse form data
    const rawData = {
      vehicleNo: formData.get('vehicleNo') as string,
      customerName: formData.get('customerName') as string,
      customerAddress: (formData.get('customerAddress') as string) || undefined,
      route: formData.get('route') as string,
      startMeter: parseFloat(formData.get('startMeter') as string),
      endMeter: parseFloat(formData.get('endMeter') as string),
      hireRate: parseFloat(formData.get('hireRate') as string),
      waitingCharge: parseFloat(formData.get('waitingCharge') as string) || 0,
      gatePass: parseFloat(formData.get('gatePass') as string) || 0,
      packageCharge: parseFloat(formData.get('packageCharge') as string) || 0,
      advanceAmount: parseFloat(formData.get('advanceAmount') as string) || 0,
      allowedKm: parseFloat(formData.get('allowedKm') as string) || 0,
      currency: (formData.get('currency') as string) || 'LKR',
      exchangeRate: parseFloat(formData.get('exchangeRate') as string) || 1,
      paymentMethod: (formData.get('paymentMethod') as string) || 'CASH',
    };

    // Validate the data
    const validatedData = BillSchema.parse(rawData);

    // Calculate total amount
    const totalAmount = calculateTotalAmount(
      validatedData.startMeter,
      validatedData.endMeter,
      validatedData.hireRate,
      validatedData.waitingCharge,
      validatedData.gatePass,
      validatedData.packageCharge,
      validatedData.allowedKm
    );

    // Save to database (use transaction to ensure bill + booking update are atomic)
    const bookingId = formData.get('bookingId') as string;

    const bill = await prisma.$transaction(async (tx) => {
      const createdBill = await tx.bill.create({
        data: {
          ...validatedData,
          totalAmount,
        },
      });

      // Auto-Close Booking within the same transaction
      if (bookingId) {
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: 'COMPLETED' },
        });
      }

      return createdBill;
    });

    // Revalidate all affected pages
    revalidateFor('bill', 'booking');

    return {
      success: true,
      data: bill.id,
    };
  } catch (error) {
    console.error('Error creating bill:', error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: 'An unexpected error occurred while creating the bill',
    };
  }
}

/**
 * Get all bills with optional search
 */
export async function getBills(searchQuery?: string): Promise<ActionResult<Bill[]>> {
  try {
    const bills = await prisma.bill.findMany({
      where: searchQuery ? {
        OR: [
          { vehicleNo: { contains: searchQuery, mode: 'insensitive' } },
          { customerName: { contains: searchQuery, mode: 'insensitive' } },
          { billNumber: { equals: parseInt(searchQuery) || undefined } },
        ],
      } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: bills,
    };
  } catch (error) {
    console.error('Error fetching bills:', error);

    return {
      success: false,
      error: 'Failed to fetch bills',
    };
  }
}

/**
 * Get a single bill by ID
 */
export async function getBillById(id: string): Promise<ActionResult<Bill>> {
  try {
    const bill = await prisma.bill.findUnique({
      where: { id },
    });

    if (!bill) {
      return {
        success: false,
        error: 'Bill not found',
      };
    }

    return {
      success: true,
      data: bill,
    };
  } catch (error) {
    console.error('Error fetching bill:', error);

    return {
      success: false,
      error: 'Failed to fetch bill',
    };
  }
}



/**
 * Get business profile
 */
export async function getBusinessProfile(): Promise<ActionResult<BusinessProfile>> {
  try {
    const profile = await prisma.businessProfile.findFirst();

    if (!profile) {
      // Create default profile if none exists
      const newProfile = await prisma.businessProfile.create({
        data: {
          companyName: 'My Transport Company',
        },
      });
      return { success: true, data: newProfile };
    }

    return { success: true, data: profile };
  } catch (error) {
    console.error('Error fetching business profile:', error);
    return { success: false, error: 'Failed to fetch business profile' };
  }
}

/**
 * Update business profile
 */
export async function updateBusinessProfile(formData: FormData): Promise<ActionResult<BusinessProfile>> {
  try {
    const rawData = {
      companyName: formData.get('companyName') as string,
      address: (formData.get('address') as string) || undefined,
      phone: (formData.get('phone') as string) || undefined,
      email: (formData.get('email') as string) || undefined,
      website: (formData.get('website') as string) || undefined,
      logoUrl: (formData.get('logoUrl') as string) || undefined,
      bankName: (formData.get('bankName') as string) || undefined,
      bankBranch: (formData.get('bankBranch') as string) || undefined,
      bankAccountNo: (formData.get('bankAccountNo') as string) || undefined,
      bankAccountName: (formData.get('bankAccountName') as string) || undefined,
    };

    const validatedData = BusinessProfileSchema.parse(rawData);

    // Check if profile exists
    const existingProfile = await prisma.businessProfile.findFirst();

    let profile;
    if (existingProfile) {
      profile = await prisma.businessProfile.update({
        where: { id: existingProfile.id },
        data: validatedData,
      });
    } else {
      profile = await prisma.businessProfile.create({
        data: validatedData,
      });
    }

    revalidateFor('businessProfile');

    return { success: true, data: profile };
  } catch (error) {
    console.error('Error updating business profile:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update business profile' };
  }
}

/**
 * Delete a bill by ID
 */
export async function deleteBill(id: string): Promise<ActionResult<void>> {
  try {
    await prisma.bill.delete({
      where: { id },
    });

    revalidateFor('bill');

    return { success: true };
  } catch (error) {
    console.error('Error deleting bill:', error);
    return {
      success: false,
      error: 'Failed to delete bill',
    };
  }
}