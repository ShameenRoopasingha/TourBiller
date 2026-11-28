import { Suspense } from 'react';
import { VehicleList } from '@/components/VehicleList';
import { Loader2, Car } from 'lucide-react';
import { auth } from '@/lib/auth';
import { getCompanySubscriptionStatus } from '@/lib/subscription';
import { getVehicles } from '@/lib/vehicle-actions';
import { type Vehicle } from '@/lib/validations';

async function VehiclesContainer({ query }: { query: string }) {
    const [session, result] = await Promise.all([auth(), getVehicles(query)]);
    const initialVehicles = result.success && result.data ? result.data : [];
    const companyId = (session?.user as { companyId?: string } | undefined)?.companyId;
    const subStatus = companyId ? await getCompanySubscriptionStatus(companyId) : null;

    const total = initialVehicles.length;
    const included = subStatus?.entitlements.maxVehicles ?? 10;
    const extraCount = subStatus?.isLifetime ? 0 : Math.max(0, total - included);
    const rate = subStatus?.isLifetime ? 0 : (subStatus?.entitlements.extraVehicleRateUsd ?? 2.1);
    const overageUsd = Number((extraCount * rate).toFixed(2));

    return (
        <div className="space-y-4">
            {subStatus && subStatus.enforcementActive && !subStatus.isLifetime && (
                <div
                    className={`rounded-xl border px-4 py-3 text-xs sm:text-sm flex flex-wrap items-center justify-between gap-2 ${
                        extraCount > 0
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                            : 'bg-card/70 border-border/60 text-muted-foreground'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 shrink-0 text-primary" />
                        <span>
                            <strong className="text-foreground">{subStatus.entitlements.label} Fleet Allowance:</strong>{' '}
                            {total} / {included} included vehicles used
                            {extraCount > 0
                                ? ` • ${extraCount} extra vehicle(s) active (+$${overageUsd.toFixed(2)}/mo @ $${rate.toFixed(2)}/veh)`
                                : ` • Additional vehicles beyond ${included} are metered at +$${rate.toFixed(2)}/vehicle/mo`}
                        </span>
                    </div>
                </div>
            )}
            <VehicleList initialVehicles={initialVehicles as Vehicle[]} />
        </div>
    );
}

export default async function VehiclesPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams;
    const query = typeof searchParams.q === 'string' ? searchParams.q : '';

    return (
        <div className="container flex-col mx-auto py-10">
            <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>}>
                <VehiclesContainer query={query} />
            </Suspense>
        </div>
    );
}
