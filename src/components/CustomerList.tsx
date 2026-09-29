'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Loader2, Search, Users, Plus, Pencil, Trash2 } from 'lucide-react';
import { type Customer } from '@/lib/validations';
import { toast } from 'sonner';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

export function CustomerList() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const query = searchParams.get('q') || '';

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/customers${query ? `?q=${encodeURIComponent(query)}` : ''}`);
            const result = await response.json();

            if (response.ok && result.success && result.data) {
                setCustomers(result.data);
            } else {
                setError(result.error || 'Failed to fetch customers');
            }
        } catch (fetchError) {
            console.error('Error fetching customers:', fetchError);
            setError('Failed to fetch customers');
        } finally {
            setLoading(false);
        }
    }, [query]);

    useEffect(() => {
        const timeoutId = setTimeout(fetchCustomers, 300);
        return () => clearTimeout(timeoutId);
    }, [fetchCustomers]);

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('q', term);
        } else {
            params.delete('q');
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    const [deleting, setDeleting] = useState<string | null>(null);

    const executeDelete = async (id: string) => {
        setDeleting(id);
        try {
            const response = await fetch(`/api/customers/${encodeURIComponent(id)}`, { method: 'DELETE' });
            const result = await response.json();
            if (response.ok && result.success) {
                toast.success('Customer deleted successfully');
                await fetchCustomers();
            } else {
                toast.error(result.error || 'Failed to delete customer');
            }
        } catch (deleteError) {
            console.error('Error deleting customer:', deleteError);
            toast.error('Failed to delete customer');
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Customers</h2>
                    <p className="text-muted-foreground">Manage your customer database</p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/customers/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Customer
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Customer Directory</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center mb-6">
                        <div className="relative w-full md:w-1/3">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search customers..."
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
                    ) : customers.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Users className="mx-auto h-12 w-12 mb-3 text-muted-foreground/20" />
                            <p className="text-lg font-medium">No customers found</p>
                            <p className="text-sm">Add a new customer to get started.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <Table className="min-w-[500px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Mobile</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customers.map((customer) => (
                                        <TableRow key={customer.id}>
                                            <TableCell className="font-medium">{customer.name}</TableCell>
                                            <TableCell>{customer.mobile}</TableCell>
                                            <TableCell>{customer.email || '-'}</TableCell>
                                            <TableCell>{customer.address || '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" asChild className="mr-2">
                                                    <Link href={`/customers/${customer.id}`}>
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
                                                            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete {customer.name}? This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => executeDelete(customer.id)}
                                                                className="bg-red-600 hover:bg-red-700"
                                                                disabled={deleting === customer.id}
                                                            >
                                                                {deleting === customer.id ? 'Deleting...' : 'Delete'}
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
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
