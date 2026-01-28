import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getBillById, getBusinessProfile } from '@/lib/actions';
import { type Bill, type BusinessProfile } from '@/lib/validations';
import { InvoiceTemplate } from '@/components/InvoiceTemplate';



async function PrintBill({ id }: { id: string }) {
    const [billResult, profileResult] = await Promise.all([
        getBillById(id),
        getBusinessProfile()
    ]);

    if (!billResult.success || !billResult.data) {
        return notFound();
    }

    return <InvoiceTemplate
        bill={billResult.data as Bill}
        businessProfile={profileResult.success ? (profileResult.data as BusinessProfile) : undefined}
    />;
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <div className="min-h-screen bg-gray-100 print:bg-white py-8 print:py-0">
            <Suspense fallback={
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            }>
                <PrintBill id={id} />
            </Suspense>
        </div>
    );
}
