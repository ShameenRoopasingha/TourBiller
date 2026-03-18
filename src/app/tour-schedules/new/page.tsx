import { TourScheduleForm } from '@/components/TourScheduleForm';
import { getTourSchedules } from '@/lib/tour-schedule-actions';

export default async function NewTourSchedulePage() {
    const schedulesResult = await getTourSchedules();
    const existingSchedules = schedulesResult.success ? schedulesResult.data || [] : [];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Create Tour Schedule</h1>
                <p className="text-muted-foreground">Define a reusable itinerary with day-by-day details.</p>
            </div>
            <TourScheduleForm existingSchedules={existingSchedules} />
        </div>
    );
}
