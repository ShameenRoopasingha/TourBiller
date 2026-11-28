import { prisma } from '@/lib/prisma';

export type TierName = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
export type BillingCycleName = 'MONTHLY' | 'ANNUAL' | 'LIFETIME';
export type LicenseSourceName = 'DODO_PAYMENTS' | 'MANUAL_ADMIN';
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
    extraVehicleRateUsd: number;
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
        extraVehicleRateUsd: 2.1,
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
        extraVehicleRateUsd: 1.8,
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
        extraVehicleRateUsd: 1.56,
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
    billingCycle: BillingCycleName | null;
    status: SubscriptionStatusName | 'NONE';
    reason?: 'NO_SUBSCRIPTION' | 'EXPIRED' | 'PAST_DUE' | 'CANCELLED' | 'REVOKED';
    source: LicenseSourceName | null;
    bitgardSubscriptionId: string | null;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    licenseKey: string | null;
    note: string | null;
}

function normalizeBillingCycle(raw?: string | null, isLifetime?: boolean): BillingCycleName | null {
    if (isLifetime) return 'LIFETIME';
    if (raw === 'MONTHLY' || raw === 'ANNUAL' || raw === 'LIFETIME') {
        return raw;
    }
    return null;
}

function normalizeLicenseSource(raw?: string | null): LicenseSourceName | null {
    if (raw === 'DODO_PAYMENTS' || raw === 'MANUAL_ADMIN') {
        return raw;
    }
    return null;
}

export function evaluateSubscriptionRecord(
    sub: {
        tier: string;
        billingCycle?: string | null;
        status: string;
        source?: string | null;
        isLifetime: boolean;
        bitgardSubscriptionId?: string | null;
        currentPeriodStart?: Date | null;
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
            billingCycle: null,
            status: 'NONE',
            reason: 'NO_SUBSCRIPTION',
            source: null,
            bitgardSubscriptionId: null,
            currentPeriodStart: null,
            currentPeriodEnd: null,
            licenseKey: null,
            note: null,
        };
    }

    const tier = (['STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(sub.tier)
        ? sub.tier
        : 'STARTER') as TierName;
    const status = sub.status as SubscriptionStatusName;
    const source = normalizeLicenseSource(sub.source);
    const bitgardSubscriptionId = sub.bitgardSubscriptionId ?? null;
    const currentPeriodStart = sub.currentPeriodStart ?? null;

    // LIFETIME licenses always bypass billing/expiry verification and grant assigned tier privileges
    if (sub.isLifetime || status === 'LIFETIME') {
        return {
            active: true,
            isLifetime: true,
            tier,
            billingCycle: 'LIFETIME',
            status: 'LIFETIME',
            source,
            bitgardSubscriptionId,
            currentPeriodStart,
            currentPeriodEnd: null,
            licenseKey: sub.licenseKey ?? null,
            note: sub.note ?? null,
        };
    }

    const billingCycle = normalizeBillingCycle(sub.billingCycle, false);

    if (status === 'ACTIVE' || status === 'TRIALING') {
        if (sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() < now.getTime()) {
            return {
                active: false,
                isLifetime: false,
                tier,
                billingCycle,
                status: 'EXPIRED',
                reason: 'EXPIRED',
                source,
                bitgardSubscriptionId,
                currentPeriodStart,
                currentPeriodEnd: sub.currentPeriodEnd,
                licenseKey: sub.licenseKey ?? null,
                note: sub.note ?? null,
            };
        }
        return {
            active: true,
            isLifetime: false,
            tier,
            billingCycle,
            status,
            source,
            bitgardSubscriptionId,
            currentPeriodStart,
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
        billingCycle,
        status,
        reason: reasonMap[status] || 'EXPIRED',
        source,
        bitgardSubscriptionId,
        currentPeriodStart,
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
          currentVehicles?: number;
          projectedExtraVehicles?: number;
          extraVehicleRateUsd?: number;
          projectedMonthlyOverageUsd?: number;
          overageActive?: boolean;
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
    const included = base.entitlements.maxVehicles;

    if (base.isLifetime) {
        return {
            ...base,
            currentVehicles: currentCount,
            projectedExtraVehicles: 0,
            extraVehicleRateUsd: 0,
            projectedMonthlyOverageUsd: 0,
            overageActive: false,
        };
    }

    if (process.env.HARD_BLOCK_VEHICLE_OVERAGE === 'true' && currentCount >= included) {
        return {
            allowed: false,
            code: 'QUOTA_EXCEEDED',
            error: `Vehicle limit reached (${currentCount}/${included}) for the ${base.entitlements.label} plan. Upgrade on Bitgard to add more vehicles.`,
        };
    }

    const projectedExtraVehicles = Math.max(0, currentCount + 1 - included);
    const extraVehicleRateUsd = base.entitlements.extraVehicleRateUsd;
    const projectedMonthlyOverageUsd = Number(
        (projectedExtraVehicles * extraVehicleRateUsd).toFixed(2)
    );

    return {
        ...base,
        currentVehicles: currentCount,
        projectedExtraVehicles,
        extraVehicleRateUsd,
        projectedMonthlyOverageUsd,
        overageActive: projectedExtraVehicles > 0,
    };
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
