'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Printer, Trash2, FileCheck, ArrowRight, ArrowRightLeft } from 'lucide-react';
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
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [confirmConvert, setConfirmConvert] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const filtered = quotations.filter(
        (q) =>
            q.customerName.toLowerCase().includes(search.toLowerCase()) ||
            q.tourSchedule.name.toLowerCase().includes(search.toLowerCase()) ||
            String(q.quotationNumber).includes(search)
    );

    const handleStatusUpdate = async (id: string, status: string) => {
        setUpdating(id);
        setErrorMsg(null);
        setSuccessMsg(null);
        const result = await updateQuotationStatus(id, status);
        if (!result.success) {
            setErrorMsg(result.error || 'Failed to update status');
        } else {
            setSuccessMsg(`Status updated to ${status}`);
        }
        setUpdating(null);
        router.refresh();
    };

    const executeDelete = async (id: string) => {
        setDeleting(id);
        setErrorMsg(null);
        setSuccessMsg(null);
        const result = await deleteQuotation(id);
        if (!result.success) {
            setErrorMsg(result.error || 'Failed to delete quotation');
        } else {
            setSuccessMsg('Quotation deleted successfully');
        }
        setDeleting(null);
        setConfirmDelete(null);
        router.refresh();
    };

    const executeConvertToBooking = async (id: string) => {
        setConverting(id);
        setErrorMsg(null);
        setSuccessMsg(null);
        const result = await convertQuotationToBooking(id);
        if (!result.success) {
            setErrorMsg(result.error || 'Failed to convert quotation to booking');
        } else {
            setSuccessMsg('Booking successfully created!');
            setTimeout(() => {
                router.push('/bookings');
            }, 1000);
        }
        setConverting(null);
        setConfirmConvert(null);
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

            {/* Search & Messages */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search quotations..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex-1">
                    {errorMsg && (
                        <div className="p-3 text-sm font-semibold text-red-700 bg-red-100 border border-red-200 rounded-md shadow-sm">
                            {errorMsg}
                        </div>
                    )}
                    {successMsg && (
                        <div className="p-3 text-sm font-semibold text-green-700 bg-green-100 border border-green-200 rounded-md shadow-sm">
                            {successMsg}
                        </div>
                    )}
                </div>
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
                                                {confirmDelete === q.id ? (
                                                    <div className="flex items-center gap-2 bg-destructive/10 px-2 py-1 rounded">
                                                        <span className="text-xs font-semibold text-destructive">Delete?</span>
                                                        <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={() => executeDelete(q.id)} disabled={deleting === q.id}>Yes</Button>
                                                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setConfirmDelete(null)} disabled={deleting === q.id}>No</Button>
                                                    </div>
                                                ) : confirmConvert === q.id ? (
                                                    <div className="flex items-center gap-2 bg-green-50 px-2 py-1 rounded">
                                                        <span className="text-xs font-semibold text-green-700">Convert to Booking?</span>
                                                        <Button variant="default" className="bg-green-600 hover:bg-green-700 h-7 text-xs" size="sm" onClick={() => executeConvertToBooking(q.id)} disabled={converting === q.id}>Yes</Button>
                                                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setConfirmConvert(null)} disabled={converting === q.id}>No</Button>
                                                    </div>
                                                ) : (
                                                    <>
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
                                                                disabled={updating === q.id || converting === q.id}
                                                                title={`Mark as ${NEXT_STATUS[q.status]}`}
                                                            >
                                                                <ArrowRight className="h-4 w-4" />
                                                            </Button>
                                                        )}

                                                        {q.status !== 'ACCEPTED' && q.status !== 'EXPIRED' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setConfirmConvert(q.id)}
                                                                disabled={converting === q.id || updating === q.id || confirmDelete === q.id}
                                                                title="Convert to Booking"
                                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            >
                                                                <ArrowRightLeft className="h-4 w-4" />
                                                            </Button>
                                                        )}

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setConfirmDelete(q.id)}
                                                            title="Delete Quotation"
                                                            className="text-destructive hover:text-destructive hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
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
        </div>
    );
}
