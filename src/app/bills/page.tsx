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
import { auth } from '@/lib/auth';

async function BillsList({ searchQuery, isAdmin }: { searchQuery?: string; isAdmin: boolean }) {
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
                {!searchQuery && isAdmin && (
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
        <div className="space-y-4">
            {/* Mobile View (Card-based) */}
            <div className="grid gap-4 md:hidden">
                {bills.map((bill) => (
                    <Card key={bill.id} className="p-4 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-bold text-lg text-primary">#{bill.billNumber}</div>
                                <div className="text-sm text-muted-foreground">{new Date(bill.createdAt).toLocaleDateString('en-GB')}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-lg text-primary">{formatCurrency(bill.totalAmount)}</div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${bill.paymentMethod === 'CASH'
                                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                    : 'bg-primary/10 text-primary'
                                    }`}>
                                    {bill.paymentMethod}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <span className="text-muted-foreground block text-xs uppercase tracking-wider">Customer</span>
                                <span className="font-medium">{bill.customerName}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-muted-foreground block text-xs uppercase tracking-wider">Vehicle</span>
                                <span className="font-medium font-mono">{bill.vehicleNo}</span>
                            </div>
                            <div className="col-span-2 space-y-1">
                                <span className="text-muted-foreground block text-xs uppercase tracking-wider">Tour Name</span>
                                <span className="font-medium">{bill.route}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-muted-foreground block text-xs uppercase tracking-wider">Start Date</span>
                                <span className="font-medium">{bill.startDate ? new Date(bill.startDate).toLocaleDateString('en-GB') : '-'}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-muted-foreground block text-xs uppercase tracking-wider">End Date</span>
                                <span className="font-medium">{bill.endDate ? new Date(bill.endDate).toLocaleDateString('en-GB') : '-'}</span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-dashed">
                            <Button variant="outline" size="sm" asChild className="flex-1">
                                <Link href={`/bills/${bill.id}/print`}>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print
                                </Link>
                            </Button>
                            {isAdmin && (
                                <div className="flex-none">
                                    <DeleteBillButton billId={bill.id} billNumber={bill.billNumber} />
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Desktop View (Table-based) */}
            <Card className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Bill No.</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Tour Name</TableHead>
                            <TableHead>Vehicle</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bills.map((bill) => (
                            <TableRow key={bill.id}>
                                <TableCell className="font-medium whitespace-nowrap">#{bill.billNumber}</TableCell>
                                <TableCell>{bill.customerName}</TableCell>
                                <TableCell className="max-w-[200px] truncate" title={bill.route}>{bill.route}</TableCell>
                                <TableCell>{bill.vehicleNo}</TableCell>
                                <TableCell className="whitespace-nowrap">
                                    {bill.startDate ? new Date(bill.startDate).toLocaleDateString('en-GB') : '-'}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                    {bill.endDate ? new Date(bill.endDate).toLocaleDateString('en-GB') : '-'}
                                </TableCell>
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
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/bills/${bill.id}/print`} title="Print Bill">
                                                <Printer className="h-4 w-4" />
                                                <span className="sr-only">Print</span>
                                            </Link>
                                        </Button>
                                        {isAdmin && <DeleteBillButton billId={bill.id} billNumber={bill.billNumber} />}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}

export default async function BillsPage(
    props: {
        searchParams?: Promise<{ q?: string }>;
    }
) {
    const session = await auth();
    const isAdmin = (session?.user as { role?: string })?.role === 'ADMIN';
    const searchParams = await props.searchParams;
    const query = searchParams?.q || '';

    return (
        <div className="container mx-auto py-10 max-w-7xl space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Bills</h1>
                    <p className="text-muted-foreground">Manage and view generated bills</p>
                </div>
                {isAdmin && (
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/bills/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Bill
                        </Link>
                    </Button>
                )}
            </div>

            <SearchInput placeholder="Search by bill no, customer, vehicle..." />

            <Suspense fallback={
                <div className="space-y-4">
                    <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
                    <div className="h-20 w-full bg-muted animate-pulse rounded-md" />
                    <div className="h-20 w-full bg-muted animate-pulse rounded-md" />
                </div>
            }>
                <BillsList searchQuery={query} isAdmin={isAdmin} />
            </Suspense>
        </div>
    );
}

