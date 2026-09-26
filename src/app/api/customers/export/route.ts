import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // 1. Get the customer ID from the URL query string
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('id');

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    // 2. Fetch the customer from the database
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // 3. Fetch related Bookings & Quotations (Matched by customerName as per schema)
    const bookings = await prisma.booking.findMany({
      where: { 
        companyId: customer.companyId,
        customerName: customer.name 
      }
    });

    const quotations = await prisma.quotation.findMany({
      where: {
        companyId: customer.companyId,
        customerName: customer.name
      }
    });

    // 4. Create the CSV Content
    let csvContent = "";
    
    // --- Section 1: Customer Info ---
    csvContent += "--- CLIENT PROFILE ---\n";
    csvContent += "Name,Mobile,Email,Address\n";
    csvContent += `"${customer.name}","${customer.mobile || ''}","${customer.email || ''}","${customer.address || ''}"\n\n`;

    // --- Section 2: Bookings ---
    csvContent += "--- BOOKINGS ---\n";
    csvContent += "Booking ID,Vehicle No,Start Date,End Date,Status,Advance Amount\n";
    if (bookings.length > 0) {
      bookings.forEach(b => {
        csvContent += `"${b.id}","${b.vehicleNo}","${b.startDate.toISOString().split('T')[0]}","${b.endDate ? b.endDate.toISOString().split('T')[0] : ''}","${b.status}","${b.advanceAmount}"\n`;
      });
    } else {
      csvContent += "No bookings found.\n";
    }
    csvContent += "\n";

    // --- Section 3: Quotations ---
    csvContent += "--- QUOTATIONS ---\n";
    csvContent += "Quotation No,Status,Total Amount,Start Date\n";
    if (quotations.length > 0) {
      quotations.forEach(q => {
        csvContent += `"${q.quotationNumber}","${q.status}","${q.totalAmount}","${q.startDate ? q.startDate.toISOString().split('T')[0] : ''}"\n`;
      });
    } else {
      csvContent += "No quotations found.\n";
    }

    // 5. Send back the CSV file to be downloaded
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="Client_Data_${customer.name.replace(/\s+/g, '_')}.csv"`,
      },
    });

  } catch (error) {
    console.error('Error generating CSV:', error);
    return NextResponse.json({ error: 'Failed to generate CSV' }, { status: 500 });
  }
}
