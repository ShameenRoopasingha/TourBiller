'use client';

import React from 'react';
import { LogOut } from 'lucide-react';
import { logoutUser } from '@/lib/user-actions';
import { cn } from '@/lib/utils';
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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface SignOutButtonProps {
    className?: string;
    showLabel?: boolean;
}

export function SignOutButton({ className, showLabel = false }: SignOutButtonProps) {
    return (
        <AlertDialog>
            <Tooltip>
                <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                        <button
                            type="button"
                            className={cn(
                                showLabel
                                    ? "h-9 px-3.5 rounded-lg flex items-center justify-center gap-2 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 border border-border/60 hover:border-red-300 dark:hover:border-red-900/60 transition-all cursor-pointer shadow-xs active:scale-95"
                                    : "size-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-500/10 border border-border/60 hover:border-red-300 dark:hover:border-red-900/60 transition-all cursor-pointer shadow-xs active:scale-95",
                                className
                            )}
                            aria-label="Sign out"
                        >
                            <LogOut className="h-4 w-4 shrink-0" />
                            {showLabel && <span className="text-sm font-medium">Sign out</span>}
                        </button>
                    </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end">
                    Sign out
                </TooltipContent>
            </Tooltip>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Sign out?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to sign out of your account?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => logoutUser()}
                        className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                    >
                        Sign out
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
