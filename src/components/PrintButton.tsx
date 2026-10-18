'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Printer,
    ArrowLeft,
    Loader2,
    Check,
    Share2,
    Download,
    Copy,
    ExternalLink,
    FileText,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    generatePdfFile,
    sharePdfFile,
    downloadPdfFile,
    getWhatsAppUrl,
    formatWhatsAppPhone,
} from '@/lib/pdf-share';

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
    const [showShareModal, setShowShareModal] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Pre-cache PDF in the background after mount so it is ready for instant sharing
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
        }, 1200);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [elementId, filename, showWhatsApp]);

    // Handle the main WhatsApp button click
    const handleWhatsAppButtonClick = async () => {
        // If PDF is already pre-generated in memory, open the share modal immediately
        if (cachedPdf) {
            setShowShareModal(true);
            return;
        }

        // User clicked before background pre-cache completed
        try {
            setIsGenerating(true);
            setStatusText('Generating PDF...');
            const res = await generatePdfFile({ elementId, filename });
            if (!res?.file) {
                alert('PDF generation failed. Please try again.');
                setStatusText(null);
                return;
            }
            setCachedPdf(res.file);
            setStatusText(null);
            setShowShareModal(true);
        } finally {
            setIsGenerating(false);
        }
    };

    // Triggered inside modal: User clicks "Share via WhatsApp / Apps" with a fresh gesture
    const handleModalNativeShare = async () => {
        if (!cachedPdf) return;
        try {
            setIsGenerating(true);
            const res = await sharePdfFile({
                file: cachedPdf,
                filename,
                title,
                phone: recipientPhone,
            });

            if (res.sharedViaNative) {
                setShowShareModal(false);
                setStatusText('Shared!');
                setTimeout(() => setStatusText(null), 3000);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    // Download PDF directly from modal
    const handleDownload = () => {
        if (cachedPdf) {
            downloadPdfFile(cachedPdf, filename);
            setStatusText('Downloaded!');
            setTimeout(() => setStatusText(null), 3000);
        }
    };

    // Copy document link to clipboard
    const handleCopyLink = async () => {
        if (typeof window === 'undefined') return;
        try {
            await navigator.clipboard.writeText(window.location.href);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2500);
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    };

    const formattedPhone = formatWhatsAppPhone(recipientPhone);
    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    const shareMessage = `📄 *${title}*\nGreetings from VIGIL Tour Management.\nPlease find your document attached.`;
    const waUrl = getWhatsAppUrl(
        formattedPhone,
        `${shareMessage}\n\n🔗 View Online:\n${typeof window !== 'undefined' ? window.location.href : ''}`
    );

    const isWebView =
        typeof window !== 'undefined' &&
        (Boolean((window as any).__TAURI__) ||
         Boolean((window as any).__TAURI_INTERNALS__) ||
         /wv|Android.*Version\/[\d.]+/i.test(navigator.userAgent));

    const handleDirectWhatsAppClick = (e: React.MouseEvent) => {
        if (isWebView) {
            e.preventDefault();
            try {
                const win = window.open(waUrl, '_blank');
                if (!win) {
                    if (cachedPdf) downloadPdfFile(cachedPdf, filename);
                    handleCopyLink();
                    setShowShareModal(false);
                    setStatusText('PDF saved & link copied!');
                    setTimeout(() => setStatusText(null), 4000);
                } else {
                    setShowShareModal(false);
                }
            } catch {
                if (cachedPdf) downloadPdfFile(cachedPdf, filename);
                handleCopyLink();
                setShowShareModal(false);
            }
        }
    };

    return (
        <>
            <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full">
                <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1">
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
                        className="flex-1 font-semibold btn-tactile-primary shadow-xs h-10 text-xs sm:text-sm"
                    >
                        <Printer className="mr-1.5 sm:mr-2 h-4 w-4" />
                        <span className="truncate">{label}</span>
                    </Button>
                </div>

                {showWhatsApp && (
                    <Button
                        type="button"
                        onClick={handleWhatsAppButtonClick}
                        disabled={isGenerating}
                        className="w-full sm:w-auto shrink-0 font-semibold text-white shadow-xs h-10 px-4 text-xs sm:text-sm active:translate-y-[1px] transition-all bg-[#25D366] hover:bg-[#20bd5a]"
                        title="Share via WhatsApp"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                <span>Generating PDF...</span>
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

            {/* Comprehensive Share & WhatsApp Modal - Responsive and Zero Clipping */}
            <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
                <DialogContent className="w-[calc(100%-1.5rem)] max-w-md p-4 sm:p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                    <DialogHeader className="text-left space-y-1 pr-9">
                        <DialogTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <WhatsAppIcon className="h-5 w-5 text-[#25D366] shrink-0" />
                            <span className="truncate">Share Document</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
                            Send {title} directly to your client via WhatsApp or other apps.
                        </DialogDescription>
                    </DialogHeader>

                    {/* PDF Document Status Card */}
                    <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-[#25D366]/20 text-[#25D366] flex items-center justify-center shrink-0">
                                <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                                    {cleanFilename}
                                </p>
                                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                                    ✅ PDF Ready {cachedPdf ? `(${(cachedPdf.size / 1024).toFixed(0)} KB)` : ''}
                                </p>
                            </div>
                        </div>
                        {recipientPhone && (
                            <span className="text-[11px] font-mono font-semibold bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded border border-gray-200 dark:border-zinc-700 shrink-0">
                                {recipientPhone}
                            </span>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2.5 pt-1">
                        {/* Option 1: Native Share Sheet (Sends File / WhatsApp) */}
                        <Button
                            type="button"
                            onClick={handleModalNativeShare}
                            disabled={!cachedPdf || isGenerating}
                            className="w-full min-h-[52px] h-auto py-2.5 px-3.5 justify-start font-semibold text-white bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.99] transition-all shadow-sm rounded-xl text-xs sm:text-sm"
                        >
                            <Share2 className="h-5 w-5 mr-3 shrink-0" />
                            <div className="flex flex-col text-left min-w-0 flex-1">
                                <span className="font-bold leading-tight">Share via WhatsApp / Apps</span>
                                <span className="text-[10px] text-white/90 font-normal leading-tight mt-0.5">
                                    Send PDF document directly using WhatsApp or system apps
                                </span>
                            </div>
                        </Button>

                        {/* Option 2: Direct WhatsApp Chat */}
                        <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={handleDirectWhatsAppClick}
                            className="w-full min-h-[52px] h-auto py-2.5 px-3.5 flex items-center justify-start font-semibold text-emerald-900 dark:text-emerald-300 bg-emerald-100/70 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 active:scale-[0.99] transition-all rounded-xl border border-emerald-300/60 dark:border-emerald-800 text-xs sm:text-sm"
                        >
                            <WhatsAppIcon className="h-5 w-5 mr-3 text-[#25D366] shrink-0" />
                            <div className="flex flex-col text-left min-w-0 flex-1">
                                <span className="font-bold leading-tight truncate">
                                    {recipientPhone ? `WhatsApp Chat (${recipientPhone})` : 'Open WhatsApp Chat'}
                                </span>
                                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-normal leading-tight mt-0.5">
                                    Open direct WhatsApp chat with pre-filled document details
                                </span>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 ml-2 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        </a>

                        {/* Option 3: Download PDF to Device */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleDownload}
                            disabled={!cachedPdf}
                            className="w-full min-h-[46px] h-auto py-2 px-3.5 justify-start font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-gray-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm"
                        >
                            <Download className="h-4 w-4 mr-3 text-blue-600 dark:text-blue-400 shrink-0" />
                            <div className="flex flex-col text-left min-w-0">
                                <span className="leading-tight font-medium">Download PDF File</span>
                            </div>
                        </Button>

                        {/* Option 4: Copy Share Link */}
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleCopyLink}
                            className="w-full h-9 justify-start px-3.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded-xl"
                        >
                            {isCopied ? (
                                <>
                                    <Check className="h-3.5 w-3.5 mr-2 text-emerald-600 shrink-0" />
                                    <span className="font-medium text-emerald-600">Link Copied to Clipboard!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="h-3.5 w-3.5 mr-2 shrink-0" />
                                    <span>Copy Document Link</span>
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
