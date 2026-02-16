'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Printer, Trash2, FileCheck, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';

import { updateQuotationStatus, deleteQuotation } from '@/lib/quotation-actions';

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
    DRAFT: 'bg-gray-100 text-gray-700 border-gray-300',
    SENT: 'bg-blue-50 text-blue-700 border-blue-300',
    ACCEPTED: 'bg-green-50 text-green-700 border-green-300',
    EXPIRED: 'bg-red-50 text-red-700 border-red-300',
};

const NEXT_STATUS: Record<string, string> = {
    DRAFT: 'SENT',
    SENT: 'ACCEPTED',
};

export function QuotationList({ quotations }: QuotationListProps) {
    const [search, setSearch] = useState('');
    const [updating, setUpdating] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

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
            alert(result.error || 'Failed to update status');
        }
        setUpdating(null);
    };

    const handleDelete = async (id: string) => {
        setDeleting(id);
        const result = await deleteQuotation(id);
        if (!result.success) {
            alert(result.error || 'Failed to delete quotation');
        }
        setDeleting(null);
    };

    const fmt = formatCurrency;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileCheck className="h-6 w-6" />
                        Quotations
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Manage tour quotations for customers
                    </p>
                </div>
                <Link href="/quotations/new">
                    <Button>
                        <FileCheck className="h-4 w-4 mr-2" /> New Quotation
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
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
                        <Table>
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
                                            {new Date(q.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Link href={`/quotations/${q.id}/print`}>
                                                    <Button variant="ghost" size="sm" title="Print">
                                                        <Printer className="h-4 w-4" />
                                                    </Button>
                                                </Link>

                                                {NEXT_STATUS[q.status] && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleStatusUpdate(q.id, NEXT_STATUS[q.status])}
                                                        disabled={updating === q.id}
                                                        title={`Mark as ${NEXT_STATUS[q.status]}`}
                                                    >
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive"
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
                                                                onClick={() => handleDelete(q.id)}
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
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
