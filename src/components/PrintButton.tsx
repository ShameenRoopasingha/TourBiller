'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Loader2, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { generatePdfFile, sharePdfFile } from '@/lib/pdf-share';

interface PrintButtonProps {
    label?: string;
    showBack?: boolean;
    elementId?: string;
    filename?: string;
    title?: string;
    recipientPhone?: string | null;
    showWhatsApp?: boolean;
}

function WhatsAppIcon({ className = 'h-4 w-4' }: { className?: string }) {
    return (
        <svg
            className={className}
            fill="currentColor"
            viewBox="0 0 24 24"
        >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.888 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    );
}

export function PrintButton({
    label = 'Print / Save as PDF',
    showBack = true,
    elementId = 'printable-document',
    filename = 'Document',
    title = 'Document',
    recipientPhone,
    showWhatsApp = true,
}: PrintButtonProps) {
    const router = useRouter();
    const [cachedPdf, setCachedPdf] = useState<File | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [statusText, setStatusText] = useState<string | null>(null);
    const [needsClickToSend, setNeedsClickToSend] = useState(false);

    // Pre-cache PDF in the background 1.5s after mount so it is instantly ready
    useEffect(() => {
        let isMounted = true;
        const timer = setTimeout(async () => {
            if (!isMounted || !showWhatsApp) return;
            try {
                const res = await generatePdfFile({ elementId, filename });
                if (isMounted && res?.file) {
                    setCachedPdf(res.file);
                }
            } catch {
                // Background caching failure is silent; click handler will regenerate
            }
        }, 1500);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [elementId, filename, showWhatsApp]);

    const handleWhatsAppShare = async () => {
        // CASE 1: PDF is already pre-generated in memory!
        if (cachedPdf) {
            try {
                setIsGenerating(true);
                const res = await sharePdfFile({
                    file: cachedPdf,
                    filename,
                    title,
                    phone: recipientPhone,
                });

                if (res.sharedViaNative) {
                    setStatusText('Sent!');
                    setTimeout(() => setStatusText(null), 3000);
                } else {
                    setStatusText('Downloaded!');
                    setTimeout(() => setStatusText(null), 4000);
                }
                setNeedsClickToSend(false);
            } finally {
                setIsGenerating(false);
            }
            return;
        }

        // CASE 2: User clicked before background pre-cache completed
        try {
            setIsGenerating(true);
            setStatusText('PDF සකසමින්...');
            const res = await generatePdfFile({ elementId, filename });
            if (!res?.file) {
                alert('PDF generation failed. Please try again.');
                setStatusText(null);
                return;
            }
            setCachedPdf(res.file);

            // Attempt share immediately:
            const shareRes = await sharePdfFile({
                file: res.file,
                filename,
                title,
                phone: recipientPhone,
            });

            if (shareRes.success && shareRes.sharedViaNative) {
                setStatusText('Sent!');
                setTimeout(() => setStatusText(null), 3000);
                setNeedsClickToSend(false);
            } else if (shareRes.error === 'GESTURE_EXPIRED') {
                // User gesture expired while generating; prompt with fresh click
                setNeedsClickToSend(true);
                setStatusText('PDF සූදානම්! තට්ටු කරන්න');
            } else {
                setStatusText('Downloaded!');
                setTimeout(() => setStatusText(null), 4000);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="no-print flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 w-full">
            {showBack && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="shrink-0 font-medium bg-white hover:bg-gray-100 text-gray-800 border-gray-300 shadow-xs h-10 px-3 sm:px-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-1 sm:mr-1.5" />
                    <span>Back</span>
                </Button>
            )}

            <Button
                type="button"
                onClick={() => window.print()}
                className="flex-1 font-semibold btn-tactile-primary shadow-xs h-10 text-xs sm:text-sm min-w-[140px]"
            >
                <Printer className="mr-1.5 sm:mr-2 h-4 w-4" />
                <span>{label}</span>
            </Button>

            {showWhatsApp && (
                <Button
                    type="button"
                    onClick={handleWhatsAppShare}
                    disabled={isGenerating}
                    className={`shrink-0 font-semibold text-white shadow-xs h-10 px-3 sm:px-4 text-xs sm:text-sm active:translate-y-[1px] transition-all ${
                        needsClickToSend
                            ? 'bg-[#25D366] hover:bg-[#20bd5a] ring-2 ring-emerald-400 ring-offset-1 animate-pulse shadow-md'
                            : 'bg-[#25D366] hover:bg-[#20bd5a]'
                    }`}
                    title="Share PDF via WhatsApp"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                            <span>PDF සකසමින්...</span>
                        </>
                    ) : needsClickToSend ? (
                        <>
                            <WhatsAppIcon className="h-4 w-4 mr-1.5" />
                            <span className="font-bold">WhatsApp වෙත යවන්න</span>
                        </>
                    ) : statusText ? (
                        <>
                            <Check className="h-4 w-4 mr-1.5" />
                            <span>{statusText}</span>
                        </>
                    ) : (
                        <>
                            <WhatsAppIcon className="h-4 w-4 mr-1.5" />
                            <span>WhatsApp PDF</span>
                        </>
                    )}
                </Button>
            )}
        </div>
    );
}
