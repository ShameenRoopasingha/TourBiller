/**
 * Client-side PDF generation and native WhatsApp / OS file sharing utility.
 * Uses jsPDF and html2canvas with dynamic imports to avoid SSR issues.
 */

export interface SharePdfOptions {
    elementId: string;
    filename: string;
    title?: string;
    text?: string;
    phone?: string; // Optional WhatsApp phone number to pre-target
}

function formatWhatsAppPhone(phone?: string): string | undefined {
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

export async function generateAndSharePdf({
    elementId,
    filename,
    title = 'Document',
    text,
    phone,
}: SharePdfOptions): Promise<{ success: boolean; error?: string }> {
    if (typeof window === 'undefined') {
        return { success: false, error: 'Cannot run on server' };
    }

    const element = document.getElementById(elementId);
    if (!element) {
        return { success: false, error: `Element with id "${elementId}" not found` };
    }

    try {
        // Dynamically import to keep client bundle lean
        const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
            import('html2canvas-pro'),
            import('jspdf'),
        ]);

        // Render high-res canvas (scale 2 for crisp vector-like text)
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

        const pdfBlob = pdf.output('blob');
        const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
        const pdfFile = new File([pdfBlob], cleanFilename, { type: 'application/pdf' });

        const shareMessage = text || `Here is your ${title} from VIGIL:`;
        const targetPhone = formatWhatsAppPhone(phone);

        // Check if Web Share API Level 2 (files sharing) is supported (mobile iOS/Android/Tauri)
        if (
            typeof navigator !== 'undefined' &&
            navigator.canShare &&
            navigator.canShare({ files: [pdfFile] })
        ) {
            await navigator.share({
                files: [pdfFile],
                title: cleanFilename,
                text: shareMessage,
            });
            return { success: true };
        }

        // Fallback for desktop / browsers that do not support navigator.share with files:
        // 1. Download the PDF directly
        const fileUrl = URL.createObjectURL(pdfBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = fileUrl;
        downloadLink.download = cleanFilename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        setTimeout(() => URL.revokeObjectURL(fileUrl), 5000);

        // 2. Open WhatsApp Web / App with prefilled message
        const baseWhatsAppUrl = targetPhone
            ? `https://api.whatsapp.com/send?phone=${encodeURIComponent(targetPhone)}&text=`
            : `https://api.whatsapp.com/send?text=`;

        const fallbackMsg = `${shareMessage}\n\n(PDF file "${cleanFilename}" has been saved to your downloads - please attach it here).`;
        window.open(`${baseWhatsAppUrl}${encodeURIComponent(fallbackMsg)}`, '_blank');

        return { success: true };
    } catch (err: any) {
        // Ignore user cancellation of native share modal
        if (err?.name === 'AbortError') {
            return { success: true };
        }
        console.error('Failed to generate or share PDF:', err);
        return { success: false, error: err?.message || 'Failed to share PDF' };
    }
}
