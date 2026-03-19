import { getTourSchedules } from '@/lib/tour-schedule-actions';

export default async function DebugTourSchedulesPage() {
    // Let's hardcode an example ID for debugging
    const [schedulesResult] = await Promise.all([
        getTourSchedules(),
    ]);

    if (!schedulesResult.success) {
        return <div>Error: {schedulesResult.error}</div>;
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold">Debug Tour Schedules Data</h1>

            <div>
                <h2 className="text-lg font-semibold mb-4">All Tour Schedules ({schedulesResult.data?.length || 0} records)</h2>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                    {JSON.stringify(schedulesResult.data?.map(s => ({
                        id: s.id,
                        name: s.name,
                        isActive: s.isActive
                    })) || [], null, 2)}
                </pre>
            </div>

            {(schedulesResult.data?.length || 0) > 0 && (
                <div>
                    <h2 className="text-lg font-semibold mb-4">Example of single schedule item</h2>
                    <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                        {JSON.stringify(schedulesResult.data?.[0], null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
