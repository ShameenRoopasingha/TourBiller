'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { logoutUser } from '@/lib/user-actions';
import { LayoutDashboard, Car, Users, FileText, CalendarDays, Settings, Map, FileCheck, LogOut, UserCog, BarChart3, CalendarRange, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['700', '900'] });
import {
    Sidebar as ShadcnSidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from '@/components/ui/sidebar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const emptySubscribe = () => () => { };

type NavItem = {
    name: string;
    href: string;
    icon: React.ElementType;
    adminOnly?: boolean;
    driverOnly?: boolean;
};

const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Live Tracking', href: '/live-tracking', icon: Radio, adminOnly: true },
    { name: 'My Active Tour', href: '/driver/active-tour', icon: Car, driverOnly: true },
    { name: 'Vehicles', href: '/vehicles', icon: Car, adminOnly: true },
    { name: 'Customers', href: '/customers', icon: Users, adminOnly: true },
    { name: 'Bookings', href: '/bookings', icon: CalendarDays, adminOnly: true },
    { name: 'Booking Calendar', href: '/calendar', icon: CalendarRange, adminOnly: true },
    { name: 'Tour Schedules', href: '/tour-schedules', icon: Map, adminOnly: true },
    { name: 'Quotations', href: '/quotations', icon: FileCheck, adminOnly: true },
    { name: 'Bills', href: '/bills', icon: FileText, adminOnly: true },
    { name: 'Reports', href: '/reports', icon: BarChart3, adminOnly: true },
    { name: 'Users', href: '/users', icon: UserCog, adminOnly: true },
    { name: 'Profile', href: '/settings', icon: UserCog, driverOnly: true },
];

interface SidebarProps {
    userRole?: string;
    userName?: string;
    className?: string;
}

export function Sidebar({ userRole = 'ADMIN', userName = 'User', className }: SidebarProps) {
    const pathname = usePathname();
    const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
    const { state, isMobile } = useSidebar();
    const isCollapsed = state === 'collapsed' && !isMobile;

    const isAdmin = userRole === 'ADMIN' || userRole === 'OWNER';
    const isDriver = userRole === 'DRIVER';
    const visibleItems = navItems.filter(item =>
        (!item.adminOnly || isAdmin) &&
        (!item.driverOnly || isDriver)
    );

    return (
        <ShadcnSidebar
            collapsible="icon"
            className={cn("border-r border-border/50 bg-card/40 backdrop-blur-xl transition-[width] duration-200", className)}
        >
            <div className={cn(
                "p-3.5 border-b border-border/50 flex items-center transition-all duration-200",
                "group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center justify-start"
            )}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link href="/" className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center min-w-0">
                            <div className="bg-white p-1.5 rounded-xl shadow-[0_2px_10px_rgba(0,180,216,0.2)] border border-slate-200 shrink-0">
                                <Image src="/logo-icon.png" alt="VIGIL" width={32} height={32} className="h-8 w-auto object-contain" priority />
                            </div>
                            <div className="flex flex-col group-data-[collapsible=icon]:hidden transition-opacity min-w-0">
                                <span className={`font-black text-2xl tracking-tight leading-none text-foreground pb-0.5 ${montserrat.className}`}>VIGIL</span>
                                <span className="text-[0.55rem] font-bold tracking-wider text-cyan-600 dark:text-cyan-400 uppercase leading-tight truncate">Vehicle Hire &<br/>Travel Management</span>
                            </div>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center" className="hidden group-data-[collapsible=icon]:block">
                        <div className="font-bold text-xs">VIGIL</div>
                        <div className="text-[10px] text-muted-foreground">Vehicle Hire & Travel Management</div>
                    </TooltipContent>
                </Tooltip>
            </div>

            <SidebarContent className="p-2 group-data-[collapsible=icon]:p-1.5 group-data-[collapsible=icon]:py-2">
                <SidebarGroup className="p-0">
                    <SidebarMenu className="space-y-1.5 group-data-[collapsible=icon]:space-y-1">
                        {visibleItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive}
                                        tooltip={item.name}
                                        className={cn(
                                            "h-10 transition-colors group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0",
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
                                                : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Link
                                            href={item.href}
                                            className="flex items-center gap-3 px-2.5 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                                        >
                                            <item.icon className="h-5 w-5 shrink-0" />
                                            <span className="font-medium text-sm group-data-[collapsible=icon]:hidden transition-opacity">
                                                {item.name}
                                            </span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-3 border-t border-border/50 group-data-[collapsible=icon]:p-1.5">
                {/* Collapsed Mode Footer Icons */}
                <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-1.5 py-1">
                    {/* User Avatar */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link
                                href="/settings"
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-transform hover:scale-105 shadow-sm",
                                    isAdmin ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                                )}
                            >
                                {userName.charAt(0).toUpperCase()}
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">
                            <div className="font-semibold text-xs">{userName}</div>
                            <div className="text-[10px] text-muted-foreground uppercase">{userRole}</div>
                        </TooltipContent>
                    </Tooltip>


                    {/* Settings */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link
                                href="/settings"
                                className={cn(
                                    "p-1.5 rounded-lg transition-colors",
                                    pathname === '/settings'
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                                aria-label="Settings"
                            >
                                <Settings className="h-4 w-4" />
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">
                            Settings
                        </TooltipContent>
                    </Tooltip>
                </div>

                {/* Expanded Mode Footer */}
                <div className="group-data-[collapsible=icon]:hidden space-y-3">
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
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button
                                    className="p-2 rounded-full transition-colors hover:bg-red-50 text-muted-foreground hover:text-red-600 shrink-0 md:hidden"
                                    aria-label="Sign out"
                                    title="Sign out"
                                >
                                    <LogOut className="h-4 w-4" />
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Sign out?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to sign out of your account?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => logoutUser()}>
                                        Sign out
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    {/* Settings & Version */}
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                            <span className="font-semibold">VIGIL</span> v0.1
                        </div>
                        <div className="flex items-center gap-1">
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
            </SidebarFooter>
            <SidebarRail />
        </ShadcnSidebar>
    );
}
