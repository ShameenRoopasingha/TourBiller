import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { VehicleForm } from '@/components/VehicleForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Vehicle } from '@/lib/validations';

async function EditVehicleForm({ id }: { id: string }) {
    const vehicle = await prisma.vehicle.findUnique({
        where: { id },
    }) as unknown as Vehicle;

    if (!vehicle) {
        return notFound();
    }

    // Ensure types match what the form expects
    return <VehicleForm vehicle={{
        ...vehicle,
        model: vehicle.model ?? '',
        ratePerDay: vehicle.ratePerDay ?? 0,
        kmPerDay: vehicle.kmPerDay ?? 0,
        excessKmRate: vehicle.excessKmRate ?? 0,
        extraHourRate: vehicle.extraHourRate ?? 0,
    }} />;
}

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <div className="container mx-auto py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Edit Vehicle</CardTitle>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}>
                        <EditVehicleForm id={id} />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}
