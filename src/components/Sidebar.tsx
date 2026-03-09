'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LayoutDashboard, Car, Users, FileText, CalendarDays, Settings, Map, FileCheck, Sun, Moon, LogOut, UserCog } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

const emptySubscribe = () => () => { };

type NavItem = {
    name: string;
    href: string;
    icon: any;
    adminOnly?: boolean;
};

const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Vehicles', href: '/vehicles', icon: Car, adminOnly: true },
    { name: 'Customers', href: '/customers', icon: Users, adminOnly: true },
    { name: 'Bookings', href: '/bookings', icon: CalendarDays },
    { name: 'Tour Schedules', href: '/tour-schedules', icon: Map, adminOnly: true },
    { name: 'Quotations', href: '/quotations', icon: FileCheck, adminOnly: true },
    { name: 'Bills', href: '/bills', icon: FileText },
    { name: 'Users', href: '/users', icon: UserCog, adminOnly: true },
];

interface SidebarProps {
    userRole?: string;
    userName?: string;
}

export function Sidebar({ userRole = 'ADMIN', userName = 'User' }: SidebarProps) {
    const pathname = usePathname();
    const { resolvedTheme, setTheme } = useTheme();
    const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

    const isAdmin = userRole === 'ADMIN';
    const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

    return (
        <div className="h-screen w-64 bg-card/40 backdrop-blur-xl border-r border-border/50 flex flex-col fixed left-0 top-0">
            <div className="p-6 border-b border-border/50">
                <Link href="/" className="flex items-center gap-2 font-bold text-2xl tracking-tight">
                    <span className="text-primary">Tour</span>Biller
                </Link>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {visibleItems.map((item) => {
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
            </nav>

            <div className="p-4 border-t border-border/50 space-y-3">
                {/* User info */}
                <div className="flex items-center gap-2 px-1">
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                        isAdmin ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                    )}>
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    <Link href="/settings/profile" className="flex-1 min-w-0 hover:opacity-80 transition-opacity cursor-pointer">
                        <div className="text-sm font-medium truncate">{userName}</div>
                        <div className={cn(
                            "text-[10px] font-bold uppercase",
                            isAdmin ? "text-primary" : "text-secondary-foreground"
                        )}>
                            {userRole}
                        </div>
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="p-2 rounded-full transition-colors hover:bg-red-50 text-muted-foreground hover:text-red-600"
                        aria-label="Sign out"
                        title="Sign out"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>

                {/* Theme toggle + Settings */}
                <div className="flex items-center justify-between">
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
                        {isAdmin && (
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
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
