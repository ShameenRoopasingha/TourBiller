'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Printer,
    ArrowLeft,
    Loader2,
    Download,
    Mail,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    generatePdfFile,
    sharePdfFile,
    downloadPdfFile,
    getWhatsAppUrl,
    getMailtoUrl,
} from '@/lib/pdf-share';

interface PrintButtonProps {
    label?: string;
    showBack?: boolean;
    elementId?: string;
    filename?: string;
    title?: string;
    recipientPhone?: string | null;
    recipientEmail?: string | null;
    documentType?: 'quotation' | 'bill';
    documentId?: string;
    showWhatsApp?: boolean;
    showEmail?: boolean;
    showDownload?: boolean;
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
    recipientEmail,
    showWhatsApp = true,
    showEmail = true,
    showDownload = true,
}: PrintButtonProps) {
    const router = useRouter();
    const [cachedPdf, setCachedPdf] = useState<File | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeAction, setActiveAction] = useState<'whatsapp' | 'email' | 'download' | null>(null);

    // Pre-cache PDF in the background after mount so it is ready for instant sharing/downloading
    useEffect(() => {
        let isMounted = true;
        const timer = setTimeout(async () => {
            if (!isMounted) return;
            try {
                const res = await generatePdfFile({ elementId, filename });
                if (isMounted && res?.file) {
                    setCachedPdf(res.file);
                }
            } catch {
                // Background caching failure is silent; click handler will generate on demand
            }
        }, 1200);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [elementId, filename]);

    // Handle Direct WhatsApp Share (Zero Dialog Boxes)
    const handleWhatsAppButtonClick = async () => {
        try {
            setActiveAction('whatsapp');
            setIsGenerating(true);
            let pdfFile = cachedPdf;
            if (!pdfFile) {
                const res = await generatePdfFile({ elementId, filename });
                if (res?.file) {
                    pdfFile = res.file;
                    setCachedPdf(res.file);
                }
            }

            if (!pdfFile) {
                // Fallback to direct WhatsApp chat if PDF generation fails
                const waUrl = getWhatsAppUrl(
                    recipientPhone,
                    `📄 *${title}*\nGreetings from VIGIL Tour Management.\nPlease find your document online:\n${typeof window !== 'undefined' ? window.location.href : ''}`
                );
                window.open(waUrl, '_blank');
                return;
            }

            await sharePdfFile({
                file: pdfFile,
                filename,
                title,
                phone: recipientPhone,
            });
        } finally {
            setIsGenerating(false);
            setActiveAction(null);
        }
    };

    // Handle Direct Email Share (Zero Dialog Boxes - Launches default mail app with pre-filled details & downloads PDF)
    const handleEmailButtonClick = async () => {
        try {
            setActiveAction('email');
            setIsGenerating(true);

            // Pre-download PDF to device so user can attach it directly in their email client
            let pdfFile = cachedPdf;
            if (!pdfFile) {
                const res = await generatePdfFile({ elementId, filename });
                if (res?.file) {
                    pdfFile = res.file;
                    setCachedPdf(res.file);
                }
            }
            if (pdfFile) {
                downloadPdfFile(pdfFile, filename);
            }

            const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
            const onlineUrl = typeof window !== 'undefined' ? window.location.href : '';
            const mailtoSubject = `${title} - VIGIL Tour Management`;
            const mailtoBody = `Dear Client,\n\nGreetings from VIGIL Tour Management.\nPlease find your ${title} details online at:\n${onlineUrl}\n\n(A PDF copy "${cleanFilename}" has been saved to your downloads folder for attachment).\n\nBest regards,\nVIGIL Tour Management`;

            const mailtoUrl = getMailtoUrl({
                to: recipientEmail || undefined,
                subject: mailtoSubject,
                body: mailtoBody,
            });

            const link = document.createElement('a');
            link.href = mailtoUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } finally {
            setIsGenerating(false);
            setActiveAction(null);
        }
    };

    // Handle Direct PDF Download (Zero Dialog Boxes)
    const handleDownloadButtonClick = async () => {
        try {
            setActiveAction('download');
            setIsGenerating(true);
            let pdfFile = cachedPdf;
            if (!pdfFile) {
                const res = await generatePdfFile({ elementId, filename });
                if (res?.file) {
                    pdfFile = res.file;
                    setCachedPdf(res.file);
                }
            }
            if (pdfFile) {
                await downloadPdfFile(pdfFile, filename);
            }
        } finally {
            setIsGenerating(false);
            setActiveAction(null);
        }
    };

    return (
        <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full">
            {/* Top row on mobile, left on desktop: Back + Print */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
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

            {/* Bottom row on mobile (3 equal balanced columns), right on desktop (flex row) */}
            <div className="grid grid-cols-3 gap-2 w-full sm:flex sm:w-auto shrink-0">
                {showDownload && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleDownloadButtonClick}
                        disabled={isGenerating}
                        className="font-semibold text-gray-800 dark:text-gray-200 bg-white hover:bg-gray-100 dark:bg-zinc-800 border-gray-300 shadow-xs h-10 px-2 sm:px-3.5 text-xs sm:text-sm justify-center"
                        title="Download PDF directly to your device"
                    >
                        {isGenerating && activeAction === 'download' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Download className="h-4 w-4 mr-1 sm:mr-1.5 text-primary shrink-0" />
                                <span className="truncate">Download</span>
                            </>
                        )}
                    </Button>
                )}

                {showWhatsApp && (
                    <Button
                        type="button"
                        onClick={handleWhatsAppButtonClick}
                        disabled={isGenerating}
                        className="font-semibold text-white shadow-xs h-10 px-2 sm:px-3.5 text-xs sm:text-sm active:translate-y-[1px] transition-all bg-[#25D366] hover:bg-[#20bd5a] justify-center"
                        title={recipientPhone ? `Share via WhatsApp (${recipientPhone})` : 'Share via WhatsApp'}
                    >
                        {isGenerating && activeAction === 'whatsapp' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <WhatsAppIcon className="h-4 w-4 mr-1 sm:mr-1.5 shrink-0" />
                                <span className="truncate">WhatsApp</span>
                            </>
                        )}
                    </Button>
                )}

                {showEmail && (
                    <Button
                        type="button"
                        onClick={handleEmailButtonClick}
                        disabled={isGenerating}
                        className="font-semibold text-white shadow-xs h-10 px-2 sm:px-3.5 text-xs sm:text-sm active:translate-y-[1px] transition-all bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-700 justify-center"
                        title={recipientEmail ? `Email to ${recipientEmail}` : 'Send via Email'}
                    >
                        {isGenerating && activeAction === 'email' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Mail className="h-4 w-4 mr-1 sm:mr-1.5 shrink-0" />
                                <span className="truncate">Email</span>
                            </>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}
