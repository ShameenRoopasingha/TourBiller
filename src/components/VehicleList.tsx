'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search, Car, Plus, Pencil, Trash2, Receipt, Droplets, Filter } from 'lucide-react';
import { type Vehicle } from '@/lib/validations';
import { notify } from '@/lib/notifications';
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
        // Preserve expenseVehicleNo if present
        const expenseVehicleNo = searchParams.get('expenseVehicleNo');
        if (expenseVehicleNo) params.set('expenseVehicleNo', expenseVehicleNo);
        router.replace(`${pathname}?${params.toString()}`);
    };

    // Automatically open expense sheet if linked from notification
    useEffect(() => {
        const expenseVehicleNo = searchParams.get('expenseVehicleNo');
        if (expenseVehicleNo && !expenseSheetOpen && vehicles.length > 0) {
            const targetVehicle = vehicles.find(v => v.vehicleNo === expenseVehicleNo);
            if (targetVehicle) {
                setSelectedVehicle(targetVehicle);
                setExpenseSheetOpen(true);
                
                // Remove from URL so it doesn't reopen on refresh
                const newParams = new URLSearchParams(searchParams.toString());
                newParams.delete('expenseVehicleNo');
                const newUrl = newParams.toString() ? `${pathname}?${newParams.toString()}` : pathname;
                window.history.replaceState(null, '', newUrl);
            }
        }
    }, [searchParams, vehicles, expenseSheetOpen, pathname]);

    const [deleting, setDeleting] = useState<string | null>(null);

    const executeDelete = async (id: string) => {
        setDeleting(id);
        try {
            const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                notify.success('Vehicle deleted successfully');
                router.refresh();
            } else {
                notify.error(result.error || 'Failed to delete vehicle');
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error('Error deleting vehicle:', error);
            notify.error(`Delete failed: ${msg}`);
        } finally {
            setDeleting(null);
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
                        <>
                            {/* Mobile View (Card-based) */}
                            <div className="grid gap-3 md:hidden">
                                {vehicles.map((vehicle) => {
                                    const oilDue = vehicle.currentMileage - vehicle.lastOilChangeMileage >= vehicle.oilChangeInterval;
                                    const filterDue = vehicle.currentMileage - vehicle.lastFilterChangeMileage >= vehicle.filterChangeInterval;
                                    const washDue = vehicle.currentMileage - vehicle.lastWashMileage >= vehicle.washInterval;
                                    const isGood = !oilDue && !filterDue && !washDue;

                                    return (
                                        <Card key={vehicle.id} className="p-4 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-base">{vehicle.vehicleNo}</span>
                                                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-medium">
                                                            {vehicle.category}
                                                        </span>
                                                    </div>
                                                    {vehicle.model && (
                                                        <p className="text-xs text-muted-foreground mt-0.5">{vehicle.model} • {vehicle.seats || 0} seats</p>
                                                    )}
                                                </div>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                                    vehicle.status === 'ACTIVE'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400'
                                                }`}>
                                                    {vehicle.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y bg-muted/20 px-2.5 rounded-md">
                                                <div>
                                                    <span className="text-muted-foreground block text-[10px] uppercase font-medium">Rate / Day</span>
                                                    <span className="font-semibold text-foreground">
                                                        {vehicle.ratePerDay > 0 ? `Rs. ${vehicle.ratePerDay.toLocaleString('en-US')}` : 'Per Km'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block text-[10px] uppercase font-medium">Included Km</span>
                                                    <span className="font-semibold text-foreground">
                                                        {vehicle.ratePerDay > 0 ? `${vehicle.kmPerDay || 0} km` : '-'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block text-[10px] uppercase font-medium">Extra Km</span>
                                                    <span className="font-semibold text-foreground">
                                                        {vehicle.excessKmRate ? `Rs. ${vehicle.excessKmRate.toLocaleString('en-US')}` : '-'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block text-[10px] uppercase font-medium">Extra Hour</span>
                                                    <span className="font-semibold text-foreground">
                                                        {vehicle.extraHourRate ? `Rs. ${vehicle.extraHourRate.toLocaleString('en-US')}` : '-'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-xs pt-1">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-muted-foreground text-[11px]">Health:</span>
                                                    {oilDue && (
                                                        <span title="Oil Change Due" className="text-red-500 flex items-center gap-0.5 text-[11px] font-medium">
                                                            <Droplets className="h-3.5 w-3.5" /> Oil
                                                        </span>
                                                    )}
                                                    {filterDue && (
                                                        <span title="Filter Change Due" className="text-orange-500 flex items-center gap-0.5 text-[11px] font-medium">
                                                            <Filter className="h-3.5 w-3.5" /> Filter
                                                        </span>
                                                    )}
                                                    {washDue && (
                                                        <span title="Body Wash Due" className="text-blue-500 flex items-center gap-0.5 text-[11px] font-medium">
                                                            <Car className="h-3.5 w-3.5" /> Wash
                                                        </span>
                                                    )}
                                                    {isGood && (
                                                        <span className="text-green-600 dark:text-green-400 font-medium text-[11px]">Good</span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                                        onClick={() => {
                                                            setSelectedVehicle(vehicle);
                                                            setExpenseSheetOpen(true);
                                                        }}
                                                    >
                                                        <Receipt className="h-4 w-4 mr-1" />
                                                        <span className="text-xs">Costs</span>
                                                    </Button>
                                                    <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                                                        <Link href={`/vehicles/${vehicle.id}`}>
                                                            <Pencil className="h-4 w-4" />
                                                            <span className="sr-only">Edit</span>
                                                        </Link>
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30">
                                                                <Trash2 className="h-4 w-4" />
                                                                <span className="sr-only">Delete</span>
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to delete {vehicle.vehicleNo}? This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => executeDelete(vehicle.id)}
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                    disabled={deleting === vehicle.id}
                                                                >
                                                                    {deleting === vehicle.id ? 'Deleting...' : 'Delete'}
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>

                            {/* Desktop View (Table-based) */}
                            <div className="hidden md:block rounded-md border overflow-x-auto">
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
                                                <TableCell className="text-right">{vehicle.ratePerDay > 0 ? `Rs. ${vehicle.ratePerDay.toLocaleString('en-US')}` : <span className="text-xs text-muted-foreground">Per Km</span>}</TableCell>
                                                <TableCell className="text-right">{vehicle.ratePerDay > 0 ? (vehicle.kmPerDay || '-') : '-'}</TableCell>
                                                <TableCell className="text-right">{vehicle.excessKmRate ? `Rs. ${vehicle.excessKmRate.toLocaleString('en-US')}${vehicle.ratePerDay === 0 ? ' / km' : ''}` : '-'}</TableCell>
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
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                                <Trash2 className="h-4 w-4" />
                                                                <span className="sr-only">Delete</span>
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to delete {vehicle.vehicleNo}? This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => executeDelete(vehicle.id)}
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                    disabled={deleting === vehicle.id}
                                                                >
                                                                    {deleting === vehicle.id ? 'Deleting...' : 'Delete'}
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
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
