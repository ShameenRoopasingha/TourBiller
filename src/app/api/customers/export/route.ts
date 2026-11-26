import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';
import { escapeCsvCell, isAdminOrOwnerRole } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdminOrOwnerRole(authCheck.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 1. Get the customer ID from the URL query string
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('id')?.trim();

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    // 2. Fetch the customer strictly within the authenticated tenant
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId: authCheck.companyId,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // 3. Fetch related Bookings & Quotations scoped to authenticated companyId
    const bookings = await prisma.booking.findMany({
      where: {
        companyId: authCheck.companyId,
        customerName: customer.name,
      },
    });

    const quotations = await prisma.quotation.findMany({
      where: {
        companyId: authCheck.companyId,
        customerName: customer.name,
      },
    });

    // 4. Create the CSV Content
    let csvContent = '';

    // --- Section 1: Customer Info ---
    csvContent += '--- CLIENT PROFILE ---\n';
    csvContent += 'Name,Mobile,Email,Address\n';
    csvContent += `${[
      escapeCsvCell(customer.name),
      escapeCsvCell(customer.mobile),
      escapeCsvCell(customer.email),
      escapeCsvCell(customer.address),
    ].join(',')}\n\n`;

    // --- Section 2: Bookings ---
    csvContent += '--- BOOKINGS ---\n';
    csvContent += 'Booking ID,Vehicle No,Start Date,End Date,Status,Advance Amount\n';
    if (bookings.length > 0) {
      bookings.forEach((b) => {
        csvContent += `${[
          escapeCsvCell(b.id),
          escapeCsvCell(b.vehicleNo),
          escapeCsvCell(b.startDate.toISOString().split('T')[0]),
          escapeCsvCell(b.endDate ? b.endDate.toISOString().split('T')[0] : ''),
          escapeCsvCell(b.status),
          escapeCsvCell(b.advanceAmount),
        ].join(',')}\n`;
      });
    } else {
      csvContent += 'No bookings found.\n';
    }
    csvContent += '\n';

    // --- Section 3: Quotations ---
    csvContent += '--- QUOTATIONS ---\n';
    csvContent += 'Quotation No,Status,Total Amount,Start Date\n';
    if (quotations.length > 0) {
      quotations.forEach((q) => {
        csvContent += `${[
          escapeCsvCell(q.quotationNumber),
          escapeCsvCell(q.status),
          escapeCsvCell(q.totalAmount),
          escapeCsvCell(q.startDate ? q.startDate.toISOString().split('T')[0] : ''),
        ].join(',')}\n`;
      });
    } else {
      csvContent += 'No quotations found.\n';
    }

    const safeFilename = customer.name.replace(/[^a-zA-Z0-9_-]+/g, '_') || 'Customer';

    // 5. Send back the CSV file to be downloaded
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="Client_Data_${safeFilename}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error generating CSV:', error);
    return NextResponse.json({ error: 'Failed to generate CSV' }, { status: 500 });
  }
}
