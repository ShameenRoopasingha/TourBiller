import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getQuotations } from '@/lib/quotation-actions';
import { getDrivers } from '@/lib/user-actions';
import { QuotationList } from '@/components/QuotationList';

export const dynamic = 'force-dynamic';

async function QuotationsList() {
    const [quotationsResult, driversResult] = await Promise.all([
        getQuotations(),
        getDrivers(),
    ]);
    const quotations = quotationsResult.success && quotationsResult.data ? quotationsResult.data : [];
    const drivers = driversResult.success && driversResult.data ? driversResult.data : [];
    return <QuotationList quotations={quotations} drivers={drivers} />;
}

export default function QuotationsPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <QuotationsList />
        </Suspense>
    );
}
