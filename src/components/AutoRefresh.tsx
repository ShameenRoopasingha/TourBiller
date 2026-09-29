'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AutoRefresh({ intervalMs = 60000 }: { intervalMs?: number }) {
    const router = useRouter();
    const refreshIntervalMs = Math.max(intervalMs, 60000);

    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh();
        }, refreshIntervalMs);

        return () => clearInterval(interval);
    }, [router, refreshIntervalMs]);

    return null; // This component doesn't render anything
}
