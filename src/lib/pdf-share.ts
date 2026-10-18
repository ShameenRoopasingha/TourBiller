/**
 * Client-side PDF generation and native WhatsApp / OS file sharing utility.
 * Uses jsPDF and html2canvas-pro with dynamic imports to avoid SSR issues.
 * Implements pre-caching and User-Activation preservation to eliminate NotAllowedError.
 */

export interface SharePdfOptions {
    elementId: string;
    filename: string;
    title?: string;
    text?: string;
    phone?: string | null;
}

export interface GeneratedPdfResult {
    file: File;
    url: string;
    blob: Blob;
}

export function formatWhatsAppPhone(phone?: string | null): string | undefined {
    if (!phone) return undefined;
    const digits = phone.replace(/[^0-9]/g, '');
    if (!digits) return undefined;
    // Sri Lanka local numbers starting with 0 (e.g., 0712345678 -> 94712345678)
    if (digits.startsWith('0') && digits.length === 10) {
        return '94' + digits.slice(1);
    }
    // Sri Lanka 9 digit numbers without leading zero (e.g., 712345678 -> 94712345678)
    if (digits.length === 9) {
        return '94' + digits;
    }
    return digits;
}

/**
 * Generates an A4 PDF File object from a DOM element using html2canvas-pro and jsPDF.
 */
export async function generatePdfFile({
    elementId,
    filename,
}: {
    elementId: string;
    filename: string;
}): Promise<GeneratedPdfResult | null> {
    if (typeof window === 'undefined') return null;
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id "${elementId}" not found`);
        return null;
    }

    try {
        const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
            import('html2canvas-pro'),
            import('jspdf'),
        ]);

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: Math.max(element.scrollWidth, 794),
            ignoreElements: (el) => {
                if (!el || !el.classList) return false;
                return (
                    el.classList.contains('no-print') ||
                    el.classList.contains('print:hidden') ||
                    el.hasAttribute('data-no-print')
                );
            },
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
            compress: true,
        });

        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        const blob = pdf.output('blob');
        const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
        const file = new File([blob], cleanFilename, { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        return { file, url, blob };
    } catch (err) {
        console.error('Failed to generate PDF:', err);
        return null;
    }
}

/**
 * Shares a PDF File using the native Web Share API Level 2 if supported.
 * Falls back safely to download without crashing mobile WebViews with ERR_UNKNOWN_URL_SCHEME.
 */
export async function sharePdfFile({
    file,
    filename,
    title = 'Document',
    text,
    phone,
}: {
    file: File;
    filename: string;
    title?: string;
    text?: string;
    phone?: string | null;
}): Promise<{ success: boolean; error?: string; sharedViaNative?: boolean }> {
    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    const shareMessage = text || `Here is your ${title} from VIGIL:`;
    const targetPhone = formatWhatsAppPhone(phone);

    // 1. Try Native Web Share API Level 2 (files sharing)
    if (
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
    ) {
        try {
            await navigator.share({
                files: [file],
                title: cleanFilename,
                text: shareMessage,
            });
            return { success: true, sharedViaNative: true };
        } catch (err: any) {
            if (err?.name === 'AbortError') {
                // User cancelled share dialog
                return { success: true, sharedViaNative: true };
            }
            if (err?.name === 'NotAllowedError') {
                // User gesture expired due to async delay
                return { success: false, error: 'GESTURE_EXPIRED' };
            }
            console.warn('Native share error, falling back:', err);
        }
    }

    // 2. Fallback: Download file directly to device
    const fileUrl = URL.createObjectURL(file);
    const downloadLink = document.createElement('a');
    downloadLink.href = fileUrl;
    downloadLink.download = cleanFilename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    setTimeout(() => URL.revokeObjectURL(fileUrl), 5000);

    // 3. Detect if in a mobile WebView / Tauri app to prevent ERR_UNKNOWN_URL_SCHEME crash
    const isWebView =
        typeof window !== 'undefined' &&
        (Boolean((window as any).__TAURI__) ||
         Boolean((window as any).__TAURI_INTERNALS__) ||
         /wv|Android.*Version\/[\d.]+/i.test(navigator.userAgent));

    if (!isWebView) {
        // Safe desktop browser: Open WhatsApp Web in new tab
        const baseWhatsAppUrl = targetPhone
            ? `https://api.whatsapp.com/send?phone=${encodeURIComponent(targetPhone)}&text=`
            : `https://api.whatsapp.com/send?text=`;

        const fallbackMsg = `${shareMessage}\n\n(PDF file "${cleanFilename}" has been saved to your downloads - please attach it here).`;
        window.open(`${baseWhatsAppUrl}${encodeURIComponent(fallbackMsg)}`, '_blank');
    }

    return { success: true, sharedViaNative: false };
}

/**
 * Backward compatible helper for single-call PDF generation and share.
 */
export async function generateAndSharePdf(options: SharePdfOptions): Promise<{ success: boolean; error?: string }> {
    const res = await generatePdfFile({ elementId: options.elementId, filename: options.filename });
    if (!res?.file) {
        return { success: false, error: 'Failed to generate PDF' };
    }
    const shareRes = await sharePdfFile({
        file: res.file,
        filename: options.filename,
        title: options.title,
        text: options.text,
        phone: options.phone,
    });
    return { success: shareRes.success, error: shareRes.error };
}
