'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RefreshButton() {
    const router = useRouter();
    const [spinning, setSpinning] = useState(false);

    const handleRefresh = () => {
        setSpinning(true);
        router.refresh();
        setTimeout(() => setSpinning(false), 1000);
    };

    return (
        <Button
            variant="outline"
            size="icon"
            className="rounded-full shadow-sm bg-background/80 backdrop-blur-sm border-muted"
            onClick={handleRefresh}
            title="Refresh data"
        >
            <RefreshCw className={`h-4 w-4 text-gray-600 dark:text-gray-300 ${spinning ? 'animate-spin' : ''}`} />
        </Button>
    );
}
