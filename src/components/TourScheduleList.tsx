'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Map, Calendar } from 'lucide-react';

import { deleteTourSchedule } from '@/lib/tour-schedule-actions';

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

interface TourScheduleRow {
    id: string;
    name: string;
    description: string | null;
    days: number;
    vehicleCategory: string;
    basePricePerPerson: number;
    items: {
        distanceKm: number;
        accommodation: number;
        meals: number;
        activities: number;
        otherCosts: number;
    }[];
    _count?: { quotations: number };
    updatedAt: Date;
}

interface TourScheduleListProps {
    schedules: TourScheduleRow[];
}

export function TourScheduleList({ schedules }: TourScheduleListProps) {
    const [search, setSearch] = useState('');
    const [deleting, setDeleting] = useState<string | null>(null);

    const filtered = schedules.filter(
        (s) =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.description?.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        setDeleting(id);
        const result = await deleteTourSchedule(id);
        if (!result.success) {
            alert(result.error || 'Failed to delete schedule');
        }
        setDeleting(null);
    };

    const calculateTotal = (items: TourScheduleRow['items']) => {
        return items.reduce(
            (sum, item) => sum + item.accommodation + item.meals + item.activities + item.otherCosts,
            0
        );
    };

    const calculateDistance = (items: TourScheduleRow['items']) => {
        return items.reduce((sum, item) => sum + item.distanceKm, 0);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Map className="h-6 w-6" />
                        Tour Schedules
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Manage reusable tour itinerary templates
                    </p>
                </div>
                <Link href="/tour-schedules/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" /> New Schedule
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search schedules..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">
                        {filtered.length} schedule{filtered.length !== 1 ? 's' : ''} found
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filtered.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Map className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No tour schedules found</p>
                            <Link href="/tour-schedules/new" className="text-primary underline text-sm mt-2 inline-block">
                                Create your first tour schedule
                            </Link>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tour Name</TableHead>
                                    <TableHead className="text-center">Days</TableHead>
                                    <TableHead className="text-center">Vehicle</TableHead>
                                    <TableHead className="text-right">Distance</TableHead>
                                    <TableHead className="text-right">Est. Cost</TableHead>
                                    <TableHead className="text-center">Quotes</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((schedule) => (
                                    <TableRow key={schedule.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{schedule.name}</p>
                                                {schedule.description && (
                                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        {schedule.description}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center gap-1 text-sm">
                                                <Calendar className="h-3 w-3" />
                                                {schedule.days}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="text-xs bg-secondary px-2 py-1 rounded">
                                                {schedule.vehicleCategory.replace('_', ' ')}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {calculateDistance(schedule.items).toFixed(0)} km
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            Rs. {calculateTotal(schedule.items).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {schedule._count?.quotations || 0}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Link href={`/tour-schedules/${schedule.id}/edit`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
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
                                                            <AlertDialogTitle>Delete Tour Schedule</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete &quot;{schedule.name}&quot;?
                                                                This will hide the schedule from the list.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(schedule.id)}
                                                                disabled={deleting === schedule.id}
                                                            >
                                                                {deleting === schedule.id ? 'Deleting...' : 'Delete'}
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
