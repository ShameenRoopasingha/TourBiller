import { Suspense } from 'react';
import Link from 'next/link';
import { getBills } from '@/lib/actions';
import { formatCurrency } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Printer, FileText } from 'lucide-react';
import { SearchInput } from '@/components/SearchInput';
import { DeleteBillButton } from '@/components/DeleteBillButton';

async function BillsList({ searchQuery }: { searchQuery?: string }) {
    const { success, data: bills, error } = await getBills(searchQuery);

    if (!success || !bills) {
        return (
            <div className="p-8 text-center text-destructive bg-destructive/10 rounded-lg">
                <p>Failed to load bills</p>
                <p className="text-sm opacity-80">{error}</p>
            </div>
        );
    }

    if (bills.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                <FileText className="mx-auto h-12 w-12 mb-3 text-muted-foreground/20" />
                <p className="text-lg font-medium">No bills found</p>
                <p className="text-sm mb-4">{searchQuery ? 'Try a different search term' : 'Create a new bill to get started'}</p>
                {!searchQuery && (
                    <Button asChild variant="outline">
                        <Link href="/bills/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Create First Bill
                        </Link>
                    </Button>
                )}
            </div>
        );
    }

    return (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Bill No.</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {bills.map((bill) => (
                        <TableRow key={bill.id}>
                            <TableCell className="font-medium">#{bill.billNumber}</TableCell>
                            <TableCell>{new Date(bill.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>{bill.customerName}</TableCell>
                            <TableCell>{bill.vehicleNo}</TableCell>
                            <TableCell>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${bill.paymentMethod === 'CASH'
                                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                    : 'bg-primary/10 text-primary'
                                    }`}>
                                    {bill.paymentMethod}
                                </span>
                            </TableCell>
                            <TableCell className="text-right font-bold text-primary">
                                {formatCurrency(bill.totalAmount)}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/bills/${bill.id}/print`} title="Print Bill">
                                        <Printer className="h-4 w-4" />
                                        <span className="sr-only">Print</span>
                                    </Link>
                                </Button>
                                <DeleteBillButton billId={bill.id} billNumber={bill.billNumber} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}

export default async function BillsPage(
    props: {
        searchParams?: Promise<{ q?: string }>;
    }
) {
    const searchParams = await props.searchParams;
    const query = searchParams?.q || '';

    return (
        <div className="container mx-auto py-10 max-w-5xl space-y-8">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bills</h1>
                    <p className="text-muted-foreground">Manage and view generated bills</p>
                </div>
                <Button asChild>
                    <Link href="/bills/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Bill
                    </Link>
                </Button>
            </div>

            <SearchInput placeholder="Search by bill no, customer, vehicle..." />

            <Suspense fallback={
                <div className="space-y-4">
                    <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
                    <div className="h-20 w-full bg-muted animate-pulse rounded-md" />
                    <div className="h-20 w-full bg-muted animate-pulse rounded-md" />
                </div>
            }>
                <BillsList searchQuery={query} />
            </Suspense>
        </div>
    );
}
