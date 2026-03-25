'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, MapPin, Calendar, Fuel, Wrench, Zap, Settings, MoreHorizontal, Car, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { getVehicleExpenses, type VehicleExpense } from '@/lib/vehicle-expense-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ActiveTourData {
    bookingId: string;
    vehicleNo: string;
    vehicleModel?: string;
    vehicleCategory?: string;
    customerName: string;
    destination?: string;
    startDate: string;
    endDate?: string;
    notes?: string;
}

interface DriverDashboardProps {
    activeTour: ActiveTourData | null;
    driverName: string;
}

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    'REPAIR': { icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
    'BREAKDOWN': { icon: Zap, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
    'FUEL': { icon: Fuel, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    'SERVICE': { icon: Settings, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    'OIL_CHANGE': { icon: Settings, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    'FILTER_CHANGE': { icon: Settings, color: 'text-teal-600', bg: 'bg-teal-100 dark:bg-teal-900/30' },
    'BODY_WASH': { icon: Car, color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
    'OTHER': { icon: MoreHorizontal, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-900/30' },
};

export function DriverDashboard({ activeTour, driverName }: DriverDashboardProps) {
    const router = useRouter();
    const [recentExpenses, setRecentExpenses] = useState<VehicleExpense[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!activeTour) return;
        const fetchExpenses = async () => {
            setLoading(true);
            const result = await getVehicleExpenses(activeTour.vehicleNo);
            if (result.success && result.data) {
                setRecentExpenses(result.data.slice(0, 5));
            }
            setLoading(false);
        };
        fetchExpenses();
    }, [activeTour]);

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    // No active tour
    if (!activeTour) {
        return (
            <div className="px-1 py-4 space-y-6">
                <div>
                    <h2 className="text-xl font-bold">{greeting()}, {driverName}! 👋</h2>
                    <p className="text-sm text-muted-foreground mt-1">Here&apos;s your driver dashboard</p>
                </div>

                <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Car className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                        <h3 className="text-lg font-semibold">No Active Tour</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">
                            You don&apos;t have any active tours right now. Your admin will assign you when a new tour begins.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const totalExpenses = recentExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    return (
        <div className="px-1 py-4 space-y-5">
            {/* Greeting */}
            <div>
                <h2 className="text-xl font-bold">{greeting()}, {driverName}! 👋</h2>
                <p className="text-sm text-muted-foreground mt-0.5">You have an active tour</p>
            </div>

            {/* Active Tour Banner */}
            <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary/90 to-primary dark:from-primary/80 dark:to-primary/60">
                <CardContent className="p-0">
                    <div className="p-4 text-primary-foreground">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
                                🟢 Active Tour
                            </span>
                            <span className="text-xs opacity-80">
                                {format(new Date(activeTour.startDate), 'dd MMM')}
                                {activeTour.endDate ? ` → ${format(new Date(activeTour.endDate), 'dd MMM')}` : ' → Ongoing'}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-14 h-14 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                                <Car className="h-7 w-7" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-2xl font-bold font-mono tracking-wider leading-none">{activeTour.vehicleNo}</h3>
                                <p className="text-sm opacity-80 mt-0.5">{activeTour.vehicleModel || activeTour.vehicleCategory || 'Vehicle'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/15">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 opacity-70 shrink-0" />
                                <span className="text-sm truncate">{activeTour.destination || 'No destination'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 opacity-70 shrink-0" />
                                <span className="text-sm">{activeTour.customerName}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
                <Button
                    size="lg"
                    className="h-14 text-base font-semibold shadow-md"
                    onClick={() => router.push('/driver/active-tour')}
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Expense
                </Button>
                <Button
                    size="lg"
                    variant="outline"
                    className="h-14 text-base font-semibold"
                    onClick={() => router.push('/driver/active-tour')}
                >
                    <Car className="h-5 w-5 mr-2" />
                    Tour Details
                </Button>
            </div>

            {/* Recent Expenses */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold">Recent Expenses</h3>
                    {recentExpenses.length > 0 && (
                        <span className="text-sm font-bold text-red-500">
                            Total: Rs. {totalExpenses.toLocaleString()}
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : recentExpenses.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-8 text-center">
                            <p className="text-sm text-muted-foreground">No expenses recorded yet for this tour.</p>
                            <Button
                                variant="link"
                                className="mt-2 text-primary"
                                onClick={() => router.push('/driver/active-tour')}
                            >
                                Add your first expense →
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {recentExpenses.map((exp) => {
                            const config = CATEGORY_CONFIG[exp.category] || CATEGORY_CONFIG['OTHER'];
                            const Icon = config.icon;
                            return (
                                <Card key={exp.id} className="overflow-hidden">
                                    <CardContent className="p-3 flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                                            <Icon className={`h-5 w-5 ${config.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{exp.category.replace(/_/g, ' ')}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {exp.description || format(new Date(exp.date), 'dd MMM yyyy')}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-bold">Rs. {exp.amount.toLocaleString()}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {format(new Date(exp.date), 'dd MMM')}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {recentExpenses.length >= 5 && (
                            <Button
                                variant="ghost"
                                className="w-full text-muted-foreground"
                                onClick={() => router.push('/driver/active-tour')}
                            >
                                View All Expenses <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
