import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guard';
import { CompanyImportSchema } from '@/lib/validations';
import { VehicleCategory } from '@prisma/client';
import { formatApiErrorResponse } from '@/lib/error-handler';

function normalizeVehicleCategory(raw: unknown): VehicleCategory {
  if (typeof raw !== 'string') return VehicleCategory.CAR;
  const normalized = raw.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (normalized in VehicleCategory) {
    return normalized as VehicleCategory;
  }
  if (normalized === 'THREE_WHEELER' || normalized === 'THREEWHEELER' || normalized === '3_WHEELER' || normalized === 'TUK' || normalized === 'TUK_TUK') {
    return VehicleCategory.THREE_WHEELER;
  }
  if (normalized === 'TRUCK' || normalized === 'LORRY') {
    return VehicleCategory.LORRY;
  }
  return VehicleCategory.CAR;
}

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON request payload' }, { status: 400 });
    }

    const parsed = CompanyImportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Invalid payload' }, { status: 400 });
    }
    const { companyId, entityType, data } = parsed.data;

    const authCheck = await requireAdmin();
    if (!authCheck.authorized || authCheck.companyId !== companyId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
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
        .filter((c: any) => c.name); // Customer name is mandatory

      const result = await prisma.customer.createMany({
        data: customersToInsert,
        skipDuplicates: true,
      });
      importedCount = result.count;
    } 
    else if (entityType === 'vehicles') {
      const vehiclesToInsert = data
        .map((row: any) => ({
          companyId,
          vehicleNo: String(row['Vehicle No'] || row.vehicleNo || row.VehicleNo || '').trim().toUpperCase(),
          model: row.Model || row.model || null,
          category: normalizeVehicleCategory(row.Category || row.category),
          ratePerDay: parseFloat(row['Rate Per Day'] || row.ratePerDay || '0') || 0,
          kmPerDay: parseFloat(row['Km Per Day'] || row.kmPerDay || '0') || 0,
        }))
        .filter((v: any) => v.vehicleNo); // Vehicle No is mandatory

      const result = await prisma.vehicle.createMany({
        data: vehiclesToInsert,
        skipDuplicates: true,
      });
      importedCount = result.count;
    } 
    else {
      return NextResponse.json({ success: false, error: 'Unsupported entity type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, importedCount });

  } catch (error) {
    return formatApiErrorResponse(error, 'Failed to import data');
  }
}
