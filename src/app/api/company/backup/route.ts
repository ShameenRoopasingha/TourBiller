import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // මේ ඔක්කොම එකතු කරලා එක object එකක් හදනවා
    const fullBackup = {
      generatedAt: new Date().toISOString(),
      business: businessInfo,
      data: {
        users,
        vehicles,
        customers,
        bookings,
        quotations,
        tourSchedules,
        expenses,
        activities
      }
    };

    // Backup එක JSON format එකෙන් download වෙන්න දෙනවා
    // (සම්පූර්ණ business backup එකකට ගොඩක් tables තියෙන නිසා JSON තමයි වඩාත් සුදුසු)
    return new NextResponse(JSON.stringify(fullBackup, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="Business_Backup_${businessInfo.companyName?.replace(/\s+/g, '_') || companyId}.json"`,
      },
    });

  } catch (error) {
    console.error('Error generating backup:', error);
    return NextResponse.json({ error: 'Failed to generate backup' }, { status: 500 });
  }
}
