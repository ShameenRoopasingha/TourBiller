import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import JSZip from 'jszip';

// CSV එකක් විදියට JSON array එකක් convert කරන function එක
function toCsv(data: any[]) {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      if (val === null || val === undefined) return '';
      // Escape double quotes and wrap in quotes to prevent comma issues
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
}

export async function GET(request: NextRequest) {
  try {
    // URL එකෙන් companyId එක ගන්න
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    // අදාල Business එකේ සියලුම data DB එකෙන් ගන්න
    const [
      businessInfo,
      users,
      vehicles,
      customers,
      bookings,
      quotations,
      tourSchedules,
      expenses,
      activities
    ] = await Promise.all([
      prisma.businessProfile.findUnique({ where: { id: companyId } }),
      prisma.user.findMany({ where: { companyId } }),
      prisma.vehicle.findMany({ where: { companyId } }),
      prisma.customer.findMany({ where: { companyId } }),
      prisma.booking.findMany({ where: { companyId } }),
      prisma.quotation.findMany({ where: { companyId } }),
      prisma.tourSchedule.findMany({ where: { companyId } }),
      prisma.vehicleExpense.findMany({ where: { companyId } }),
      prisma.tripActivity.findMany({ where: { companyId } }),
    ]);

    if (!businessInfo) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // අලුත් JSZip object එකක් හදනවා
    const zip = new JSZip();
    
    // Business profile එකේ විස්තර JSON එකක් විදියටම ZIP එකට දානවා (CSV කරන්න අමාරු නිසා)
    zip.file('business_info.json', JSON.stringify(businessInfo, null, 2));

    // හැම table එකක්ම වෙන වෙනම CSV files විදියට ZIP එකට ඇතුලත් කරනවා
    if (users.length) zip.file('users.csv', toCsv(users));
    if (vehicles.length) zip.file('vehicles.csv', toCsv(vehicles));
    if (customers.length) zip.file('customers.csv', toCsv(customers));
    if (bookings.length) zip.file('bookings.csv', toCsv(bookings));
    if (quotations.length) zip.file('quotations.csv', toCsv(quotations));
    if (tourSchedules.length) zip.file('tour_schedules.csv', toCsv(tourSchedules));
    if (expenses.length) zip.file('expenses.csv', toCsv(expenses));
    if (activities.length) zip.file('activities.csv', toCsv(activities));

    // සම්පූර්ණ ZIP file එක generate කරනවා
    const zipContent = await zip.generateAsync({ type: 'uint8array' });

    // ZIP file එක download වෙන්න return කරනවා
    return new NextResponse(zipContent, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="Business_Backup_${businessInfo.companyName?.replace(/\s+/g, '_') || companyId}.zip"`,
      },
    });

  } catch (error) {
    console.error('Error generating ZIP backup:', error);
    return NextResponse.json({ error: 'Failed to generate ZIP backup' }, { status: 500 });
  }
}
