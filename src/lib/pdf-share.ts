/**
 * Client-side PDF generation and native WhatsApp / OS file sharing utility.
 * Uses jsPDF and html2canvas-pro with dynamic imports to avoid SSR issues.
 * Implements pre-caching and User-Activation preservation to eliminate NotAllowedError.
 * Includes AndroidBridge support for direct device storage downloads and native intent sharing.
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
 * Returns the universal WhatsApp link (wa.me) for web or mobile.
 */
export function getWhatsAppUrl(phone?: string | null, text?: string): string {
    const targetPhone = formatWhatsAppPhone(phone);
    const encodedText = encodeURIComponent(text || '');
    if (targetPhone) {
        return `https://wa.me/${targetPhone}${encodedText ? `?text=${encodedText}` : ''}`;
    }
    return `https://wa.me/?text=${encodedText}`;
}

/**
 * Converts a File or Blob into a base64 string.
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.includes(',') ? result.split(',')[1] : result;
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Downloads a File or Blob directly to the device.
 * Supports native AndroidBridge in Tauri APK, with fallback to standard web download.
 */
export async function downloadPdfFile(file: File | Blob, filename: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

    // 1. If running in Android APK with native AndroidBridge:
    if (typeof (window as any).AndroidBridge?.downloadPdf === 'function') {
        try {
            const base64 = await fileToBase64(file);
            (window as any).AndroidBridge.downloadPdf(base64, cleanFilename);
            return;
        } catch (err) {
            console.error('AndroidBridge download error:', err);
        }
    }

    // 2. Standard Web Download:
    const fileUrl = URL.createObjectURL(file);
    const downloadLink = document.createElement('a');
    downloadLink.href = fileUrl;
    downloadLink.download = cleanFilename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    setTimeout(() => URL.revokeObjectURL(fileUrl), 10000);
}

