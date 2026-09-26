'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, FileText, Calendar, Banknote } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { getDashboardStats } from '@/lib/dashboard-actions';
import Link from 'next/link';

export function NotificationBell() {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const response = await getDashboardStats();
                if (response.success && response.data) {
                    setAlerts(response.data.maintenanceAlerts || []);
                } else {
                    setAlerts([]);
                }
            } catch (error) {
                console.error("Failed to fetch alerts", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAlerts();
        const interval = setInterval(fetchAlerts, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const unreadCount = alerts.length;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative rounded-full shadow-sm bg-background/80 backdrop-blur-sm border-muted">
                    <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-background">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4 mt-2" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Bell className="h-4 w-4" /> Notifications
                    </h3>
                    <span className="text-xs bg-muted px-2 py-1 rounded-full font-medium">
                        {unreadCount} New
                    </span>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
                    ) : alerts.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                            <Bell className="h-8 w-8 text-muted-foreground/30" />
                            No new notifications
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {alerts.map((alert, i) => {
                                let href = '/dashboard';
                                if (alert.type === 'BILLING') href = '/bills';
                                else if (alert.type === 'TOUR') href = '/bookings';
                                else if (alert.type === 'MAINTENANCE') href = '/vehicles';
                                else if (alert.type === 'EXPENSE') href = '/reports';

                                return (
                                    <Link 
                                        key={i} 
                                        href={href}
                                        onClick={() => setOpen(false)}
                                        className="flex gap-3 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                                    >
                                        <div className="mt-0.5 flex-shrink-0">
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                                alert.type === 'BILLING' ? 'bg-orange-100 dark:bg-orange-900/30' : 
                                                alert.type === 'TOUR' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                                alert.type === 'EXPENSE' ? 'bg-green-100 dark:bg-green-900/30' :
                                                'bg-red-100 dark:bg-red-900/30'
                                            }`}>
                                                {alert.type === 'BILLING' ? (
                                                    <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                                ) : alert.type === 'TOUR' ? (
                                                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                ) : alert.type === 'EXPENSE' ? (
                                                    <Banknote className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                ) : (
                                                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 w-full justify-center">
                                            <p className="text-sm font-medium leading-none">{alert.title}</p>
                                            <p className="text-xs text-muted-foreground">{alert.message}</p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
