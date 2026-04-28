'use client';

import { useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search, Car, Plus, Pencil, Trash2, Receipt, Droplets, Filter } from 'lucide-react';
import { deleteVehicle } from '@/lib/vehicle-actions';
import { type Vehicle } from '@/lib/validations';
import { VehicleExpenseManager } from '@/components/VehicleExpenseManager';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import Link from 'next/link';

interface VehicleListProps {
    initialVehicles: Vehicle[];
}

export function VehicleList({ initialVehicles }: VehicleListProps) {
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [expenseSheetOpen, setExpenseSheetOpen] = useState(false);

    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const query = searchParams.get('q') || '';
    const vehicles = initialVehicles;

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('q', term);
        } else {
            params.delete('q');
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this vehicle?')) return;

        const result = await deleteVehicle(id);
        if (!result.success) {
            alert(result.error || 'Failed to delete vehicle');
        } else {
            router.refresh();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Vehicles</h2>
                    <p className="text-muted-foreground">Manage your fleet of vehicles</p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/vehicles/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Vehicle
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Vehicle Registry</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center mb-6">
                        <div className="relative w-full md:w-1/3">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search vehicles..."
                                className="pl-8"
                                defaultValue={query}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {vehicles.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Car className="mx-auto h-12 w-12 mb-3 text-muted-foreground/20" />
                            <p className="text-lg font-medium">No vehicles found</p>
                            <p className="text-sm">Add a new vehicle to get started.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <Table className="min-w-[600px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Vehicle No.</TableHead>
                                        <TableHead>Model</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-center">Seats</TableHead>
                                        <TableHead className="text-right">Rate/Day</TableHead>
                                        <TableHead className="text-right">Km/Day</TableHead>
                                        <TableHead className="text-right">Extra Km</TableHead>
                                        <TableHead>Extra Hour</TableHead>
                                        <TableHead>Maintenance</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {vehicles.map((vehicle) => (
                                        <TableRow key={vehicle.id}>
                                            <TableCell className="font-medium">{vehicle.vehicleNo}</TableCell>
                                            <TableCell>{vehicle.model || '-'}</TableCell>
                                            <TableCell>{vehicle.category}</TableCell>
                                            <TableCell className="text-center">{vehicle.seats || '-'}</TableCell>
                                            <TableCell className="text-right">{vehicle.ratePerDay ? `Rs. ${vehicle.ratePerDay.toLocaleString('en-US')}` : '-'}</TableCell>
                                            <TableCell className="text-right">{vehicle.kmPerDay || '-'}</TableCell>
                                            <TableCell className="text-right">{vehicle.excessKmRate ? `Rs. ${vehicle.excessKmRate.toLocaleString('en-US')}` : '-'}</TableCell>
                                            <TableCell className="text-right">{vehicle.extraHourRate ? `Rs. ${vehicle.extraHourRate.toLocaleString('en-US')}` : '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {vehicle.currentMileage - vehicle.lastOilChangeMileage >= vehicle.oilChangeInterval && (
                                                        <span title="Oil Change Due" className="text-red-500">
                                                            <Droplets className="h-4 w-4" />
                                                        </span>
                                                    )}
                                                    {vehicle.currentMileage - vehicle.lastFilterChangeMileage >= vehicle.filterChangeInterval && (
                                                        <span title="Filter Change Due" className="text-orange-500">
                                                            <Filter className="h-4 w-4" />
                                                        </span>
                                                    )}
                                                    {vehicle.currentMileage - vehicle.lastWashMileage >= vehicle.washInterval && (
                                                        <span title="Body Wash Due" className="text-blue-500">
                                                            <Car className="h-4 w-4" />
                                                        </span>
                                                    )}
                                                    {!(vehicle.currentMileage - vehicle.lastOilChangeMileage >= vehicle.oilChangeInterval) &&
                                                     !(vehicle.currentMileage - vehicle.lastFilterChangeMileage >= vehicle.filterChangeInterval) &&
                                                     !(vehicle.currentMileage - vehicle.lastWashMileage >= vehicle.washInterval) && (
                                                        <span className="text-green-500 text-xs font-medium">Good</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${vehicle.status === 'ACTIVE'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {vehicle.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="mr-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() => {
                                                        setSelectedVehicle(vehicle);
                                                        setExpenseSheetOpen(true);
                                                    }}
                                                >
                                                    <Receipt className="h-4 w-4" />
                                                    <span className="sr-only">Expenses</span>
                                                </Button>
                                                <Button variant="ghost" size="sm" asChild className="mr-2">
                                                    <Link href={`/vehicles/${vehicle.id}`}>
                                                        <Pencil className="h-4 w-4" />
                                                        <span className="sr-only">Edit</span>
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(vehicle.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Delete</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
            <Sheet open={expenseSheetOpen} onOpenChange={setExpenseSheetOpen}>
                <SheetContent className="w-full sm:max-w-md md:max-w-xl overflow-y-auto pt-10">
                    <SheetHeader>
                        <SheetTitle>Vehicle Expenses</SheetTitle>
                        <SheetDescription>
                            Managing costs for {selectedVehicle?.vehicleNo}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                        {selectedVehicle && (
                            <VehicleExpenseManager vehicleNo={selectedVehicle.vehicleNo} />
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
