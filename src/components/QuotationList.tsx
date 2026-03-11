'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Printer, Trash2, FileCheck, ArrowRight, ArrowRightLeft, Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';
import { updateQuotationStatus, deleteQuotation, convertQuotationToBooking } from '@/lib/quotation-actions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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


interface QuotationRow {
    id: string;
    quotationNumber: number;
    customerName: string;
    customerPhone: string | null;
    totalAmount: number;
    status: string;
    startDate: Date | null;
    validUntil: Date | null;
    createdAt: Date;
    tourSchedule: {
        name: string;
        days: number;
    };
}

interface QuotationListProps {
    quotations: QuotationRow[];
}

const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-muted text-muted-foreground border-border',
    SENT: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    ACCEPTED: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    EXPIRED: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
};

const NEXT_STATUS: Record<string, string> = {
    DRAFT: 'SENT',
    SENT: 'ACCEPTED',
};

export function QuotationList({ quotations }: QuotationListProps) {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [updating, setUpdating] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [converting, setConverting] = useState<string | null>(null);
    const [dialogMessage, setDialogMessage] = useState<{ title: string; description: string; type: 'error' | 'success' } | null>(null);

    const filtered = quotations.filter(
        (q) =>
            q.customerName.toLowerCase().includes(search.toLowerCase()) ||
            q.tourSchedule.name.toLowerCase().includes(search.toLowerCase()) ||
            String(q.quotationNumber).includes(search)
    );

    const handleStatusUpdate = async (id: string, status: string) => {
        setUpdating(id);
        const result = await updateQuotationStatus(id, status);
        if (!result.success) {
            setDialogMessage({ title: 'Update Failed', description: result.error || 'Failed to update status', type: 'error' });
        } else {
            setDialogMessage({ title: 'Status Updated', description: `Quotation status updated to ${status}.`, type: 'success' });
        }
        setUpdating(null);
        router.refresh();
    };

    const executeDelete = async (id: string) => {
        setDeleting(id);
        const result = await deleteQuotation(id);
        if (!result.success) {
            setDialogMessage({ title: 'Deletion Failed', description: result.error || 'Failed to delete quotation', type: 'error' });
        } else {
            setDialogMessage({ title: 'Quotation Deleted', description: 'The quotation was deleted successfully.', type: 'success' });
        }
        setDeleting(null);
        router.refresh();
    };

    const executeConvertToBooking = async (id: string) => {
        setConverting(id);
        const result = await convertQuotationToBooking(id);
        if (!result.success) {
            setDialogMessage({ title: 'Conversion Failed', description: result.error || 'Failed to convert quotation to booking', type: 'error' });
        } else {
            setDialogMessage({ title: 'Conversion Successful', description: 'Booking successfully created!', type: 'success' });
            setTimeout(() => {
                router.push('/bookings');
            }, 1500);
        }
        setConverting(null);
    };

    const fmt = formatCurrency;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileCheck className="h-6 w-6" />
                        Quotations
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Manage tour quotations for customers
                    </p>
                </div>
                <Link href="/quotations/new" className="w-full sm:w-auto">
                    <Button className="w-full">
                        <FileCheck className="h-4 w-4 mr-2" /> New Quotation
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search quotations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">
                        {filtered.length} quotation{filtered.length !== 1 ? 's' : ''} found
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filtered.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No quotations found</p>
                            <Link href="/quotations/new" className="text-primary underline text-sm mt-2 inline-block">
                                Generate your first quotation
                            </Link>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <Table className="min-w-[600px]">
                                <TableHeader>
                                <TableRow>
                                    <TableHead>Q No.</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Tour</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-center">Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((q) => (
                                    <TableRow key={q.id}>
                                        <TableCell className="font-mono font-medium">
                                            Q-{String(q.quotationNumber).padStart(4, '0')}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{q.customerName}</p>
                                                {q.customerPhone && (
                                                    <p className="text-xs text-muted-foreground">{q.customerPhone}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="text-sm">{q.tourSchedule.name}</p>
                                                <p className="text-xs text-muted-foreground">{q.tourSchedule.days} days</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {fmt(q.totalAmount)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={`text-xs px-2 py-1 rounded border ${STATUS_COLORS[q.status] || ''}`}>
                                                {q.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center text-sm">
                                            {new Date(q.createdAt).toLocaleDateString('en-GB')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Link href={`/quotations/${q.id}`}>
                                                    <Button variant="ghost" size="sm" title="View Quotation">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                
                                                <Link href={`/quotations/${q.id}/print`}>
                                                    <Button variant="ghost" size="sm" title="Print Quotation">
                                                        <Printer className="h-4 w-4" />
                                                    </Button>
                                                </Link>

                                                {NEXT_STATUS[q.status] && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleStatusUpdate(q.id, NEXT_STATUS[q.status])}
                                                        disabled={updating === q.id || converting === q.id}
                                                        title={`Mark as ${NEXT_STATUS[q.status]}`}
                                                    >
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                {q.status !== 'ACCEPTED' && q.status !== 'EXPIRED' && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                disabled={converting === q.id || updating === q.id}
                                                                title="Convert to Booking"
                                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            >
                                                                <ArrowRightLeft className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Convert to Booking</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to convert this quotation into a confirmed booking?
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    className="bg-green-600 hover:bg-green-700"
                                                                    onClick={() => executeConvertToBooking(q.id)}
                                                                >
                                                                    Convert to Booking
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete quotation Q-{String(q.quotationNumber).padStart(4, '0')}?
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                                                onClick={() => executeDelete(q.id)}
                                                                disabled={deleting === q.id}
                                                            >
                                                                {deleting === q.id ? 'Deleting...' : 'Delete'}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Global Message Dialog */}
            <AlertDialog open={!!dialogMessage} onOpenChange={() => setDialogMessage(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className={dialogMessage?.type === 'error' ? 'text-destructive' : 'text-green-600'}>
                            {dialogMessage?.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {dialogMessage?.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDialogMessage(null)}>OK</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
