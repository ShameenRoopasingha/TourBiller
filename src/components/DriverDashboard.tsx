'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Loader2, MapPin, Calendar, Fuel, Wrench, Zap, Settings, MoreHorizontal,
    Car, ChevronRight, CircleStop, Hotel, AlertTriangle, Droplets, Filter, Sparkles,
} from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { getVehicleExpenses, type VehicleExpense } from '@/lib/vehicle-expense-actions';
import { getTripActivities, type TripActivity } from '@/lib/trip-activity-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QuickActionSheet } from '@/components/QuickActionSheet';

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

const ACTIVITY_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    'FUEL_FILL': { icon: Fuel, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Fuel Fill' },
    'FLAT_TIRE': { icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30', label: 'Flat Tire' },
    'BREAKDOWN': { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Breakdown' },
    'STOP': { icon: CircleStop, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Stop' },
    'HOTEL_CHECKIN': { icon: Hotel, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', label: 'Hotel Check-in' },
    'RESUME': { icon: Car, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Resume Trip' },
    'NOTE': { icon: MoreHorizontal, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-900/30', label: 'Note' },
};

const EXPENSE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    'REPAIR': { icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
    'BREAKDOWN': { icon: Zap, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
    'FUEL': { icon: Fuel, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    'SERVICE': { icon: Settings, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    'OIL_CHANGE': { icon: Droplets, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    'FILTER_CHANGE': { icon: Filter, color: 'text-teal-600', bg: 'bg-teal-100 dark:bg-teal-900/30' },
    'BODY_WASH': { icon: Sparkles, color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
    'OTHER': { icon: MoreHorizontal, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-900/30' },
};

export function DriverDashboard({ activeTour, driverName }: DriverDashboardProps) {
    const router = useRouter();
    const [recentExpenses, setRecentExpenses] = useState<VehicleExpense[]>([]);
    const [activities, setActivities] = useState<TripActivity[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (!activeTour) return;
        const fetchData = async () => {
            setLoading(true);
            const [expResult, actResult] = await Promise.all([
                getVehicleExpenses(activeTour.vehicleNo),
                getTripActivities(activeTour.bookingId),
            ]);
            if (expResult.success && expResult.data) {
                setRecentExpenses(expResult.data.slice(0, 5));
            }
            if (actResult.success && actResult.data) {
                setActivities(actResult.data.slice(0, 8));
            }
            setLoading(false);
        };
        fetchData();
    }, [activeTour, refreshKey]);

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

                <Button
                    variant="outline"
                    className="w-full h-12"
                    onClick={() => router.push('/driver/active-tour')}
                >
                    View Tour History <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>
        );
    }

    // Calculate tour progress
    const startDate = new Date(activeTour.startDate);
    const endDate = activeTour.endDate ? new Date(activeTour.endDate) : null;
    const today = new Date();
    const currentDay = differenceInCalendarDays(today, startDate) + 1;
    const totalDays = endDate ? differenceInCalendarDays(endDate, startDate) + 1 : null;
    const progressPercent = totalDays ? Math.min(Math.round((currentDay / totalDays) * 100), 100) : null;

    const totalExpenses = recentExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    return (
        <div className="px-1 py-4 space-y-5">
            {/* Greeting */}
            <div>
                <h2 className="text-xl font-bold">{greeting()}, {driverName}! 👋</h2>
                <p className="text-sm text-muted-foreground mt-0.5">You have an active tour</p>
            </div>

            {/* Active Tour Banner with Progress */}
            <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary/90 to-primary dark:from-primary/80 dark:to-primary/60">
                <CardContent className="p-0">
                    <div className="p-4 text-primary-foreground">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
                                🟢 Active Tour
                            </span>
                            <span className="text-xs opacity-80">
                                {format(startDate, 'dd MMM')}
                                {endDate ? ` → ${format(endDate, 'dd MMM')}` : ' → Ongoing'}
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

                        {/* Tour Progress Bar */}
                        <div className="mb-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="font-semibold">
                                    Day {currentDay}{totalDays ? ` of ${totalDays}` : ''}
                                </span>
                                {progressPercent !== null && (
                                    <span className="opacity-80">{progressPercent}% complete</span>
                                )}
                            </div>
                            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white/80 rounded-full transition-all duration-500"
                                    style={{ width: progressPercent !== null ? `${progressPercent}%` : '10%' }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/15">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 opacity-70 shrink-0" />
                                <span className="text-sm truncate">{activeTour.destination || 'No destination'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 opacity-70 shrink-0" />
                                <span className="text-sm truncate">{activeTour.customerName}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Action Macros */}
            <Card>
                <CardContent className="p-4">
                    <QuickActionSheet
                        bookingId={activeTour.bookingId}
                        vehicleNo={activeTour.vehicleNo}
                        onComplete={() => setRefreshKey(k => k + 1)}
                    />
                </CardContent>
            </Card>

            {/* Activity Timeline */}
            {activities.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-base font-semibold">Today&apos;s Activity</h3>
                    </div>
                    <div className="space-y-1">
                        {activities.map((act) => {
                            const config = ACTIVITY_CONFIG[act.type] || ACTIVITY_CONFIG['NOTE'];
                            const Icon = config.icon;
                            return (
                                <div key={act.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-card border">
                                    <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
                                        <Icon className={`h-4 w-4 ${config.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{config.label}</p>
                                        {act.note && <p className="text-xs text-muted-foreground truncate">{act.note}</p>}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                        {format(new Date(act.timestamp), 'h:mm a')}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recent Expenses */}
            <div>
                <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-base font-semibold">Recent Expenses</h3>
                    {recentExpenses.length > 0 && (
                        <span className="text-sm font-bold text-red-500">
                            Rs. {totalExpenses.toLocaleString()}
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : recentExpenses.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-6 text-center">
                            <p className="text-sm text-muted-foreground">No expenses yet. Use quick actions above!</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {recentExpenses.map((exp) => {
                            const config = EXPENSE_CONFIG[exp.category] || EXPENSE_CONFIG['OTHER'];
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

                        <Button
                            variant="ghost"
                            className="w-full text-muted-foreground"
                            onClick={() => router.push('/driver/active-tour')}
                        >
                            View All <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
