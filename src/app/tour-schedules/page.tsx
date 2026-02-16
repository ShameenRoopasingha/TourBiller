import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getTourSchedules } from '@/lib/tour-schedule-actions';
import { TourScheduleList } from '@/components/TourScheduleList';

async function SchedulesList() {
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
