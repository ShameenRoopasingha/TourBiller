import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guard';
import { CustomerForm } from '@/components/CustomerForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';



async function EditCustomerForm({ id }: { id: string }) {
    const authCheck = await requireAdmin();
    if (!authCheck.authorized) {
        return notFound();
    }

    const customer = await prisma.customer.findFirst({
        where: { id, companyId: authCheck.companyId },
    });

    if (!customer) {
        return notFound();
    }

    return <CustomerForm customer={{
        ...customer,
        mobile: customer.mobile ?? '',
        email: customer.email ?? '',
        address: customer.address ?? ''
    }} />;
}

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <div className="container mx-auto py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Edit Customer</CardTitle>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}>
                        <EditCustomerForm id={id} />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}
