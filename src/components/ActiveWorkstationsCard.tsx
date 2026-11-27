'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Laptop, Loader2, LogOut } from 'lucide-react';
import { deactivateCompanyWorkstation } from '@/lib/subscription-actions';
import { notify } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import type { WorkstationSummary } from '@/lib/workstations';

export function ActiveWorkstationsCard({
    workstations,
    maxWorkstations,
    planLabel,
    currentDeviceId,
}: {
    workstations: WorkstationSummary[];
    maxWorkstations: number;
    planLabel: string;
    currentDeviceId?: string;
}) {
    const router = useRouter();
    const [busyId, setBusyId] = useState<string | null>(null);

    const handleDeactivate = async (ws: WorkstationSummary) => {
        setBusyId(ws.id);
        try {
            const res = await deactivateCompanyWorkstation(ws.id);
            if (!res.success) {
                notify.error(res.error || 'Failed to deactivate workstation.');
                return;
            }
            notify.success(`Deactivated ${ws.deviceLabel}.`);
            router.refresh();
        } catch {
            notify.error('Failed to deactivate workstation.');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Laptop className="h-4 w-4 text-primary" />
                    <div>
                        <h3 className="text-sm font-semibold">
                            Active Workstations ({workstations.length} / {maxWorkstations})
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Concurrent desktop/browser sessions counted against your {planLabel} plan. Deactivate a broken or old PC anytime to sign in on a new computer.
                        </p>
                    </div>
                </div>
            </div>

            {workstations.length === 0 ? (
                <p className="text-xs text-muted-foreground pt-1">
                    No active desktop sessions recorded yet. New admin logins will appear here automatically.
                </p>
            ) : (
                <div className="divide-y divide-border rounded-lg border border-border/70 bg-muted/20">
                    {workstations.map((ws) => {
                        const isSelf = Boolean(currentDeviceId && ws.deviceId === currentDeviceId);
                        const lastSeenText = new Date(ws.lastSeenAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'UTC',
                        });
                        return (
                            <div
                                key={ws.id}
                                className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 text-xs"
                            >
                                <div className="space-y-0.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-semibold text-foreground">{ws.deviceLabel}</span>
                                        {isSelf && (
                                            <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary font-mono text-[10px] font-semibold">
                                                THIS DEVICE
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-muted-foreground">
                                        {ws.userName} ({ws.userEmail}) &bull; Last active {lastSeenText} UTC
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={busyId === ws.id}
                                    onClick={() => void handleDeactivate(ws)}
                                    className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                                >
                                    {busyId === ws.id ? (
                                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                    ) : (
                                        <LogOut className="h-3.5 w-3.5 mr-1.5" />
                                    )}
                                    {isSelf ? 'Sign Out & Free Seat' : 'Deactivate PC'}
                                </Button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
