import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, entityType, data } = body;

    if (!companyId || !entityType || !data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    let importedCount = 0;

    if (entityType === 'customers') {
      const customersToInsert = data
        .map((row: any) => ({
          companyId,
          name: row.Name || row.name,
          mobile: String(row.Mobile || row.mobile || ''),
          email: row.Email || row.email || null,
          address: row.Address || row.address || null,
        }))
        .filter((c: any) => c.name); // නමක් අනිවාර්යයි (Must have a name)

      const result = await prisma.customer.createMany({
        data: customersToInsert,
        skipDuplicates: true, // එකම data තිබ්බොත් skip කරනවා
      });
      importedCount = result.count;
    } 
    else if (entityType === 'vehicles') {
      const vehiclesToInsert = data
        .map((row: any) => ({
          companyId,
          vehicleNo: String(row['Vehicle No'] || row.vehicleNo || row.VehicleNo || ''),
          model: row.Model || row.model || null,
          category: row.Category || row.category || 'CAR',
          ratePerDay: parseFloat(row['Rate Per Day'] || row.ratePerDay || '0') || 0,
          kmPerDay: parseFloat(row['Km Per Day'] || row.kmPerDay || '0') || 0,
        }))
        .filter((v: any) => v.vehicleNo); // Vehicle No අනිවාර්යයි

      const result = await prisma.vehicle.createMany({
        data: vehiclesToInsert,
        skipDuplicates: true,
      });
      importedCount = result.count;
    } 
    else {
      return NextResponse.json({ error: 'Unsupported entity type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, importedCount });

  } catch (error) {
    console.error('CSV Import Error:', error);
    return NextResponse.json({ error: 'Failed to import data' }, { status: 500 });
  }
}
