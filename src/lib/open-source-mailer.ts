import nodemailer from 'nodemailer';

export interface SendVerificationEmailOptions {
  to: string;
  name?: string;
  otpCode: string;
  token: string;
}

export interface SendVerificationEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isDevFallback?: boolean;
  resetLink?: string;
  verifyLink?: string;
  otpCode?: string;
}

/**
 * Creates and caches the open-source Nodemailer SMTP transporter.
 * Supports standard SMTP (Brevo, AWS SES, Postfix, etc.) as well as Gmail shorthand.
 */
function getSmtpTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const rawPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;
  const pass = rawPass ? rawPass.replace(/\s+/g, '') : '';

  // 1. Gmail shorthand support (user supplies gmail address & app password)
  if ((!host || host === 'smtp.gmail.com') && user && pass && user.includes('@gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  // 2. Standard SMTP support
  if (!host || !user || !pass) {
    return null;
  }

  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Generates an elegant, responsive HTML email for user email verification.
 */
export function generateVerificationEmailHtml(options: {
  name?: string;
  otpCode: string;
  verifyLink: string;
}): string {
  const { name = 'Team Member', otpCode, verifyLink } = options;
  const brandName = 'VIGIL Tour Management';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;line-height:1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;padding:32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);padding:32px 24px;text-align:center;color:#ffffff;">
              <div style="font-size:20px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#38bdf8;margin-bottom:6px;">
                ${brandName}
              </div>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">
                Verify Your Email Address
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:32px 28px;">
              <p style="margin:0 0 16px 0;font-size:16px;font-weight:600;color:#0f172a;">
                Hello ${name},
              </p>
              <p style="margin:0 0 24px 0;font-size:14px;color:#475569;">
                Welcome to ${brandName}! Your account has been registered. To activate your full access, please use the 6-digit verification code below or click the verification button.
              </p>

              <!-- OTP Highlight Box -->
              <div style="background-color:#f8fafc;border:2px dashed #cbd5e1;border-radius:12px;padding:20px;text-align:center;margin-bottom:28px;">
                <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:8px;">
                  Your 6-Digit Verification Code
                </div>
                <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#0284c7;font-family:monospace;">
                  ${otpCode}
                </div>
                <div style="font-size:12px;color:#94a3b8;margin-top:8px;">
                  Code expires in 24 hours
                </div>
              </div>

              <!-- Button Link -->
              <div style="text-align:center;margin-bottom:28px;">
                <a href="${verifyLink}" style="display:inline-block;background-color:#0284c7;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.5px;box-shadow:0 4px 6px -1px rgba(2,132,199,0.3);">
                  Verify Email Address Directly &rarr;
                </a>
              </div>

              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.5;">
                If you did not request this registration or believe this was sent by mistake, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 24px;text-align:center;font-size:11px;color:#94a3b8;">
              &copy; ${new Date().getFullYear()} ${brandName}. Powered by Open-Source Mailer.
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
 * Generates an elegant, responsive HTML email for password reset requests.
 */
export function generatePasswordResetEmailHtml(options: {
  name?: string;
  resetLink: string;
  otpCode?: string;
}): string {
  const { name = 'Valued User', resetLink, otpCode } = options;
  const brandName = 'VIGIL Tour Management';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;line-height:1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;padding:32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);padding:32px 24px;text-align:center;color:#ffffff;">
              <div style="font-size:20px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#38bdf8;margin-bottom:6px;">
                ${brandName}
              </div>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">
                Password Reset Request
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:32px 28px;">
              <p style="margin:0 0 16px 0;font-size:16px;font-weight:600;color:#0f172a;">
                Hello ${name},
              </p>
              <p style="margin:0 0 24px 0;font-size:14px;color:#475569;">
                We received a request to reset your password for your ${brandName} account. You can use either the 6-digit OTP code below or click the direct reset button.
              </p>

              ${otpCode ? `
              <!-- OTP Highlight Box -->
              <div style="background-color:#f8fafc;border:2px dashed #0284c7;border-radius:12px;padding:20px;text-align:center;margin-bottom:28px;">
                <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:8px;">
                  Your 6-Digit Password Reset OTP Code
                </div>
                <div style="font-size:34px;font-weight:800;letter-spacing:8px;color:#0284c7;font-family:monospace;">
                  ${otpCode}
                </div>
                <div style="font-size:12px;color:#94a3b8;margin-top:8px;">
                  Code valid for 15 minutes • Do not share this OTP with anyone
                </div>
              </div>
              ` : ''}

              <!-- Button Link -->
              <div style="text-align:center;margin-bottom:28px;">
                <a href="${resetLink}" style="display:inline-block;background-color:#0284c7;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.5px;box-shadow:0 4px 6px -1px rgba(2,132,199,0.3);">
                  Reset Your Password Directly &rarr;
                </a>
              </div>

              <!-- Expiration note -->
              <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;margin-bottom:24px;font-size:13px;color:#64748b;text-align:center;">
                This link will automatically expire in <strong>1 hour</strong> for security reasons.
              </div>

              <p style="margin:0 0 8px 0;font-size:12px;color:#94a3b8;">
                If the button above does not work, copy and paste this URL into your browser:
              </p>
              <p style="margin:0 0 20px 0;font-size:11px;color:#0284c7;word-break:break-all;">
                ${resetLink}
              </p>

              <p style="margin:0;font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;">
                If you did not request this password reset, please ignore this email or contact support. Your password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 24px;text-align:center;font-size:11px;color:#94a3b8;">
              &copy; ${new Date().getFullYear()} ${brandName}. Powered by Open-Source Mailer.
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
 * Sends a user registration verification email using open-source Nodemailer.
 * Falls back to server console logging if SMTP credentials are not yet configured.
 */
export async function sendVerificationEmail(
  options: SendVerificationEmailOptions
): Promise<SendVerificationEmailResult> {
  const { to, name, otpCode, token } = options;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verifyLink = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(to)}`;

  const transporter = getSmtpTransporter();

  // If SMTP is not configured in local environment, log gracefully so dev/testing is never blocked
  if (!transporter) {
    console.log('====================================================');
    console.log('[OPEN-SOURCE MAILER] SMTP NOT CONFIGURED (DEV FALLBACK)');
    console.log(`[OPEN-SOURCE MAILER] Verification Email for: ${to} (${name || 'User'})`);
    console.log(`[OPEN-SOURCE MAILER] 6-Digit OTP Code: >> ${otpCode} <<`);
    console.log(`[OPEN-SOURCE MAILER] Direct Verification Link: ${verifyLink}`);
    console.log('====================================================');
    return {
      success: true,
      isDevFallback: true,
      verifyLink,
      otpCode,
    };
  }

  try {
    const fromAddress = process.env.SMTP_FROM || `"VIGIL Tour Management" <noreply@vigil.app>`;
    const htmlContent = generateVerificationEmailHtml({
      name,
      otpCode,
      verifyLink,
    });

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `Verify your email address - Vigil Tour Management [Code: ${otpCode}]`,
      text: `Hello ${name || 'there'},\n\nYour 6-digit verification code is: ${otpCode}\n\nOr verify directly at: ${verifyLink}\n\nThis code expires in 24 hours.`,
      html: htmlContent,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('[OPEN-SOURCE MAILER] Failed to dispatch verification email:', error);
    return {
      success: false,
      error: error?.message || 'Failed to send verification email via SMTP.',
    };
  }
}

/**
 * Dispatches a password reset email using open-source Nodemailer.
 * Falls back to server console logging if SMTP is not configured.
 */
export async function sendPasswordResetEmail(options: {
  to: string;
  name?: string;
  resetLink: string;
  otpCode?: string;
}): Promise<SendVerificationEmailResult> {
  const { to, name, resetLink, otpCode } = options;
  const transporter = getSmtpTransporter();

  if (!transporter) {
    console.log('====================================================');
    console.log('[OPEN-SOURCE MAILER] SMTP NOT CONFIGURED (DEV FALLBACK)');
    console.log(`[OPEN-SOURCE MAILER] Password Reset Email for: ${to} (${name || 'User'})`);
    if (otpCode) console.log(`[OPEN-SOURCE MAILER] 6-Digit Reset OTP: >> ${otpCode} <<`);
    console.log(`[OPEN-SOURCE MAILER] Direct Reset Link: ${resetLink}`);
    console.log('====================================================');
    return {
      success: true,
      isDevFallback: true,
      resetLink,
      otpCode,
    };
  }

  try {
    const fromAddress = process.env.SMTP_FROM || `"VIGIL Tour Management" <noreply@vigil.app>`;
    const htmlContent = generatePasswordResetEmailHtml({
      name,
      resetLink,
      otpCode,
    });

    const subject = otpCode
      ? `Reset your password - Vigil Tour Management [OTP: ${otpCode}]`
      : `Reset your password - Vigil Tour Management`;

    const textContent = otpCode
      ? `Hello ${name || 'there'},\n\nYour 6-digit password reset OTP is: ${otpCode}\n\nAlternatively, reset your password using the link below:\n\n${resetLink}\n\nThis OTP and link expire in 15-60 minutes.`
      : `Hello ${name || 'there'},\n\nWe received a request to reset your password. Use the link below to set a new password:\n\n${resetLink}\n\nThis link expires in 1 hour.`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: textContent,
      html: htmlContent,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('[OPEN-SOURCE MAILER] Failed to dispatch password reset email:', error);
    return {
      success: false,
      error: error?.message || 'Failed to send password reset email via SMTP.',
    };
  }
}
