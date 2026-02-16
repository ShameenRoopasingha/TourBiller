import { TourScheduleForm } from '@/components/TourScheduleForm';

export default function NewTourSchedulePage() {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Create Tour Schedule</h1>
            <TourScheduleForm />
        </div>
    );
}
