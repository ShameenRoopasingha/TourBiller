'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

export function WorkstationGuard({
    deviceId,
    isAdminOrOwner,
}: {
    deviceId?: string;
    isAdminOrOwner: boolean;
}) {
    useEffect(() => {
        if (!isAdminOrOwner) return;

        let resolvedDeviceId = deviceId || '';
        if (!resolvedDeviceId) {
            try {
                resolvedDeviceId = localStorage.getItem('vigil_device_id') || '';
            } catch {
                resolvedDeviceId = '';
            }
        }
        if (!resolvedDeviceId) return;

        let cancelled = false;
        const checkSeat = async () => {
            try {
                const res = await fetch('/api/auth/workstation-heartbeat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deviceId: resolvedDeviceId }),
                });
                const data = (await res.json().catch(() => ({}))) as {
                    active?: boolean;
                    reason?: string;
                };
                if (!cancelled && res.status === 401 && data.reason === 'WORKSTATION_REVOKED') {
                    await signOut({ callbackUrl: '/login?error=WorkstationRevoked' });
                }
            } catch {
                // Ignore transient network drops
            }
        };

        void checkSeat();
        const intervalId = window.setInterval(checkSeat, 45_000);
        const onFocus = () => void checkSeat();
        window.addEventListener('focus', onFocus);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
            window.removeEventListener('focus', onFocus);
        };
    }, [deviceId, isAdminOrOwner]);

    return null;
}
