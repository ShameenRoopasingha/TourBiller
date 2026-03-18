import { CustomerForm } from '@/components/CustomerForm';
import { Card, CardContent } from '@/components/ui/card';

export default function NewCustomerPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Add New Customer</h1>
                <p className="text-muted-foreground">Add a new customer to your database.</p>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <CustomerForm />
                </CardContent>
            </Card>
        </div>
    );
}
