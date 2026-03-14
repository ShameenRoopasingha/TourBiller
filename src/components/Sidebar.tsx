'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LayoutDashboard, Car, Users, FileText, CalendarDays, Settings, Map, FileCheck, Sun, Moon, LogOut, UserCog } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
    Sidebar as ShadcnSidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

const emptySubscribe = () => () => { };

type NavItem = {
    name: string;
    href: string;
    icon: React.ElementType;
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
        <ShadcnSidebar className="border-r border-border/50 bg-card/40 backdrop-blur-xl">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                    <Image src="/virgil-logo.png" alt="VIRGIL" width={48} height={48} className="h-12 w-auto drop-shadow-sm" priority />
                    <div className="flex flex-col">
                        <span className="font-bold text-2xl tracking-tight leading-none bg-gradient-to-r from-blue-900 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent pb-1">VIRGIL</span>
                        <span className="text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase leading-none">Smart Travel Management.</span>
                    </div>
                </Link>
            </div>

            <SidebarContent className="p-2">
                <SidebarGroup>
                    <SidebarMenu className="space-y-2">
                        {visibleItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton 
                                        asChild 
                                        isActive={isActive} 
                                        className={cn(
                                            "h-10 transition-colors",
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
                                                : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Link href={item.href} className="flex items-center gap-3 px-2 w-full">
                                            <item.icon className="h-5 w-5" />
                                            <span className="font-medium text-base">{item.name}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-4 border-t border-border/50 space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        isAdmin ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                    )}>
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    <Link href="/settings" className="flex-1 min-w-0 hover:opacity-80 transition-opacity cursor-pointer">
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
                        className="p-2 rounded-full transition-colors hover:bg-red-50 text-muted-foreground hover:text-red-600 shrink-0"
                        aria-label="Sign out"
                        title="Sign out"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>

                {/* Theme toggle + Settings */}
                <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                        <span className="font-semibold">VIRGIL</span> v0.1
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
            </SidebarFooter>
        </ShadcnSidebar>
    );
}
