import { Suspense } from 'react';
import { Loader2, UserCircle, Briefcase, CreditCard, Crown, CalendarClock, Repeat } from 'lucide-react';
import { getBusinessProfile } from '@/lib/actions';
import { BusinessProfileForm } from '@/components/BusinessProfileForm';
import ProfileForm from '@/components/ProfileForm';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prisma } from '@/lib/prisma';
import { BackupButton } from '@/components/BackupButton';
import { CsvImport } from '@/components/CsvImport';
import { SubscriptionCancelButton } from '@/components/SubscriptionCancelButton';
import { ActiveWorkstationsCard } from '@/components/ActiveWorkstationsCard';
import { getCompanySubscriptionStatus } from '@/lib/subscription';
import { listActiveWorkstations } from '@/lib/workstations';

function formatBillingDate(value: Date | null): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
    });
}

function formatBillingCycleLabel(cycle: 'MONTHLY' | 'ANNUAL' | 'LIFETIME' | null, isLifetime: boolean): string {
    if (isLifetime || cycle === 'LIFETIME') return 'Lifetime VIP';
    if (cycle === 'ANNUAL') return 'Annual Billing';
    if (cycle === 'MONTHLY') return 'Monthly Billing';
    return 'Not Synced';
}

async function SettingsContent() {
    const session = await auth();

    if (!session || !session.user || !session.user.email) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        redirect('/login');
    }

    const result = await getBusinessProfile();
    const profile = result.success ? result.data : undefined;
    const isAdmin = user.role === 'ADMIN' || user.role === 'OWNER';

    const [subStatus, vehicleCount, adminCount, activeWorkstations] = await Promise.all([
        getCompanySubscriptionStatus(user.companyId),
        prisma.vehicle.count({ where: { companyId: user.companyId } }),
        prisma.user.count({ where: { companyId: user.companyId, role: { in: ['ADMIN', 'OWNER'] } } }),
        isAdmin ? listActiveWorkstations(user.companyId) : Promise.resolve([]),
    ]);

    const portalUrl =
        process.env.NEXT_PUBLIC_BITGARD_PORTAL_URL || 'https://bitgard.vercel.app/products/vigil';

    const billingCycleLabel = formatBillingCycleLabel(subStatus.billingCycle, subStatus.isLifetime);
    const periodStartFormatted = formatBillingDate(subStatus.currentPeriodStart);
    const periodEndFormatted = formatBillingDate(subStatus.currentPeriodEnd);
    const canSelfCancel =
        !subStatus.isLifetime &&
        (subStatus.status === 'ACTIVE' || subStatus.status === 'TRIALING');
    const isInactiveStatus =
        subStatus.status === 'CANCELLED' ||
        subStatus.status === 'REVOKED' ||
        subStatus.status === 'EXPIRED' ||
        subStatus.status === 'PAST_DUE';

    let renewalSummary = 'No renewal date scheduled';
    if (subStatus.isLifetime) {
        renewalSummary = 'No expiration (Lifetime VIP)';
    } else if (periodEndFormatted) {
        if (subStatus.status === 'ACTIVE' || subStatus.status === 'TRIALING') {
            renewalSummary = `Renews ${periodEndFormatted}`;
        } else if (subStatus.status === 'CANCELLED') {
            renewalSummary = `Cancelled (${periodEndFormatted})`;
        } else if (subStatus.status === 'EXPIRED') {
            renewalSummary = `Expired ${periodEndFormatted}`;
        } else {
            renewalSummary = `Period end ${periodEndFormatted}`;
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account, subscription plan, and business preferences.</p>
            </div>

            {isAdmin && (
                <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                            {subStatus.isLifetime ? (
                                <Crown className="h-5 w-5 text-amber-500 mt-0.5" />
                            ) : (
                                <CreditCard className="h-5 w-5 text-primary mt-0.5" />
                            )}
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-base font-semibold">
                                        {subStatus.entitlements.label} Plan
                                    </h2>
                                    <span
                                        className={`px-2 py-0.5 text-xs font-mono font-semibold rounded-full ${
                                            isInactiveStatus
                                                ? 'bg-destructive/15 text-destructive'
                                                : 'bg-primary/15 text-primary'
                                        }`}
                                    >
                                        {subStatus.status}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-secondary text-secondary-foreground">
                                        <Repeat className="h-3 w-3" />
                                        {billingCycleLabel}
                                    </span>
                                    {subStatus.isLifetime && (
                                        <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded-full bg-amber-500/20 text-amber-500">
                                            LIFETIME VIP
                                        </span>
                                    )}
                                    <span className="px-2 py-0.5 text-xs font-mono rounded-full bg-muted text-muted-foreground">
                                        {subStatus.enforcementActive ? 'ENFORCED' : 'TEST RUN MODE'}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {subStatus.licenseKey
                                        ? `License Key: ${subStatus.licenseKey}`
                                        : 'No Bitgard subscription synced yet'}
                                    {subStatus.note ? ` • ${subStatus.note}` : ''}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {canSelfCancel && (
                                <SubscriptionCancelButton
                                    planLabel={subStatus.entitlements.label}
                                    billingCycleLabel={billingCycleLabel}
                                    renewalDateLabel={periodEndFormatted}
                                    portalUrl={portalUrl}
                                />
                            )}
                            <a
                                href={portalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold text-primary hover:underline"
                            >
                                Manage on Bitgard Portal &rarr;
                            </a>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg border border-border/70 bg-muted/30 p-3 text-xs">
                        <div className="flex items-center gap-2">
                            <Repeat className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-muted-foreground">Billing Cycle</div>
                                <div className="font-semibold text-foreground">{billingCycleLabel}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <CalendarClock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-muted-foreground">Current Period Start</div>
                                <div className="font-semibold text-foreground">{periodStartFormatted || '—'}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <CalendarClock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <div>
                                <div className="text-muted-foreground">
                                    {subStatus.status === 'ACTIVE' || subStatus.status === 'TRIALING'
                                        ? 'Next Renewal Date'
                                        : 'Renewal / End Date'}
                                </div>
                                <div className="font-semibold text-foreground">{renewalSummary}</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border text-xs">
                        <div>
                            <span className="text-muted-foreground">Vehicles:</span>{' '}
                            <strong>{vehicleCount} / {subStatus.entitlements.maxVehicles}</strong>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Admin Users:</span>{' '}
                            <strong>{adminCount} / {subStatus.entitlements.maxAdminWorkstations}</strong>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Driver App &amp; GPS:</span>{' '}
                            <strong>{subStatus.entitlements.features.driverMobileSync ? 'Included' : 'Pro+'}</strong>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Multi-Currency &amp; Swaps:</span>{' '}
                            <strong>{subStatus.entitlements.features.multiCurrency ? 'Included' : 'Enterprise'}</strong>
                        </div>
                    </div>
                </div>
            )}

            {isAdmin && (
                <ActiveWorkstationsCard
                    workstations={activeWorkstations}
                    maxWorkstations={subStatus.entitlements.maxAdminWorkstations}
                    planLabel={subStatus.entitlements.label}
                    currentDeviceId={(session.user as { deviceId?: string }).deviceId}
                />
            )}

            <Tabs defaultValue="account" className="w-full">
                <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-2 max-w-md' : 'grid-cols-1 max-w-[200px]'}`}>
                    <TabsTrigger value="account" className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4" /> Account
                    </TabsTrigger>
                    {isAdmin && (
                        <TabsTrigger value="business" className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" /> Business Profile
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="account" className="pt-4">
                    <ProfileForm user={{ id: user.id, name: user.name, email: user.email, role: user.role }} />
                </TabsContent>

                {isAdmin && (
                    <TabsContent value="business" className="pt-4">
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold tracking-tight">Business Information</h2>
                            <p className="text-sm text-muted-foreground">
                                These details appear on invoices and reports. Only administrators can modify business settings.
                            </p>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <BusinessProfileForm initialData={profile as any} />
                            
                            <div className="mt-10 pt-6 border-t border-border">
                                <h3 className="text-lg font-medium mb-2">Data Backup</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Download a complete backup of your business data (Customers, Vehicles, Bookings, etc.) as a ZIP file containing CSVs.
                                </p>
                                {profile?.id && <BackupButton companyId={profile.id} />}
                            </div>

                            <div className="mt-6 pt-6 border-t border-border">
                                <h3 className="text-lg font-medium mb-2">Import Data</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Restore or bulk-upload business records from a previously generated ZIP backup file.
                                </p>
                                {profile?.id && <CsvImport companyId={profile.id} />}
                            </div>
                        </div>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <div className="container mx-auto py-10">
            <Suspense fallback={
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            }>
                <SettingsContent />
            </Suspense>
        </div>
    );
}