/**
 * Generates an A4 PDF File object from a DOM element using html2canvas-pro and jsPDF.
 * Implements intelligent, content-aware pagination:
 * 1. Single-page tolerance (up to 5% overflow is scaled cleanly to 1 page instead of creating an empty 2nd page).
 * 2. Multi-page slicing detects avoid-break elements (tables, rows, headings, cards, signatures)
 *    and slices off-screen canvases at clean element boundaries, never cutting through text or rows.
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
                    el.classList.contains('leaflet-control-zoom') ||
                    el.classList.contains('leaflet-control-attribution') ||
                    el.hasAttribute('data-no-print')
                );
            },
        });

        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
            compress: true,
        });

        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const mmPerPx = imgWidth / canvas.width;
        const totalHeightMm = canvas.height * mmPerPx;
        const pageHeightPx = pageHeight / mmPerPx;

        // 1. Single-page scenario: If content fits within 1 page (or with up to 5% minor overflow),
        // scale slightly so it fits perfectly on 1 page without creating an accidental 2nd page.
        if (totalHeightMm <= pageHeight * 1.05) {
            const scale = totalHeightMm > pageHeight ? (pageHeight / totalHeightMm) : 1;
            const renderWidthMm = imgWidth * scale;
            const renderHeightMm = totalHeightMm * scale;
            const xOffsetMm = (imgWidth - renderWidthMm) / 2;
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            pdf.addImage(imgData, 'JPEG', xOffsetMm, 0, renderWidthMm, renderHeightMm);
        } else {
            // 2. Multi-page scenario: Content-aware intelligent slicing
            const elementRect = element.getBoundingClientRect();
            const scaleY = canvas.height / (elementRect.height || element.scrollHeight);

            const avoidSelectors = [
                '.print-avoid-break',
                'tr',
                '.print-heading',
                'h1', 'h2', 'h3',
                '[data-avoid-break="true"]'
            ];
            const avoidNodes = Array.from(element.querySelectorAll(avoidSelectors.join(','))) as HTMLElement[];

            interface AvoidZone {
                top: number;
                bottom: number;
            }

            const avoidZones: AvoidZone[] = [];
            for (const node of avoidNodes) {
                if (!node.offsetParent && node.offsetHeight === 0) continue;
                const rect = node.getBoundingClientRect();
                if (rect.height <= 0) continue;

                const topPx = (rect.top - elementRect.top) * scaleY;
                const bottomPx = (rect.bottom - elementRect.top) * scaleY;

                // Add small buffer around elements (4px)
                avoidZones.push({
                    top: Math.max(0, topPx - 4),
                    bottom: Math.min(canvas.height, bottomPx + 4),
                });
            }

            // Calculate slice intervals
            let currentY = 0;
            const slices: { startY: number; endY: number }[] = [];

            while (currentY < canvas.height) {
                const remainingHeight = canvas.height - currentY;
                if (remainingHeight <= pageHeightPx * 1.03) {
                    slices.push({ startY: currentY, endY: canvas.height });
                    break;
                }

                let targetSliceY = currentY + pageHeightPx;

                // Check if targetSliceY cuts through any avoid zone
                const intersectingZone = avoidZones.find(
                    (zone) => targetSliceY > zone.top && targetSliceY < zone.bottom
                );

                if (intersectingZone) {
                    const zoneHeight = intersectingZone.bottom - intersectingZone.top;
                    // Pull slice point above the element if it leaves sufficient page height (> 40%)
                    if (zoneHeight < pageHeightPx * 0.8 && intersectingZone.top > currentY + pageHeightPx * 0.4) {
                        targetSliceY = intersectingZone.top;
                    }
                }

                // Ensure forward progress
                if (targetSliceY <= currentY + 100) {
                    targetSliceY = currentY + pageHeightPx;
                }

                slices.push({ startY: currentY, endY: Math.min(canvas.height, targetSliceY) });
                currentY = targetSliceY;
            }

            // Draw each slice on an offscreen canvas and add to PDF
            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = canvas.width;
            const ctx = sliceCanvas.getContext('2d');

            for (let i = 0; i < slices.length; i++) {
                const { startY, endY } = slices[i];
                const sliceHeight = endY - startY;
                if (sliceHeight <= 0) continue;

                sliceCanvas.height = sliceHeight;
                if (ctx) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, sliceCanvas.width, sliceHeight);
                    ctx.drawImage(
                        canvas,
                        0, startY, canvas.width, sliceHeight,
                        0, 0, canvas.width, sliceHeight
                    );
                }

                const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 0.95);
                const sliceHeightMm = (sliceHeight * imgWidth) / canvas.width;

                if (i > 0) {
                    pdf.addPage();
                }

                pdf.addImage(sliceImgData, 'JPEG', 0, 0, imgWidth, sliceHeightMm);
            }
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
 * Shares a PDF File using AndroidBridge, Web Share API Level 2 (files), Level 1 (text),
 * or local device download.
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
}): Promise<{
    success: boolean;
    error?: string;
    sharedViaNative?: boolean;
    method?: 'android-bridge' | 'native-files' | 'native-text' | 'fallback';
}> {
    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    const shareMessage = text || `📄 *${title}*\nGreetings from VIGIL Tour Management.\nPlease find your document attached.`;
    const targetPhone = formatWhatsAppPhone(phone);

    // 1. If running inside Android APK with native AndroidBridge:
    if (typeof (window as any).AndroidBridge?.sharePdf === 'function') {
        try {
            const base64 = await fileToBase64(file);
            (window as any).AndroidBridge.sharePdf(base64, cleanFilename, shareMessage);
            return { success: true, sharedViaNative: true, method: 'android-bridge' };
        } catch (err) {
            console.error('AndroidBridge share error:', err);
        }
    }

    // 2. Try Native Web Share API Level 2 (files sharing)
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
            return { success: true, sharedViaNative: true, method: 'native-files' };
        } catch (err: any) {
            if (err?.name === 'AbortError') {
                return { success: true, sharedViaNative: true, method: 'native-files' };
            }
            if (err?.name === 'NotAllowedError') {
                return { success: false, error: 'GESTURE_EXPIRED' };
            }
            console.warn('Native file share failed, trying text share:', err);
        }
    }

    // 3. Try Native Web Share API Level 1 (text + page URL)
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
            const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
            await navigator.share({
                title: cleanFilename,
                text: `${shareMessage}\n\n🔗 View Online:\n${pageUrl}`,
                url: pageUrl || undefined,
            });
            return { success: true, sharedViaNative: true, method: 'native-text' };
        } catch (err: any) {
            if (err?.name === 'AbortError') {
                return { success: true, sharedViaNative: true, method: 'native-text' };
            }
            if (err?.name === 'NotAllowedError') {
                return { success: false, error: 'GESTURE_EXPIRED' };
            }
            console.warn('Native text share failed, falling back to download:', err);
        }
    }

    // 4. Fallback: Download file directly to device
    await downloadPdfFile(file, cleanFilename);

    // 5. In standard desktop/mobile browsers, open WhatsApp Web/App in a new tab.
    const isWebView =
        typeof window !== 'undefined' &&
        (Boolean((window as any).__TAURI__) ||
         Boolean((window as any).__TAURI_INTERNALS__) ||
         /wv|Android.*Version\/[\d.]+/i.test(navigator.userAgent));

    if (!isWebView) {
        const waUrl = getWhatsAppUrl(
            targetPhone,
            `${shareMessage}\n\n(PDF file "${cleanFilename}" has been saved to your downloads - please attach it here).`
        );
        try {
            window.open(waUrl, '_blank');
        } catch {
            // Popup blocked by browser settings
        }
    }

    return { success: true, sharedViaNative: false, method: 'fallback' };
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
