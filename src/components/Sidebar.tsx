'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Car, Users, FileText, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Vehicles', href: '/vehicles', icon: Car },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Bookings', href: '/bookings', icon: CalendarDays },
    { name: 'New Bill', href: '/bills/new', icon: FileText },
];

export function Sidebar() {
    const pathname = usePathname();

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
                    <Link href="/settings">
                        <div className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                            pathname === '/settings'
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}>
                            <Users className="h-5 w-5" />
                            <span className="font-medium">Settings</span>
                        </div>
                    </Link>
                </div>
            </nav>

            <div className="p-4 border-t border-border">
                <div className="text-xs text-muted-foreground text-center">
                    Vehicle Hire Billing System
                    <br />v0.1.0
                </div>
            </div>
        </div>
    );
}
