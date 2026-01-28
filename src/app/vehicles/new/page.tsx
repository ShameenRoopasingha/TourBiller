import { VehicleForm } from '@/components/VehicleForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewVehiclePage() {
    return (
        <div className="container mx-auto py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Add New Vehicle</CardTitle>
                </CardHeader>
                <CardContent>
                    <VehicleForm />
                </CardContent>
            </Card>
        </div>
    );
}
