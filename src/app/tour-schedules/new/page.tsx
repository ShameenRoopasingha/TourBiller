import { TourScheduleForm } from '@/components/TourScheduleForm';
import { getTourSchedules } from '@/lib/tour-schedule-actions';

export default async function NewTourSchedulePage() {
    const schedulesResult = await getTourSchedules();
    const existingSchedules = schedulesResult.success ? schedulesResult.data || [] : [];

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Create Tour Schedule</h1>
            <TourScheduleForm existingSchedules={existingSchedules} />
        </div>
    );
}
