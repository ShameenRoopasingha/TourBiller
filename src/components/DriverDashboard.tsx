'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Loader2, MapPin, Calendar, Fuel, Wrench, Zap, Settings, MoreHorizontal,
    Car, ChevronRight, CircleStop, Hotel, AlertTriangle, Droplets, Filter, Sparkles,
} from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import type { TripActivity, VehicleExpense } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QuickActionSheet } from '@/components/QuickActionSheet';
import { ThemeSwitcher } from '@/components/layout/theme-switcher';

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
    'FUEL_FILL': { icon: Fuel, color: 'text-primary', bg: 'bg-primary/10 dark:bg-primary/20', label: 'Fuel Fill' },
    'FLAT_TIRE': { icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30', label: 'Flat Tire' },
    'BREAKDOWN': { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Breakdown' },
    'STOP': { icon: CircleStop, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Stop' },
    'HOTEL_CHECKIN': { icon: Hotel, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Hotel Check-in' },
    'RESUME': { icon: Car, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Resume Trip' },
    'NOTE': { icon: MoreHorizontal, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-900/30', label: 'Note' },
};

const EXPENSE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    'REPAIR': { icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
    'BREAKDOWN': { icon: Zap, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
    'FUEL': { icon: Fuel, color: 'text-primary', bg: 'bg-primary/10 dark:bg-primary/20' },
    'SERVICE': { icon: Settings, color: 'text-primary', bg: 'bg-primary/10 dark:bg-primary/20' },
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
            try {
                const [expensesResponse, activitiesResponse] = await Promise.all([
                    fetch(`/api/vehicle-expenses?vehicleNo=${encodeURIComponent(activeTour.vehicleNo)}`),
                    fetch(`/api/trip-activities?bookingId=${encodeURIComponent(activeTour.bookingId)}`),
                ]);
                const [expResult, actResult] = await Promise.all([expensesResponse.json(), activitiesResponse.json()]);
                if (expensesResponse.ok && expResult.success && expResult.data) {
                    setRecentExpenses(expResult.data.slice(0, 5));
                }
                if (activitiesResponse.ok && actResult.success && actResult.data) {
                    setActivities(actResult.data.slice(0, 8));
                }
            } catch (error) {
                console.error('Error loading driver dashboard:', error);
            } finally {
                setLoading(false);
            }
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
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold font-subheading text-foreground">{greeting()}, {driverName}! 👋</h2>
                        <p className="text-xs text-muted-foreground mt-0.5 font-sans">Driver operations & vehicle status</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeSwitcher />
                        <Button variant="ghost" size="icon" onClick={() => router.push('/settings')} className="rounded-full bg-muted/60 border border-border/50 hover:bg-muted" title="Settings">
                            <Settings className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <Card className="border-dashed border-2 border-border/80 bg-card/60">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Car className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                        <h3 className="text-lg font-semibold font-subheading text-foreground">No Active Tour</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">
                            You don&apos;t have any active tours right now. Your admin will assign you when a new tour begins.
                        </p>
                    </CardContent>
                </Card>

                <Button
                    variant="outline"
                    className="w-full h-12 btn-tactile-secondary border border-border/70 hover:border-primary/50 text-foreground font-semibold"
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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold font-subheading text-foreground">{greeting()}, {driverName}! 👋</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Active field assignments & telematics</p>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeSwitcher />
                    <Button variant="ghost" size="icon" onClick={() => router.push('/settings')} className="rounded-full bg-muted/60 border border-border/50 hover:bg-muted" title="Settings">
                        <Settings className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Active Tour Banner with Progress */}
            <Card className="overflow-hidden border border-primary/30 shadow-[0_8px_25px_rgba(232,115,42,0.22)] bg-gradient-to-br from-[#F27830] via-[#E8732A] to-[#D6651F] dark:from-[#994716]/95 dark:via-[#6E3310]/85 dark:to-[#441F0A]/95 text-white dark:border-[#E8732A]/35 dark:shadow-[0_12px_35px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)]">
                <CardContent className="p-0">
                    <div className="p-4 text-white">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/25 dark:bg-black/40 backdrop-blur-sm border border-white/15">
                                🟢 Active Tour
                            </span>
                            <span className="text-xs font-mono opacity-90">
                                {format(startDate, 'dd MMM')}
                                {endDate ? ` → ${format(endDate, 'dd MMM')}` : ' → Ongoing'}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-14 h-14 rounded-xl bg-white/20 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/15">
                                <Car className="h-7 w-7 text-white" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-2xl sm:text-3xl font-black font-heading tracking-[0.14em] leading-none uppercase text-white drop-shadow-sm">{activeTour.vehicleNo}</h3>
                                <p className="text-xs opacity-90 mt-1 font-sans font-medium">{activeTour.vehicleModel || activeTour.vehicleCategory || 'Vehicle'}</p>
                            </div>
                        </div>

                        {/* Tour Progress Bar */}
                        <div className="mb-3">
                            <div className="flex items-center justify-between text-xs mb-1 font-mono">
                                <span className="font-semibold">
                                    Day {currentDay}{totalDays ? ` of ${totalDays}` : ''}
                                </span>
                                {progressPercent !== null && (
                                    <span className="opacity-90">{progressPercent}% complete</span>
                                )}
                            </div>
                            <div className="w-full h-2 bg-black/25 dark:bg-black/40 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white dark:bg-primary-100 rounded-full transition-all duration-500 shadow-sm"
                                    style={{ width: progressPercent !== null ? `${progressPercent}%` : '10%' }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/20 text-xs font-medium">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 opacity-80 shrink-0 text-amber-200" />
                                <span className="truncate">{activeTour.destination || 'No destination'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 opacity-80 shrink-0 text-amber-200" />
                                <span className="truncate">{activeTour.customerName}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Action Macros */}
            <Card className="border border-border/70 shadow-xs bg-card dark:bg-card/70 dark:border-border/50">
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
                    <div className="flex items-center justify-between mb-2.5 px-1">
                        <h3 className="text-sm font-bold font-subheading uppercase tracking-wider text-muted-foreground">Today&apos;s Activity</h3>
                    </div>
                    <div className="space-y-1.5">
                        {activities.map((act) => {
                            const config = ACTIVITY_CONFIG[act.type] || ACTIVITY_CONFIG['NOTE'];
                            const Icon = config.icon;
                            return (
                                <div key={act.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-card dark:bg-card/70 border border-border/70 shadow-xs">
                                    <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
                                        <Icon className={`h-4 w-4 ${config.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground">{config.label}</p>
                                        {act.note && <p className="text-xs text-muted-foreground truncate">{act.note}</p>}
                                    </div>
                                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
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
                <div className="flex items-center justify-between mb-2.5 px-1">
                    <h3 className="text-sm font-bold font-subheading uppercase tracking-wider text-muted-foreground">Recent Expenses</h3>
                    {recentExpenses.length > 0 && (
                        <span className="text-sm font-bold font-mono text-destructive">
                            Rs. {totalExpenses.toLocaleString()}
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : recentExpenses.length === 0 ? (
                    <Card className="border-dashed border-2 border-border/80 bg-card/60">
                        <CardContent className="py-6 text-center">
                            <p className="text-sm text-muted-foreground">No expenses logged yet. Tap a quick action above!</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {recentExpenses.map((exp) => {
                            const config = EXPENSE_CONFIG[exp.category] || EXPENSE_CONFIG['OTHER'];
                            const Icon = config.icon;
                            return (
                                <Card key={exp.id} className="overflow-hidden border border-border/70 shadow-xs bg-card dark:bg-card/70 dark:border-border/50">
                                    <CardContent className="p-3 flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                                            <Icon className={`h-5 w-5 ${config.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-foreground">{exp.category.replace(/_/g, ' ')}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {exp.description || format(new Date(exp.date), 'dd MMM yyyy')}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-bold font-mono text-foreground">Rs. {exp.amount.toLocaleString()}</p>
                                            <p className="text-[10px] font-mono text-muted-foreground">
                                                {format(new Date(exp.date), 'dd MMM')}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        <Button
                            variant="outline"
                            className="w-full btn-tactile-secondary border border-border/70 hover:border-primary/50 text-foreground font-semibold mt-2"
                            onClick={() => router.push('/driver/active-tour')}
                        >
                            View All Tours & Expenses <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
