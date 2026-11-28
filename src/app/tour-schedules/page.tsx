import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { checkTierFeature, getCompanySubscriptionStatus } from '@/lib/subscription';
import { getTourSchedules } from '@/lib/tour-schedule-actions';
import { TourScheduleList } from '@/components/TourScheduleList';
import { UpgradeFeatureWall } from '@/components/UpgradeFeatureWall';

export const dynamic = 'force-dynamic';

async function SchedulesList() {
    const session = await auth();
    const companyId = (session?.user as { companyId?: string } | undefined)?.companyId;
    if (!companyId) {
        redirect('/login');
    }

    const tierCheck = await checkTierFeature(companyId, 'itineraryRouting');
    if (!tierCheck.allowed) {
        if (tierCheck.code === 'SUBSCRIPTION_INACTIVE') {
            redirect('/subscription-required');
        }
        const subStatus = await getCompanySubscriptionStatus(companyId);
        return (
            <UpgradeFeatureWall
                featureName="Tour Schedules & Multi-Day Itinerary Routing"
                description={tierCheck.error}
                requiredTier="Professional"
                currentPlan={subStatus.entitlements.label}
            />
        );
    }

    const result = await getTourSchedules();
    const schedules = result.success && result.data ? result.data : [];
    return <TourScheduleList schedules={schedules} />;
}

export default function TourSchedulesPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <SchedulesList />
        </Suspense>
    );
}
