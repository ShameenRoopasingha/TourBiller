import { Suspense } from 'react';
import { VehicleList } from '@/components/VehicleList';
import { Loader2 } from 'lucide-react';
import { getVehicles } from '@/lib/vehicle-actions';
import { type Vehicle } from '@/lib/validations';

async function VehiclesContainer({ query }: { query: string }) {
    const result = await getVehicles(query);
    const initialVehicles = result.success && result.data ? result.data : [];
    
    return <VehicleList initialVehicles={initialVehicles as Vehicle[]} />;
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
