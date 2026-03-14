import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getTourScheduleById, getTourSchedules } from '@/lib/tour-schedule-actions';
import { TourScheduleForm } from '@/components/TourScheduleForm';

async function EditForm({ id }: { id: string }) {
    const [result, schedulesResult] = await Promise.all([
        getTourScheduleById(id),
        getTourSchedules()
    ]);

    if (!result.success || !result.data) {
        return notFound();
    }

    const existingSchedules = schedulesResult.success ? schedulesResult.data || [] : [];

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Edit Tour Schedule</h1>
            <TourScheduleForm 
                initialData={result.data} 
                existingSchedules={existingSchedules}
            />
        </div>
    );
}

export default async function EditTourSchedulePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <EditForm id={id} />
        </Suspense>
    );
}
