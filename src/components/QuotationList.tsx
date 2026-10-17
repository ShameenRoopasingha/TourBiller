'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Printer, Trash2, FileCheck, ArrowRight, ArrowRightLeft, Pencil, Eye, User, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';
import { notify } from '@/lib/notifications';
import { ConvertQuotationDialog } from '@/components/ConvertQuotationDialog';

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
    customerPhone?: string | null;
    totalAmount: number;
    totalDistance?: number;
    status: string;
    startDate?: Date | null;
    endDate?: Date | null;
    validUntil?: Date | null;
    createdAt: Date;
    vehicleNo?: string | null;
    pickupLocation?: string | null;
    dropLocation?: string | null;
    driver?: {
        id: string;
        name: string;
    } | null;
    tourSchedule: {
        name: string;
        days: number;
    } | null;
}

interface QuotationListProps {
    quotations: QuotationRow[];
    drivers?: {
        id: string;
        name: string;
        email?: string | null;
    }[];
}

const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-muted text-muted-foreground border-border',
    SENT: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    ACCEPTED: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    CONVERTED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold',
    EXPIRED: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
};

const NEXT_STATUS: Record<string, string> = {
    DRAFT: 'SENT',
    SENT: 'ACCEPTED',
};

export function QuotationList({ quotations, drivers = [] }: QuotationListProps) {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [updating, setUpdating] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [converting, setConverting] = useState<string | null>(null);

    const filtered = quotations.filter(
        (q) =>
            q.customerName.toLowerCase().includes(search.toLowerCase()) ||
            (q.tourSchedule?.name || (q.pickupLocation && q.dropLocation ? `${q.pickupLocation} to ${q.dropLocation}` : '')).toLowerCase().includes(search.toLowerCase()) ||
            String(q.quotationNumber).includes(search)
    );

    const handleStatusUpdate = async (id: string, status: string) => {
        setUpdating(id);
        try {
            const response = await fetch(`/api/quotations/${encodeURIComponent(id)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                notify.error(result.error || 'Failed to update quotation status');
            } else {
                router.refresh();
                notify.success(`Quotation status updated to ${status}`);
            }
        } catch (error) {
            console.error('Error updating quotation status:', error);
            notify.error('Failed to update quotation status. Please try again.');
        } finally {
            setUpdating(null);
        }
    };

    const executeDelete = async (id: string) => {
        setDeleting(id);
        try {
            const response = await fetch(`/api/quotations/${encodeURIComponent(id)}`, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok || !result.success) {
                notify.error(result.error || 'Failed to delete quotation');
            } else {
                router.refresh();
                notify.success('Quotation deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting quotation:', error);
            notify.error('Failed to delete quotation. Please try again.');
        } finally {
            setDeleting(null);
        }
    };

    const executeConvertToBooking = async (id: string) => {
        setConverting(id);
        try {
            const response = await fetch(`/api/quotations/${encodeURIComponent(id)}/convert`, { method: 'POST' });
            const result = await response.json();
            if (!response.ok || !result.success) {
                notify.error(result.error || 'Failed to convert quotation to booking');
            } else {
                notify.success('Quotation converted to booking');
                router.refresh();
                setTimeout(() => {
                    router.push('/bookings');
                }, 1500);
            }
        } catch (error) {
            console.error('Error converting quotation:', error);
            notify.error('Failed to convert quotation to booking. Please try again.');
        } finally {
            setConverting(null);
        }
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
                        <>
                            {/* Mobile View (Card-based) */}
                            <div className="grid gap-3 md:hidden">
                                {filtered.map((q) => {
                                    const tourTitle = q.tourSchedule?.name || (q.pickupLocation && q.dropLocation ? `${q.pickupLocation} → ${q.dropLocation}` : 'Direct Route');
                                    const tourDays = q.tourSchedule?.days || (
                                        (q.startDate && q.endDate)
                                            ? Math.max(1, Math.round((new Date(q.endDate).getTime() - new Date(q.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)
                                            : 1
                                    );

                                    return (
                                        <Card key={q.id} className="p-4 space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-sm bg-muted px-2 py-0.5 rounded">
                                                            Q-{String(q.quotationNumber).padStart(4, '0')}
                                                        </span>
                                                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[q.status] || ''}`}>
                                                            {q.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {new Date(q.createdAt).toLocaleDateString('en-GB')}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-base font-bold text-primary block">
                                                        {fmt(q.totalAmount)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-1 py-2 border-y border-border/50 text-xs">
                                                <div>
                                                    <span className="font-semibold text-foreground text-sm">{q.customerName}</span>
                                                    {q.customerPhone && (
                                                        <span className="text-muted-foreground ml-1.5 font-normal">({q.customerPhone})</span>
                                                    )}
                                                </div>
                                                {q.driver && (
                                                    <div className="text-muted-foreground flex items-center gap-1">
                                                        <User className="w-3 h-3 text-primary shrink-0" />
                                                        <span>Driver: <strong className="text-foreground">{q.driver.name}</strong></span>
                                                    </div>
                                                )}
                                                <div className="text-muted-foreground pt-0.5">
                                                    <span className="text-foreground font-medium">{tourTitle}</span>
                                                    <span className="ml-1 text-[11px]">({tourDays} day{tourDays !== 1 ? 's' : ''}{(q.totalDistance && q.totalDistance > 0) ? ` • ${q.totalDistance.toFixed(0)} km` : ''})</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-1 pt-1">
                                                <div className="flex items-center gap-1">
                                                    <Link href={`/quotations/${q.id}`}>
                                                        <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs">
                                                            <Eye className="h-3.5 w-3.5 mr-1" />
                                                            View
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/quotations/${q.id}/print`}>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Print">
                                                            <Printer className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/quotations/${q.id}/edit`}>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit">
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    {NEXT_STATUS[q.status] && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-2 text-xs"
                                                            onClick={() => handleStatusUpdate(q.id, NEXT_STATUS[q.status])}
                                                            disabled={updating === q.id || converting === q.id}
                                                            title={`Mark as ${NEXT_STATUS[q.status]}`}
                                                        >
                                                            <ArrowRight className="h-3.5 w-3.5 mr-1" />
                                                            {NEXT_STATUS[q.status]}
                                                        </Button>
                                                    )}

                                                    {q.status === 'ACCEPTED' && (
                                                        <ConvertQuotationDialog
                                                            quotation={q}
                                                            drivers={drivers}
                                                            trigger={
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    title="Convert to Booking"
                                                                    className="h-8 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                >
                                                                    <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
                                                                    Book
                                                                </Button>
                                                            }
                                                        />
                                                    )}

                                                    {q.status === 'CONVERTED' && (
                                                        <Link href="/bookings">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                title="View Booking"
                                                                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700"
                                                            >
                                                                <CheckCircle2 className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                    )}

                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                <span className="sr-only">Delete</span>
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
                                                        {q.driver && (
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                <User className="w-3 h-3 text-primary shrink-0" />
                                                                <span>{q.driver.name}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {q.tourSchedule?.name || (q.pickupLocation && q.dropLocation ? `${q.pickupLocation} → ${q.dropLocation}` : 'Direct Route')}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {q.tourSchedule?.days || (
                                                                (q.startDate && q.endDate)
                                                                    ? Math.max(1, Math.round((new Date(q.endDate).getTime() - new Date(q.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)
                                                                    : 1
                                                            )} days{(q.totalDistance && q.totalDistance > 0) ? ` • ${q.totalDistance.toFixed(0)} km` : ''}
                                                        </p>
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
                                                            <Button variant="ghost" size="sm" title="View Details">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>

                                                        <Link href={`/quotations/${q.id}/edit`}>
                                                            <Button variant="ghost" size="sm" title="Edit">
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        </Link>

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

                                                        {q.status === 'ACCEPTED' && (
                                                            <ConvertQuotationDialog
                                                                quotation={q}
                                                                drivers={drivers}
                                                                trigger={
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        title="Convert to Booking (Assign Driver)"
                                                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                    >
                                                                        <ArrowRightLeft className="h-4 w-4" />
                                                                    </Button>
                                                                }
                                                            />
                                                        )}

                                                        {q.status === 'CONVERTED' && (
                                                            <Link href="/bookings">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    title="Converted to Booking (View in Bookings)"
                                                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
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
                        </>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}
