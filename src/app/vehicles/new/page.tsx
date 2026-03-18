import { VehicleForm } from '@/components/VehicleForm';
import { Card, CardContent } from '@/components/ui/card';

export default function NewVehiclePage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Add New Vehicle</h1>
                <p className="text-muted-foreground">Register a new vehicle in your fleet.</p>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <VehicleForm />
                </CardContent>
            </Card>
        </div>
    );
}
