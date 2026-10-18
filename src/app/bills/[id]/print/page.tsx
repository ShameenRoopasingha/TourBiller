import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getBillById, getBusinessProfile } from '@/lib/actions';
import { type Bill, type BusinessProfile } from '@/lib/validations';
import { InvoiceTemplate } from '@/components/InvoiceTemplate';



import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function PrintBill({ id }: { id: string }) {
    const session = await auth();
    const userRole = ((session?.user as { role?: string })?.role || 'DRIVER') as 'DRIVER' | 'ADMIN';

    const [billResult, profileResult] = await Promise.all([
        getBillById(id),
        getBusinessProfile()
    ]);

    if (!billResult.success || !billResult.data) {
        return notFound();
    }

    const bill = billResult.data;
    let customerEmail: string | null = null;
    let customerPhone: string | null = (bill as any).customerPhone || null;

    if (bill.customerName && bill.companyId) {
        try {
            const customer = await prisma.customer.findFirst({
                where: {
                    name: bill.customerName,
                    companyId: bill.companyId,
                },
            });
            if (customer) {
                if (customer.email) customerEmail = customer.email;
                if (!customerPhone && customer.mobile) customerPhone = customer.mobile;
                if (!customerPhone && (customer as any).phone) customerPhone = (customer as any).phone;
            }
        } catch {
            // Non-critical customer lookup failure
        }
    }

    return <InvoiceTemplate
        bill={bill as unknown as Bill}
        businessProfile={profileResult.success ? (profileResult.data as BusinessProfile) : undefined}
        userRole={userRole}
        customerEmail={customerEmail}
        customerPhone={customerPhone}
    />;
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 print:bg-white flex flex-col items-center justify-start print:block print:min-h-0 print:h-auto print:p-0 print:m-0 overflow-x-hidden">
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
