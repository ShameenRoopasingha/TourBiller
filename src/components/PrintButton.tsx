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
    Mail,
    Send,
    AlertCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    generatePdfFile,
    sharePdfFile,
    downloadPdfFile,
    getWhatsAppUrl,
    formatWhatsAppPhone,
    getMailtoUrl,
    fileToBase64,
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
    documentType,
    documentId,
    showWhatsApp = true,
    showEmail = true,
}: PrintButtonProps) {
    const router = useRouter();
    const [cachedPdf, setCachedPdf] = useState<File | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [statusText, setStatusText] = useState<string | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Email state
    const [targetEmail, setTargetEmail] = useState(recipientEmail || '');
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [emailStatus, setEmailStatus] = useState<{
        type: 'success' | 'error' | 'warning';
        message: string;
    } | null>(null);

    // Keep email in sync if prop changes
    useEffect(() => {
        if (recipientEmail) {
            setTargetEmail(recipientEmail);
        }
    }, [recipientEmail]);

    // Pre-cache PDF in the background after mount so it is ready for instant sharing/emailing
    useEffect(() => {
        let isMounted = true;
        const timer = setTimeout(async () => {
            if (!isMounted || (!showWhatsApp && !showEmail)) return;
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
    }, [elementId, filename, showWhatsApp, showEmail]);

    // Helper to ensure PDF is generated before opening modal
    const ensurePdfAndOpenModal = async () => {
        if (cachedPdf) {
            setShowShareModal(true);
            return;
        }

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

    const handleWhatsAppButtonClick = () => {
        ensurePdfAndOpenModal();
    };

    const handleEmailButtonClick = () => {
        ensurePdfAndOpenModal();
    };

    // Triggered inside modal: User clicks "Share via WhatsApp / Apps"
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

    // Send email via server API
    const handleSendEmail = async () => {
        if (!targetEmail.trim() || !targetEmail.includes('@')) {
            setEmailStatus({
                type: 'error',
                message: 'Please enter a valid recipient email address.',
            });
            return;
        }

        try {
            setIsSendingEmail(true);
            setEmailStatus(null);

            // Prepare base64 of generated PDF
            let pdfBase64: string | undefined = undefined;
            if (cachedPdf) {
                pdfBase64 = await fileToBase64(cachedPdf);
            } else {
                const res = await generatePdfFile({ elementId, filename });
                if (res?.file) {
                    setCachedPdf(res.file);
                    pdfBase64 = await fileToBase64(res.file);
                }
            }

            // Derive doc type and id
            const derivedType = documentType || (
                (filename.toLowerCase().includes('quotation') || title.toLowerCase().includes('quotation'))
                    ? 'quotation'
                    : 'bill'
            );

            let derivedId = documentId;
            if (!derivedId && typeof window !== 'undefined') {
                const parts = window.location.pathname.split('/');
                if (parts.length >= 3 && parts[2]) {
                    derivedId = parts[2];
                }
            }

            const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

            const response = await fetch('/api/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: targetEmail.trim(),
                    subject: `${title} - VIGIL Tour Management`,
                    documentType: derivedType,
                    documentId: derivedId,
                    pdfBase64,
                    filename: cleanFilename,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setEmailStatus({
                    type: 'success',
                    message: data.message || `Document was successfully emailed to ${targetEmail}!`,
                });
                setStatusText('Email sent!');
                setTimeout(() => setStatusText(null), 4000);
            } else {
                if (data.isKeyMissing) {
                    setEmailStatus({
                        type: 'warning',
                        message: 'Resend API key is not configured on the server. You can click "Open Mail App" to send via your local email app.',
                    });
                } else {
                    setEmailStatus({
                        type: 'error',
                        message: data.error || 'Failed to send email. Try using "Open Mail App".',
                    });
                }
            }
        } catch (err: any) {
            setEmailStatus({
                type: 'error',
                message: err?.message || 'Network error while sending email.',
            });
        } finally {
            setIsSendingEmail(false);
        }
    };

    const formattedPhone = formatWhatsAppPhone(recipientPhone);
    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    const shareMessage = `📄 *${title}*\nGreetings from VIGIL Tour Management.\nPlease find your document attached.`;
    const waUrl = getWhatsAppUrl(
        formattedPhone,
        `${shareMessage}\n\n🔗 View Online:\n${typeof window !== 'undefined' ? window.location.href : ''}`
    );

    // Fallback mailto: link
    const mailtoSubject = `${title} - VIGIL Tour Management`;
    const mailtoBody = `Dear Client,\n\nGreetings from VIGIL Tour Management.\nPlease find your ${title} details online at:\n${typeof window !== 'undefined' ? window.location.href : ''}\n\n(A PDF copy "${cleanFilename}" has also been prepared for your records).\n\nBest regards,\nVIGIL Tour Management`;
    const mailtoUrl = getMailtoUrl({
        to: targetEmail || undefined,
        subject: mailtoSubject,
        body: mailtoBody,
    });

    const handleMailtoClick = () => {
        if (cachedPdf) {
            downloadPdfFile(cachedPdf, filename);
        }
        setStatusText('Mail app opened & PDF saved!');
        setTimeout(() => setStatusText(null), 4000);
    };

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

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    {showWhatsApp && (
                        <Button
                            type="button"
                            onClick={handleWhatsAppButtonClick}
                            disabled={isGenerating}
                            className="flex-1 sm:flex-initial font-semibold text-white shadow-xs h-10 px-3.5 text-xs sm:text-sm active:translate-y-[1px] transition-all bg-[#25D366] hover:bg-[#20bd5a]"
                            title="Share via WhatsApp"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                    <span className="hidden sm:inline">Generating...</span>
                                </>
                            ) : (
                                <>
                                    <WhatsAppIcon className="h-4 w-4 mr-1.5" />
                                    <span>WhatsApp</span>
                                </>
                            )}
                        </Button>
                    )}

                    {showEmail && (
                        <Button
                            type="button"
                            onClick={handleEmailButtonClick}
                            disabled={isGenerating}
                            className="flex-1 sm:flex-initial font-semibold text-white shadow-xs h-10 px-3.5 text-xs sm:text-sm active:translate-y-[1px] transition-all bg-blue-600 hover:bg-blue-700"
                            title="Send via Email"
                        >
                            <Mail className="h-4 w-4 mr-1.5" />
                            <span>Email</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Comprehensive Share & Email Modal */}
            <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
                <DialogContent className="w-[calc(100%-1.5rem)] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl">
                    <DialogHeader className="text-left space-y-1 pr-9">
                        <DialogTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Share2 className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span className="truncate">Share & Send Document</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
                            Send {title} to your customer via WhatsApp, Email, or download the PDF file.
                        </DialogDescription>
                    </DialogHeader>

                    {/* PDF Document Status Card */}
                    <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
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
                    </div>

                    <div className="flex flex-col gap-3 pt-1">
                        {/* ── EMAIL DOCUMENT SECTION ── */}
                        <div className="border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl p-3 sm:p-3.5 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">Email PDF Document</span>
                                </div>
                                <span className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                                    PDF Attached
                                </span>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-medium text-gray-600 dark:text-gray-300">Recipient Email Address:</label>
                                <input
                                    type="email"
                                    value={targetEmail}
                                    onChange={(e) => {
                                        setTargetEmail(e.target.value);
                                        setEmailStatus(null);
                                    }}
                                    placeholder="customer@example.com"
                                    className="w-full h-9 px-3 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {emailStatus && (
                                <div className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                                    emailStatus.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' :
                                    emailStatus.type === 'error' ? 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800' :
                                    'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                                }`}>
                                    {emailStatus.type === 'success' ? (
                                        <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                                    ) : (
                                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                                    )}
                                    <div className="flex-1 leading-tight">{emailStatus.message}</div>
                                </div>
                            )}

                            <div className="flex gap-2 pt-0.5">
                                <Button
                                    type="button"
                                    onClick={handleSendEmail}
                                    disabled={isSendingEmail || !cachedPdf || !targetEmail.trim()}
                                    className="flex-1 h-9 font-semibold text-white bg-blue-600 hover:bg-blue-700 text-xs rounded-lg shadow-xs"
                                >
                                    {isSendingEmail ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                            <span>Sending Email...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-3.5 w-3.5 mr-1.5" />
                                            <span>Send via Email</span>
                                        </>
                                    )}
                                </Button>

                                <a
                                    href={mailtoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={handleMailtoClick}
                                    className="h-9 px-3 flex items-center justify-center font-medium text-blue-700 dark:text-blue-300 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 rounded-lg text-xs border border-blue-300/60 dark:border-blue-800 shrink-0"
                                    title="Open default Mail app"
                                >
                                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                    <span>Mail App</span>
                                </a>
                            </div>
                        </div>

                        {/* ── WHATSAPP OPTIONS ── */}
                        {showWhatsApp && (
                            <>
                                {/* Native Share Sheet */}
                                <Button
                                    type="button"
                                    onClick={handleModalNativeShare}
                                    disabled={!cachedPdf || isGenerating}
                                    className="w-full min-h-[48px] h-auto py-2.5 px-3.5 justify-start font-semibold text-white bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.99] transition-all shadow-xs rounded-xl text-xs sm:text-sm"
                                >
                                    <Share2 className="h-4 w-4 mr-2.5 shrink-0" />
                                    <div className="flex flex-col text-left min-w-0 flex-1">
                                        <span className="font-bold leading-tight">Share via WhatsApp / Apps</span>
                                        <span className="text-[10px] text-white/90 font-normal leading-tight mt-0.5">
                                            Send PDF file directly using WhatsApp or system share
                                        </span>
                                    </div>
                                </Button>

                                {/* Direct WhatsApp Chat */}
                                <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={handleDirectWhatsAppClick}
                                    className="w-full min-h-[48px] h-auto py-2.5 px-3.5 flex items-center justify-start font-semibold text-emerald-900 dark:text-emerald-300 bg-emerald-100/70 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 active:scale-[0.99] transition-all rounded-xl border border-emerald-300/60 dark:border-emerald-800 text-xs sm:text-sm"
                                >
                                    <WhatsAppIcon className="h-4 w-4 mr-2.5 text-[#25D366] shrink-0" />
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
                            </>
                        )}

                        {/* ── DOWNLOAD & COPY OPTIONS ── */}
                        <div className="flex gap-2">
                            {/* Download PDF to Device */}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleDownload}
                                disabled={!cachedPdf}
                                className="flex-1 h-10 px-3 justify-center font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-gray-200 dark:border-zinc-700 rounded-xl text-xs"
                            >
                                <Download className="h-4 w-4 mr-1.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                <span>Download PDF</span>
                            </Button>

                            {/* Copy Share Link */}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCopyLink}
                                className="flex-1 h-10 px-3 justify-center font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-gray-200 dark:border-zinc-700 rounded-xl text-xs"
                            >
                                {isCopied ? (
                                    <>
                                        <Check className="h-4 w-4 mr-1.5 text-emerald-600 shrink-0" />
                                        <span className="text-emerald-600">Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4 mr-1.5 shrink-0" />
                                        <span>Copy Link</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
