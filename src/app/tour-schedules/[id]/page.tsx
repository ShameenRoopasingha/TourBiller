import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getTourScheduleById } from '@/lib/tour-schedule-actions';
import { TourScheduleDetail } from '@/components/TourScheduleDetail';

async function ScheduleDetailContent({ id }: { id: string }) {
    const result = await getTourScheduleById(id);

    if (!result.success || !result.data) {
        return notFound();
    }

    return <TourScheduleDetail schedule={result.data} />;
}

export default async function TourSchedulePage(
    props: {
        params: Promise<{ id: string }>;
    }
) {
    const params = await props.params;
    const { id } = params;

    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <ScheduleDetailContent id={id} />
        </Suspense>
    );
}
