'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
                <div className="text-center space-y-6 max-w-md">
                    <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Critical Error
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            The application encountered a critical error. Please try refreshing the page.
                        </p>
                    </div>
                    <div className="flex gap-3 justify-center">
                        <Button onClick={reset}>
                            Try Again
                        </Button>
                        <Button onClick={() => window.location.href = '/'} variant="outline">
                            Go Home
                        </Button>
                    </div>
                </div>
            </body>
        </html>
    );
}
