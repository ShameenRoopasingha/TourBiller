import { Suspense } from 'react';
import { VehicleList } from '@/components/VehicleList';
import { Loader2 } from 'lucide-react';

export default function VehiclesPage() {
    return (
        <div className="container mx-auto py-10">
            <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>}>
                <VehicleList />
            </Suspense>
        </div>
    );
}
