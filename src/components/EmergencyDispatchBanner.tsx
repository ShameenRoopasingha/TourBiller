'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ShieldAlert, AlertTriangle, BellOff, ArrowRight } from 'lucide-react';
import { 
    startRepeatingAlarm, 
    stopRepeatingAlarm, 
    isDispatchAudioEnabled 
} from '@/lib/dispatch-audio';
import { fireEmergencySystemNotification } from '@/lib/system-notifications';

interface UrgentAlert {
    id: string;
    entityId?: string;
    title: string;
    message: string;
    type: 'BREAKDOWN' | 'HANDOVER';
}

export function EmergencyDispatchBanner() {
    const [urgentAlerts, setUrgentAlerts] = useState<UrgentAlert[]>([]);
    const [silencedIds, setSilencedIds] = useState<Set<string>>(new Set());
    const seenAlertIdsRef = useRef<Set<string>>(new Set());
    const isFirstRunRef = useRef(true);

    // Load silenced IDs from sessionStorage on mount
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem('vigil_silenced_alerts');
            if (stored) {
                setSilencedIds(new Set(JSON.parse(stored)));
            }
        } catch {}
    }, []);

    // Fetch urgent dispatch alerts periodically
    useEffect(() => {
        let isMounted = true;

        const checkAlerts = async () => {
            try {
                const res = await fetch('/api/dashboard/notifications');
                const data = await res.json();
                if (data.success && data.data && isMounted) {
                    const allAlerts: any[] = data.data.maintenanceAlerts || [];
                    const activeUrgent: UrgentAlert[] = allAlerts.filter(
                        (a) => a.type === 'BREAKDOWN' || a.type === 'HANDOVER'
                    );

                    setUrgentAlerts(activeUrgent);

                    // Check for brand new alerts to fire OS notification
                    if (!isFirstRunRef.current) {
                        for (const alert of activeUrgent) {
                            if (!seenAlertIdsRef.current.has(alert.id)) {
                                fireEmergencySystemNotification({
                                    type: alert.type,
                                    vehicleNo: alert.title || 'Fleet Tour',
                                    driverName: 'Urgent Dispatch',
                                    details: alert.message,
                                    bookingId: alert.entityId,
                                });
                            }
                        }
                    } else {
                        isFirstRunRef.current = false;
                    }

                    seenAlertIdsRef.current = new Set(activeUrgent.map(a => a.id));
                }
            } catch (err) {
                console.warn('Error checking emergency dispatch alerts:', err);
            }
        };

        checkAlerts();
        const interval = setInterval(checkAlerts, 12000); // Check every 12 seconds

        return () => {
            isMounted = false;
            clearInterval(interval);
            stopRepeatingAlarm();
        };
    }, []);

    // Evaluate active un-silenced alert to manage repeating sound loop
    const activeBreakdown = urgentAlerts.find(a => a.type === 'BREAKDOWN' && !silencedIds.has(a.id));
    const activeHandover = urgentAlerts.find(a => a.type === 'HANDOVER' && !silencedIds.has(a.id));
    const primaryAlert = activeBreakdown || activeHandover || null;

    useEffect(() => {
        if (!isDispatchAudioEnabled()) {
            stopRepeatingAlarm();
            return;
        }

        if (activeBreakdown) {
            startRepeatingAlarm('BREAKDOWN', 5.5);
        } else if (activeHandover) {
            startRepeatingAlarm('HANDOVER', 6.0);
        } else {
            stopRepeatingAlarm();
        }
    }, [activeBreakdown, activeHandover]);

    if (!primaryAlert) {
        return null;
    }

    const isBreakdown = primaryAlert.type === 'BREAKDOWN';

    const handleSilence = () => {
        const next = new Set(silencedIds);
        next.add(primaryAlert.id);
        setSilencedIds(next);
        try {
            sessionStorage.setItem('vigil_silenced_alerts', JSON.stringify(Array.from(next)));
        } catch {}
        stopRepeatingAlarm();
    };

    const handleRespond = () => {
        handleSilence();
    };

    const targetUrl = primaryAlert.entityId
        ? `/bookings/${primaryAlert.entityId}${isBreakdown ? '#swap-section' : '#handover-section'}`
        : '/live-tracking';

    return (
        <aside 
            aria-label="Emergency Dispatch Alert" 
            className={`w-full z-50 px-4 py-2.5 shadow-xl transition-all print:hidden ${
            isBreakdown 
                ? 'bg-red-700 text-white border-b-2 border-red-500 animate-pulse' 
                : 'bg-amber-600 text-slate-950 border-b-2 border-amber-400'
        }`}>
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 text-center sm:text-left">
                    <div className={`p-2 rounded-full shrink-0 ${
                        isBreakdown ? 'bg-red-900/60 text-white' : 'bg-amber-800/30 text-slate-950'
                    }`}>
                        {isBreakdown ? <ShieldAlert className="w-5 h-5 animate-bounce" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                        <div className="font-black text-xs sm:text-sm tracking-wide uppercase flex items-center justify-center sm:justify-start gap-2">
                            <span>{isBreakdown ? '🚨 EMERGENCY VEHICLE BREAKDOWN' : '⚠️ MID-TOUR DRIVER HANDOVER REQUESTED'}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-extrabold bg-black/30 text-white">
                                ACTION REQUIRED
                            </span>
                        </div>
                        <p className={`text-xs truncate font-medium ${isBreakdown ? 'text-red-100' : 'text-slate-900'}`}>
                            <strong>{primaryAlert.title}</strong> — {primaryAlert.message}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                    <button
                        type="button"
                        onClick={handleSilence}
                        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                            isBreakdown 
                                ? 'bg-red-900/80 hover:bg-red-950 text-white border border-red-400/40' 
                                : 'bg-amber-800/20 hover:bg-amber-800/30 text-slate-950 border border-amber-800/40'
                        }`}
                        title="Silence alert siren for this request"
                    >
                        <BellOff className="w-3.5 h-3.5" />
                        <span>Silence Siren</span>
                    </button>

                    <Link
                        href={targetUrl}
                        onClick={handleRespond}
                        className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition shadow-lg ${
                            isBreakdown 
                                ? 'bg-white text-red-700 hover:bg-slate-100' 
                                : 'bg-slate-950 text-white hover:bg-slate-900'
                        }`}
                    >
                        <span>{isBreakdown ? '⚡ Respond & Swap' : '⚡ Respond & Reassign'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </aside>
    );
}
