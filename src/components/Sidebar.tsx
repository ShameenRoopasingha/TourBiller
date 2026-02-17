'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Car, Users, FileText, CalendarDays, Settings, Map, FileCheck, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

const emptySubscribe = () => () => { };

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Vehicles', href: '/vehicles', icon: Car },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Bookings', href: '/bookings', icon: CalendarDays },
    { name: 'Tour Schedules', href: '/tour-schedules', icon: Map },
    { name: 'Quotations', href: '/quotations', icon: FileCheck },
    { name: 'Bills', href: '/bills', icon: FileText },
];

export function Sidebar() {
    const pathname = usePathname();
    const { resolvedTheme, setTheme } = useTheme();
    const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

    return (
        <div className="h-screen w-64 bg-card border-r border-border flex flex-col fixed left-0 top-0">
            <div className="p-6 border-b border-border">
                <Link href="/" className="flex items-center gap-2 font-bold text-2xl tracking-tight">
                    <span className="text-primary">Tour</span>Biller
                </Link>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href}>
                            <div className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}>
                                <item.icon className="h-5 w-5" />
                                <span className="font-medium">{item.name}</span>
                            </div>
                        </Link>
                    );
                })}
                <div className="pt-4 mt-4 border-t">
                    {/* Settings moved to bottom footer */}
                </div>
            </nav>

            <div className="p-4 border-t border-border flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                    <span className="font-semibold">TourBiller</span> v0.1
                </div>
                <div className="flex items-center gap-1">
                    {mounted ? (
                        <button
                            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                            className="p-2 rounded-full transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
                            aria-label="Toggle theme"
                        >
                            {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
                    ) : (
                        <div className="p-2 h-9 w-9" />
                    )}
                    <Link href="/settings" aria-label="Settings">
                        <div className={cn(
                            "p-2 rounded-full transition-colors",
                            pathname === '/settings'
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}>
                            <Settings className="h-5 w-5" />
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
