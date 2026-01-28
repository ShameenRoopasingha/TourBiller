'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Loader2, Search, Users, Plus, Pencil, Trash2 } from 'lucide-react';
import { getCustomers, deleteCustomer } from '@/lib/customer-actions';
import { type Customer } from '@/lib/validations';
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

        const result = await getCustomers(query);

        if (result.success && result.data) {
            setCustomers(result.data);
        } else {
            setError(result.error || 'Failed to fetch customers');
        }

        setLoading(false);
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

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this customer?')) return;

        const result = await deleteCustomer(id);
        if (result.success) {
            fetchCustomers(); // Refresh list
        } else {
            alert(result.error || 'Failed to delete customer');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
                <Button asChild>
                    <Link href="/customers/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Customer
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Customer Directory</CardTitle>
                    <CardDescription>
                        Manage your customer database.
                    </CardDescription>
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
                        <div className="rounded-md border">
                            <Table>
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
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(customer.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
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
