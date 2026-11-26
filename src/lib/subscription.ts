import { prisma } from '@/lib/prisma';

export type TierName = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
export type SubscriptionStatusName =
    | 'TRIALING'
    | 'ACTIVE'
    | 'LIFETIME'
    | 'PAST_DUE'
    | 'EXPIRED'
    | 'CANCELLED'
    | 'REVOKED';

export type TierFeatureKey =
    | 'itineraryRouting'
    | 'liveGpsRadar'
    | 'driverMobileSync'
    | 'maintenanceAlerts'
    | 'multiCurrency'
    | 'vehicleSwapAudit'
    | 'rbacMultiRole';

export interface TierEntitlements {
    tier: TierName;
    label: string;
    maxVehicles: number;
    maxAdminWorkstations: number;
    features: Record<TierFeatureKey, boolean>;
}

/**
 * Canonical subscription tier limits & features matching BitgardWeb's Vigil pricing specification.
 */
export const TIER_ENTITLEMENTS: Record<TierName, TierEntitlements> = {
    STARTER: {
        tier: 'STARTER',
        label: 'Starter',
        maxVehicles: 10,
        maxAdminWorkstations: 1,
        features: {
            itineraryRouting: false,
            liveGpsRadar: false,
            driverMobileSync: false,
            maintenanceAlerts: false,
            multiCurrency: false,
            vehicleSwapAudit: false,
            rbacMultiRole: false,
        },
    },
    PROFESSIONAL: {
        tier: 'PROFESSIONAL',
        label: 'Professional',
        maxVehicles: 25,
        maxAdminWorkstations: 3,
        features: {
            itineraryRouting: true,
            liveGpsRadar: true,
            driverMobileSync: true,
            maintenanceAlerts: true,
            multiCurrency: false,
            vehicleSwapAudit: false,
            rbacMultiRole: false,
        },
    },
    ENTERPRISE: {
        tier: 'ENTERPRISE',
        label: 'Enterprise',
        maxVehicles: 75,
        maxAdminWorkstations: 10,
        features: {
            itineraryRouting: true,
            liveGpsRadar: true,
            driverMobileSync: true,
            maintenanceAlerts: true,
            multiCurrency: true,
            vehicleSwapAudit: true,
            rbacMultiRole: true,
        },
    },
};

export const FEATURE_MIN_TIER_LABEL: Record<TierFeatureKey, string> = {
    itineraryRouting: 'Professional',
    liveGpsRadar: 'Professional',
    driverMobileSync: 'Professional',
    maintenanceAlerts: 'Professional',
    multiCurrency: 'Enterprise',
    vehicleSwapAudit: 'Enterprise',
    rbacMultiRole: 'Enterprise',
};

export function isSubscriptionEnforcementEnabled(): boolean {
    return process.env.ENABLE_SUBSCRIPTION_ENFORCEMENT === 'true';
}

export interface SubscriptionAccessEvaluation {
    active: boolean;
    isLifetime: boolean;
    tier: TierName;
    status: SubscriptionStatusName | 'NONE';
    reason?: 'NO_SUBSCRIPTION' | 'EXPIRED' | 'PAST_DUE' | 'CANCELLED' | 'REVOKED';
    currentPeriodEnd: Date | null;
    licenseKey: string | null;
    note: string | null;
}

