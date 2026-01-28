'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, FileText, Printer, Plus } from 'lucide-react';
import { getDashboardStats } from '@/lib/dashboard-actions';

import { formatCurrency } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Activity, Banknote, Car } from 'lucide-react';
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

export function Dashboard() {
    const [stats, setStats] = useState({
        totalVehicles: 0,
        occupiedVehicles: 0,
        availableVehicles: 0,

        revenueYearly: 0,
        revenueWeekly: 0,
        revenueToday: 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recentBills: [] as any[],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ongoingBookings: [] as any[],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            setError(null);

            const result = await getDashboardStats();

            if (result.success && result.data) {
                setStats(result.data);
            } else {
                setError(result.error || 'Failed to fetch dashboard statistics');
            }

            setLoading(false);
        };

        fetchStats();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/bookings/new')}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Booking
                    </Button>
                    <Button onClick={() => router.push('/bills/new')}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Bill
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Vehicle Status
                        </CardTitle>
                        <Car className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-2xl font-bold text-green-600">{stats.availableVehicles}</div>
                                    <p className="text-xs text-muted-foreground">Available</p>
                                </div>
                                <div className="text-right border-l pl-4 border-gray-100">
                                    <div className="text-2xl font-bold text-orange-600">{stats.occupiedVehicles}</div>
                                    <p className="text-xs text-muted-foreground">Occupied</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Weekly Income
                        </CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(stats.revenueWeekly)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    This week
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Yearly Income
                        </CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(stats.revenueYearly)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Total for {new Date().getFullYear()}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Fleet Size
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{stats.totalVehicles}</div>
                                <p className="text-xs text-muted-foreground">
                                    Total vehicles
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Bills</CardTitle>
                        <CardDescription>
                            Latest generated vehicle hire bills.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
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
                        ) : stats.recentBills.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <FileText className="mx-auto h-12 w-12 mb-3 text-muted-foreground/20" />
                                <p className="text-lg font-medium">No bills found</p>
                                <p className="text-sm">Create a new bill to get started.</p>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Bill No.</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Vehicle</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stats.recentBills.map((bill) => (
                                            <TableRow key={bill.id}>
                                                <TableCell className="font-medium">#{bill.billNumber}</TableCell>
                                                <TableCell>{new Date(bill.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell>{bill.customerName}</TableCell>
                                                <TableCell>{bill.vehicleNo}</TableCell>
                                                <TableCell className="text-right font-bold text-primary">
                                                    {formatCurrency(bill.totalAmount)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <a href={`/bills/${bill.id}/print`} target="_blank" rel="noopener noreferrer">
                                                            <Printer className="h-4 w-4" />
                                                            <span className="sr-only">Print</span>
                                                        </a>
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

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Ongoing Tours</CardTitle>
                        <CardDescription>
                            Currently active vehicle bookings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : stats.ongoingBookings?.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                <Car className="mx-auto h-12 w-12 mb-3 text-muted-foreground/20" />
                                <p className="text-lg font-medium">No Ongoing Tours</p>
                                <p className="text-sm mb-4">All vehicles are currently available or scheduled for future.</p>
                                <Button variant="outline" onClick={() => router.push('/bookings')}>
                                    View All Bookings
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {stats.ongoingBookings?.map((booking) => (
                                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">{booking.vehicleNo}</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-green-100 text-green-700">
                                                    ONGOING
                                                </span>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {booking.customerName}
                                            </div>
                                            {booking.destination && (
                                                <div className="text-xs italic text-muted-foreground">
                                                    → {booking.destination}
                                                </div>
                                            )}
                                        </div>
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700" asChild>
                                            <a href={`/bills/new?vehicleNo=${encodeURIComponent(booking.vehicleNo)}&customerName=${encodeURIComponent(booking.customerName)}&bookingId=${booking.id}`}>
                                                End Tour
                                            </a>
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => router.push('/bookings')}>
                                    View All Bookings
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
