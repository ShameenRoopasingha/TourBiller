import { prisma } from '@/lib/prisma';
import { getCompanySubscriptionStatus } from '@/lib/subscription';
import { isAdminOrOwnerRole } from '@/lib/crypto-utils';

export interface WorkstationSummary {
    id: string;
    deviceId: string;
    deviceLabel: string;
    platform: string | null;
    userId: string;
    userName: string;
    userEmail: string;
    status: string;
    lastSeenAt: string;
    createdAt: string;
}

export async function resolveWorkspaceSeatLimit(companyId: string): Promise<{
    maxWorkstations: number;
    planLabel: string;
}> {
    const subStatus = await getCompanySubscriptionStatus(companyId);
    // For synced workspaces (ACTIVE/TRIALING/LIFETIME/etc.), enforce tier workstation cap;
    // unprovisioned dev accounts without a subscription fall back to 10 in non-enforced mode.
    if (subStatus.status === 'NONE' && !subStatus.enforcementActive) {
        return { maxWorkstations: 10, planLabel: 'Test Mode' };
    }
    return {
        maxWorkstations: subStatus.entitlements.maxAdminWorkstations,
        planLabel: subStatus.entitlements.label,
    };
}

export async function listActiveWorkstations(companyId: string): Promise<WorkstationSummary[]> {
    const rows = await prisma.activeWorkstation.findMany({
        where: { companyId, status: 'ACTIVE' },
        orderBy: { lastSeenAt: 'desc' },
        include: {
            user: {
                select: { name: true, email: true },
            },
        },
    });

    return rows.map((row) => ({
        id: row.id,
        deviceId: row.deviceId,
        deviceLabel: row.deviceLabel,
        platform: row.platform,
        userId: row.userId,
        userName: row.user.name,
        userEmail: row.user.email,
        status: row.status,
        lastSeenAt: row.lastSeenAt.toISOString(),
        createdAt: row.createdAt.toISOString(),
    }));
}

export type RegisterWorkstationResult =
    | {
          allowed: true;
          workstationId: string;
          maxWorkstations: number;
          planLabel: string;
          switchedFromId?: string;
      }
    | {
          allowed: false;
          code: 'WORKSTATION_LIMIT_REACHED';
          maxWorkstations: number;
          planLabel: string;
          activeWorkstations: WorkstationSummary[];
      };

/**
 * Registers or refreshes an Admin/Owner workstation login against the plan's seat cap.
 * Supports self-serve replacement (`deactivateWorkstationId`) when upgrading/switching
 * away from a broken or decommissioned computer.
 */
export async function registerOrSwitchWorkstation(params: {
    companyId: string;
    userId: string;
    role: string;
    deviceId: string;
    deviceLabel: string;
    platform?: string | null;
    userAgent?: string | null;
    deactivateWorkstationId?: string;
}): Promise<RegisterWorkstationResult> {
    if (!isAdminOrOwnerRole(params.role)) {
        return {
            allowed: true,
            workstationId: 'driver-exempt',
            maxWorkstations: 0,
            planLabel: 'Driver',
        };
    }

    const cleanDeviceId = params.deviceId.trim().slice(0, 120);
    const cleanLabel = (params.deviceLabel || 'Workstation Browser').trim().slice(0, 120);
    const { maxWorkstations, planLabel } = await resolveWorkspaceSeatLimit(params.companyId);

    const activeList = await listActiveWorkstations(params.companyId);
    const existingSelf = activeList.find((w) => w.deviceId === cleanDeviceId);

    if (existingSelf) {
        await prisma.activeWorkstation.update({
            where: { id: existingSelf.id },
            data: {
                userId: params.userId,
                deviceLabel: cleanLabel,
                platform: params.platform?.slice(0, 80) || undefined,
                userAgent: params.userAgent?.slice(0, 240) || undefined,
                status: 'ACTIVE',
                revokedAt: null,
                lastSeenAt: new Date(),
            },
        });

        return {
            allowed: true,
            workstationId: existingSelf.id,
            maxWorkstations,
            planLabel,
        };
    }

    let switchedFromId: string | undefined;

    if (activeList.length >= maxWorkstations) {
        const targetId = params.deactivateWorkstationId?.trim();
        if (!targetId) {
            return {
                allowed: false,
                code: 'WORKSTATION_LIMIT_REACHED',
                maxWorkstations,
                planLabel,
                activeWorkstations: activeList,
            };
        }

        const targetRow = activeList.find((w) => w.id === targetId);
        if (!targetRow) {
            return {
                allowed: false,
                code: 'WORKSTATION_LIMIT_REACHED',
                maxWorkstations,
                planLabel,
                activeWorkstations: activeList,
            };
        }

        await prisma.activeWorkstation.update({
            where: { id: targetRow.id },
            data: {
                status: 'REVOKED',
                revokedAt: new Date(),
            },
        });
        switchedFromId = targetRow.id;
    }

    const activated = await prisma.activeWorkstation.upsert({
        where: {
            companyId_deviceId: {
                companyId: params.companyId,
                deviceId: cleanDeviceId,
            },
        },
        update: {
            userId: params.userId,
            deviceLabel: cleanLabel,
            platform: params.platform?.slice(0, 80) || null,
            userAgent: params.userAgent?.slice(0, 240) || null,
            status: 'ACTIVE',
            revokedAt: null,
            lastSeenAt: new Date(),
        },
        create: {
            companyId: params.companyId,
            userId: params.userId,
            deviceId: cleanDeviceId,
            deviceLabel: cleanLabel,
            platform: params.platform?.slice(0, 80) || null,
            userAgent: params.userAgent?.slice(0, 240) || null,
            status: 'ACTIVE',
            lastSeenAt: new Date(),
        },
    });

    return {
        allowed: true,
        workstationId: activated.id,
        maxWorkstations,
        planLabel,
        switchedFromId,
    };
}
