import { Suspense } from 'react';
import { CustomerList } from '@/components/CustomerList';
import { Loader2 } from 'lucide-react';

export default function CustomersPage() {
    return (
        <div className="container mx-auto py-10">
            <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>}>
                <CustomerList />
            </Suspense>
        </div>
    );
}
