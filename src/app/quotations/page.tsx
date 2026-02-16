import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getQuotations } from '@/lib/quotation-actions';
import { QuotationList } from '@/components/QuotationList';

async function QuotationsList() {
    const result = await getQuotations();
    const quotations = result.success && result.data ? result.data : [];
    return <QuotationList quotations={quotations} />;
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
