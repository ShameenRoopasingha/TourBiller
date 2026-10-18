'use client';

import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PrintButtonProps {
    label?: string;
    showBack?: boolean;
}

export function PrintButton({ label = 'Print / Save as PDF', showBack = true }: PrintButtonProps) {
    const router = useRouter();

    const handleShare = async () => {
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            try {
                await navigator.share({
                    title: document.title || 'Document',
                    url: window.location.href,
                });
            } catch {
                // Share cancelled or not supported
            }
        } else {
            window.print();
        }
    };

    return (
        <div className="no-print flex items-center gap-2 sm:gap-3 w-full">
            {showBack && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="shrink-0 font-medium bg-white hover:bg-gray-100 text-gray-800 border-gray-300 shadow-xs h-10 px-3.5 sm:px-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-1 sm:mr-1.5" />
                    <span>Back</span>
                </Button>
            )}
            <Button
                type="button"
                onClick={() => window.print()}
                className="flex-1 font-semibold btn-tactile-primary shadow-sm h-10 text-sm sm:text-base"
            >
                <Printer className="mr-2 h-4 w-4" />
                <span>{label}</span>
            </Button>
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleShare}
                    className="sm:hidden shrink-0 bg-white hover:bg-gray-100 text-gray-800 border-gray-300 shadow-xs h-10 px-3"
                    title="Share"
                >
                    <Share2 className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
