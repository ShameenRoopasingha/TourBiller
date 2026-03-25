'use client';

import { useState } from 'react';
import { format, differenceInCalendarDays } from 'date-fns';
import { Car, MapPin, Calendar, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { VehicleExpenseManager } from '@/components/VehicleExpenseManager';
import { QuickActionSheet } from '@/components/QuickActionSheet';

interface BookingData {
    id: string;
    vehicleNo: string;
    customerName: string;
    destination: string | null;
    startDate: string;
    endDate: string | null;
    status: string;
    notes: string | null;
}

interface VehicleData {
    model: string | null;
    category: string | null;
    seats: number | null;
    acType: string | null;
    currentMileage: number | null;
}

interface DriverTourTabsProps {
    activeBooking: BookingData | null;
    vehicle: VehicleData | null;
    upcomingBookings: BookingData[];
    completedBookings: BookingData[];
}

const TABS = ['Current', 'Upcoming', 'Completed'] as const;

export function DriverTourTabs({ activeBooking, vehicle, upcomingBookings, completedBookings }: DriverTourTabsProps) {
    const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Current');
    const [refreshKey, setRefreshKey] = useState(0);

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">My Tours</h2>

            {/* Tab Bar */}
            <div className="flex rounded-lg bg-muted p-1 gap-1">
                {TABS.map((tab) => {
                    const count = tab === 'Upcoming' ? upcomingBookings.length
                        : tab === 'Completed' ? completedBookings.length
                        : activeBooking ? 1 : 0;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2.5 px-3 rounded-md text-sm font-semibold transition-all ${
                                activeTab === tab
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {tab}
                            {count > 0 && (
                                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                                    activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20'
                                }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Current Tab */}
            {activeTab === 'Current' && (
                <div className="space-y-5">
                    {!activeBooking ? (
                        <Card className="border-dashed border-2">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <Car className="h-10 w-10 text-muted-foreground/40" />
                                </div>
                                <h3 className="text-lg font-semibold">No Active Tour</h3>
                                <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">
                                    You are not currently assigned to any active tours.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Tour Progress Banner */}
                            <TourBanner booking={activeBooking} vehicle={vehicle} />

                            {/* Quick Actions */}
                            <Card>
                                <CardContent className="p-4">
                                    <QuickActionSheet
                                        bookingId={activeBooking.id}
                                        vehicleNo={activeBooking.vehicleNo}
                                        onComplete={() => setRefreshKey(k => k + 1)}
                                    />
                                </CardContent>
                            </Card>

                            {/* Expense Manager */}
                            <VehicleExpenseManager
                                key={refreshKey}
                                vehicleNo={activeBooking.vehicleNo}
                                bookingId={activeBooking.id}
                                userRole="DRIVER"
                            />
                        </>
                    )}
                </div>
            )}

            {/* Upcoming Tab */}
            {activeTab === 'Upcoming' && (
                <div className="space-y-2">
                    {upcomingBookings.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="py-10 text-center">
                                <Clock className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                                <p className="text-sm text-muted-foreground">No upcoming tours scheduled.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        upcomingBookings.map((booking) => (
                            <BookingCard key={booking.id} booking={booking} variant="upcoming" />
                        ))
                    )}
                </div>
            )}

            {/* Completed Tab */}
            {activeTab === 'Completed' && (
                <div className="space-y-2">
                    {completedBookings.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="py-10 text-center">
                                <CheckCircle2 className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                                <p className="text-sm text-muted-foreground">No completed tours yet.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        completedBookings.map((booking) => (
                            <BookingCard key={booking.id} booking={booking} variant="completed" />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

function TourBanner({ booking, vehicle }: { booking: BookingData; vehicle: VehicleData | null }) {
    const startDate = new Date(booking.startDate);
    const endDate = booking.endDate ? new Date(booking.endDate) : null;
    const today = new Date();
    const currentDay = differenceInCalendarDays(today, startDate) + 1;
    const totalDays = endDate ? differenceInCalendarDays(endDate, startDate) + 1 : null;
    const progressPercent = totalDays ? Math.min(Math.round((currentDay / totalDays) * 100), 100) : null;

    return (
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary/90 to-primary dark:from-primary/80 dark:to-primary/60">
            <CardContent className="p-4 text-primary-foreground">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20">
                        🟢 Active
                    </span>
                    <span className="text-xs opacity-80">
                        {format(startDate, 'dd MMM')}
                        {endDate ? ` → ${format(endDate, 'dd MMM')}` : ' → Ongoing'}
                    </span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                        <Car className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-xl font-bold font-mono tracking-wider leading-none">{booking.vehicleNo}</h3>
                        <p className="text-sm opacity-80 mt-0.5">
                            {vehicle?.model || vehicle?.category || 'Vehicle'}
                            {vehicle?.seats ? ` • ${vehicle.seats} Seats` : ''}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold">Day {currentDay}{totalDays ? ` of ${totalDays}` : ''}</span>
                        {progressPercent !== null && <span className="opacity-80">{progressPercent}%</span>}
                    </div>
                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white/80 rounded-full transition-all"
                            style={{ width: progressPercent !== null ? `${progressPercent}%` : '10%' }}
                        />
                    </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/15 text-sm">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 opacity-70 shrink-0" />
                        <span className="truncate">{booking.customerName}</span>
                        {booking.destination && (
                            <>
                                <ArrowRight className="h-3 w-3 opacity-50 shrink-0" />
                                <span className="truncate">{booking.destination}</span>
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function BookingCard({ booking, variant }: { booking: BookingData; variant: 'upcoming' | 'completed' }) {
    const startDate = new Date(booking.startDate);
    const endDate = booking.endDate ? new Date(booking.endDate) : null;
    const totalDays = endDate ? differenceInCalendarDays(endDate, startDate) + 1 : null;

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            variant === 'upcoming' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'
                        }`}>
                            {variant === 'upcoming'
                                ? <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                : <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            }
                        </div>
                        <div>
                            <h4 className="text-sm font-bold font-mono">{booking.vehicleNo}</h4>
                            <p className="text-xs text-muted-foreground">{booking.customerName}</p>
                        </div>
                    </div>
                    {totalDays && (
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {totalDays} day{totalDays > 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 pt-2 border-t">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                            {format(startDate, 'dd MMM yyyy')}
                            {endDate ? ` → ${format(endDate, 'dd MMM')}` : ''}
                        </span>
                    </div>
                    {booking.destination && (
                        <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{booking.destination}</span>
                        </div>
                    )}
                </div>

                {booking.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic truncate">{booking.notes}</p>
                )}
            </CardContent>
        </Card>
    );
}
