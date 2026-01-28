import { CustomerForm } from '@/components/CustomerForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewCustomerPage() {
    return (
        <div className="container mx-auto py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Add New Customer</CardTitle>
                </CardHeader>
                <CardContent>
                    <CustomerForm />
                </CardContent>
            </Card>
        </div>
    );
}
