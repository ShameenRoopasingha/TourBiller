'use client';

import { playBreakdownAlarm, playHandoverChime, unlockDispatchAudio } from '@/lib/dispatch-audio';

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register service worker for background dispatch notifications
 */
export async function registerDispatchServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return null;
    }

    try {
        if (!swRegistration) {
            swRegistration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        }
        return swRegistration;
    } catch (e) {
        console.warn('Service worker registration failed:', e);
        return null;
    }
}

/**
 * Request OS-level notification permission from user
 */
export async function requestSystemNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'unsupported';
    }

    try {
        unlockDispatchAudio();
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            await registerDispatchServiceWorker();
        }
        return permission;
    } catch {
        return 'denied';
    }
}

export function isSystemNotificationSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
}

export function getSystemNotificationPermission(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
}

interface EmergencyNotificationOptions {
    type: 'BREAKDOWN' | 'HANDOVER';
    vehicleNo: string;
    driverName: string;
    details?: string;
    bookingId?: string;
}

/**
 * Trigger an OS-Level Desktop/Mobile System Notification Banner
 * Plays distinct sound + vibrates device + displays persistent system alert banner
 * Even if browser is in background, minimized, or user is working in another app.
 */
export async function fireEmergencySystemNotification({
    type,
    vehicleNo,
    driverName,
    details,
    bookingId,
}: EmergencyNotificationOptions): Promise<void> {
    const isBreakdown = type === 'BREAKDOWN';

    // 1. Play high-impact acoustic alert
    if (isBreakdown) {
        playBreakdownAlarm();
    } else {
        playHandoverChime();
    }

    // 2. Check if OS notifications are permitted
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const title = isBreakdown
        ? `🚨 BREAKDOWN: ${vehicleNo} (${driverName})`
        : `⚠️ HANDOVER REQUEST: ${vehicleNo} (${driverName})`;

    const body = isBreakdown
        ? `Driver reported vehicle defect: ${details || 'Action required immediately'}. Click to swap vehicle.`
        : `Driver requested mid-tour handover: ${details || 'Action required'}. Click to reassign driver.`;

    const targetUrl = bookingId ? `/bookings/${bookingId}` : '/live-tracking';

    try {
        const reg = swRegistration || (await registerDispatchServiceWorker());

        if (reg && 'showNotification' in reg) {
            await reg.showNotification(title, {
                body,
                icon: '/logo-icon.png',
                badge: '/logo-icon.png',
                tag: `dispatch-${type}-${vehicleNo}-${Date.now()}`,
                requireInteraction: true, // Remains on screen until clicked or dismissed
                vibrate: isBreakdown ? [400, 150, 400, 150, 800] : [200, 100, 200, 100, 400],
                data: { url: targetUrl },
            } as any);
            return;
        }

        // Fallback for browsers without service worker active
        const notification = new Notification(title, {
            body,
            icon: '/logo-icon.png',
            requireInteraction: true,
            data: { url: targetUrl },
        });

        notification.onclick = () => {
            window.focus();
            window.location.href = targetUrl;
            notification.close();
        };
    } catch (e) {
        console.warn('Failed to display OS notification:', e);
    }
}
