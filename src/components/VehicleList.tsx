'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Loader2, Search, Car, Plus, Pencil, Trash2 } from 'lucide-react';
import { getVehicles, deleteVehicle } from '@/lib/vehicle-actions';
import { type Vehicle } from '@/lib/validations';
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
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

export function VehicleList() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const query = searchParams.get('q') || '';

    const fetchVehicles = useCallback(async () => {
        setLoading(true);
        setError(null);

        const result = await getVehicles(query);

        if (result.success && result.data) {
            setVehicles(result.data);
        } else {
            setError(result.error || 'Failed to fetch vehicles');
        }

        setLoading(false);
    }, [query]);

    useEffect(() => {
        const timeoutId = setTimeout(fetchVehicles, 300);
        return () => clearTimeout(timeoutId);
    }, [fetchVehicles]);

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
        if (result.success) {
            fetchVehicles(); // Refresh list
        } else {
            alert(result.error || 'Failed to delete vehicle');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Vehicles</h2>
                <Button asChild>
                    <Link href="/vehicles/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Vehicle
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Vehicle Registry</CardTitle>
                    <CardDescription>
                        Manage your fleet of vehicles.
                    </CardDescription>
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

                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : vehicles.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Car className="mx-auto h-12 w-12 mb-3 text-muted-foreground/20" />
                            <p className="text-lg font-medium">No vehicles found</p>
                            <p className="text-sm">Add a new vehicle to get started.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Vehicle No.</TableHead>
                                        <TableHead>Model</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-right">Default Rate</TableHead>
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
                                            <TableCell className="text-right">{vehicle.defaultRate ? `Rs. ${vehicle.defaultRate}` : '-'}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${vehicle.status === 'ACTIVE'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {vehicle.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
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
        </div>
    );
}
