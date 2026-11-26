import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface AuditLogInput {
    companyId: string;
    actorId?: string | null;
    actorRole?: string | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    ipAddress?: string | null;
    metadata?: Record<string, unknown>;
}

/**
 * Records an immutable audit trail entry for sensitive admin actions.
 * Swallows secondary telemetry failures so primary transactions never abort on audit log failure.
 */
export async function recordAuditLog(entry: AuditLogInput): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                companyId: entry.companyId,
                actorId: entry.actorId ?? null,
                actorRole: entry.actorRole ?? null,
                action: entry.action,
                resourceType: entry.resourceType,
                resourceId: entry.resourceId ?? null,
                ipAddress: entry.ipAddress ?? null,
                metadata: entry.metadata ? (entry.metadata as Prisma.InputJsonValue) : undefined,
            },
        });
    } catch (error) {
        console.error('[AuditLog] Failed to record audit event:', error);
    }
}