export function evaluateSubscriptionRecord(
    sub: {
        tier: string;
        status: string;
        isLifetime: boolean;
        currentPeriodEnd: Date | null;
        licenseKey?: string | null;
        note?: string | null;
    } | null,
    now: Date = new Date()
): SubscriptionAccessEvaluation {
    if (!sub) {
        return {
            active: false,
            isLifetime: false,
            tier: 'STARTER',
            status: 'NONE',
            reason: 'NO_SUBSCRIPTION',
            currentPeriodEnd: null,
            licenseKey: null,
            note: null,
        };
    }

    const tier = (['STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(sub.tier)
        ? sub.tier
        : 'STARTER') as TierName;
    const status = sub.status as SubscriptionStatusName;

    // LIFETIME licenses always bypass billing/expiry verification and grant assigned tier privileges
    if (sub.isLifetime || status === 'LIFETIME') {
        return {
            active: true,
            isLifetime: true,
            tier,
            status: 'LIFETIME',
            currentPeriodEnd: null,
            licenseKey: sub.licenseKey ?? null,
            note: sub.note ?? null,
        };
    }

    if (status === 'ACTIVE' || status === 'TRIALING') {
        if (sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() < now.getTime()) {
            return {
                active: false,
                isLifetime: false,
                tier,
                status: 'EXPIRED',
                reason: 'EXPIRED',
                currentPeriodEnd: sub.currentPeriodEnd,
                licenseKey: sub.licenseKey ?? null,
                note: sub.note ?? null,
            };
        }
        return {
            active: true,
            isLifetime: false,
            tier,
            status,
            currentPeriodEnd: sub.currentPeriodEnd,
            licenseKey: sub.licenseKey ?? null,
            note: sub.note ?? null,
        };
    }

    const reasonMap: Record<string, SubscriptionAccessEvaluation['reason']> = {
        PAST_DUE: 'PAST_DUE',
        EXPIRED: 'EXPIRED',
        CANCELLED: 'CANCELLED',
        REVOKED: 'REVOKED',
    };

    return {
        active: false,
        isLifetime: false,
        tier,
        status,
        reason: reasonMap[status] || 'EXPIRED',
        currentPeriodEnd: sub.currentPeriodEnd,
        licenseKey: sub.licenseKey ?? null,
        note: sub.note ?? null,
    };
}

export async function getCompanySubscriptionStatus(companyId: string) {
    const enforcementActive = isSubscriptionEnforcementEnabled();
    let sub = null;
    try {
        sub = await prisma.subscription.findUnique({
            where: { companyId },
        });
    } catch (error) {
        const prismaCode = (error as { code?: string })?.code;
        if (!enforcementActive && (prismaCode === 'P2021' || prismaCode === 'P2022')) {
            sub = null;
        } else {
            throw error;
        }
    }
    const evaluation = evaluateSubscriptionRecord(sub);
    const entitlements = TIER_ENTITLEMENTS[evaluation.tier];
    return {
        enforcementActive,
        ...evaluation,
        entitlements,
    };
}

export type EntitlementCheckResult =
    | {
          allowed: true;
          enforcementActive: boolean;
          tier: TierName;
          isLifetime: boolean;
          entitlements: TierEntitlements;
      }
    | {
          allowed: false;
          code: 'SUBSCRIPTION_INACTIVE' | 'TIER_UPGRADE_REQUIRED' | 'QUOTA_EXCEEDED';
          error: string;
          requiredTier?: string;
      };

export async function requireActiveSubscription(companyId: string): Promise<EntitlementCheckResult> {
    const enforcementActive = isSubscriptionEnforcementEnabled();
    if (!enforcementActive) {
        return {
            allowed: true,
            enforcementActive: false,
            tier: 'ENTERPRISE',
            isLifetime: false,
            entitlements: TIER_ENTITLEMENTS.ENTERPRISE,
        };
    }

    const state = await getCompanySubscriptionStatus(companyId);

    if (!state.active) {
        return {
            allowed: false,
            code: 'SUBSCRIPTION_INACTIVE',
            error:
                state.reason === 'NO_SUBSCRIPTION'
                    ? 'No active Vigil subscription found. Please subscribe via the Bitgard portal.'
                    : `Your Vigil subscription is ${state.status.toLowerCase()}. Please renew via the Bitgard portal.`,
        };
    }

    return {
        allowed: true,
        enforcementActive: true,
        tier: state.tier,
        isLifetime: state.isLifetime,
        entitlements: state.entitlements,
    };
}

export async function checkTierFeature(
    companyId: string,
    feature: TierFeatureKey
): Promise<EntitlementCheckResult> {
    const base = await requireActiveSubscription(companyId);
    if (!base.allowed) return base;
    if (!base.enforcementActive) return base;

    if (!base.entitlements.features[feature]) {
        const minTier = FEATURE_MIN_TIER_LABEL[feature];
        return {
            allowed: false,
            code: 'TIER_UPGRADE_REQUIRED',
            requiredTier: minTier,
            error: `This feature requires the ${minTier} tier or higher (current plan: ${base.entitlements.label}).`,
        };
    }

    return base;
}

export async function checkVehicleQuota(companyId: string): Promise<EntitlementCheckResult> {
    const base = await requireActiveSubscription(companyId);
    if (!base.allowed) return base;
    if (!base.enforcementActive) return base;

    const currentCount = await prisma.vehicle.count({ where: { companyId } });
    if (currentCount >= base.entitlements.maxVehicles) {
        return {
            allowed: false,
            code: 'QUOTA_EXCEEDED',
            error: `Vehicle limit reached (${currentCount}/${base.entitlements.maxVehicles}) for the ${base.entitlements.label} plan. Upgrade on Bitgard to add more vehicles.`,
        };
    }

    return base;
}

export async function checkUserCreationQuota(
    companyId: string,
    role: string
): Promise<EntitlementCheckResult> {
    const normalizedRole = (role || 'DRIVER').toUpperCase();
    if (normalizedRole === 'DRIVER') {
        return checkTierFeature(companyId, 'driverMobileSync');
    }

    const base = await requireActiveSubscription(companyId);
    if (!base.allowed) return base;
    if (!base.enforcementActive) return base;

    const adminCount = await prisma.user.count({
        where: { companyId, role: { in: ['ADMIN', 'OWNER'] } },
    });
    if (adminCount >= base.entitlements.maxAdminWorkstations) {
        return {
            allowed: false,
            code: 'QUOTA_EXCEEDED',
            error: `Admin workstation limit reached (${adminCount}/${base.entitlements.maxAdminWorkstations}) for the ${base.entitlements.label} plan.`,
        };
    }

    return base;
}
