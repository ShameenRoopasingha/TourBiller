'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';
import { isAdminOrOwnerRole, signBitgardSyncPayload } from '@/lib/crypto-utils';
import { recordAuditLog } from '@/lib/audit';

export interface CancelSubscriptionResult {
    success: boolean;
    error?: string;
    status?: string;
    remoteBillingCancelled?: boolean;
    portalUrl?: string;
}

function resolveBitgardPortalOrigin(): string {
    const rawUrl =
        process.env.BITGARD_PORTAL_API_URL?.trim() ||
        process.env.NEXT_PUBLIC_BITGARD_PORTAL_URL?.trim() ||
        'https://bitgard.vercel.app/products/vigil';
    try {
        return new URL(rawUrl).origin;
    } catch {
        return 'https://bitgard.vercel.app';
    }
}

/**
 * Allows an authenticated workspace Admin or Owner to cancel an active or
 * trialing subscription directly inside VIGIL.
 *
 * For Dodo-billed subscriptions synced from BitgardWeb, cancellation fails closed
 * unless BitgardWeb's signed `/api/dodo/cancel` endpoint confirms cancellation,
 * preventing local state divergence or unexpected recurring charges.
 */
export async function cancelCompanySubscription(
    reason?: string
): Promise<CancelSubscriptionResult> {
    const authCheck = await requireAuth();
    if (!authCheck.authorized) {
        return { success: false, error: authCheck.error };
    }

    if (!isAdminOrOwnerRole(authCheck.role)) {
        return {
            success: false,
            error: 'Unauthorized: Only a workspace Admin or Owner can cancel a subscription.',
        };
    }

    const portalUrl =
        process.env.NEXT_PUBLIC_BITGARD_PORTAL_URL?.trim() ||
        'https://bitgard.vercel.app/products/vigil';

    try {
        const sub = await prisma.subscription.findUnique({
            where: { companyId: authCheck.companyId },
        });

        if (!sub) {
            return {
                success: false,
                error: 'No active Bitgard subscription found for this workspace.',
                portalUrl,
            };
        }

        if (sub.isLifetime || sub.status === 'LIFETIME') {
            return {
                success: false,
                error: 'Lifetime VIP licenses never renew and cannot be cancelled.',
                portalUrl,
            };
        }

        if (sub.status === 'CANCELLED' || sub.status === 'REVOKED') {
            return {
                success: false,
                error: `This subscription is already ${sub.status.toLowerCase()}.`,
                status: sub.status,
                portalUrl,
            };
        }

        const sanitizedReason = (reason || '')
            .trim()
            .replace(/[\r\n\t]+/g, ' ')
            .slice(0, 200);

        const deliveryId = `cancel_${sub.id}_${crypto.randomUUID().slice(0, 8)}`;
        let remoteBillingCancelled = false;

        const requiresRemoteDodoCancel =
            sub.source === 'DODO_PAYMENTS' && Boolean(sub.bitgardSubscriptionId);

        if (requiresRemoteDodoCancel) {
            const syncSecret = process.env.BITGARD_SYNC_SECRET?.trim();
            if (!syncSecret) {
                return {
                    success: false,
                    error: 'Direct cancellation bridge is not configured on this server. Please cancel from the Bitgard Portal to stop recurring billing.',
                    portalUrl,
                };
            }

            const bitgardOrigin = resolveBitgardPortalOrigin();
            const rawBody = JSON.stringify({
                deliveryId,
                companyId: authCheck.companyId,
                bitgardSubscriptionId: sub.bitgardSubscriptionId,
                ownerEmail: sub.ownerEmail,
                reason: sanitizedReason || 'Cancelled from VIGIL workspace settings',
            });

            const signatureHeaders = signBitgardSyncPayload(rawBody, syncSecret, deliveryId);
            const remoteRes = await fetch(`${bitgardOrigin}/api/dodo/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...signatureHeaders,
                },
                body: rawBody,
                signal: AbortSignal.timeout(15000),
            });

            const remoteJson = (await remoteRes.json().catch(() => ({}))) as {
                error?: string;
                remoteBillingCancelled?: boolean;
            };

            if (!remoteRes.ok) {
                return {
                    success: false,
                    error:
                        remoteJson.error ||
                        'Could not confirm cancellation with Bitgard billing. Please cancel from the Bitgard Portal.',
                    portalUrl,
                };
            }

            remoteBillingCancelled = Boolean(remoteJson.remoteBillingCancelled ?? true);
        }

        const noteText = sanitizedReason
            ? `Cancelled inside VIGIL: ${sanitizedReason}`
            : 'Cancelled inside VIGIL workspace settings';

        await prisma.subscription.update({
            where: { id: sub.id },
            data: {
                status: 'CANCELLED',
                note: noteText,
                lastSyncedAt: new Date(),
            },
        });

        await prisma.subscriptionEvent.create({
            data: {
                subscriptionId: sub.id,
                deliveryId,
                eventType: 'subscription.cancelled_by_customer',
                tier: sub.tier,
                status: 'CANCELLED',
                metadata: {
                    actorUserId: authCheck.userId,
                    actorRole: authCheck.role,
                    remoteBillingCancelled,
                    reason: sanitizedReason || null,
                },
            },
        });

        await recordAuditLog({
            companyId: authCheck.companyId,
            actorId: authCheck.userId,
            actorRole: authCheck.role,
            action: 'SUBSCRIPTION_CANCEL',
            resourceType: 'Subscription',
            resourceId: sub.id,
            metadata: {
                previousStatus: sub.status,
                tier: sub.tier,
                billingCycle: sub.billingCycle,
                remoteBillingCancelled,
                reason: sanitizedReason || null,
            },
        });

        revalidatePath('/settings');
        revalidatePath('/subscription-required');

        return {
            success: true,
            status: 'CANCELLED',
            remoteBillingCancelled,
            portalUrl,
        };
    } catch (error) {
        console.error('Subscription cancellation error:', error);
        return {
            success: false,
            error: 'Unable to cancel subscription right now. Please try again or manage billing via Bitgard Portal.',
            portalUrl,
        };
    }
}

/**
 * Allows an authenticated workspace Admin or Owner to deactivate/sign out
 * an active workstation (e.g., broken/replaced computer or freeing a seat).
 */
export async function deactivateCompanyWorkstation(
    workstationId: string
): Promise<{ success: boolean; error?: string }> {
    const authCheck = await requireAuth();
    if (!authCheck.authorized) {
        return { success: false, error: authCheck.error };
    }

    if (!isAdminOrOwnerRole(authCheck.role)) {
        return {
            success: false,
            error: 'Unauthorized: Only an Admin or Owner can manage active workstations.',
        };
    }

    const cleanId = (workstationId || '').trim();
    if (!cleanId) {
        return { success: false, error: 'Missing workstation ID.' };
    }

    try {
        const target = await prisma.activeWorkstation.findFirst({
            where: {
                id: cleanId,
                companyId: authCheck.companyId,
            },
            select: { id: true, deviceLabel: true, status: true },
        });

        if (!target) {
            return { success: false, error: 'Workstation not found for this workspace.' };
        }

        await prisma.activeWorkstation.update({
            where: { id: target.id },
            data: {
                status: 'REVOKED',
                revokedAt: new Date(),
            },
        });

        await recordAuditLog({
            companyId: authCheck.companyId,
            actorId: authCheck.userId,
            actorRole: authCheck.role,
            action: 'WORKSTATION_DEACTIVATE',
            resourceType: 'ActiveWorkstation',
            resourceId: target.id,
            metadata: { deviceLabel: target.deviceLabel },
        });

        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        console.error('Workstation deactivate error:', error);
        return { success: false, error: 'Failed to deactivate workstation.' };
    }
}
