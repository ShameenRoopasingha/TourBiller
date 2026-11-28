import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guard';
import { CompanyImportSchema } from '@/lib/validations';
import { VehicleCategory } from '@prisma/client';
import { formatApiErrorResponse } from '@/lib/error-handler';
import { checkVehicleQuota, isSubscriptionEnforcementEnabled, requireActiveSubscription } from '@/lib/subscription';
import { reportCompanyVehicleUsage } from '@/lib/vehicle-usage';
import { recordAuditLog } from '@/lib/audit';
import { getClientIp, hashIpAddress } from '@/lib/security';
import { enforceApiRateLimit } from '@/lib/api-rate-limit';

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
    let body: unknown;
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

    const rl = await enforceApiRateLimit(request, {
      prefix: 'company-import',
      identifier: companyId,
      maxAttempts: 15,
      windowMs: 15 * 60 * 1000,
    });
    if (rl.limited) return rl.response;

    const subCheck = await requireActiveSubscription(companyId);
    if (!subCheck.allowed) {
      return NextResponse.json(
        { success: false, code: subCheck.code, error: subCheck.error },
        { status: 403 }
      );
    }

    let importedCount = 0;

    if (entityType === 'customers') {
      const customersToInsert = data
        .map((row: Record<string, unknown>) => ({
          companyId,
          name: String(row.Name || row.name || ''),
          mobile: String(row.Mobile || row.mobile || ''),
          email: row.Email || row.email ? String(row.Email || row.email) : null,
          address: row.Address || row.address ? String(row.Address || row.address) : null,
        }))
        .filter((c) => Boolean(c.name)); // Customer name is mandatory

      const result = await prisma.customer.createMany({
        data: customersToInsert,
        skipDuplicates: true,
      });
      importedCount = result.count;
    } 
    else if (entityType === 'vehicles') {
      const quotaCheck = await checkVehicleQuota(companyId);
      if (!quotaCheck.allowed) {
        return NextResponse.json(
          { success: false, code: quotaCheck.code, error: quotaCheck.error },
          { status: 403 }
        );
      }

      const vehiclesToInsert = data
        .map((row: Record<string, unknown>) => ({
          companyId,
          vehicleNo: String(row['Vehicle No'] || row.vehicleNo || row.VehicleNo || '').trim().toUpperCase(),
          model: row.Model || row.model ? String(row.Model || row.model) : null,
          category: normalizeVehicleCategory(String(row.Category || row.category || '')),
          ratePerDay: parseFloat(String(row['Rate Per Day'] || row.ratePerDay || '0')) || 0,
          kmPerDay: parseFloat(String(row['Km Per Day'] || row.kmPerDay || '0')) || 0,
        }))
        .filter((v) => Boolean(v.vehicleNo)); // Vehicle No is mandatory

      if (isSubscriptionEnforcementEnabled() && process.env.HARD_BLOCK_VEHICLE_OVERAGE === 'true' && vehiclesToInsert.length > 0) {
        const existingVehicles = await prisma.vehicle.findMany({
          where: { companyId },
          select: { vehicleNo: true },
        });
        const existingSet = new Set(existingVehicles.map((v) => v.vehicleNo));
        const newUniqueNos = new Set(
          vehiclesToInsert
            .map((v) => v.vehicleNo)
            .filter((no) => !existingSet.has(no))
        );
        if (existingSet.size + newUniqueNos.size > quotaCheck.entitlements.maxVehicles) {
          const remaining = Math.max(0, quotaCheck.entitlements.maxVehicles - existingSet.size);
          return NextResponse.json(
            {
              success: false,
              code: 'QUOTA_EXCEEDED',
              error: `Bulk import exceeds vehicle limit for your ${quotaCheck.entitlements.label} plan (${existingSet.size}/${quotaCheck.entitlements.maxVehicles} used, only ${remaining} remaining slot(s)).`,
            },
            { status: 403 }
          );
        }
      }

      const result = await prisma.vehicle.createMany({
        data: vehiclesToInsert,
        skipDuplicates: true,
      });
      await reportCompanyVehicleUsage(companyId);
      importedCount = result.count;
    } 
    else {
      return NextResponse.json({ success: false, error: 'Unsupported entity type' }, { status: 400 });
    }

    await recordAuditLog({
      companyId,
      actorId: authCheck.userId,
      actorRole: authCheck.role,
      action: 'COMPANY_BULK_IMPORT',
      resourceType: entityType,
      ipAddress: hashIpAddress(getClientIp(request)),
      metadata: { entityType, importedCount },
    });

    return NextResponse.json({ success: true, importedCount });

  } catch (error) {
    return formatApiErrorResponse(error, 'Failed to import data');
  }
}
