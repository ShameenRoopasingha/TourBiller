import { Resend } from 'resend';

export interface SendEmailOptions {
    to: string;
    subject?: string;
    documentType: 'quotation' | 'bill';
    documentNumber: number | string;
    customerName: string;
    totalAmount: number;
    advanceAmount?: number;
    currency?: string;
    tourName?: string;
    vehicleNo?: string;
    dates?: string;
    onlineUrl?: string;
    customMessage?: string;
    companyName?: string;
    companyEmail?: string;
    companyPhone?: string;
    companyAddress?: string;
    pdfBase64?: string;
    filename?: string;
}

export interface SendEmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
    isKeyMissing?: boolean;
}

/**
 * Returns clean currency formatted string for emails.
 */
function formatAmount(amount: number, currency: string = 'LKR'): string {
    return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Generates an elegant, responsive HTML email for quotations or invoices/bills.
 */
export function generateDocumentEmailHtml(opts: SendEmailOptions): string {
    const isQuotation = opts.documentType === 'quotation';
    const docLabel = isQuotation ? 'Quotation' : 'Invoice / Receipt';
    const accentColor = isQuotation ? '#1d4ed8' : '#b91c1c'; // Blue for quotation, Red/Crimson for invoice
    const accentBg = isQuotation ? '#eff6ff' : '#fef2f2';
    const company = opts.companyName || 'VIGIL Tour Management';
    const currency = opts.currency || 'LKR';
    const balanceDue = Math.max(0, opts.totalAmount - (opts.advanceAmount || 0));

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docLabel} #${opts.documentNumber}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;line-height:1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color:${accentColor};padding:24px;text-align:center;color:#ffffff;">
              <h1 style="margin:0;font-size:22px;letter-spacing:1px;font-weight:700;text-transform:uppercase;">
                ${company}
              </h1>
              <p style="margin:6px 0 0 0;font-size:13px;opacity:0.9;">
                ${docLabel} #${opts.documentNumber}
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:28px 24px;">
              <p style="margin:0 0 16px 0;font-size:16px;font-weight:600;color:#0f172a;">
                Dear ${opts.customerName},
              </p>

              <p style="margin:0 0 20px 0;font-size:14px;color:#475569;">
                ${isQuotation 
                  ? `Thank you for your interest in our tour and transfer services. Please find the summary of your quotation below. A complete PDF document has also been attached to this email.`
                  : `Thank you for choosing ${company}. Please find your payment receipt and invoice details below. A complete PDF copy has been attached to this email for your records.`}
              </p>

              ${opts.customMessage ? `
              <div style="background-color:${accentBg};border-left:4px solid ${accentColor};padding:12px 16px;border-radius:4px;margin-bottom:20px;font-size:13px;color:#334155;">
                ${opts.customMessage.replace(/\n/g, '<br/>')}
              </div>
              ` : ''}

              <!-- Document Summary Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px;">
                    <table width="100%" cellpadding="6" cellspacing="0" border="0" style="font-size:13px;">
                      <tr>
                        <td style="color:#64748b;width:35%;font-weight:500;">Document:</td>
                        <td style="color:#0f172a;font-weight:600;">${docLabel} #${opts.documentNumber}</td>
                      </tr>
                      ${opts.tourName ? `
                      <tr>
                        <td style="color:#64748b;font-weight:500;">Tour / Route:</td>
                        <td style="color:#0f172a;font-weight:600;">${opts.tourName}</td>
                      </tr>
                      ` : ''}
                      ${opts.vehicleNo ? `
                      <tr>
                        <td style="color:#64748b;font-weight:500;">Vehicle:</td>
                        <td style="color:#0f172a;">${opts.vehicleNo}</td>
                      </tr>
                      ` : ''}
                      ${opts.dates ? `
                      <tr>
                        <td style="color:#64748b;font-weight:500;">Period:</td>
                        <td style="color:#0f172a;">${opts.dates}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="border-top:1px dashed #cbd5e1;padding-top:10px;color:#64748b;font-weight:500;">Total Amount:</td>
                        <td style="border-top:1px dashed #cbd5e1;padding-top:10px;color:${accentColor};font-size:16px;font-weight:700;">
                          ${formatAmount(opts.totalAmount, currency)}
                        </td>
                      </tr>
                      ${opts.advanceAmount && opts.advanceAmount > 0 ? `
                      <tr>
                        <td style="color:#64748b;font-weight:500;">${isQuotation ? 'Advance Required:' : 'Advance Paid:'}</td>
                        <td style="color:#16a34a;font-weight:600;">${formatAmount(opts.advanceAmount, currency)}</td>
                      </tr>
                      <tr>
                        <td style="color:#64748b;font-weight:500;">${isQuotation ? 'Remaining on Arrival:' : 'Balance Due:'}</td>
                        <td style="color:#0f172a;font-weight:700;">${formatAmount(balanceDue, currency)}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Online Link CTA Button -->
              ${opts.onlineUrl ? `
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;text-align:center;">
                <tr>
                  <td align="center">
                    <a href="${opts.onlineUrl}" target="_blank" style="display:inline-block;background-color:${accentColor};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:6px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                      View & Print Document Online →
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}

              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                📎 A copy of this ${docLabel.toLowerCase()} is also attached as a PDF file.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:20px 24px;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#64748b;">
              <p style="margin:0 0 6px 0;font-weight:600;color:#334155;">${company}</p>
              <p style="margin:0 0 4px 0;">
                ${opts.companyAddress ? `${opts.companyAddress} | ` : ''}
                ${opts.companyPhone ? `Tel: ${opts.companyPhone} | ` : ''}
                ${opts.companyEmail ? `Email: ${opts.companyEmail}` : ''}
              </p>
              <p style="margin:8px 0 0 0;font-size:11px;color:#94a3b8;">
                Powered by Bitgard PVT LTD
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
}

/**
 * Sends a document email via Resend API with PDF attachment.
 */
export async function sendDocumentEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const apiKey = process.env.RESEND_API_KEY;

    // Check for absent or obvious dummy keys
    if (!apiKey || apiKey === 're_123456789' || apiKey.trim() === '') {
        return {
            success: false,
            isKeyMissing: true,
            error: 'Resend API key is not configured. Please add a valid RESEND_API_KEY in your environment settings.',
        };
    }

    try {
        const resend = new Resend(apiKey);
        const fromAddress = process.env.EMAIL_FROM || 'VIGIL Tours <onboarding@resend.dev>';
        const isQuotation = options.documentType === 'quotation';
        const docLabel = isQuotation ? 'Quotation' : 'Invoice';
        const subject = options.subject || `${docLabel} #${options.documentNumber} - ${options.companyName || 'VIGIL Tour Management'}`;

        const html = generateDocumentEmailHtml(options);

        const attachments = [];
        if (options.pdfBase64) {
            const cleanFilename = options.filename || `${docLabel}-${options.documentNumber}.pdf`;
            attachments.push({
                filename: cleanFilename,
                content: Buffer.from(options.pdfBase64, 'base64'),
            });
        }

        const data = await resend.emails.send({
            from: fromAddress,
            to: [options.to],
            subject,
            html,
            attachments: attachments.length > 0 ? attachments : undefined,
        });

        if ((data as any).error) {
            return {
                success: false,
                error: (data as any).error.message || 'Failed to send email via Resend',
            };
        }

        return {
            success: true,
            messageId: (data as any).data?.id,
        };
    } catch (err: any) {
        console.error('Error sending document email via Resend:', err);
        return {
            success: false,
            error: err?.message || 'Unexpected error while sending email',
        };
    }
}
